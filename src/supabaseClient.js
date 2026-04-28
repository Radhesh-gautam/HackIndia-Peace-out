import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pcssxucikqsmiimmbspl.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjc3N4dWNpa3FzbWlpbW1ic3BsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNjE4MjIsImV4cCI6MjA5MjgzNzgyMn0.XTIqMVd0-hVYp6ltXUyvFkDYoZKL7iChgjTgF_Pe6sw'

let supabase;

try {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} catch (e) {
  console.error("Supabase init error:", e);
  // Provide a dummy object to prevent app-wide crashes
  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
      getUser: () => Promise.resolve({ data: { user: null } }),
      signOut: () => Promise.resolve(),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
          order: () => Promise.resolve({ data: [], error: null }),
        }),
        order: () => Promise.resolve({ data: [], error: null }),
      }),
      insert: () => Promise.resolve({ error: null }),
    }),
  };
}

export { supabase };
