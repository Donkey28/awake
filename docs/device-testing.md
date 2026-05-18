# 真机测试优化

## 一、真机测试清单

### 基础连接
- [ ] iOS 微信扫码 → 首页正常显示 → 进入夜晚 → WS 连接成功
- [ ] Android 微信扫码 → 同上流程
- [ ] 发消息后另一设备实时看到
- [ ] 历史消息正确加载

### 后台切换
- [ ] 聊天页 → 切到桌面 → 10 秒后回来 → 消息继续接收
- [ ] 聊天页 → 切到微信主页 → 回来 → WS 不断
- [ ] 聊天页 → 锁屏 → 解锁 → 恢复

### 断网
- [ ] 开飞行模式 → 发消息 → 关飞行模式 → 自动重连 → 新消息同步
- [ ] 关掉服务端 → 客户端不崩溃 → 重开服务端 → 客户端重连成功

### 输入
- [ ] 点输入框 → 键盘弹起 → 输入框在键盘上方可见
- [ ] 发消息后键盘收起
- [ ] iOS 底部安全区留白正常
- [ ] Android 底部导航栏不影响输入

### 滚动
- [ ] 50+ 条消息流畅滚动
- [ ] 新消息自动滚到底
- [ ] 手动上滑不被打断

---

## 二、发现的 4 个真实问题

### P0-1：消息重复

**根因**：`chat.js` `onSend` 先 `ws.send()` 再本地拼接消息数组。服务器广播给所有人（含发送者），`onMessage` 再拼一次。同一条消息本地 ID（`Date.now()`）和服务器 ID（`mpb3tb...`）不同，无法去重。

**现象**：每条消息显示两次。

**修复**：`onMessage` 收到消息时检查 `content + time` 是否和列表末条一致，一致则跳过。

### P0-2：输入框被键盘遮挡

**根因**：`input` 的 `adjust-position` 默认为 `true`，会推动整个页面。但 `.msg-area` 是 `position:fixed`，不受页面滚动影响。iOS 和部分 Android 上，键盘弹起后 fixed 定位的元素不重新计算。

**现象**：点输入框后键盘弹出，输入栏还在屏幕底部（被键盘挡住），看不到输入内容。

**修复**：
- `input` 加 `adjust-position="{{false}}"` 
- 监听 `wx.onKeyboardHeightChange`，动态设 `.input-bar` 的 `bottom`

### P0-3：后台回来 WS 僵死

**根因**：`chat.js` 没有 `onShow`。小程序挂起后 WS 可能 TCP 未断但应用层已失效。回到前台时 `onLoad` 不会再执行，WS 处于假活状态。

**现象**：切后台再回来，消息收不到也发不出去，但没报错。

**修复**：`chat.js` 加 `onShow`，检查 WS 状态，必要时重连。

### P1-4：onError 不触发重连

**根因**：`websocket.js` 只在 `onClose` 里调 `scheduleReconnect`，`onError` 只打日志。

**现象**：网络切换、基站切换等场景下 WS 报错但没关闭，无法自动恢复。

**修复**：`onError` 里主动 `close()` 再让 `onClose` 触发重连。

---

## 三、修改文件与顺序

| 顺序 | 文件 | 问题 |
|------|------|------|
| 1 | `miniprogram/pages/chat/chat.js` | P0-1 消息去重 + P0-3 加 onShow |
| 2 | `miniprogram/pages/chat/chat.wxml` | P0-2 输入框键盘适配 |
| 3 | `miniprogram/pages/chat/chat.wxss` | P0-2 输入栏键盘偏移样式 |
| 4 | `miniprogram/utils/websocket.js` | P1-4 onError 触发重连 |

---

## 四、iOS vs Android 差异备忘

| 差异点 | iOS | Android |
|--------|-----|---------|
| 键盘收起 | 点空白区域自动收 | 部分机型需按返回键 |
| safeArea | `safeArea.bottom` 有值 | 部分 OEM 为 0 或异常 |
| scroll-view | 有惯性滚动 | 需设 `enhanced` 才有惯性 |
| 字体 | PingFang SC | 系统默认（各厂商不同） |
| 固定定位+键盘 | fixed 元素被键盘推起 | fixed 保持原位 |

涉及文件 `app.wxss`，iOS/Android 字体栈已包含 PingFang + 系统兜底，保持不变。
