const http = require('http');
const { WebSocketServer } = require('ws');
const config = require('./config');
const { saveMessage, getRecentMessages } = require('./supabase');
const { recordConnection, recordMessage, getStats } = require('./stats');
const { filter } = require('./filter');

function log(msg) {
  const ts = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  console.log(`[${ts}] ${msg}`);
}

// WebSocket server
const wss = new WebSocketServer({ port: config.port, perMessageDeflate: false });

wss.on('listening', () => {
  log(`WS 已启动，端口 ${config.port}，环境 ${config.env}`);
});

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  recordConnection(wss.clients.size);
  log(`连接 ${ip} (${wss.clients.size}人在线)`);

  getRecentMessages(20).then((messages) => {
    messages.forEach((msg) => {
      try { ws.send(JSON.stringify(msg)); } catch (e) {}
    });
  });

  ws.on('message', (raw) => {
    let content;
    try {
      const parsed = JSON.parse(raw);
      content = parsed.content;
    } catch (e) {
      return;
    }

    if (!content || typeof content !== 'string') return;
    content = content.trim().slice(0, 40);
    if (!content) return;

    if (filter(content)) {
      log('消息被过滤');
      return;
    }

    recordMessage(content.length);

    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const time = formatTime(new Date());

    try { saveMessage(id, content, time); } catch (e) {
      log('写入失败 ' + e.message);
    }

    const payload = JSON.stringify({ id, content, time });

    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        try { client.send(payload); } catch (e) {}
      }
    });
  });

  ws.on('close', (code) => {
    log(`断开 ${ip} code=${code} (${wss.clients.size}人在线)`);
  });

  ws.on('error', (err) => {
    log('连接错误 ' + err.message);
  });
});

// 心跳
const heartbeat = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.readyState === 1) {
      try { ws.ping(); } catch (e) {}
    }
  });
}, 30000);

wss.on('close', () => clearInterval(heartbeat));

// 统计数据 HTTP 接口（独立端口）
if (config.statsEnabled) {
  const statsPort = config.port + 1;
  http.createServer((req, res) => {
    if (req.url === '/stats') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(getStats()));
      return;
    }
    res.writeHead(404);
    res.end();
  }).listen(statsPort, () => {
    log(`Stats 接口 http://localhost:${statsPort}/stats`);
  });
}

function formatTime(date) {
  const h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}
