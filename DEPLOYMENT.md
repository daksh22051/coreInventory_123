CoreInventory Deployment Guide

Architecture
- Frontend: Next.js app in frontend folder
- Backend: Node.js + Express + Socket.IO in backend folder
- Database: MongoDB (Atlas recommended for production)

Recommended Hosting
- Frontend: Vercel
- Backend: Render (or Railway)
- Database: MongoDB Atlas

1) Prepare MongoDB Atlas
1. Create a free cluster in MongoDB Atlas.
2. Create a database user.
3. Add network access rule (0.0.0.0/0 for quick setup, then restrict later).
4. Copy connection string and set it as MONGODB_URI in backend environment.

2) Deploy Backend (Render)
1. Push code to GitHub.
2. In Render, create New Web Service and connect repo.
3. Root Directory: backend
4. Build Command: npm install
5. Start Command: npm start
6. Add Environment Variables:
   - PORT=10000
   - MONGODB_URI=<your atlas uri>
   - JWT_SECRET=<strong random value>
   - JWT_EXPIRE=7d
   - CORS_ORIGINS=https://your-frontend-domain.vercel.app
   - EMAIL_USER=<optional>
   - EMAIL_PASS=<optional>
7. Deploy and copy backend URL, for example:
   https://coreinventory-api.onrender.com

3) Deploy Frontend (Vercel)
1. In Vercel, import same GitHub repo.
2. Project Root: frontend
3. Framework preset should detect Next.js automatically.
4. Add Environment Variable:
   - NEXT_PUBLIC_API_URL=https://coreinventory-api.onrender.com
5. Deploy.

4) Update Backend CORS After Frontend URL Is Final
- Go to backend service env vars and set:
  CORS_ORIGINS=https://your-final-frontend-domain.vercel.app
- Redeploy backend.

5) Smoke Test
- Open frontend URL.
- Verify login/signup works.
- Verify products list fetches successfully.
- Verify API health endpoint:
  GET https://your-backend-domain/api/health
- Verify browser console has no CORS errors.

6) Optional: Single Domain Setup
If you want same domain for frontend and backend:
- Use custom domain on frontend in Vercel.
- Use subdomain for API (api.yourdomain.com) in Render.
- Set NEXT_PUBLIC_API_URL to api subdomain.
- Set CORS_ORIGINS to frontend domain.

Common Issues
- CORS error:
  Backend CORS_ORIGINS missing frontend URL or has typo.
- 500 error on APIs:
  MONGODB_URI invalid or Atlas IP/network rule not configured.
- Frontend still calling localhost:
  NEXT_PUBLIC_API_URL not set in Vercel or redeploy not done.
- Socket reconnect issues:
  Ensure backend URL is HTTPS and reachable publicly.

Local verification before deploy
- Frontend:
  cd frontend
  npm install
  npm run build
- Backend:
  cd backend
  npm install
  npm start
