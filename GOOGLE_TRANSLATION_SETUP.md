# Google Cloud Translation Setup Guide

Complete setup for multi-language support in Messho Pragati using Google Cloud Translation API.

## Quick Summary

✅ **Backend**: Translation API endpoint created at `/api/translate/batch`
✅ **Frontend**: Language provider and selector components ready
✅ **Database**: Translation caching model (MongoDB) for cost savings
✅ **UI**: English catalog and translation hooks ready to use
⏳ **Your Action**: Add Google Cloud project ID and authenticate

---

## Step 1: Google Cloud Project Setup

### 1.1 Create or Select a Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Name: `messho-pragati` (or your choice)
4. Click "Create"

### 1.2 Enable Required APIs

1. In the left sidebar, click **APIs & Services** → **Library**
2. Search for **"Cloud Translation API"**
3. Click it and press **Enable**
4. Google will prompt you to enable billing — **click Enable** (required)

### 1.3 Set Up Billing

1. Go to **Billing** → **Create Account** (if needed)
2. Add a payment method
3. Set up a **Budget Alert** (optional but recommended):
   - Click **Budgets & Alerts**
   - Create budget for ~$10-50/month depending on usage
   - Gets notified when approaching limit

### 1.4 Record Your Project ID

1. Click the **Project Selector** dropdown (top-left)
2. Copy your **Project ID** (looks like: `messho-pragati-2024-1a2b3c`)
3. Keep this handy for the next step

---

## Step 2: Install Google Cloud CLI

### On Windows (PowerShell as Administrator)

```powershell
# Download installer
Invoke-WebRequest -Uri "https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe" -OutFile "$env:TEMP\GoogleCloudSDKInstaller.exe"

# Run installer
& "$env:TEMP\GoogleCloudSDKInstaller.exe"

# Verify installation
gcloud --version
```

### On macOS

```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud --version
```

### On Linux

```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud --version
```

---

## Step 3: Authenticate with Google Cloud

### 3.1 Initialize gcloud

```bash
# Windows (PowerShell)
gcloud init

# macOS / Linux
gcloud init
```

This will:
- Ask you to log in (opens browser)
- Ask you to select your project
- Set up default region (any region is fine)

### 3.2 Set Up Application Default Credentials

```bash
gcloud auth application-default login
```

This creates a local credentials file at:
- **Windows**: `C:\Users\[YourUsername]\AppData\Roaming\gcloud\application_default_credentials.json`
- **macOS/Linux**: `~/.config/gcloud/application_default_credentials.json`

**Important**: This file is automatically picked up by the backend. Do NOT commit it to GitHub (already in `.gitignore`).

---

## Step 4: Update Backend Configuration

### 4.1 Set Your Project ID in `.env`

Open `backend/.env` and update:

```env
# Google Cloud Translation
GOOGLE_CLOUD_PROJECT=your-google-cloud-project-id
GOOGLE_APPLICATION_CREDENTIALS=./gcp-credentials.json
```

Replace `your-google-cloud-project-id` with your actual Project ID from Step 1.4

### 4.2 Verify Dependencies

The backend already has `@google-cloud/translate` installed. Verify:

```bash
cd backend
npm list @google-cloud/translate
```

Should show: `@google-cloud/translate@8.5.0` (or newer)

---

## Step 5: Test the Translation API

### 5.1 Start the Backend

```bash
cd backend
npm run dev
```

Should log:
```
✓ Groq initialized
✓ Database connected
Server running on port 3001
```

### 5.2 Test Translation Endpoint

**Using cURL (Windows PowerShell)**:
```powershell
$body = @{
    texts = @("Hello", "Welcome", "Dashboard")
    sourceLanguage = "en"
    targetLanguage = "hi"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3001/api/translate/batch" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

**Using cURL (macOS/Linux)**:
```bash
curl -X POST http://localhost:3001/api/translate/batch \
  -H "Content-Type: application/json" \
  -d '{
    "texts": ["Hello", "Welcome", "Dashboard"],
    "sourceLanguage": "en",
    "targetLanguage": "hi"
  }'
