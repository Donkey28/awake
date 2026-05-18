# 深夜匿名文字空间 — 架构设计文档

> 产品定位：凌晨失眠时愿意打开的匿名文字空间  
> 关键词：深夜感 · 匿名 · 慢节奏 · 极简 · 留白 · 黑色UI  
> 技术栈：微信原生小程序 + Supabase + WebSocket  
> 策略：MVP 优先，单人可维护，极简架构

---

## 一、项目目录设计

```
Wechatapp_project/
├── miniprogram/                    # 微信小程序主体
│   ├── pages/                      # 页面目录
│   │   ├── index/                  # 首页 — 文字流
│   │   │   ├── index.js
│   │   │   ├── index.json
│   │   │   └── index.wxml
│   │   └── write/                  # 书写页 — 发布文字
│   │       ├── write.js
│   │       ├── write.json
│   │       └── write.wxml
│   ├── components/                 # 公共组件
│   │   ├── text-card/              # 单条匿名文字卡片
│   │   │   ├── text-card.js
│   │   │   ├── text-card.json
│   │   │   └── text-card.wxml
│   │   ├── text-stream/            # 文字流容器（含缓慢浮现动画）
│   │   │   ├── text-stream.js
│   │   │   ├── text-stream.json
│   │   │   └── text-stream.wxml
│   │   ├── nav-bar/                # 自定义顶栏（极致轻量）
│   │   │   ├── nav-bar.js
│   │   │   ├── nav-bar.json
│   │   │   └── nav-bar.wxml
│   │   └── loading/                # 加载占位（呼吸动画）
│   │       ├── loading.js
│   │       ├── loading.json
│   │       └── loading.wxml
│   ├── services/                   # 数据层（所有外部通信集中于此）
│   │   ├── supabase.js             # Supabase 客户端 & 数据库操作
│   │   └── websocket.js            # WebSocket 连接管理 & 事件分发
│   ├── utils/                      # 工具函数
│   │   ├── util.js                 # 通用工具
│   │   └── time.js                 # 深夜时间感知工具
│   ├── styles/                     # 全局样式
│   │   └── global.wxss             # 黑夜主题 CSS 变量 & 基础样式
│   ├── app.js                      # 小程序入口（初始化 Supabase / WS）
│   ├── app.json                    # 小程序配置（路由、窗口、组件）
│   └── app.wxss                    # 全局样式入口
├── supabase/                       # Supabase 相关
│   └── migrations/                 # 数据库迁移 SQL
│       └── 001_init.sql            # 初始建表 & RLS 策略
├── server/                         # WebSocket 服务端（独立部署，MVP 可延后）
│   ├── package.json
│   └── index.js                    # 轻量 WS 服务器入口
├── project.config.json             # 微信开发者工具配置
├── project.private.config.json     # 私有配置（不提交 Git）
├── .gitignore
└── README.md                       # 项目说明
```

### 目录设计原则

| 原则 | 说明 |
|------|------|
| **页面与组件分离** | `pages/` 只放页面级逻辑，可复用 UI 单元放入 `components/` |
| **数据层集中** | 所有 Supabase 调用、WebSocket 连接都在 `services/`，页面不直接操作数据源 |
| **样式集中管理** | `styles/global.wxss` 定义 CSS 变量，组件和页面遵守同一套设计令牌 |
| **无冗余抽象** | MVP 不做 store/状态管理库，页面自管理状态；等到跨页面共享状态变多时再引入 |
| **一个文件干一件事** | 每个 service / util 职责单一，单人维护不迷路 |

---

## 二、页面规划

### 2.1 MVP 页面列表

| 页面 | 路径 | 职责 | 核心操作 |
|------|------|------|----------|
| **首页（文字流）** | `pages/index/index` | 展示匿名文字流，营造深夜氛围 | 浏览、下拉刷新、点击进入书写页 |
| **书写页** | `pages/write/write` | 极简编辑器，发布匿名文字 | 输入文字、发布、自动返回首页 |

