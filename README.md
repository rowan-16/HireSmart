# HireSmart — Quick Start Guide

## Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

## Setup

### 1. Server
```
cd server
# Edit .env if needed (MongoDB URI, Google OAuth credentials)
npm install
npm run dev
```

### 2. Client
```
cd client
npm install
npm run dev
```

## Default URLs
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/api/health

## First Login
Register a new account at http://localhost:5173/register

## Google OAuth Setup (Optional)
1. Go to https://console.cloud.google.com/
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: http://localhost:5000/api/auth/google/callback
4. Add your Client ID and Secret to server/.env

## Demo Flow
1. Register/Login
2. Create a job (Dashboard → Create Job)
3. Upload PDFs/DOCX resumes (Jobs → Upload)
4. Generate ranking (Ranking tab)
5. View candidate explanations
6. Check Fairness Dashboard
7. Override a recommendation
8. Review Audit Trail

## Notes
- Semantic embeddings (all-MiniLM-L6-v2) download ~23MB on first use, cached locally
- No external LLM API required — all AI runs locally
- Protected attributes are never used in ranking

## Environment Variables (server/.env)
```
MONGO_URI=mongodb://localhost:27017/hiresmart
JWT_SECRET=your_secret_here
GOOGLE_CLIENT_ID=optional
GOOGLE_CLIENT_SECRET=optional
CLIENT_URL=http://localhost:5173
PORT=5000
```
