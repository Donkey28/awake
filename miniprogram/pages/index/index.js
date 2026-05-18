const { getTimeInfo } = require('../../utils/time');

const PRESENCE_TEXTS = [
  '今晚还有一些人没睡。',
  '还有几个人也醒着。',
  '这个时间，不止你醒着。',
  '有一些人和你一起醒着。'
];

Page({
  data: {
    timePeriod: '',
    timeClock: '',
    moodText: '',
    presenceText: ''
  },

  onLoad() {
    this.refreshPage();
  },

  onShow() {
    this.refreshPage();
  },

  refreshPage() {
    const { period, clock, mood } = getTimeInfo();

    this.setData({
      timePeriod: period,
      timeClock: clock,
      moodText: mood,
      presenceText: PRESENCE_TEXTS[Math.floor(Math.random() * PRESENCE_TEXTS.length)]
    });
  },

  onEnterNight() {
    wx.navigateTo({
      url: '/pages/chat/chat'
    });
  }
});
