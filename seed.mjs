import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zqigylkzoclflatnyeks.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxaWd5bGt6b2NsZmxhdG55ZWtzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQxMDk4MCwiZXhwIjoyMDg3OTg2OTgwfQ.fZfuPwSGQ1--qvnzH6k9DqmuGVBtzYBenKZiACG8Iz0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seed() {
    console.log('Seeding Test Business...');

    const { data, error } = await supabase
        .from('businesses')
        .insert([
            { name: 'Test Business', slug: 'test-business' }
        ])
        .select();

    if (error) {
        console.error('Error inserting business:', error.message);
    } else {
        console.log('Successfully seeded business:', data);
    }
}

seed();
