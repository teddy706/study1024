import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://jvadwfxkkhcmndluxyzk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YWR3Znhra2hjbW5kbHV4eXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMTE5ODIsImV4cCI6MjA3Njg4Nzk4Mn0.D3Qy0FKqQsxrluu0KGLvc4ZTjmrc73s1wmv8kckFZOk";

const supabase = createClient(supabaseUrl, supabaseKey);

async function runQuery() {
  const { data, error } = await supabase
    .rpc('get_contact_summary');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Results:', JSON.stringify(data, null, 2));
}

runQuery();