> MVP 只做两个页面。不做个人中心、不做详情页、不做历史记录。极简。

### 2.2 首页 — 文字流 (index)

**设计意图**：打开即看到他人的深夜文字，像黑暗中漂浮的微光。

```
┌──────────────────────────┐
│        (极简顶栏)          │
│   ⌾ 此刻 · 深夜3:12      │
│                          │
│  ┌──────────────────┐    │
│  │  "睡不着，看了两集..." │    │  ← 文字卡片缓慢浮现
│  └──────────────────┘    │
│       · · · · · ·       │     ← 文字之间大量留白
│  ┌──────────────────┐    │
│  │  "明天考试，焦虑..."   │    │
│  └──────────────────┘    │
│       · · · · · ·        │
│  ┌──────────────────┐    │
│  │  "在想一个人..."       │    │
│  └──────────────────┘    │
│                          │
│  [      写下心事      ]   │  ← 底部固定按钮，跳转书写页
└──────────────────────────┘
```

**关键交互**：
- 文字卡片**逐个缓慢浮现**（错开动画，营造慢节奏）
- 下拉刷新获取最新文字（动画用暗色系，不动感、不大声）
- 底部按钮固定，引导写作
- 无点赞、无评论、无分享 — 只看和写
- 顶部显示当前时间段描述（"深夜"、"凌晨"、"夜深了"）

### 2.3 书写页 — 发布文字 (write)

**设计意图**：比备忘录还简单，打开就能写，写完就走。

```
┌──────────────────────────┐
│   ← 返回                  │
│                          │
│                          │
│    "此刻，你在想什么？"    │  ← 唯一提示语，大号、浅灰
│                          │
│  ┌────────────────────┐  │
│  │                    │  │
│  │   (光标缓慢闪烁)    │  │  ← 几乎无边框的输入区
│  │                    │  │
│  └────────────────────┘  │
│                          │
│         499/500          │  ← 字数限制，极浅
│                          │
│     [ 匿名扔进夜色 ]      │  ← 提交按钮，深夜感文案
└──────────────────────────┘
```

**关键交互**：
- 进入页面自动聚焦键盘
- 字数上限500字，超出不提示，直接不能输入
- 提交后短暂显示"已投入夜色中"，自动返回首页
- 空内容不可提交，按钮置灰
- 无草稿保存 — 离开即丢弃（强化匿名感）

### 2.4 组件职责细分

| 组件 | 职责 | 尺寸预估 |
|------|------|---------|
| `text-card` | 渲染单条匿名文字，处理浮现动画 | ~50行 JS |
| `text-stream` | 管理文字卡片列表，错开动画时序 | ~80行 JS |
| `nav-bar` | 极简顶栏：返回箭头 + 时间/状态文案 | ~40行 JS |
| `loading` | 全局加载/呼吸占位，骨架屏 | ~30行 JS |

---

## 三、数据流规划

### 3.1 总体架构

```
┌─────────────────────────────────────────────┐
│               微信小程序 (Client)             │
│                                              │
│  pages/index  ←── 订阅新帖子 ──┐             │
│       │                        │             │
│       ↓ 拉取帖子列表           │             │
│  pages/write ── 发布帖子 ──┐   │             │
│                            │   │             │
│  ┌─────────────────────────┼───┼──────────┐  │
│  │       services/         │   │          │  │
│  │                         ↓   ↓          │  │
│  │  supabase.js     websocket.js          │  │
│  │  (REST +          (实时推送)            │  │
│  │   Realtime)                             │  │
│  └────────────────────┬───────────────────┘  │
└───────────────────────┼──────────────────────┘
                        │
            ┌───────────┴───────────┐
            │                       │
            ↓                       ↓
     ┌─────────────┐       ┌──────────────┐
     │  Supabase   │       │  WebSocket   │
     │  (数据库 +   │       │  Server      │
     │   Realtime) │       │  (Node.js)   │
     └─────────────┘       └──────────────┘
```

### 3.2 数据模型 (Supabase)

#### 核心表：`posts`

