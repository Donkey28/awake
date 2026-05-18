const WS_URL = 'ws://localhost:3000'; // 部署时替换为你的服务器地址

let socketTask = null;
let messageHandler = null;
let reconnectTimer = null;
let reconnectTimes = 0;
const MAX_RECONNECT = 10;
const RECONNECT_BASE = 1000;

function connect() {
  if (socketTask) {
    if (socketTask.readyState === 1) return;
    try { socketTask.close({}); } catch (e) {}
    socketTask = null;
  }

  socketTask = wx.connectSocket({
    url: WS_URL,
    success() {},
    fail(err) {
      console.error('[ws] 连接失败', err);
      socketTask = null;
      scheduleReconnect();
    }
  });

  socketTask.onOpen(() => {
    console.log('[ws] 已连接');
    reconnectTimes = 0;
  });

  socketTask.onMessage((res) => {
    if (messageHandler) {
      try {
        const data = JSON.parse(res.data);
        messageHandler(data);
      } catch (e) {
        console.error('[ws] 消息解析失败', e);
      }
    }
  });

  socketTask.onError((err) => {
    console.error('[ws] 错误', err);
    if (socketTask) {
      try { socketTask.close({}); } catch (e) {}
      socketTask = null;
    }
    scheduleReconnect();
  });

  socketTask.onClose(() => {
    console.log('[ws] 已关闭');
    socketTask = null;
    scheduleReconnect();
  });
}

function scheduleReconnect() {
  if (reconnectTimes >= MAX_RECONNECT) return;
  if (reconnectTimer) return;

  const delay = Math.min(RECONNECT_BASE * Math.pow(2, reconnectTimes), 30000);
  reconnectTimes++;

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, delay);
}

function send(data) {
  if (!socketTask || socketTask.readyState !== 1) {
    console.warn('[ws] 未连接，无法发送');
    return;
  }
  socketTask.send({
    data: JSON.stringify(data),
    fail(err) {
      console.error('[ws] 发送失败', err);
    }
  });
}

function onMessage(handler) {
  messageHandler = handler;
}

function close() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (socketTask) {
    try { socketTask.close({}); } catch (e) {}
    socketTask = null;
  }
}

module.exports = { connect, send, onMessage, close };
