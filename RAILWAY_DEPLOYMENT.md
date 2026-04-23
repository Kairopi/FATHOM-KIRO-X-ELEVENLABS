# Railway Deployment Guide for Fathom

## Important: This is a Monorepo

Fathom has a client (frontend) and server (backend) in the same repository. Railway requires **TWO SEPARATE SERVICES** for this setup.

## Step-by-Step Deployment

### 1. Delete Your Current Railway Project
- Go to Railway dashboard
- Open your current project
- Settings > Danger > Delete Project
- Start fresh to avoid configuration conflicts

### 2. Create New Empty Project
- Click "+ New Project"
- Choose "Empty Project"
- Rename it to "Fathom"

### 3. Create Backend Service

#### A. Add Empty Service
- Click "+ Create" in top right
- Choose "Empty Service"
- Right-click the service > Rename to "Backend"

#### B. Configure Backend
- Click on Backend service
- Go to Settings tab
- **Root Directory**: Set to `server`
- **Connect Repo**: Click "Connect Repo" > Select your GitHub repo
- **Start Command**: Leave empty (Railway will auto-detect from package.json)

#### C. Add Backend Environment Variables
- Click Variables tab
- Add these variables:
  ```
  ELEVENLABS_API_KEY=your_key_here
  DASHSCOPE_API_KEY=your_key_here
  ACCESS_CODE=JUDGE2024
  PORT=3001
  ```

#### D. Generate Backend Domain
- Go to Settings tab
- Scroll to Networking
- Click "Generate Domain"
- Copy this domain (you'll need it for the frontend)

### 4. Create Frontend Service

#### A. Add Empty Service
- Click "+ Create" in top right
- Choose "Empty Service"
- Right-click the service > Rename to "Frontend"

#### B. Configure Frontend
- Click on Frontend service
- Go to Settings tab
- **Root Directory**: Set to `client`
- **Connect Repo**: Click "Connect Repo" > Select your GitHub repo
- **Build Command**: `npm run build`
- **Start Command**: Leave empty

#### C. Add Frontend Environment Variables
- Click Variables tab
- Add:
  ```
  VITE_API_URL=https://your-backend-domain.railway.app
  ```
  (Replace with your actual backend domain from step 3D)

#### D. Generate Frontend Domain
- Go to Settings tab
- Scroll to Networking
- Click "Generate Domain"
- This is your public app URL

### 5. Deploy Both Services
- Both services should automatically deploy after configuration
- If not, click "Deploy" button on each service

### 6. Update Backend CORS (After First Deploy)
After both services are deployed, you need to allow the frontend domain in your backend:

- Go to Backend service > Variables
- Add:
  ```
  FRONTEND_URL=https://your-frontend-domain.railway.app
  ```

Then update `server/index.ts` to use this variable in CORS configuration.

## Troubleshooting

### Build Fails with Tailwind Error
If you see "Cannot find native binding" error:
1. Go to service Settings
2. Add this to Variables:
   ```
   NPM_CONFIG_PLATFORM=linux
   NPM_CONFIG_ARCH=x64
   ```
3. Redeploy

### Services Can't Communicate
- Make sure both services have public domains generated
- Check that VITE_API_URL in frontend matches backend domain
- Check that FRONTEND_URL in backend matches frontend domain

### Database Not Persisting
- Go to Backend service > Settings
- Add a Volume:
  - Mount Path: `/app/data`
  - Update your database path to use `/app/data/fathom.db`

## Why Two Services?

Railway treats each subdirectory (client, server) as a separate application. This approach:
- Allows independent scaling
- Provides separate build environments
- Enables proper networking between services
- Follows Railway's best practices for monorepos

## Cost Estimate

- Free tier: $5 credit (should last ~30 days for light usage)
- Each service uses resources independently
- Monitor usage in Railway dashboard