```sql
CREATE TABLE posts (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content     TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  is_visible  BOOLEAN NOT NULL DEFAULT TRUE
);

-- 为首页列表查询建立索引
CREATE INDEX idx_posts_visible_created
  ON posts (is_visible, created_at DESC)
  WHERE is_visible = TRUE;

-- 自动清理已过期帖子（由 pg_cron 定时执行）
-- SELECT cron.schedule('cleanup-expired-posts', '*/10 * * * *',
--   $$ UPDATE posts SET is_visible = FALSE WHERE expires_at < NOW() AND is_visible = TRUE $$
-- );
```

#### 匿名身份策略（RLS）

```sql
-- 允许任何人读取可见帖子
CREATE POLICY "Anyone can read visible posts"
  ON posts FOR SELECT
  USING (is_visible = TRUE);

-- 允许任何人插入帖子
CREATE POLICY "Anyone can insert posts"
  ON posts FOR INSERT
  WITH CHECK (true);

-- 禁止修改和删除（匿名用户无权操作已发布内容）
-- 不创建 UPDATE / DELETE policy 即默认拒绝
```

#### 数据生命周期

```
用户发布 → INSERT (is_visible=TRUE)
                ↓
        首页 SELECT WHERE is_visible=TRUE
                ↓
         24小时后 expires_at 到达
                ↓
        定时任务标记 is_visible=FALSE
                ↓
        不再出现在首页列表中
```

### 3.3 数据流关键路径

#### 路径 A：浏览文字流

```
用户打开小程序
  → app.js onLaunch: 初始化 Supabase 客户端
  → pages/index onLoad: 调用 supabase.js.fetchPosts()
  → supabase.js: SELECT * FROM posts WHERE is_visible ORDER BY created_at DESC LIMIT 20
  → 返回数据渲染 text-stream
  → 订阅 Supabase Realtime channel "posts-channel"
  → 有新帖子时收到推送 → 插入列表顶部 → 触发放大/浮现动画
```

#### 路径 B：发布文字

```
用户在 write 页输入文字 → 点击发布
  → write.js: 校验内容（非空、≤500字）
  → supabase.js.publishPost(content)
  → INSERT INTO posts (content) VALUES (...)
  → 成功 → 短暂提示 → wx.navigateBack() 回到首页
  → 首页的 Realtime 订阅收到这条新帖子 → 自动加入列表
```

#### 路径 C：WebSocket 氛围信号（MVP 可延后）

```
app.js onLaunch: 连接 WebSocket 服务器
  → websocket.js.connect()
  → 发送 { type: "presence:join" }
  → 服务端广播 { type: "presence:count", count: N }
  → 首页展示 "此刻，N 人和你一样醒着"
  → 用户退出小程序时发送 { type: "presence:leave" }
  → 服务端更新并广播最新在线人数
```

### 3.4 状态管理策略（MVP）

**不做全局状态管理库。** 理由：
- 只有两个页面，跨页面共享状态极少
- 新帖子通过 Supabase Realtime 推送，无需手动同步
- 等出现第三个页面或复杂跨页状态时再引入

数据流约定：
| 数据 | 所属位置 | 获取方式 |
|------|---------|---------|
| 帖子列表 | `pages/index` 本地状态 | `supabase.js.fetchPosts()` |
| 在线人数 | `app.js` 全局变量 | `websocket.js` 事件回调 |
| 当前输入内容 | `pages/write` 本地状态 | 用户输入 |

---

## 四、WebSocket 架构

### 4.1 两阶段方案

| 阶段 | 方案 | 覆盖需求 |
|------|------|---------|
| **MVP（推荐先做）** | 纯 Supabase Realtime | 新帖子实时推送 |
| **V2（体验升级）** | 独立 WebSocket 服务器 | 在线人数、氛围信号、"有人正在输入" |

> Supabase Realtime 本质是 PostgreSQL 的 `LISTEN/NOTIFY` 的 WebSocket 封装，**已经能满足 MVP 核心诉求**。  
> 独立 WebSocket 服务器仅在需要「非数据库事件」（在线人数、心跳、氛围）时才引入。

