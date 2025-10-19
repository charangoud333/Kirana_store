import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://orfycbpdvgbzatmhkfcx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZnljYnBkdmdiemF0bWhrZmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNzg0ODksImV4cCI6MjA3NTc1NDQ4OX0.ZpyzxCAoIgdSnlvPZgev4T4NJv-246RhlgQ0VfcCs_M';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Testing Supabase connection...\n');

// Test 1: Check if we can query store_settings
const { data, error } = await supabase
  .from('store_settings')
  .select('*')
  .limit(1);

if (error) {
  console.log('❌ CONNECTION FAILED!');
  console.log('Error:', error.message);
  console.log('\nPossible reasons:');
  console.log('1. Database schema not applied (run the migration SQL)');
  console.log('2. Wrong Supabase URL or API key in .env');
  console.log('3. RLS policies blocking access');
  process.exit(1);
} else {
  console.log('✅ CONNECTION SUCCESSFUL!');
  console.log('Data retrieved:', data);
  console.log('\nYour project is connected to Supabase ✨');
  process.exit(0);
}
