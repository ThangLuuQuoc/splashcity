import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves this repo from /splashcity/, while Vercel and local dev
// serve from the root. The Pages workflow sets DEPLOY_TARGET=gh-pages; anything
// else builds for the root, so one config covers both hosts.
const base = process.env.DEPLOY_TARGET === 'gh-pages' ? '/splashcity/' : '/'

export default defineConfig({
  plugins: [react()],
  base,
  server: { port: 5173, open: false },
})