### 4.2 MVP 方案：Supabase Realtime

```
微信小程序                      Supabase
    │                              │
    │── subscribe(channel) ────────→│  建立 WebSocket 连接
    │                              │
    │   ←── { event: "INSERT",     │  新帖子写入数据库时
    │         table: "posts",      │  自动推送
    │         data: {...} }        │
    │                              │
    │── unsubscribe() ────────────→│  页面隐藏时取消订阅
```

**客户端实现要点** (`services/supabase.js`)：

```
职责：
  - 初始化 Supabase 客户端（URL + anon key）
  - 封装 fetchPosts(limit, offset) — 分页拉取
  - 封装 publishPost(content) — 发布帖子
  - 封装 subscribeToNewPosts(callback) — 订阅实时推送
  - 封装 unsubscribe(channel) — 取消订阅

原则：
  - 页面不直接 import supabase SDK，只 import services/supabase.js
  - 未来换后端，只需改这一个文件
```

### 4.3 V2 方案：独立 WebSocket 服务器

#### 服务端架构 (`server/index.js`)

```
技术栈：Node.js + ws (轻量级 WebSocket 库)
部署：腾讯云 CloudBase / 轻量应用服务器 / Vercel Edge
```

**事件协议设计** (JSON 格式)：

```
客户端 → 服务端                   服务端 → 客户端
─────────────────────────       ─────────────────────────
{ type: "presence:join" }       { type: "presence:count",
                                   count: 3 }

{ type: "presence:leave" }      { type: "atmosphere:pulse",
                                   timeLabel: "凌晨 3:14" }

{ type: "typing:start" }        { type: "typing:signal",
                                   hint: "有人正在写下心事..." }

{ type: "typing:end" }
```

**服务端核心逻辑** (伪码)：

```
clients = new Map()  // connectionId → ws

onConnection(ws):
  clients.add(ws)
  broadcast({ type: "presence:count", count: clients.size })

onMessage(ws, msg):
  match msg.type:
    "presence:join"  → broadcast presence count
    "typing:start"   → broadcast typing signal（限流：每人每30秒最多发1次）

onClose(ws):
  clients.remove(ws)
  broadcast({ type: "presence:count", count: clients.size })

// 每5分钟自动推送一次深夜氛围信号
setInterval(() => {
  broadcast({ type: "atmosphere:pulse", timeLabel: getLateNightLabel() })
}, 5 * 60 * 1000)
```

#### 客户端实现要点 (`services/websocket.js`)

```
职责：
  - 封装 wx.connectSocket / wx.onSocketMessage
  - 心跳保活（每30秒 ping）
  - 断线重连（指数退避：1s → 2s → 4s → 8s → 上限30s）
  - 事件分发（将服务端消息转为内部 EventBus）
  - 页面隐藏时挂起连接，显示时恢复

API（供页面使用）：
  websocket.on('presence:count', callback)
  websocket.on('atmosphere:pulse', callback)
  websocket.send({ type: "presence:join" })
```

### 4.4 WebSocket 连接生命周期

```
app.js onLaunch
  │
  ├──→ 初始化 Supabase（同步）
  ├──→ 连接 WebSocket（异步，非阻塞）
  │
app.js onShow（从后台切回）
  ├──→ 检查 WS 连接状态，断开则重连
  │
app.js onHide（切到后台）
  ├──→ 发送 presence:leave
  ├──→ 关闭 WS 连接（节省资源）
  │
用户关闭小程序
  └──→ 微信自动断开 WS，服务端监测到 close 事件
```

---

## 五、页面跳转关系

### 5.1 跳转图

