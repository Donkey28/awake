const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000');

ws.on('open', () => {
  console.log('[test] 已连接');
  ws.send(JSON.stringify({ content: '测试消息' }));
});

ws.on('message', (data) => {
  console.log('[test] 收到:', data.toString());
  ws.close();
});

ws.on('close', () => {
  console.log('[test] 已关闭');
  process.exit(0);
});

ws.on('error', (err) => {
  console.error('[test] 错误:', err.message);
  process.exit(1);
});

setTimeout(() => {
  console.log('[test] 超时');
  process.exit(1);
}, 5000);
