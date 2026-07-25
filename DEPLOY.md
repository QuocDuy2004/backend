# Hướng dẫn Deploy – Render + Aiven MySQL

## Kiến trúc

```
GitHub ──push──▶ GitHub Actions (build + type-check)
                         │
                         ▼
              Render Web Service  (free)
              ├── Backend API     →  /api/*
              └── Admin SPA       →  /* (React)
              
              Domain: https://api.yourdomain.com
                         │  (kết nối SSL)
                         ▼
              Aiven MySQL  (free tier)
              1GB storage · 1GB RAM · SSL bắt buộc
```

---

## Bước 1 – Tạo MySQL Database trên Aiven

1. Vào [aiven.io](https://aiven.io) → **Sign up** (không cần credit card)
2. **Create service** → chọn **MySQL** → chọn plan **Free**
3. Chọn cloud provider và region (khuyên dùng Google Cloud / Singapore)
4. Đặt tên service → **Create**
5. Vào tab **Overview** của service, lấy:

| Thông tin | Lấy từ |
|-----------|--------|
| `Host` | Overview → Connection information → Host |
| `Port` | Thường là `3306` |
| `User` | `avnadmin` |
| `Password` | Overview → Password (click Show) |
| `Database` | `defaultdb` |

> Aiven **bắt buộc SSL** – đã cấu hình sẵn trong code qua `DB_SSL=true`.

---

## Bước 2 – Deploy lên Render

### Cách 1: Blueprint (tự động, khuyên dùng)

1. Push repo lên GitHub (đã có `render.yaml`).
2. Vào [render.com](https://render.com) → **New** → **Blueprint**
3. Chọn GitHub repo → Render tự đọc `render.yaml`
4. Điền các **Secret** env vars (xem bảng dưới) → **Apply**

### Cách 2: Thủ công

1. **New** → **Web Service** → chọn GitHub repo
2. Cấu hình:
   - **Runtime:** Node
   - **Region:** Singapore
   - **Build Command:** `npm ci && npm run build`
   - **Start Command:** `node dist/server.cjs`
   - **Health Check Path:** `/api/health`
3. Thêm env vars theo bảng dưới

---

## Bước 3 – Environment Variables trên Render

Vào **Service → Environment → Add Environment Variable**:

| Key | Giá trị | Ghi chú |
|-----|---------|---------|
| `NODE_ENV` | `production` | |
| `APP_URL` | `https://api.yourdomain.com` | URL Render hoặc custom domain |
| `FRONTEND_URL` | `https://app.yourdomain.com` | URL app Expo/web |
| `DB_HOST` | `mysql-xxx.aivencloud.com` | Lấy từ Aiven Overview |
| `DB_PORT` | `3306` | |
| `DB_USER` | `avnadmin` | |
| `DB_PASSWORD` | *(Aiven password)* | **Secret** |
| `DB_DATABASE` | `defaultdb` | |
| `DB_SSL` | `true` | Bắt buộc với Aiven |
| `JWT_SECRET` | *(random ≥32 ký tự)* | **Secret** |
| `GEMINI_API_KEY` | *(Google AI Studio key)* | Tuỳ chọn |
| `VNPAY_TMN_CODE` | *(mã VNPay)* | Tuỳ chọn |
| `VNPAY_HASH_SECRET` | *(hash secret)* | **Secret** |
| `MOMO_PARTNER_CODE` | *(mã MoMo)* | Tuỳ chọn |
| `MOMO_ACCESS_KEY` | *(access key)* | Tuỳ chọn |
| `MOMO_SECRET_KEY` | *(secret key)* | **Secret** |

> `VNPAY_RETURN_URL`, `MOMO_RETURN_URL`, `MOMO_IPN_URL` **không cần set** –  
> hệ thống tự build từ `APP_URL`.

---

## Bước 4 – Custom Domain

### 4a. Thêm domain vào Render

1. Service → **Settings** → **Custom Domains** → **Add Custom Domain**
2. Nhập domain, ví dụ: `api.yourdomain.com`
3. Render cấp CNAME record, ví dụ:
   ```
   api.yourdomain.com  CNAME  duymedia-backend.onrender.com
   ```
4. Vào DNS provider (Cloudflare, Namecheap, GoDaddy...) → thêm CNAME record đó
5. Chờ DNS propagate (~5–30 phút) → Render tự cấp SSL certificate

### 4b. Cập nhật APP_URL

Sau khi domain hoạt động:
- Render → Service → **Environment** → sửa `APP_URL` thành `https://api.yourdomain.com`
- Click **Save Changes** → service tự redeploy

---

## Bước 5 – GitHub Actions Auto Deploy

### Thêm GitHub Secrets

Vào repo GitHub → **Settings** → **Secrets and variables** → **Actions**:

| Secret | Lấy từ đâu |
|--------|-----------|
| `RENDER_DEPLOY_HOOK_URL` | Render → Service → **Settings** → **Deploy Hooks** → tạo hook → copy URL |
| `RENDER_APP_URL` | URL backend, ví dụ `https://api.yourdomain.com` |

Sau khi set xong, mỗi lần push lên `main` → GitHub Actions tự trigger Render deploy.

---

## Bước 6 – Import Database Schema

Lần đầu deploy, schema tự động được tạo khi server khởi động (`ensureDatabaseSchema()`).

Nếu cần import thủ công (ví dụ reset DB):

```bash
# Yêu cầu cài mysql client và CA cert từ Aiven
mysql --ssl-ca=ca.pem \
  -h mysql-xxx.aivencloud.com \
  -P 3306 \
  -u avnadmin \
  -p defaultdb < database.sql
```

CA cert tải tại: Aiven Console → MySQL service → Overview → **Download CA Certificate**

---

## Bước 7 – Kiểm tra sau deploy

```bash
# Ping health check
curl https://api.yourdomain.com/api/health

# Kiểm tra kết nối database
curl https://api.yourdomain.com/api/health/db
```

Kết quả mong đợi:
```json
{ "ok": true, "database": [{ "databaseName": "defaultdb", "serverTime": "..." }] }
```

---

## Lưu ý

| Vấn đề | Giải pháp |
|--------|-----------|
| Free Render spin down sau 15 phút | Nâng lên Starter $7/tháng, hoặc dùng UptimeRobot ping mỗi 10 phút |
| Aiven free tier giới hạn 1GB | Đủ cho dự án nhỏ/vừa; upgrade khi cần |
| `GOOGLE_PRIVATE_KEY` trên Render | Paste nguyên chuỗi với `\n` literal, không cần escape thêm |
| DB_SSL local dev | Set `DB_SSL=false` trong `.env.local` nếu dùng MySQL local |
