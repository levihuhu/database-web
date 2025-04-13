// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? './' : '/', // ✅ dev 本地用绝对路径，prod 用相对路径
  plugins: [react()],
}));