```
                    ┌─────────────────┐
                    │    启动 / 入口    │
                    └────────┬────────┘
                             │
                             ↓
                    ┌─────────────────┐
          ┌────────→│   首页 (index)   │←─────────┐
          │         │  匿名文字流      │          │
          │         └────────┬────────┘          │
          │                  │                   │
          │       点击 "写下心事"                  │
          │                  │                   │
          │                  ↓                   │
          │         ┌─────────────────┐          │
          │         │  书写页 (write)  │          │
          │         │  极简编辑器      │──────────┘
          │         └────────┬────────┘  发布成功自动 navigateBack
          │                  │
          │          点击 "← 返回" / 手势右滑
          │                  │
          └──────────────────┘
                  navigateBack
```

### 5.2 跳转方式

| 跳转 | 方式 | 理由 |
|------|------|------|
| 首页 → 书写页 | `wx.navigateTo` | 保留首页状态，返回时无需重新加载列表 |
| 书写页 → 首页 | `wx.navigateBack` | 自动返回，列表已通过 Realtime 更新 |
| 书写页 — 发布成功 | `wx.navigateBack` | 与手动返回一致，简单统一 |

> 不用 `wx.redirectTo`，不用 `wx.reLaunch`。两个页面用最基础的 `navigateTo/navigateBack` 就够。

### 5.3 页面栈状态

```
场景 A：正常浏览 → 写作 → 返回

  [index]  →  [index, write]  →  [index]
  打开App    点击写下心事        发布成功/返回

场景 B：从后台切回（保留了之前的页面栈）

  [index, write]  用户可能留在编辑页，切回后继续编辑
  （不做特殊处理，微信自动恢复）

场景 C：再次打开（已被微信销毁）

  [index]  冷启动，重新加载文字流
```

---

## 六、MVP 开发优先级

### Phase 1 — 能看（第1-2天）

```
☐ 初始化微信小程序项目结构
☐ 创建 Supabase 项目，执行 init migration
☐ 实现 services/supabase.js（fetchPosts + publishPost）
☐ 实现 pages/index（基础版文字列表，无动画）
☐ 实现 components/text-card（无动画版）
☐ 全局黑色主题 CSS 变量
```

### Phase 2 — 能写（第3天）

```
☐ 实现 pages/write（编辑器 + 发布）
☐ 连接首页与书写页的跳转
☐ Supabase Realtime 订阅新帖子
☐ 发布后自动刷新首页列表
```

### Phase 3 — 深夜感（第4-5天）

```
☐ 文字卡片缓慢浮现动画
☐ 文字流错开入场时序
☐ 自定义 nav-bar（深夜时间标签）
☐ loading 呼吸动画
☐ 书写页键盘体验打磨（自动聚焦、光标样式）
☐ 精美文案（提示语、按钮文字）
```

### Phase 4 — WebSocket 氛围（可延后）

```
☐ server/index.js 开发 & 部署
☐ services/websocket.js 连接管理
☐ 在线人数展示
☐ atmosphere:pulse 深夜氛围信号
```

---

## 七、技术决策记录

| 决策 | 选择 | 理由 |
|------|------|------|
| 框架 | 微信原生 | 不引入第三方框架，减少依赖，单人维护成本最低 |
| 后端 | Supabase | 自带数据库 + Realtime + RLS，零运维 |
| 实时通信 | MVP 用 Supabase Realtime | 能满足核心需求，避免过早引入独立服务 |
| 状态管理 | 无框架，页面本地状态 | 两个页面不需要全局 store |
| CSS 方案 | 原生 WXSS + CSS 变量 | 够用，不引入 Tailwind / UnoCSS |
| 动画 | WXSS transition + animation | 原生能力，简单够用 |
| 匿名方案 | Supabase anon key + RLS | 无需注册，RLS 保证安全 |

---

## 八、关键约束

- **微信小程序包大小限制 2MB** — 不上大图、不上字体文件、不上重型库
- **Supabase 免费版限制** — 500MB 数据库、5GB 带宽/月，MVP 绰绰有余
- **微信 WebSocket 限制** — 最大并发连接 5 个，我们的 1 个连接完全可以
- **小程序审核** — "匿名发布"属于 UGC，需要添加内容安全检测（微信提供 `msgSecCheck` API）
