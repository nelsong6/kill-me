import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'
import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Get git commit hash
const getGitCommit = () => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch (error) {
    console.warn('Could not get git commit hash:', error.message)
    return 'dev'
  }
}

// Copy sql.js WASM file to public/ so it's served as a static asset.
// sql.js needs this file at runtime to initialize the SQLite engine.
function copySqlJsWasm() {
  return {
    name: 'copy-sql-js-wasm',
    buildStart() {
      const src = resolve(__dirname, 'node_modules/sql.js/dist/sql-wasm.wasm')
      const dest = resolve(__dirname, 'public/sql-wasm.wasm')
      if (existsSync(src)) {
        mkdirSync(dirname(dest), { recursive: true })
        copyFileSync(src, dest)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copySqlJsWasm()],
  define: {
    __BUILD_NUMBER__: JSON.stringify(getGitCommit()),
  },
})