```

**Expected Response**:
```json
{
  "sourceLanguage": "en",
  "targetLanguage": "hi",
  "translations": [
    "नमस्ते",
    "स्वागत है",
    "डैशबोर्ड"
  ],
  "cacheHit": false
}
```

If you see errors, check:
- ✓ Project ID is correct
- ✓ Cloud Translation API is enabled
- ✓ Billing is set up
- ✓ `gcloud auth application-default login` was run

---

## Step 6: Start the Frontend

### 6.1 Run Frontend Dev Server

```bash
cd frontend
npm run dev
```

Should show:
```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173
```

### 6.2 Test Language Selector

1. Open http://localhost:5173
2. Look for **Globe icon** in the top navigation
3. Click dropdown and select **हिन्दी (Hindi)**
4. Page should translate to Hindi automatically
5. Switch to other languages to test

---

## Step 7: Integrate Translations in Components

### 7.1 Use in Any Component

```jsx
import { useLanguage } from "../i18n/LanguageProvider";

export function MyComponent() {
  const { t } = useLanguage();

  return (
    <div>
      <h1>{t("dashboard")}</h1>
      <button>{t("approve")}</button>
      <p>{t("welcome")}</p>
    </div>
  );
}
```

### 7.2 Add New UI Strings

1. Open `frontend/src/locales/english.js`
2. Add your new key:
   ```js
   myNewFeature: "My New Feature Label",
   ```
3. Use in component: `t("myNewFeature")`
4. Translation happens automatically on language change

---

## .env Configuration Reference

### Backend `.env` Variables

| Variable | Example | Purpose |
|----------|---------|---------|
| `GOOGLE_CLOUD_PROJECT` | `messho-pragati-2024-1a2b3c` | Your Google Cloud project ID |
| `GOOGLE_APPLICATION_CREDENTIALS` | `./gcp-credentials.json` | Path to credentials (auto-picked up) |
| `PORT` | `3001` | Backend port |
| `NODE_ENV` | `development` | Environment mode |

### Frontend `.env` Variables

| Variable | Example | Purpose |
|----------|---------|---------|
| `VITE_API_URL` | `http://localhost:3001` | Backend URL for translation API |

---

## How Translation Caching Works

1. **First translation request** → Calls Google Cloud API → Saves to MongoDB → Returns result
2. **Second same request** → Checks MongoDB → Returns cached translation (free!)
3. **Browser cache** → localStorage stores translations for instant page loads

**Cost savings**:
- First user translates "Dashboard" to Hindi: $0.000015 (micro-cost)
- Next 999 users get it free from cache
- Reduces Google API costs by ~80%

---

## Production Deployment

### On Google Cloud Run

1. Create `.env` with your project ID
2. Deploy backend to Cloud Run:
   ```bash
   gcloud run deploy messho-pragati-backend \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```
3. Google Cloud Run automatically uses service account credentials (no JSON file needed)

### On Render (Recommended for Backend)

#### 4A. Create Service Account JSON Key (One-time)

Run on your local machine:

```bash
# Create service account
gcloud iam service-accounts create messho-translator

# Grant necessary permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:messho-translator@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudtranslate.user"

# Create and download JSON key
gcloud iam service-accounts keys create render-key.json \
  --iam-account=messho-translator@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

Replace `YOUR_PROJECT_ID` with your actual Google Cloud Project ID.

#### 4B. Deploy to Render

1. Push your backend to GitHub (if not already)
2. Go to [Render.com](https://render.com/)
3. Click **New** → **Web Service**
4. Connect your GitHub repository
5. Fill in:
   - **Name**: `messho-pragati-backend`
   - **Runtime**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Region**: Choose closest to your users

6. Add Environment Variables:
   - Click **Environment** → **Add Secret File**
   - **Filename**: `gcp-credentials.json`
   - **Contents**: Paste entire contents of `render-key.json` (created above)

7. Add Regular Environment Variables:
   - `GOOGLE_CLOUD_PROJECT`: Your Project ID
   - `GOOGLE_APPLICATION_CREDENTIALS`: `/etc/secrets/gcp-credentials.json`
   - `PORT`: `3001`
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: Your MongoDB connection string
   - `CORS_ORIGINS`: `https://your-frontend.vercel.app`

8. Click **Create Web Service**

