# Climate Guard — Full-Stack Climate Intelligence & IMD Heatwave Early Warning System

**Use Case ID:** `KJS-CES-01`  
**Stack:** React 19 + Vite (Frontend) · Node.js + Express.js + MongoDB + Mongoose + GridFS (Backend)

---

## Project Structure

```text
climate-ai-usecase-main/
├── frontend/        # React 19 + Vite Glassmorphic IMD Dashboard
├── backend/         # Node.js + Express.js + MongoDB REST API & Classification Engine
└── README.md        # Full-Stack Quick Start Guide
```

---

## Quick Start (Windows PowerShell)

### 1. Ensure MongoDB is Running
```powershell
net start MongoDB
```
*(Or set your MongoDB Atlas connection string in `backend/.env` under `MONGO_URI`).*

### 2. Install, Seed & Start the Backend (Terminal 1)
```powershell
cd backend
npm install
npm run seed
npm run store:weather-api
npm run dev
```
- Backend Server: `http://localhost:5000`
- Health Endpoint: `http://localhost:5000/api/health`

### 3. Install & Start the React Frontend (Terminal 2)
```powershell
cd frontend
npm install
npm run dev
```
- Frontend Dashboard: `http://localhost:5173`

### 4. Run Automated Verification & Boundary Tests
```powershell
cd backend
npm run test:engine
```

For full architecture, database schema, classification thresholds, and REST API documentation, see [`backend/README.md`](./backend/README.md).
