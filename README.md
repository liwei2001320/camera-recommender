# Camera Recommender

中英双语的相机购买问卷与推荐（最小可用版本）。

## 功能

- 多步骤问卷（预算、用途、偏好、品牌）
- 基于权重的推荐算法（客观打分）
- 本地历史保存、CSV 导出、分享链接（编码结果）
- 对比/保存（本地）

## 部署

此仓库为静态站点，已配置 GitHub Pages（通过 Actions）
1. 确认仓库 `Settings -> Pages` 源（branch）为 `gh-pages` 或者 `main` 根目录。
2. 也可以直接在本地运行：`python -m http.server` 并访问 `http://localhost:8000`。

## 后端与统计

最小可用版使用 `localStorage` 保存用户历史。若需服务器端统计/保存（可查看后台），可接入：
- Google Sheets (Apps Script)
- Airtable
- Firebase

我可以按你偏好接入并把统计面板放到 `admin/`。

## 未来扩展

- 自动抓取京东/淘宝/拼多多的价格并更新 `data/cameras.json`
- 更多机型、样张、视频样本
- 登录/用户面板、结果导出 PDF

