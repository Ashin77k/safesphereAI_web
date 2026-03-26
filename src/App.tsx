import React, { useState, useEffect, useMemo } from 'react';
import { 
  auth, db, googleProvider, signInWithPopup, onAuthStateChanged, 
  collection, onSnapshot, query, orderBy, limit, updateDoc, doc, Timestamp,
  OperationType, handleFirestoreError, User, addDoc
} from './firebase';
import { Emergency, MissingPerson, Notification, UserProfile, LocationHistory } from './types';
import { backendService } from './services/backendService';
import { MapView } from './components/MapView';
import { 
  AlertCircle, Users, Bell, Search, Filter, LogOut, Shield, 
  CheckCircle2, MapPin, Clock, Info, ChevronRight, Activity, Navigation, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [missingPersons, setMissingPersons] = useState<MissingPerson[]>([]);
  const [locationHistory, setLocationHistory] = useState<LocationHistory[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'EMERGENCY' | 'MISSING'>('ALL');
  const [selectedId, setSelectedId] = useState<string | undefined>();

  // Fetch from Backend
  const syncWithBackend = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const [bEmergencies, bMissing, bNotifications] = await Promise.all([
        backendService.fetchEmergencies(),
        backendService.fetchMissingPersons(),
        backendService.fetchNotifications()
      ]);
      
      if (bEmergencies.length > 0) setEmergencies(bEmergencies);
      if (bMissing.length > 0) setMissingPersons(bMissing);
      if (bNotifications.length > 0) setNotifications(bNotifications);
    } catch (error) {
      console.error('Backend Sync Error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Fetch profile
        try {
          const userDoc = await doc(db, 'users', u.uid);
          // In a real app, we'd check if user exists, otherwise create
          // For this dashboard, we'll assume admin role if email matches
          const isAdmin = u.email === 'abhinavraj92007@gmail.com';
          setProfile({
            id: u.uid,
            name: u.displayName || 'Unknown',
            email: u.email || '',
            role: isAdmin ? 'ADMIN' : 'USER',
            createdAt: Timestamp.now()
          });
        } catch (e) {
          console.error("Error fetching profile", e);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Data Listeners & Backend Polling
  useEffect(() => {
    if (!user) return;

    // Initial backend fetch
    syncWithBackend();

    // Backend polling every 30 seconds
    const pollInterval = setInterval(syncWithBackend, 30000);

    // Firestore listeners (fallback/real-time)
    const qEmergencies = query(collection(db, 'emergencies'), orderBy('timestamp', 'desc'), limit(50));
    const unsubEmergencies = onSnapshot(qEmergencies, (snapshot) => {
      if (snapshot.docs.length > 0) {
        setEmergencies(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Emergency)));
      }
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'emergencies'));

    const qMissing = query(collection(db, 'missingPersons'), orderBy('timestamp', 'desc'), limit(50));
    const unsubMissing = onSnapshot(qMissing, (snapshot) => {
      if (snapshot.docs.length > 0) {
        setMissingPersons(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MissingPerson)));
      }
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'missingPersons'));

    const qNotifications = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'), limit(20));
    const unsubNotifications = onSnapshot(qNotifications, (snapshot) => {
      if (snapshot.docs.length > 0) {
        setNotifications(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
      }
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'notifications'));

    const qHistory = query(collection(db, 'locationHistory'), orderBy('timestamp', 'desc'), limit(200));
    const unsubHistory = onSnapshot(qHistory, (snapshot) => {
      setLocationHistory(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LocationHistory)));
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'locationHistory'));

    return () => {
      clearInterval(pollInterval);
      unsubEmergencies();
      unsubMissing();
      unsubNotifications();
      unsubHistory();
    };
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error("Login failed", e);
    }
  };

  const handleLogout = () => auth.signOut();

  const updateStatus = async (type: 'EMERGENCY' | 'MISSING', id: string, newStatus: string) => {
    if (profile?.role !== 'ADMIN') return;
    
    // Update Backend
    const backendSuccess = await backendService.updateStatus(type, id, newStatus);
    
    // Update Firestore
    const collectionName = type === 'EMERGENCY' ? 'emergencies' : 'missingPersons';
    try {
      await updateDoc(doc(db, collectionName, id), { status: newStatus });
      if (backendSuccess) {
        console.log('Status updated on both Backend and Firestore');
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `${collectionName}/${id}`);
    }
  };

  const simulateLocationUpdate = async (item: Emergency | MissingPerson) => {
    if (profile?.role !== 'ADMIN') return;
    
    // Get current position
    const itemHistory = locationHistory
      .filter(h => h.parentId === item.id)
      .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
    
    const currentPos = itemHistory.length > 0 
      ? itemHistory[0].location 
      : ('location' in item ? item.location : item.lastSeenLocation);

    // Add a small random offset
    const newPos = {
      lat: currentPos.lat + (Math.random() - 0.5) * 0.01,
      lng: currentPos.lng + (Math.random() - 0.5) * 0.01
    };

    try {
      await addDoc(collection(db, 'locationHistory'), {
        parentId: item.id,
        location: newPos,
        timestamp: Timestamp.now()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'locationHistory');
    }
  };

  const filteredItems = useMemo(() => {
    const items = [
      ...emergencies.map(e => ({ ...e, type: 'EMERGENCY' as const })),
      ...missingPersons.map(m => ({ ...m, type: 'MISSING' as const }))
    ].sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());

    return items.filter(item => {
      const matchesSearch = item.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ('name' in item && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          ('userName' in item && item.userName?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFilter = filter === 'ALL' || item.type === filter;
      return matchesSearch && matchesFilter;
    });
  }, [emergencies, missingPersons, searchQuery, filter]);

  const stats = useMemo(() => [
    { name: 'Active Emergencies', value: emergencies.filter(e => e.status === 'ACTIVE').length, color: '#ff4444' },
    { name: 'Missing Persons', value: missingPersons.filter(m => m.status === 'MISSING').length, color: '#ffcc00' },
    { name: 'Safe/Found', value: emergencies.filter(e => e.status === 'SAFE').length + missingPersons.filter(m => m.status === 'FOUND').length, color: '#4ade80' }
  ], [emergencies, missingPersons]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0a]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0a0a0a] p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full glass-panel p-10 rounded-3xl text-center"
        >
          <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">Guardian Response</h1>
          <p className="text-white/60 mb-10">Secure administrative dashboard for emergency monitoring and response coordination.</p>
          <button 
            onClick={handleLogin}
            className="w-full bg-white text-black font-semibold py-4 rounded-xl hover:bg-white/90 transition-all flex items-center justify-center gap-3"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            Sign in as Administrator
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0a0a] text-white overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 shrink-0 z-50 glass-panel">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold tracking-tight">GUARDIAN RESPONSE</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Command Center v1.0</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={syncWithBackend}
            disabled={isSyncing}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all",
              isSyncing && "opacity-50 cursor-not-allowed"
            )}
          >
            <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
            <span className="text-xs font-medium">{isSyncing ? 'Syncing...' : 'Sync Backend'}</span>
          </button>
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
            <Activity className="w-4 h-4 text-green-500" />
            <span className="text-xs font-medium">System Live</span>
          </div>
          <div className="flex items-center gap-3 pl-6 border-l border-white/10">
            <div className="text-right">
              <p className="text-xs font-medium">{profile?.name}</p>
              <p className="text-[10px] text-white/40">{profile?.role}</p>
            </div>
            <button onClick={handleLogout} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <LogOut className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar - Alerts & List */}
        <aside className="w-96 border-r border-white/10 flex flex-col shrink-0 glass-panel">
          <div className="p-4 border-b border-white/10 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input 
                type="text" 
                placeholder="Search by ID or Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-white/20"
              />
            </div>
            <div className="flex gap-2">
              {(['ALL', 'EMERGENCY', 'MISSING'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border",
                    filter === f ? "bg-white text-black border-white" : "bg-white/5 text-white/40 border-white/10 hover:border-white/20"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "p-4 rounded-2xl cursor-pointer transition-all border group relative overflow-hidden",
                    selectedId === item.id ? "bg-white/10 border-white/20" : "bg-white/5 border-white/5 hover:border-white/10"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                      item.type === 'EMERGENCY' ? "bg-red-500/20 text-red-500" : "bg-yellow-500/20 text-yellow-500"
                    )}>
                      {item.type}
                    </div>
                    <span className="text-[10px] text-white/40">{item.timestamp.toDate().toLocaleTimeString()}</span>
                  </div>
                  <h3 className="font-semibold text-sm mb-1">
                    {item.type === 'EMERGENCY' ? (item.userName || `User: ${item.userId.slice(0, 8)}...`) : item.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <MapPin className="w-3 h-3" />
                    <span>{item.type === 'EMERGENCY' ? `${item.location.lat.toFixed(4)}, ${item.location.lng.toFixed(4)}` : `${item.lastSeenLocation.lat.toFixed(4)}, ${item.lastSeenLocation.lng.toFixed(4)}`}</span>
                  </div>
                  
                  {item.status === 'ACTIVE' || item.status === 'MISSING' ? (
                    <div className="mt-3 flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatus(item.type, item.id, item.type === 'EMERGENCY' ? 'SAFE' : 'FOUND');
                        }}
                        className="flex-1 bg-white/10 hover:bg-white/20 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors"
                      >
                        Resolve
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          simulateLocationUpdate(item);
                        }}
                        className="p-1.5 bg-blue-500/20 hover:bg-blue-500/40 rounded-lg text-blue-400 transition-colors"
                        title="Simulate Location Update"
                      >
                        <Navigation className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-2 text-green-400 text-[10px] font-bold uppercase">
                      <CheckCircle2 className="w-3 h-3" />
                      Resolved
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </aside>

        {/* Main Content - Map & Stats */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 relative">
            <MapView 
              emergencies={emergencies.filter(e => e.status === 'ACTIVE')} 
              missingPersons={missingPersons.filter(m => m.status === 'MISSING')}
              locationHistory={locationHistory}
              selectedId={selectedId}
            />
            
            {/* Floating Stats */}
            <div className="absolute top-6 left-6 z-[1000] flex gap-4 pointer-events-none">
              {stats.map((stat) => (
                <div key={stat.name} className="glass-panel px-6 py-4 rounded-2xl pointer-events-auto">
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">{stat.name}</p>
                  <p className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Panel - Notifications & Charts */}
          <div className="h-64 border-t border-white/10 flex shrink-0 glass-panel">
            <div className="w-1/3 border-r border-white/10 flex flex-col p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Live Notifications
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4">
                {notifications.map((notif) => (
                  <div key={notif.id} className="flex gap-3 text-xs">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full mt-1 shrink-0",
                      notif.severity === 'HIGH' ? "bg-red-500" : notif.severity === 'MEDIUM' ? "bg-yellow-500" : "bg-blue-500"
                    )} />
                    <div>
                      <p className="text-white/80">{notif.message}</p>
                      <p className="text-[10px] text-white/40 mt-1">{notif.timestamp.toDate().toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Response Analytics
              </h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats}>
                    <XAxis dataKey="name" stroke="#ffffff40" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ background: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                      itemStyle={{ fontSize: '12px' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {stats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.6} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
