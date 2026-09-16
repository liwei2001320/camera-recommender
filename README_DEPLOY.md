# 部署说明 — 将 price-service 部署为公网服务（多种可选）

本项目位于 `/mnt/data/price-service`。下面提供多种部署方案，你可以根据偏好选择其一：使用 ngrok 暴露本机（快速临时），或部署到 Railway / Render / Vercel / Docker 主机（可长期）。

-------------------------
0) 准备
-------------------------
确保已安装 Node.js (>=16)、npm、以及可选的 Docker。进入项目目录：
```bash
cd /mnt/data/price-service
```

安装依赖并在本地测试运行：
```bash
npm install
npm start
# 访问 http://localhost:5000/api/price?q=Sony%20A7%20IV
```

-------------------------
A) 临时公网（推荐用于分享给同事/客户快速测试）—— 使用 ngrok
-------------------------
1. 安装 ngrok: https://ngrok.com （注册并获取 Authtoken）
2. 在本地启动服务（端口 5000）:
   ```bash
   npm start
   ```
3. 打开另一个终端启动 ngrok 隧道:
   ```bash
   ngrok http 5000
   ```
   ngrok 会显示一个公网地址（例如 https://abcd-1234.ngrok.io），把它填入前端文件中 `window.PRICE_SERVICE_BASE` 或直接在浏览器访问：
   ```
   https://abcd-1234.ngrok.io/api/price?q=Sony%20A7%20IV
   ```
4. 若要同时暴露前端静态页面，可在 /mnt/data 起一个静态服务器（端口 8000）并再开一个 ngrok 隧道：
   ```bash
   cd /mnt/data
   python3 -m http.server 8000
   ngrok http 8000
   ```
   然后把前端页面中的 PRICE_SERVICE_BASE 指向第一个 ngrok 地址（后端）。

提示：
- ngrok 免费账户的域名会变动（短期临时）。有付费账号可保留域名。
- 若你在公司网络，可能需要允许 ngrok/端口。

-------------------------
B) 快速部署（免费额度）—— Railway（非常适合快速演示）
-------------------------
1. 安装 Railway CLI (可选) 或直接在 https://railway.app 创建项目并连接 GitHub 仓库。
2. 在 Railway 控制台创建新项目，选择 "Deploy from GitHub" 或直接手动部署。
3. 在 Railway 环境变量中添加：
   - AGG_API_KEY (若使用聚合 API)
   - AGG_BASE (eg. https://api.veapi.cn)
   - PORT=5000
4. Railway 会自动构建并发布，生成一个类似 `https://your-app.up.railway.app` 的域名。

-------------------------
C) Render / Fly.io / DigitalOcean App Platform
-------------------------
1. Render（推荐）:
   - 在 https://render.com 新建 Web Service，连接到你的 GitHub 仓库，使用 Docker 或直接用 Node。
   - 设置构建命令：`npm install && npm start`
   - 设置环境变量（AGG_API_KEY, AGG_BASE, PORT）
   - Render 会分配公网域名。

-------------------------
D) Vercel（Serverless Node）
-------------------------
1. 将仓库 push 到 GitHub。
2. 在 Vercel 控制台新建项目并导入 GitHub 仓库。
3. 使用 `vercel.json`（已包含在仓库）作为配置。
4. 在环境变量中添加 AGG_API_KEY / AGG_BASE。
5. Vercel 会以 Serverless function 形式部署 node 后端与前端页面，提供公网地址。

-------------------------
常见问题
-------------------------
- 若使用聚合 API 失败，后端会回退到本地 mock 数据（确保 mock 数据已在 providers/mock.js 中）。
- 若需要我把代码打包成 GitHub 仓库并生成 zip，我可以立即为你生成下载文件。

-------------------------
结束语
-------------------------
如果你想，我可以代为在某个平台（例如 Render）帮你“直接部署”，请告诉我你允许我使用你的 GitHub 仓库（或我为你生成仓库并提供部署脚本）。注意：我无法直接在你的云账号上创建资源，但可以生成完整的一键部署包与命令，你只需在本地/云控制台运行即可.