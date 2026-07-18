# Deployment Quick Reference

## One-Sentence Summary
Backend (Render) + Frontend (Vercel) + Google Cloud Translation = Full production multi-language app

---

## Render Deployment (Backend)

### Step 1: Create Service Account Key
```bash
gcloud iam service-accounts create messho-translator
gcloud iam service-accounts keys create render-key.json \
  --iam-account=messho-translator@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### Step 2: Deploy on Render
1. Go to [render.com](https://render.com)
2. Connect GitHub repo
3. Add secret file: `gcp-credentials.json` (copy contents of `render-key.json`)
4. Add environment variables:
   ```
   GOOGLE_CLOUD_PROJECT=your-project-id
   GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/gcp-credentials.json
   MONGODB_URI=your-mongodb-url
   PORT=3001
   NODE_ENV=production
   CORS_ORIGINS=https://your-vercel-url.vercel.app
   ```
5. Start command: `npm start`
6. Deploy

**Result**: `https://your-backend.onrender.com`

---

## Vercel Deployment (Frontend)

### Step 1: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import GitHub repo
3. Framework: `Vite`
4. Add environment variable:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```
5. Deploy

**Result**: `https://your-app.vercel.app`

---

## After Deployment

### Test Translation
```bash
# From your browser DevTools Console or curl:
curl -X POST https://your-backend.onrender.com/api/translate/batch \
  -H "Content-Type: application/json" \
  -d '{
    "texts": ["Hello", "Welcome"],
    "sourceLanguage": "en",
    "targetLanguage": "hi"
  }'
```

Expected: Hindi translations

### Test Frontend
1. Open `https://your-app.vercel.app`
2. Look for **Globe icon** in top-right
3. Select **हिन्दी (Hindi)**
4. Page should translate to Hindi

---

## Important Environment Variables

| Platform | Variable | Value | Where to Set |
|----------|----------|-------|--------------|
| Render | `GOOGLE_CLOUD_PROJECT` | `your-project-id` | Render Dashboard |
| Render | `GOOGLE_APPLICATION_CREDENTIALS` | `/etc/secrets/gcp-credentials.json` | Render Dashboard |
| Render | `MONGODB_URI` | Your MongoDB URL | Render Dashboard |
| Render | `CORS_ORIGINS` | Your Vercel frontend URL | Render Dashboard |
| Vercel | `VITE_API_URL` | Your Render backend URL | Vercel Project Settings |

---

## Files NOT to Commit to GitHub

```
.env
render-key.json
gcp-credentials.json
service-account*.json
```

These should be in `.gitignore` (already added)

---

## Troubleshooting Quick Fixes

| Problem | Fix |
|---------|-----|
| Render can't find gcp credentials | Check secret file exists in Render Dashboard |
| Frontend shows "Translation failed" | Check `VITE_API_URL` in Vercel matches Render URL |
| CORS error | Add Vercel URL to Render's `CORS_ORIGINS` variable |
| "Permission denied" from Google API | Regenerate service account JSON key & re-upload to Render |
| Page not translating | Check browser DevTools → Network → look for `/api/translate/batch` calls |

---

## Cost Estimate

- **Render Backend**: $7/month (Starter tier, always-on)
- **Vercel Frontend**: Free (unless you need Pro features)
- **Google Cloud**: Free (500K characters/month covers all UI)
- **Total**: ~$7/month

---

## Next Steps

1. ✅ Run Google Cloud setup (local machine)
2. ✅ Create service account JSON key
3. ✅ Deploy backend to Render
4. ✅ Deploy frontend to Vercel
5. ✅ Update `CORS_ORIGINS` if needed
6. ✅ Test translations on deployed URL

**All done!** Your app is now live with multi-language support 🚀
