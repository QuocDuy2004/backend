# 🚀 Velocart - CI/CD Deployment Guide

Hướng dẫn triển khai tự động cho Backend (Web) và Mobile App với GitHub Actions + Docker Hub.

---

## 📦 Cấu trúc file đã tạo

```
backend/
├── .github/workflows/deploy.yml     # CI/CD workflow
├── Dockerfile                        # Docker build
├── .dockerignore                     # Bỏ qua file không cần
├── docker-compose.yml                # Deploy trên VPS
├── nginx.conf                        # Nginx reverse proxy
└── CICD_GUIDE.md                     # Hướng dẫn chi tiết

velocart-expo-split/
└── .github/workflows/expo-build.yml  # CI/CD workflow
```

---

## ⚡ Thiết lập GitHub Secrets

Vào repo → **Settings → Secrets and variables → Actions** → New secret:

### Backend Secrets

| Secret                    | Giá trị                                         |
|---------------------------|-------------------------------------------------|
| `DOCKER_HUB_USERNAME`     | Username Docker Hub (ví dụ: `johndoe`)          |
| `DOCKER_HUB_ACCESS_TOKEN` | Token tạo từ Docker Hub (xem bên dưới)          |
| `SERVER_HOST`             | IP VPS (ví dụ: `103.12.34.56`)                  |
| `SERVER_USER`             | SSH user (ví dụ: `root` hoặc `ubuntu`)          |
| `SERVER_SSH_KEY`          | Nội dung private SSH key (-----BEGIN...)        |

### Mobile Secrets

| Secret        | Giá trị                            |
|---------------|------------------------------------|
| `EXPO_TOKEN`  | Token tạo từ expo.dev/settings     |

---

## 🔑 Tạo Docker Hub Access Token

1. Đăng nhập [hub.docker.com](https://hub.docker.com)
2. Click avatar → **Account Settings**
3. **Security → New Access Token**
4. Đặt tên: `github-actions` → Permission: `Read, Write`
5. Copy token → Lưu vào secret `DOCKER_HUB_ACCESS_TOKEN`

---

## 🖥️ Chuẩn bị VPS (lần đầu)

```bash
# 1. Cài Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# 2. Tạo SSH key cho GitHub Actions
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 3. Copy private key để lưu vào GitHub Secret
cat ~/.ssh/github_actions
# Copy toàn bộ nội dung (từ -----BEGIN đến -----END)
# Lưu vào GitHub Secret: SERVER_SSH_KEY

# 4. Tạo file .env production
mkdir -p /opt/velocart
nano /opt/velocart/.env
```

Nội dung file `.env` trên VPS (dựa theo `.env.example`):
```env
NODE_ENV=production
PORT=3000
DB_HOST=db
DB_PORT=3306
DB_USER=velocart
DB_PASSWORD=your_strong_password
DB_NAME=omnishop
JWT_SECRET=your_jwt_secret_here
# ... thêm các biến khác
```

---

## 🔧 Update workflow trước khi push

Sửa file `.github/workflows/deploy.yml`, thay đổi:
```yaml
--env-file /path/to/.env
# Thành:
--env-file /opt/velocart/.env
```

---

## 🚀 Deploy

```bash
# Sau khi thiết lập xong, chỉ cần push code
git add .
git commit -m "feat: setup CI/CD"
git push origin main

# GitHub Actions sẽ tự động:
# 1. Build Docker image
# 2. Push lên Docker Hub
# 3. SSH vào VPS và deploy
```

---

## 🔍 Kiểm tra trạng thái

```bash
# Trên VPS
docker ps                           # Xem container đang chạy
docker logs velocart-backend -f     # Xem logs realtime
docker stats velocart-backend       # Xem CPU/RAM

# Restart thủ công
docker restart velocart-backend
```

---

## 📱 Mobile App (Expo)

Mobile app không dùng Docker mà dùng **EAS Build**:

```bash
# Cài EAS CLI
npm install -g eas-cli

# Đăng nhập Expo
eas login

# Khởi tạo EAS config (chạy 1 lần)
cd velocart-expo-split
eas build:configure

# Build thủ công để test
eas build --platform android --profile preview
```

Xem kết quả build: [expo.dev](https://expo.dev) → Projects → Builds

---

## 💡 Mẹo hay

- **HTTPS miễn phí:** Dùng Certbot + Let's Encrypt với nginx.conf đã tạo sẵn
- **OTA Updates:** Dùng `eas update` để cập nhật app mobile mà không cần build lại APK
- **Zero downtime:** Thêm health check vào Dockerfile để tránh downtime khi deploy
- **Monitoring:** Dùng `docker-compose up -d` nếu muốn kéo thêm MySQL + Nginx

---

**Xem hướng dẫn chi tiết: [CICD_GUIDE.md](./CICD_GUIDE.md)**
