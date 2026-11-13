import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'

// The version shown in the corner of the app comes from package.json.
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  server: {
    // Lets you open the dev server from your phone on the same Wi-Fi
    host: true,
  },
})
