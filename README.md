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
- Frontend: https://hire-smart-1snd8w21m-my-own18.vercel.app
- Backend API: https://hiresmart-4jfl.onrender.com/api
- Health check: https://hiresmart-4jfl.onrender.com/api/health

## First Login
Register a new account at https://hire-smart-1snd8w21m-my-own18.vercel.app/register

## Google OAuth Setup (Optional)
1. Go to https://console.cloud.google.com/
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: https://hiresmart-4jfl.onrender.com/api/auth/google/callback
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
MONGO_URI=mongodb+srv://rocklandrowanm_db_user:<db_password>@cluster0.kurfy4f.mongodb.net/hiresmart?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_secret_here
GOOGLE_CLIENT_ID=optional
GOOGLE_CLIENT_SECRET=optional
CLIENT_URL=https://hire-smart-1snd8w21m-my-own18.vercel.app
SERVER_URL=https://hiresmart-4jfl.onrender.com
PORT=5000
```
