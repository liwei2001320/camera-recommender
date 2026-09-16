# Camera Recommender

中英双语的相机购买问卷与推荐（最小可用版本）。

## 功能

- 多步骤问卷（预算、用途、偏好、品牌）
- 基于权重的推荐算法（客观打分）
- 本地历史保存、CSV 导出、分享链接（编码结果）
- 对比/保存（本地）

## 部署

此仓库为静态站点，已配置 GitHub Pages（通过 Actions）
1. 确认仓库 `Settings -> Pages` 源（branch) 为 `gh-pages` 或者 `main` 根目录。
2. 也可以直接在本地运行：`python -m http.server` 并访问 `http://localhost:8000`。

## 后端与统计（Firebase 集成说明）

本仓库已提供 Firebase 客户端对接代码，可以把用户提交的问卷保存到 Firestore。步骤如下：

1. 在 Firebase 控制台创建一个新项目（https://console.firebase.google.com/）。
2. 在项目中启用 Cloud Firestore（建议使用 Native 模式）。
3. 在 `Firestore Rules`（测试阶段）你可以临时使用：

```
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

> **警告**：上面的规则会允许任何人读写。仅用于测试。部署到生产前请根据需要收紧规则（例如只允许有特定 API key 或者使用 Firebase Auth 登录的用户写入/读取）。

4. 在 Firebase 控制台中添加一个 Web App（"添加应用" -> Web），复制它的配置对象。
5. 在仓库 `js/` 目录下复制 `firebase-config.example.js` 为 `firebase-config.js`，并粘贴上你的配置（`apiKey` 等）。

6. 管理页面：打开 `https://<your-username>.github.io/camera-recommender/admin/`（或本地 `admin/index.html`），它会自动读取 `submissions` collection 并显示最近记录。

7. 在问卷页面中，点击 **保存** 按钮会将当前结果写入 Firestore（如果配置正确）。

## 其他后端选项

- Airtable：更适合非开发者直接查看和导出数据（需要 Airtable API Key）。
- Google Sheets：可用 Apps Script 做为轻量后端。

## 未来扩展

- 自动抓取京东/淘宝/拼多多的价格并更新 `data/cameras.json`
- 更多机型、样张、视频样本
- 登录/用户面板、结果导出 PDF

