const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('[supabase] 未配置 SUPABASE_URL / SUPABASE_KEY，数据库功能不可用');
}

const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

async function saveMessage(id, content, time) {
  if (!supabase) return;
  const { error } = await supabase
    .from('messages')
    .insert({ id, content, time });

  if (error) {
    console.error('[supabase] 写入失败', error.message);
  }
}

async function getRecentMessages(limit = 20) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('messages')
    .select('id, content, time')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[supabase] 读取失败', error.message);
    return [];
  }
  return data;
}

module.exports = { saveMessage, getRecentMessages };
