# Hướng dẫn CI/CD - Backend

## 1. Cấu trúc file đã tạo

```
backend/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions workflow
├── Dockerfile                   # Docker build config
├── .dockerignore                # Bỏ qua file không cần thiết
├── docker-compose.yml           # Docker Compose (deploy trên VPS)
└── nginx.conf                   # Nginx reverse proxy config
```

## 2. Thiết lập GitHub Secrets

Vào **GitHub Repo → Settings → Secrets and variables → Actions → New repository secret**

Thêm các secret sau:

| Secret Name               | Mô tả                                  |
|---------------------------|----------------------------------------|
| `DOCKER_HUB_USERNAME`     | Username Docker Hub của bạn           |
| `DOCKER_HUB_ACCESS_TOKEN` | Access token từ Docker Hub (xem #3)   |
| `SERVER_HOST`             | IP hoặc domain của VPS                |
| `SERVER_USER`             | Username SSH (thường là `root` hoặc `ubuntu`) |
| `SERVER_SSH_KEY`          | Private SSH key để kết nối VPS        |
| `SERVER_PORT`             | SSH port (mặc định 22, có thể bỏ qua) |

## 3. Tạo Docker Hub Access Token

1. Đăng nhập [hub.docker.com](https://hub.docker.com)
2. Vào **Account Settings → Security → New Access Token**
3. Đặt tên (ví dụ: `github-actions-velocart`)
4. Copy token và lưu vào GitHub Secret `DOCKER_HUB_ACCESS_TOKEN`

## 4. Thiết lập VPS (lần đầu)

SSH vào VPS và chạy:

```bash
# Cài Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Cài Docker Compose (nếu cần)
sudo apt-get install docker-compose-plugin

# Tạo file .env trên server
nano /path/to/.env
# (Copy nội dung từ .env.local và điền giá trị production)

# Tạo SSH key pair (nếu chưa có) để GitHub Actions dùng
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_actions  # Copy private key này vào SERVER_SSH_KEY secret
```

## 5. Luồng CI/CD hoạt động

```
Push to main/master
        │
        ▼
  GitHub Actions
        │
        ├─► Build Docker image
        │
        ├─► Push to Docker Hub
        │   (username/velocart-backend:latest)
        │
        └─► SSH vào VPS
              │
              ├─► docker pull latest image
              ├─► docker stop & rm old container
              └─► docker run new container
```

## 6. Deploy thủ công (khi cần)

```bash
# Trên VPS - pull và restart
docker pull yourusername/velocart-backend:latest
docker-compose down
docker-compose up -d

# Hoặc không dùng docker-compose
docker stop velocart-backend && docker rm velocart-backend
docker run -d \
  --name velocart-backend \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env \
  yourusername/velocart-backend:latest
```

## 7. Update nginx.conf

Thay `yourdomain.com` bằng domain thật của bạn, rồi:

```bash
# Cài Certbot SSL
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
