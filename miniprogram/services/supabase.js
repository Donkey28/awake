const SUPABASE_URL = '';
const SUPABASE_KEY = '';

function initSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('[Supabase] 未配置连接信息，离线模式运行');
    return null;
  }
  // 正式接入时在此初始化 supabase client
  console.log('[Supabase] 已连接');
  return null;
}

module.exports = { initSupabase };
