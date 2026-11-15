import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kdklpiepaawtegopuamo.supabase.co';
const supabaseKey = 'sb_publishable_YtI_JT5ZVc-WD0Jzz6lsgw_gWC7zswl';

export const supabase = createClient(supabaseUrl, supabaseKey);
