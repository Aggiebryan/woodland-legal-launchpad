import { createClient } from '@supabase/supabase-js';

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_BUCKET = 'documents',
  EXPIRATION_HOURS = '24',
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const cutoffIso = new Date(Date.now() - Number(EXPIRATION_HOURS) * 60 * 60 * 1000).toISOString();

async function cleanup() {
  const { data, error } = await supabase
    .schema('storage')
    .from('objects')
    .select('name')
    .eq('bucket_id', SUPABASE_BUCKET)
    .lt('created_at', cutoffIso);

  if (error) {
    console.error('Error fetching expired objects:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No expired files to delete');
    return;
  }

  const paths = data.map((o) => o.name);
  const { error: deleteError } = await supabase.storage.from(SUPABASE_BUCKET).remove(paths);

  if (deleteError) {
    console.error('Failed to delete files:', deleteError);
  } else {
    console.log(`Deleted ${paths.length} expired files`);
  }
}

cleanup();
