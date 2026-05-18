const WORDS = [
  '广告', '推广', '加微', '加微信', '微信',
  'QQ', 'qq群', '加群', '扫码', '二维码',
  '赌博', '彩票', '代购', '兼职', '刷单',
  '色情', '裸聊', '约炮', '一夜情',
  '违法', '枪支', '毒品', '翻墙', 'VPN',
  '政治', '敏感', '六四', '法轮功', '藏独', '疆独', '台独',
  '贷款', '套现', '信用卡', '办证',
  '自杀', '自残', '割腕', '跳楼'
];

function filter(text) {
  const lower = text.toLowerCase();
  for (const word of WORDS) {
    if (lower.includes(word.toLowerCase())) {
      return true;
    }
  }
  return false;
}

module.exports = { filter };
