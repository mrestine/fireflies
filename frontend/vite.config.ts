import { defineConfig } from 'vite'

export default defineConfig({
  base: '/fireflies/',
  server: {
    proxy: {
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
      },
    },
  },
})
