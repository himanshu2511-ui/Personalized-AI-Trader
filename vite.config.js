import { defineConfig } from 'vite';

export default defineConfig({
  // Dynamically switch base path. GitHub Pages requires the repo name, but Vercel requires root '/'
  base: process.env.GITHUB_ACTIONS ? '/Personalized-AI-Trader/' : '/',
});
