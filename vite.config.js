import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// GitHub Pages project URL: /RepoName/ — change if you rename the repo.
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/TeacherStudio/' : '/',
  plugins: [react()],
})
