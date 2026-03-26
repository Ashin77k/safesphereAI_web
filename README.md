# Guardian Response Dashboard

A real-time emergency response and missing persons tracking dashboard built with React, Firebase, and Leaflet.

## 🚀 Features

- **Real-time Emergency Monitoring**: Live tracking of emergency reports with visual alerts.
- **Missing Persons Database**: Manage and track missing person cases with last-seen locations.
- **Live Location History**: Visual breadcrumb trails on the map showing the movement history of active cases.
- **Interactive Map**: Built with Leaflet, featuring dark-mode styling and custom markers.
- **Multi-Source Sync**: Synchronizes data between Firebase Firestore and an external backend API.
- **Admin Simulation**: Tools for administrators to simulate location updates for testing.
- **Responsive Design**: Fully responsive dashboard optimized for both desktop and mobile command centers.
- **Secure Authentication**: Google OAuth integration for authorized personnel access.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS 4, Lucide React (Icons), Motion (Animations)
- **Database/Auth**: Firebase (Firestore & Authentication)
- **Mapping**: Leaflet, React Leaflet
- **Charts**: Recharts
- **Backend Integration**: REST API polling and synchronization

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Firebase project with Firestore and Authentication enabled.
- (Optional) An external backend server matching the SafeSphere AI API spec.

## ⚙️ Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/your-username/guardian-response-dashboard.git
cd guardian-response-dashboard
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory based on `.env.example`:
```bash
cp .env.example .env
```
Fill in your configuration:
- `VITE_BACKEND_URL`: Your external backend API URL.
- Firebase configuration (see step 4).

### 4. Firebase Configuration
Create a `src/firebase-applet-config.json` file with your Firebase project credentials:
```json
{
  "apiKey": "YOUR_API_KEY",
  "authDomain": "YOUR_AUTH_DOMAIN",
  "projectId": "YOUR_PROJECT_ID",
  "storageBucket": "YOUR_STORAGE_BUCKET",
  "messagingSenderId": "YOUR_MESSAGING_SENDER_ID",
  "appId": "YOUR_APP_ID",
  "firestoreDatabaseId": "(default)"
}
```

### 5. Firestore Security Rules
Deploy the rules provided in `firestore.rules` to your Firebase project to ensure data security.

## 🚀 Running the App

### Development Mode
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

### Production Build
```bash
npm run build
```
The optimized build will be in the `dist/` folder.

## 📁 Project Structure

- `src/components/`: Reusable UI components (Map, Sidebar, etc.)
- `src/services/`: API and Firebase service logic.
- `src/types.ts`: TypeScript interfaces and types.
- `src/firebase.ts`: Firebase initialization and helper functions.
- `firestore.rules`: Security rules for your database.
- `firebase-blueprint.json`: Data structure definition.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
