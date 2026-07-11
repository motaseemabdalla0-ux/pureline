import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/chat/',
  plugins: [react()],
  server: {
    port: 5174,
    // Proxy API to the FastAPI backend during local dev.
    proxy: { '/api': 'http://localhost:8000' },
  },
})
