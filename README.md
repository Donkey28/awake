# 醒着

深夜匿名文字空间 · 微信小程序

---

一个为凌晨失眠的人做的安静角落。没有头像、没有昵称、没有社交关系。只有文字，和夜晚。

<br>

## 产品理念

大多数社交产品都在白天运行——喧闹、高效、充满目的性。

但凌晨 3 点不是。那个时间人的表达欲最真实，也最脆弱。你不想发朋友圈，不想聊天，只是单纯地想「说点什么」，说给一个不评价你的空间听。

**「醒着」不做的事：**

- 不陪伴、不疗愈、不安慰
- 不肯定你是特别的
- 不催促你开口、不鼓励你社交

**「醒着」做的事：**

- 提供一段安静的夜晚时间
- 让文字自然浮现、自然消失
- 像一个凌晨便利店的灯——亮着，但不打扰

<br>

## 核心体验

**首页 — 感受夜晚**

打开后显示当前时段、一句深夜文案、一个呼吸的在线人数指示点。没有列表，没有推送，没有红点。只有一个「进入夜晚」的按钮。

文案随小时变化：`23:00` 和 `04:00` 看到的不同。在线人数来自 WebSocket 真实连接数。

**聊天页 — 匿名文字流**

完全匿名的公共空间。消息以缓慢动画逐条浮现，间距极大，像黑暗中漂浮的微光。

- 每条消息限 40 字，10 秒发送间隔
- 内容过滤 + 敏感词拦截
- 消息 24 小时自动过期
- 无头像、无昵称、无时间戳精确到秒

**设计原则**

| 维度 | 选择 |
|------|------|
| 背景色 | `#F5F3F0` 暖灰白，非纯黑 |
| 文字透明度 | 0.20 ~ 0.55，层级靠透明度区分而非字号 |
| 动画时长 | 2.0s 缓入，刻意慢 |
| 消息间距 | 110rpx，留白大于内容 |
| 字体字重 | 全局 300 light，克制 |

完整的设计文档见 `docs/`。

<br>

## 技术架构

```
微信小程序（原生）
    │
    ├── WebSocket ──── Node.js server (ws)
    │    实时消息 + 在线人数
    │
    └── Supabase ──── PostgreSQL
         消息持久化 + 24h 自动过期
```

| 层 | 技术 | 说明 |
|---|------|------|
| 前端 | 微信原生小程序 | 无第三方框架，无状态管理库 |
| 实时通信 | WebSocket (ws) | Node.js 轻量服务，支持心跳/重连 |
| 数据库 | Supabase | 免费额度，RLS 行级安全，自动过期策略 |
| 内容安全 | 自建词库过滤 | 客户端 + 服务端双重拦截 |

**两个刻意不做的技术决策：**

1. 不用 Supabase Realtime 替代 WebSocket —— 在线人数、心跳、氛围信号需要独立通道
2. 不做全局状态管理 —— 只有两个页面，页面本地状态完全够用

<br>

## 项目结构

```
awake/
├── miniprogram/
│   ├── app.js / app.json / app.wxss
│   ├── pages/
│   │   ├── index/          # 首页（时段文案 + 进入入口）
│   │   └── chat/           # 聊天页（匿名文字流）
│   ├── services/
│   │   └── supabase.js     # 数据库操作封装
│   └── utils/
│       ├── time.js         # 深夜时间感知（时段判断/文案系统）
│       └── websocket.js    # WebSocket 连接管理
├── server/
│   ├── server.js           # WebSocket 服务端主逻辑
│   ├── filter.js           # 敏感词过滤
│   ├── stats.js            # 运行时统计
│   ├── supabase.js         # 数据库读写
│   └── config.js           # 环境配置
├── docs/                   # 设计文档
│   ├── architecture.md
│   ├── ui-atmosphere-plan.md
│   ├── ui-style-guide.md
│   ├── launch-checklist.md
│   └── device-testing.md
└── project.config.json
```

<br>

## AI 协同开发

这个项目由 **Claude Code + DeepSeek** 协同完成，独立开发者负责产品方向与决策。

**协作模式：**

- 产品定义、氛围设计、技术选型由人决策
- 架构设计由 Claude Code 输出方案，人审核
- 代码实现由 Claude Code 编写，DeepSeek 交叉验证
- 样式细节、文案打磨由人反复调整

**实际分工：**

| 环节 | 工具 | 人的工作 |
|------|------|---------|
| 产品定位 | — | 独立完成 |
| 架构文档 | Claude Code | 审核 + 修正边界条件 |
| 前端页面 | Claude Code | UI 反复调试（透明度/间距/动画曲线） |
| WebSocket 服务 | Claude Code | 协议设计 + 连接生命周期管理 |
| 敏感词系统 | Claude Code | 词库设计 |
| 深夜文案 | — | 独立撰写 |

关键体会：**AI 擅长「怎么做」，但「做什么」和「做成什么样」仍然依赖人的判断。** 产品的质感、节奏、氛围无法通过 prompt 描述清楚，只能靠人一次次调整。

<br>

## 本地运行

### 前置条件

- 微信开发者工具
- Node.js 18+
- Supabase 项目（免费版即可）

### 启动 WebSocket 服务

```bash
cd server
cp .env.example .env
# 编辑 .env 填入你的 Supabase URL 和 Key
npm install
npm start
```

### 启动小程序

1. 微信开发者工具打开项目根目录
2. `project.config.json` 中 `appid` 替换为你的 AppID
3. `miniprogram/utils/websocket.js` 中 `WS_URL` 替换为你的服务器地址
4. 编译运行

### Supabase 数据库

```sql
CREATE TABLE messages (
  id         TEXT PRIMARY KEY,
  content    TEXT NOT NULL,
  time       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_created_at ON messages (created_at);
```

<br>

## 后续计划

- [ ] 消息 24 小时自动清理（cron job）
- [ ] 凌晨时段背景色渐变（蓝黑 → 暖灰 → 冷白）
- [ ] 首页背景光晕层
- [ ] 微信内容安全 API 接入
- [ ] `有人在输入...` 氛围信号

<br>

## License

MIT
