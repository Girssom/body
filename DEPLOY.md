# 健身成长记录 - 部署说明

## 架构概览

- **前端**: React + Vite，构建为静态资源，可部署至 Vercel / Nginx
- **后端**: Node.js + Express，部署至火山云 ECS 或任意 VPS
- **数据**: SQLite（单机）或可换 PostgreSQL
- **存储**: 火山云 TOS 存放年度报告 PDF
- **支付**: 微信支付 Native（扫码）

---

## 一、后端部署（火山云 ECS）

### 1. 环境准备

- Node.js 18+
- PM2（进程守护）

### 2. 安装依赖与构建

```bash
cd server
npm install
npm run build
```

### 3. 环境变量

复制 `server/.env.example` 为 `server/.env`，填写：

- `JWT_SECRET`: 强随机字符串
- `DATABASE_PATH`: 如 `/data/fitness/fitness.db`
- 微信支付: `WECHAT_APP_ID`, `WECHAT_MCH_ID`, `WECHAT_API_KEY_V3`, `WECHAT_NOTIFY_URL`
- 火山云 TOS: `TOS_ACCESS_KEY_ID`, `TOS_ACCESS_KEY_SECRET`, `TOS_REGION`, `TOS_BUCKET`, `TOS_ENDPOINT`

### 4. PM2 配置

在项目根目录创建 `ecosystem.config.cjs`：

```javascript
module.exports = {
  apps: [
    {
      name: 'fitness-server',
      cwd: './server',
      script: 'dist/index.js',
      interpreter: 'node',
      env: { NODE_ENV: 'production' },
      instances: 1,
      exec_mode: 'fork',
    },
  ],
};
```

启动：

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### 5. Nginx 反代

后端监听 3001，Nginx 将 `/api` 转发到本机 3001：

```nginx
server {
  listen 80;
  server_name your-domain.com;
  root /path/to/frontend/dist;
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

HTTPS 建议用 Let's Encrypt + certbot。

---

## 二、前端部署（Vercel）

1. 根目录 `.env.production` 或 Vercel 环境变量中设置：
   - `VITE_API_BASE_URL=https://your-domain.com`
2. `npm run build`
3. 将 `dist` 部署到 Vercel，或把构建产物放到上述 Nginx 的 `root` 目录。

---

## 三、微信支付配置

1. 商户平台开通 Native 支付，设置回调 URL 为 `https://your-domain.com/api/pay/notify`。
2. 获取 API v3 密钥，填入 `WECHAT_API_KEY_V3`。
3. 注意：生产环境需使用商户证书对请求签名，当前示例为简化版，正式上线需按微信文档实现完整签名与验签。

---

## 四、火山云 TOS 配置

1. 创建 Bucket（建议私有）。
2. 创建子用户并授予该 Bucket 的读写权限，拿到 AccessKey / SecretKey。
3. 将对应变量填入 `server/.env`。
4. 报告存储路径：`fitness-reports/{userId}/{year}/fitness_report_{year}.pdf`。

---

## 五、本地联调

```bash
# 终端 1 - 后端
cd server && npm run dev

# 终端 2 - 前端
npm run dev
```

前端 `.env` 或 `.env.local` 设置 `VITE_API_BASE_URL=http://localhost:3001`。
