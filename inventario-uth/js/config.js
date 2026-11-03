// Datos de conexión de Supabase (Project Settings > API Keys > Legacy anon)
const SUPABASE_URL = 'https://fgkvtdjpyoxuklrlbykr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZna3Z0ZGpweW94dWtscmxieWtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1NTAyNzIsImV4cCI6MjEwOTEyNjI3Mn0.biOJw0QkiPwADHsJmIhSVh4QH-DZA2mJ2AtTgUPWNuA';

// Cliente que usan todas las páginas
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
