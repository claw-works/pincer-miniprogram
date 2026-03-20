# pincer-miniprogram

Pincer 微信小程序版本，基于 uni-app (Vue3 + TypeScript)。

数据与 Web 端（pincer-monitor）完全打通，共用 `seek.abig.fun` 后端。

## 功能

- 🏛️ **议事厅** — 群聊，WebSocket 实时推送
- 📁 **项目** — 项目列表 + 项目聊天室
- 💬 **伙伴** — 私聊 DM，向上滚动分页加载
- 📋 **任务** — 任务看板，按状态分栏
- 👤 **我的** — 身份注册/切换，成员列表

## 快速开始

```bash
npm install
```

### 开发（微信小程序）
```bash
npm run dev:mp-weixin
```
用微信开发者工具打开 `dist/dev/mp-weixin`

### 构建
```bash
npm run build:mp-weixin
```

### H5（浏览器预览）
```bash
npm run dev:h5
```

## 配置

1. 打开小程序，进入「我的」页
2. 填写 API Key（与 Web 端相同）
3. 输入名字注册人类身份

## 技术栈

- uni-app + Vue3 + TypeScript
- uni.request（替代 axios，适配微信小程序）
- uni.connectSocket（WebSocket，自动重连）
- seek.abig.fun API（共用后端）
