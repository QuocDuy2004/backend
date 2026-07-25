# Deploy len Vercel

Project nay chay Vite frontend va Express API tren Vercel:

- Frontend: static output trong `dist`
- API: `/api/*`
- Webhook: `/webhook/*`
- SPA fallback: cac route frontend quay ve `index.html`

## 1. Cau hinh Project Settings tren Vercel

Vao Vercel Dashboard -> Project `backend-5nxv` -> Settings -> General:

| Setting | Gia tri |
| --- | --- |
| Framework Preset | Other |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | de mac dinh hoac `npm install` |
| Root Directory | `.` |

Neu dung CLI:

```bash
npx vercel project update backend-5nxv --framework other --build-command "npm run build" --output-directory dist
```

## 2. Cau hinh Environment Variables

Vao Vercel Dashboard -> Project `backend-5nxv` -> Settings -> Environment Variables.

Them cac bien sau cho moi truong `Production`:

```env
NODE_ENV=production
APP_URL=https://backend-5nxv.vercel.app
FRONTEND_URL=https://frontend-ten-gamma-17.vercel.app
EXTRA_CORS_ORIGINS=https://frontend-ten-gamma-17.vercel.app
VITE_API_BASE_URL=
JWT_SECRET=your-random-secret-at-least-32-characters
JWT_EXPIRES_IN=7d
DATABASE_URL=mysql://root:password@tramway.proxy.rlwy.net:30596/railway
DB_HOST=mysql-xxx.aivencloud.com
DB_PORT=3306
DB_USER=avnadmin
DB_PASSWORD=your-db-password
DB_DATABASE=defaultdb
DB_SSL=true
DB_CONNECTION_LIMIT=5
GEMINI_API_KEY=
VNPAY_TMN_CODE=
VNPAY_HASH_SECRET=
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=
MOMO_PARTNER_CODE=
MOMO_ACCESS_KEY=
MOMO_SECRET_KEY=
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_RETURN_URL=
MOMO_IPN_URL=
```

Ghi chu:

- Khong commit `.env.local`, `.env.production.local`, hay mat khau that len GitHub.
- Neu dung Aiven MySQL, thuong can `DB_SSL=true`.
- Neu dung Railway, copy thang `MYSQL_PUBLIC_URL` hoac `DATABASE_URL` tu tab Variables va dan vao `DATABASE_URL`.
- Neu frontend Expo/mobile goi API nay, dat `FRONTEND_URL` va `EXTRA_CORS_ORIGINS` bang domain frontend do.
- `APP_URL` van la domain backend, vi backend dung no de build return URL cho thanh toan.
- Sau khi gan custom domain, chi can doi `APP_URL` neu backend doi domain; frontend domain thi giu trong `FRONTEND_URL`.
- Neu muon day nhanh tu file local, sua `.env.vercel.local` roi chay:

```bash
powershell -ExecutionPolicy Bypass -File scripts/push-vercel-env.ps1
```

## 3. Them env bang CLI

Vi du:

```bash
npx vercel env add NODE_ENV production --project backend-5nxv --value "production" --yes
npx vercel env add APP_URL production --project backend-5nxv --value "https://backend-5nxv.vercel.app" --yes
npx vercel env add FRONTEND_URL production --project backend-5nxv --value "https://frontend-ten-gamma-17.vercel.app" --yes
npx vercel env add EXTRA_CORS_ORIGINS production --project backend-5nxv --value "https://frontend-ten-gamma-17.vercel.app" --yes
npx vercel env add JWT_SECRET production --project backend-5nxv --value "your-random-secret-at-least-32-characters" --yes
npx vercel env add DB_HOST production --project backend-5nxv --value "mysql-xxx.aivencloud.com" --yes
npx vercel env add DB_PORT production --project backend-5nxv --value "3306" --yes
npx vercel env add DB_USER production --project backend-5nxv --value "avnadmin" --yes
npx vercel env add DB_PASSWORD production --project backend-5nxv --value "your-db-password" --yes
npx vercel env add DB_DATABASE production --project backend-5nxv --value "defaultdb" --yes
npx vercel env add DB_SSL production --project backend-5nxv --value "true" --yes
```

Kiem tra danh sach env:

```bash
npx vercel env ls
```

## 4. Deploy

Deploy bang CLI:

```bash
npx vercel deploy --prod --yes
```

Hoac push len branch dang connect voi Vercel:

```bash
git add .
git commit -m "Configure Vercel environment template"
git push origin main
```

## 5. Kiem tra sau deploy

```bash
curl https://backend-5nxv.vercel.app/
curl https://backend-5nxv.vercel.app/api/meta/routes
curl https://backend-5nxv.vercel.app/api/health/db
```

Ket qua dung:

- `/` tra HTML cua admin app
- `/api/meta/routes` tra JSON `{ "ok": true, ... }`
- `/api/health/db` tra JSON database neu env MySQL dung

Neu `/api/health/db` tra `500`, thuong la sai hoac thieu `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`, `DB_SSL`.
