# 健身成长记录 - 火山引擎 ECS 从零部署指南

本文档面向将本项目部署到**火山引擎 (Volcengine) ECS**（系统为 Ubuntu 或 CentOS），从零完成环境安装、代码部署、构建、进程守护与 Nginx 反向代理。端口与架构说明参见项目内 [DEPLOY.md](DEPLOY.md)：后端默认端口 **3001**，Nginx 将 `/api` 反代到本机 3001。

---

## 项目与部署拓扑

| 维度 | 说明 |
|------|------|
| **类型** | 全栈：前端 + 后端同仓 |
| **前端** | React 18 + Vite 5 + TypeScript + TailwindCSS，构建产物为 `dist/` |
| **后端** | Node.js + Express + TypeScript（`server/`），默认端口 **3001** |
| **数据** | SQLite（better-sqlite3），路径由 `DATABASE_PATH` 指定 |
| **其它** | 微信支付 Native、火山引擎 TOS 存 PDF；前端通过 `VITE_API_BASE_URL` 请求后端 |

部署拓扑：同一台 ECS 上 Nginx 监听 80/443，静态资源由 `dist/` 提供，`/api` 反代到本机 3001；后端由 PM2 守护（项目根目录已提供 `ecosystem.config.cjs`）。

---

## 1. 环境准备

在 ECS 上安装：**Node.js 18+**、**Git**、**Nginx**、**PM2**。无需 Python、Docker（若需 Docker 部署可另行编写）。

### Ubuntu 22.04

```bash
sudo apt update
sudo apt install -y git nginx

# Node.js 20 LTS（NodeSource）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PM2 全局
sudo npm install -g pm2
```

### CentOS 7/8 或 Rocky / AlmaLinux

```bash
sudo yum install -y git
sudo yum install -y nginx   # 或 dnf install -y nginx

# Node.js 20（NodeSource）
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

sudo npm install -g pm2
```

可选：若希望用 systemd 直接管理 Node 进程而不用 PM2，可不装 PM2，按第 4 节「备选：systemd」配置。

---

## 2. 代码传输

### 推荐：Git

在 ECS 上配置好 Git（私仓需配置 SSH 或 Token），然后：

```bash
cd /opt
sudo mkdir -p fitness && sudo chown $USER:$USER fitness
cd fitness
git clone <你的仓库地址> .
```

后续更新部署：

```bash
cd /opt/fitness
git pull
npm ci && npm run build
cd server && npm ci && npm run build
cd /opt/fitness && pm2 restart fitness-server
```

### 备选：SCP / SFTP

本地打包时排除 `node_modules`、`.env`、`dist` 等，上传到服务器后解压，再按第 3 节在项目根目录和 `server` 分别安装依赖并构建。

---

## 3. 环境变量、依赖安装与构建

### 3.1 后端环境变量

```bash
cd /opt/fitness
cp server/.env.example server/.env
# 编辑 server/.env，至少填写：
#   PORT=3001
#   JWT_SECRET=<强随机字符串>
#   DATABASE_PATH=/opt/fitness/data/fitness.db
mkdir -p data
```

若使用微信支付与火山 TOS，请按 `server/.env.example` 和 [DEPLOY.md](DEPLOY.md) 填写对应变量。

### 3.2 前端构建前 API 地址（可选）

若用户通过同一域名访问（如 `https://your-domain.com`），且 Nginx 将 `/api` 反代到 3001，构建前可设置：

```bash
export VITE_API_BASE_URL=https://your-domain.com
# 或留空，使用相对路径 /api/...
```

### 3.3 安装依赖并构建

**前端（项目根目录）：**

```bash
cd /opt/fitness
npm ci
npm run build
```

**后端（server 目录）：**

```bash
cd /opt/fitness/server
npm ci
npm run build
```

---

## 4. 启动与守护

### 4.1 使用 PM2（推荐）

项目根目录已有 `ecosystem.config.cjs`，配置了 `fitness-server`（工作目录 `./server`，入口 `dist/index.js`）。在项目根目录执行：

```bash
cd /opt/fitness
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
# 按终端提示执行生成的 sudo 命令，实现开机自启
```

前端不单独起进程，由 Nginx 提供 `dist/` 静态资源（见第 5 节）。

### 4.2 备选：systemd

若不使用 PM2，可创建 systemd 服务。新建 `/etc/systemd/system/fitness-server.service`：

```ini
[Unit]
Description=Fitness API Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/fitness/server
EnvironmentFile=/opt/fitness/server/.env
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

然后执行：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now fitness-server
```

（将 `User` 和路径按实际用户与部署目录修改。）

---

## 5. Nginx 配置

后端监听 **3001**；Nginx 对外 80（及可选 443），静态资源使用 `dist/`，`/api` 反代到本机 3001。后端路由为 `/api/auth`、`/api/workouts` 等，因此 Nginx 需将完整路径（含 `/api`）转发，**不要**在 `proxy_pass` 后加尾斜杠。

将下面配置写入单独站点文件，例如：
- Ubuntu：`/etc/nginx/sites-available/fitness` 并软链到 `sites-enabled`
- CentOS：`/etc/nginx/conf.d/fitness.conf`

把 `your-domain.com` 和 `root` 路径改为你的域名与项目路径（如 `/opt/fitness`）。

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /opt/fitness/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

说明：`proxy_pass http://127.0.0.1:3001;` 不带尾斜杠时，请求 `/api/auth/login` 会原样转发到后端，与 `server/src/index.ts` 中的 `app.use('/api/auth', ...)` 等一致。

校验并重载 Nginx：

```bash
sudo nginx -t && sudo systemctl reload nginx
```

HTTPS：建议使用 Let's Encrypt + certbot 生成证书，并增加 `listen 443 ssl` 及 `ssl_certificate` / `ssl_certificate_key` 配置。

---

## 6. 从零执行顺序汇总

按下列顺序执行即可完成从零部署：

1. **环境**：按系统执行第 1 节（Node.js、Git、Nginx、PM2）。
2. **代码**：第 2 节克隆或上传代码到 ECS（如 `/opt/fitness`）。
3. **环境变量与目录**：复制 `server/.env.example` 为 `server/.env` 并填写；`mkdir -p /opt/fitness/data`。
4. **依赖与构建**：项目根目录 `npm ci && npm run build`；`server` 目录 `npm ci && npm run build`（根目录构建前可按需设置 `VITE_API_BASE_URL`）。
5. **后端守护**：在项目根目录执行 `pm2 start ecosystem.config.cjs`，再 `pm2 save` 与 `pm2 startup` 并按提示完成。
6. **Nginx**：写入第 5 节配置，执行 `nginx -t` 与 `systemctl reload nginx`。
7. **可选**：微信支付回调 URL、火山 TOS、HTTPS（certbot）等见 [DEPLOY.md](DEPLOY.md)。

---

## 7. 可选配置简述

- **微信支付**：商户平台回调 URL 设为 `https://你的域名/api/pay/notify`，API v3 密钥等填入 `server/.env`。
- **火山引擎 TOS**：创建 Bucket 与子用户，将 TOS 相关变量填入 `server/.env`；报告存储路径见 [DEPLOY.md](DEPLOY.md)。
- **HTTPS**：使用 certbot 为 Nginx 配置 SSL，并确保 `X-Forwarded-Proto` 为 `https`（上文配置已包含）。

与现有 [DEPLOY.md](DEPLOY.md) 的对应关系：后端端口 **3001**，Nginx 将 **/api** 反代到本机 3001；本指南在此基础上给出在火山 ECS 上从零安装与执行的完整命令与配置。
