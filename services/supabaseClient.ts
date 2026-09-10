import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ztuqpwnphelezlddaxfz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0dXFwd25waGVsZXpsZGRheGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjUzNDEsImV4cCI6MjA3NzE0MTM0MX0.YjoCF8RVrWhMfOacdUAGixWfyGMQpPIkNWeKL3Jlp5A';

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL or anonymous key is not set in environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
