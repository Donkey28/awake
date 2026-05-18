const { initSupabase } = require('./services/supabase');

App({
  globalData: {
    supabase: null,
    presenceCount: 0
  },

  onLaunch() {
    this.globalData.supabase = initSupabase();
  }
});