After deployment, Render will give you a URL like: `https://messho-pragati-backend.onrender.com`

### On Vercel (Frontend)

#### 4C. Deploy Frontend to Vercel

1. Push your frontend to GitHub
2. Go to [Vercel.com](https://vercel.com)
3. Click **New Project**
4. Import your repository
5. **Framework**: Select `Vite`
6. Add Environment Variable:
   - `VITE_API_URL`: `https://messho-pragati-backend.onrender.com`

7. Click **Deploy**

After deployment, Vercel will give you URL like: `https://your-app.vercel.app`

#### 4D. Update Backend CORS

Update your backend `CORS_ORIGINS` to include Vercel URL:
```
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://your-app.vercel.app
```

---

### On Other Platforms (Heroku, AWS, etc.)

1. Create service account JSON key (same as Render Step 4A):
   ```bash
   gcloud iam service-accounts create messho-translator
   gcloud iam service-accounts keys create key.json \
     --iam-account=messho-translator@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

2. Upload `key.json` to platform's secret manager
3. Set environment variables:
   - `GOOGLE_CLOUD_PROJECT`: Your Project ID
   - `GOOGLE_APPLICATION_CREDENTIALS`: `/path/to/secret/gcp-credentials.json`
   - `MONGODB_URI`: Your database URL

---

## Complete Deployment Checklist

### Before Deployment

- [ ] Google Cloud project created with billing enabled
- [ ] Cloud Translation API enabled
- [ ] Service account JSON key created (`render-key.json`)
- [ ] Backend code pushed to GitHub
- [ ] Frontend code pushed to GitHub
- [ ] `.env` files NOT committed (check `.gitignore`)

### Environment Variables Summary

**Backend on Render** `.env`:
```env
GOOGLE_CLOUD_PROJECT=your-google-cloud-project-id
GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/gcp-credentials.json
MONGODB_URI=mongodb+srv://user:pass@cluster0.mongodb.net/?appName=Cluster0
PORT=3001
NODE_ENV=production
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://your-app.vercel.app
```

**Frontend on Vercel** `.env`:
```env
VITE_API_URL=https://messho-pragati-backend.onrender.com
```

### Deployment Steps (Summary)

1. **Google Cloud Setup** (one-time):
   - Create project & enable Translation API
   - Create service account & JSON key
   - Keep `render-key.json` safe (don't commit)

2. **Backend Deployment** (Render):
   - Push to GitHub
   - Create new Web Service on Render
   - Add `gcp-credentials.json` as secret file
   - Add environment variables
   - Deploy

3. **Frontend Deployment** (Vercel):
   - Push to GitHub
   - Import project on Vercel
   - Set `VITE_API_URL` to Render backend URL
   - Deploy

4. **Test**:
   - Open frontend: `https://your-app.vercel.app`
   - Click language selector
   - Verify translations load
   - Check browser DevTools → Network for `/api/translate/batch` calls

---

## Troubleshooting Deployment

### ❌ "Cannot find module @google-cloud/translate"

**Frontend Render Issue**: Make sure build command is correct:
```
cd backend && npm install && npm run build
```

### ❌ "GOOGLE_APPLICATION_CREDENTIALS not found"

**Solution on Render**:
1. Go to Render Dashboard → Your Service
2. Click **Environment**
3. Verify secret file `gcp-credentials.json` exists
4. Verify path in env var: `/etc/secrets/gcp-credentials.json`
5. Restart service

### ❌ "403 Permission denied" from Google API

**Solution**:
1. Verify service account has `Cloud Translation User` role
2. Regenerate JSON key
3. Update secret on Render
4. Restart service

### ❌ "CORS error from frontend"

**Solution**:
1. Get your actual Vercel URL (e.g., `https://messho-pragati-prod.vercel.app`)
2. Update Render backend `CORS_ORIGINS` environment variable:
   ```
   CORS_ORIGINS=https://messho-pragati-prod.vercel.app
   ```
3. Restart Render service
4. Clear browser cache & reload

### ❌ Translation works locally but not on Vercel

**Solution**:
1. Check Vercel environment variables:
   - Click Project → Settings → Environment Variables
   - Verify `VITE_API_URL` is set correctly
   - Should be your Render backend URL

2. Check frontend build:
   - Vercel should show: `✓ Build successful`
   - If build fails, check logs

3. Test API directly:
   ```bash
   curl https://your-render-backend.onrender.com/health
   ```
   Should return `{"status":"ok",...}`

---

## Cost on Render + Vercel

### Render Pricing (Backend)
- **Free Tier**: 0.5 GB RAM, 0.5 vCPU, auto-pauses after 15 min inactivity
- **Starter**: $7/month, always active
- **Standard**: $12/month, better performance

### Vercel Pricing (Frontend)
- **Free Tier**: 100 GB bandwidth/month, auto-scaling
- **Pro**: $20/month, priority support

### Google Cloud Pricing (Translation)
- **Free Tier**: 500K characters/month (covers UI translations)
- **Pay-as-you-go**: $15 per million characters after free tier

**Total Monthly Cost**: $7-12 (Render) + $0-20 (Vercel) + $0-15 (Google) = $7-47/month

---

## Production Best Practices

### 1. Secure Your Credentials
- ✅ Never commit `gcp-credentials.json`
- ✅ Use Render's secret files feature
- ✅ Rotate keys every 90 days
- ✅ Monitor API usage in Google Cloud Console

### 2. Optimize Translation Performance
- ✅ MongoDB caching saves 80% API calls
- ✅ Browser localStorage caches for instant loads
- ✅ Batch API reduces request overhead

### 3. Monitor Costs
- ✅ Set Google Cloud budget alerts
- ✅ Check Render resource usage
- ✅ Monitor translation API usage monthly

### 4. Handle Failures Gracefully
- ✅ If translation fails, falls back to English
- ✅ Shows "Translating..." state while loading
- ✅ Caches successful translations permanently

### 5. Scale for More Users
- ✅ Upgrade Render from Free → Starter → Standard
- ✅ Add Vercel Pro for more bandwidth
- ✅ Increase Google Cloud quota as needed

| Code | Language | Native | Region |
|------|----------|--------|--------|
| en | English | English | Pan-India |
| hi | Hindi | हिन्दी | North |
| mr | Marathi | मराठी | Western |
| bn | Bengali | বাংলা | Eastern |
| gu | Gujarati | ગુજરાતી | Western |
| pa | Punjabi | ਪੰਜਾਬੀ | Northern |
| ta | Tamil | தமிழ் | Southern |
| te | Telugu | తెలుగు | Southern |
| kn | Kannada | ಕನ್ನಡ | Southern |
| ml | Malayalam | മലയാളം | Southern |
| or | Odia | ଓଡ଼ିଆ | Eastern |
| as | Assamese | অসমীয়া | Northeastern |
| ur | Urdu | اردو | North (RTL) |

---

## Troubleshooting

### ❌ "GOOGLE_CLOUD_PROJECT is not configured"

**Solution**: Add to `backend/.env`:
```
GOOGLE_CLOUD_PROJECT=your-actual-project-id
```

### ❌ "Access Denied" / "Permission Denied"

**Solution**: Run:
```bash
gcloud auth application-default login
```

### ❌ "Cloud Translation API not enabled"

**Solution**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Search for "Cloud Translation API"
3. Click **Enable**
4. Wait 30 seconds and retry

### ❌ Translation returns empty strings

**Solution**: Likely API rate limit or quota issue
1. Check Google Cloud Console → Quota page
2. Increase if needed
3. Restart backend: `npm run dev`

### ❌ "Billing required"

**Solution**: Google Cloud requires active billing for Translation API. Add payment method in Google Cloud Console → Billing.

---

## Cost Estimates

**Google Cloud Translation Pricing**:
- First 500K characters/month: FREE
- Beyond: $15 per million characters

**For Messho Pragati**:
- Average UI: ~50KB of strings
- 12 languages: 50KB × 12 = 600KB (within free tier)
- Monthly cost: $0 (free tier covers it)

---

## Next Steps

1. ✅ Complete Step 1-6 above
2. ✅ Test translation at http://localhost:5173
3. ✅ Update components to use `t("key")`
4. ✅ Add new UI strings to `english.js`
5. ✅ Deploy backend and frontend

---

**Questions?** Check browser console (F12) for translation logs and errors.
