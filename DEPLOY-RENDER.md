# Deploy Backend to Render

This guide explains how to deploy the Smart Business Card backend to [Render](https://render.com) using Docker.

## Prerequisites

- A [Render](https://render.com) account
- A [Cloudinary](https://cloudinary.com) account (for image uploads)
- PostgreSQL database (Render provides this)

## Deployment Options

### Option 1: Manual Deployment (Recommended)

#### Step 1: Create a PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **PostgreSQL**
3. Configure:
   - **Name**: `smart-business-card-db`
   - **Database Name**: `smart_business_card`
   - **User**: `smart_business_card`
   - **Region**: `Frankfurt` (EU) or your preferred region
4. Click **Create Database**
5. Wait for the database to be provisioned (green status)
6. Copy the **Connection String** (you'll need it later)

#### Step 2: Create a Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `smart-business-card-api`
   - **Region**: `Frankfurt` (same as database)
   - **Runtime**: `Docker`
   - **Build Command**: `npm ci && npx prisma generate && npm run build`
   - **Start Command**: `node dist/index.js`
5. Click **Create Web Service**

#### Step 3: Configure Environment Variables

In the **Environment** tab, add these variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `API_VERSION` | `v1` |
| `DATABASE_URL` | (from Step 1) |
| `JWT_SECRET` | (generate a secure random string, min 32 chars) |
| `JWT_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | (your frontend URL) |
| `CARD_PUBLIC_URL` | (your frontend URL + `/card`) |
| `CLOUDINARY_CLOUD_NAME` | (from Cloudinary dashboard) |
| `CLOUDINARY_API_KEY` | (from Cloudinary dashboard) |
| `CLOUDINARY_API_SECRET` | (from Cloudinary dashboard) |

#### Step 4: Health Check

The API includes a health check endpoint at `/api/v1/health`. Configure Render's health check to use:
- **Path**: `/api/v1/health`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 3

---

### Option 2: Blueprint Deployment (Automatic)

Render supports `render.yaml` blueprints for automatic infrastructure setup.

1. Push your code to GitHub
2. Go to [Render Blueprints](https://dashboard.render.com/blueprints)
3. Click **New Blueprint Instance**
4. Connect your repository
5. Render will automatically:
   - Create the PostgreSQL database
   - Create the web service
   - Configure environment variables

---

## After Deployment

### Run Migrations

After the first deployment, run database migrations:

1. Go to your web service on Render
2. Click **Shell** to open a shell
3. Run:
   ```bash
   npx prisma migrate deploy
   ```

### Seed the Database (Optional)

To create an admin user:
```bash
npm run seed
```

### Verify Deployment

Test the API:
```bash
curl https://your-api-url.onrender.com/api/v1/health
```

Expected response:
```json
{
  "success": true,
  "message": "Smart Business Card API",
  "version": "v1"
}
```

---

## Troubleshooting

### Build Fails

1. Check that `node_modules` is not in `.dockerignore`
2. Ensure `package.json` has the correct dependencies
3. Verify `tsconfig.json` configuration

### Database Connection Fails

1. Verify `DATABASE_URL` is correct
2. Ensure database and web service are in the same region
3. Check that the database is fully provisioned (green status)

### Health Check Fails

1. Verify the port is set to `5000`
2. Check that the app is listening on `0.0.0.0` (not `localhost`)
3. View logs in Render dashboard for errors

### View Logs

1. Go to your web service on Render
2. Click **Logs** tab
3. Filter by `INFO`, `WARN`, or `ERROR`

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Set to `production` |
| `PORT` | No | Port for the server (default: 5000) |
| `API_VERSION` | No | API version prefix (default: v1) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret key for JWT tokens |
| `JWT_EXPIRES_IN` | No | Token expiration (default: 7d) |
| `FRONTEND_URL` | Yes | Frontend application URL |
| `CARD_PUBLIC_URL` | Yes | Public card page URL |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret |

---

## Updating the Deployment

To deploy a new version:

1. Push changes to your GitHub repository
2. Render automatically detects changes
3. Click **Deploy** in the Render dashboard (or it auto-deploys)

For manual redeploy:
1. Go to your web service
2. Click **Deploy** → **Deploy latest commit**
