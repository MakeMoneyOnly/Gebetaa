console.log('Checking Environment Variables...');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'MISSING');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK' : 'MISSING');
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('Key Length:', process.env.SUPABASE_SERVICE_ROLE_KEY.length);
}
console.log('Done.');
