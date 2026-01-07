
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // We explicitly avoid overriding process.env here to let the index.html shim work correctly,
    // while providing safe fallbacks for standard variable injections.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'process.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || ''),
    'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || ''),
  },
  server: {
    historyApiFallback: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
