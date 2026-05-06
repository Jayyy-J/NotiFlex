# FlexNotify — Deployment Guide

## Stack Summary
| Service | Platform | Notes |
|---------|----------|-------|
| API (Node.js) | Railway | Auto-deploy from main branch |
| Web (Next.js) | Vercel | Connect GitHub repo |
| Database | Supabase | Run migration SQL first |
| Scraper (Python) | Local machine / VPS | Keep running 24/7 |
| n8n | Railway | Self-hosted, import JSON workflows |
| Push Notifications | Firebase | FCM, configure in Firebase Console |

---

## 1. Supabase Setup
1. Create project at supabase.com
2. Go to SQL Editor → run `infra/supabase/migrations/001_initial_schema.sql`
3. Copy `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`

## 2. Railway (API + n8n)
```bash
# Install Railway CLI
npm install -g @railway/cli
railway login

# Deploy API
cd packages/api
railway init
railway up

# Set environment variables
railway variables set SUPABASE_URL=...
# (set all vars from .env.example)
```

## 3. Vercel (Web)
```bash
npm install -g vercel
cd apps/web
vercel
# Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_API_URL
```

## 4. Scraper (Local/VPS)
```bash
cd apps/scraper
pip install -r requirements.txt
playwright install chromium
cp .env.example .env
# Fill in your Amazon Flex and DoorDash credentials
python src/main.py
```

## 5. Firebase (Push Notifications)
1. Create project at console.firebase.google.com
2. Add Android + iOS apps with bundle ID `app.flexnotify.mobile`
3. Download `google-services.json` → copy to `apps/mobile/`
4. Copy service account credentials to API `.env`

## 6. Mobile App (Expo)
```bash
cd apps/mobile
npm install
# Development
npx expo start

# Production build
npm install -g eas-cli
eas build --platform android
eas build --platform ios
eas submit
```

## 7. n8n Workflows
1. Access n8n at http://your-railway-n8n-url
2. Import workflow JSON from `infra/n8n/workflow-new-delivery.json`
3. Activate workflow
4. Set webhook URL in Supabase Database Webhooks → point to n8n webhook URL

## Environment Variables Checklist
- [ ] Supabase URL + keys
- [ ] Stripe keys + webhook secret  
- [ ] PayPal client ID + secret
- [ ] MercadoPago access token
- [ ] Wompi public + private keys
- [ ] Firebase service account JSON
- [ ] SCRAPER_API_KEY (generate random secret)
- [ ] N8N_API_KEY (generate random secret)
- [ ] APP_URL (production URL)
- [ ] API_URL (Railway URL)
