let visitors = 0;
let peakOnline = 0;
let totalMessages = 0;
let totalChars = 0;
const hourly = {};

function resetDaily() {
  visitors = 0;
  peakOnline = 0;
  totalMessages = 0;
  totalChars = 0;
  Object.keys(hourly).forEach(k => delete hourly[k]);
}

function recordConnection(onlineCount) {
  visitors++;
  if (onlineCount > peakOnline) peakOnline = onlineCount;
}

function recordMessage(length) {
  totalMessages++;
  totalChars += length;
  const hour = new Date().getHours().toString();
  hourly[hour] = (hourly[hour] || 0) + 1;
}

function getStats() {
  const msgCount = totalMessages;
  return {
    visitors,
    peakOnline,
    totalMessages: msgCount,
    avgLength: msgCount ? Math.round(totalChars / msgCount) : 0,
    hourly: { ...hourly }
  };
}

(function scheduleReset() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  setTimeout(() => { resetDaily(); scheduleReset(); }, next - now);
})();

module.exports = { recordConnection, recordMessage, getStats };
