import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // GitHub Pages serves this project under /CubeNest/, not the domain root.
  base: '/CubeNest/',
  build: {
    outDir: 'dist',
  },
})
