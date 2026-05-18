const MOODS = {
  late: [
    '睡不着的人，不止你一个。',
    '夜晚是白天的找零。',
    '把今天没说完的话，带到夜里。',
    '此刻醒着，也不用跟谁解释。',
    '有些话，只能在深夜说。'
  ],
  midnight: [
    '夜到深处，声音反而轻了。',
    '失眠不是惩罚，是独处。',
    '凌晨两点前，都还算今天。',
    '全世界都黑屏了。'
  ],
  deep: [
    '这是夜晚的底部。',
    '没有人在这个时间打广告。',
    '安静到能听见自己的呼吸。',
    '快天亮了。再坐一会儿。',
    '夜晚最暗的时候，话最轻。'
  ],
  dawn: [
    '天边开始变色了。',
    '又陪了夜晚一夜。',
    '天快亮了。晚安。',
    '这一夜，不算浪费。'
  ]
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getTimeInfo() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();

  let period;
  let mood;

  if (hour >= 22 || hour < 1) {
    period = '深夜';
    mood = pick(MOODS.late);
  } else if (hour >= 1 && hour < 3) {
    period = '凌晨';
    mood = pick(MOODS.midnight);
  } else if (hour >= 3 && hour < 5) {
    period = '夜深了';
    mood = pick(MOODS.deep);
  } else if (hour >= 5 && hour < 7) {
    period = '天快亮了';
    mood = pick(MOODS.dawn);
  } else {
    period = '夜结束了';
    mood = '天亮了。晚安。';
  }

  const clock = `${hour}:${String(minute).padStart(2, '0')}`;

  return { period, clock, mood };
}

module.exports = { getTimeInfo };
