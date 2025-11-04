import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cclcevdzfpgrxfcwkymf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjbGNldmR6ZnBncnhmY3dreW1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMTU3NjQsImV4cCI6MjA3Mzc5MTc2NH0.0DdvV_BslAmDQDsZlykWTAGAEfRZzjouKC1KOrvelLI';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
    if (!supabaseInstance) {
        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error("Supabase URL and Anon Key must be provided.");
        }
        supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    }
    return supabaseInstance;
};