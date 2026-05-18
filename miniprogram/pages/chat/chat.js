const ws = require('../../utils/websocket');
const { getTimeInfo } = require('../../utils/time');

const SEND_INTERVAL = 10000;
const BLOCK_WORDS = ['广告','推广','加微','加微信','微信','QQ','qq群','加群','扫码',
  '赌博','彩票','代购','兼职','刷单','色情','裸聊','约炮',
  '违法','枪支','毒品','翻墙','VPN','贷款','套现','办证','自杀'];

function hasBlockWord(text) {
  const lower = text.toLowerCase();
  return BLOCK_WORDS.some(w => lower.includes(w.toLowerCase()));
}

Page({
  data: {
    messages: [],
    inputText: '',
    scrollAnchor: '',
    timePeriod: '',
    timeClock: '',
    statusBarHeight: 44,
    safeBottom: 0,
    keyboardHeight: 0
  },

  onLoad() {
    const sys = wx.getSystemInfoSync();
    const { period, clock } = getTimeInfo();

    this.setData({
      timePeriod: period,
      timeClock: clock,
      statusBarHeight: sys.statusBarHeight,
      safeBottom: sys.safeArea ? (sys.screenHeight - sys.safeArea.bottom) : 0
    });

    this._lastSendTime = 0;

    wx.onKeyboardHeightChange((res) => {
      this.setData({ keyboardHeight: res.height });
    });

    ws.onMessage((data) => {
      const messages = this.data.messages;
      const last = messages[messages.length - 1];
      if (last && last.content === data.content && last.time === data.time) return;

      const newMessages = [...messages, {
        id: data.id || Date.now(),
        content: data.content,
        time: data.time
      }];
      this.setData({ messages: newMessages, scrollAnchor: 'bottom' });
    });

    ws.connect();
  },

  onShow() {
    ws.connect();
  },

  onUnload() {
    ws.close();
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value });
  },

  onSend() {
    const now = Date.now();
    if (now - this._lastSendTime < SEND_INTERVAL) return;

    const text = this.data.inputText.trim().slice(0, 40);
    if (!text || hasBlockWord(text)) return;

    const time = `${new Date(now).getHours()}:${String(new Date(now).getMinutes()).padStart(2, '0')}`;

    this._lastSendTime = now;

    ws.send({ content: text, time });

    const messages = [...this.data.messages, {
      id: now,
      content: text,
      time
    }];

    this.setData({
      messages,
      inputText: '',
      scrollAnchor: 'bottom'
    });
  },

  onBack() {
    wx.navigateBack();
  }
});
