
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Definimos como undefined se não existirem para que o fallback no código (|| DEFAULT_KEY) funcione corretamente
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'process.env.VITE_SUPABASE_URL': process.env.VITE_SUPABASE_URL ? JSON.stringify(process.env.VITE_SUPABASE_URL) : 'undefined',
    'process.env.VITE_SUPABASE_ANON_KEY': process.env.VITE_SUPABASE_ANON_KEY ? JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY) : 'undefined',
  },
  server: {
    historyApiFallback: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
