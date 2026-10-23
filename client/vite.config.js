import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // อ่าน .env จากโฟลเดอร์หลักของโปรเจกต์ (เฉพาะตัวแปรที่ขึ้นต้นด้วย VITE_ เท่านั้นที่ไปถึงหน้าเว็บ)
  envDir: '..',
  server: {
    proxy: { '/api': 'http://localhost:3000' },
  },
});
