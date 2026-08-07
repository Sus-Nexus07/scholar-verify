import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: [
      '@midnight-ntwrk/ledger-v8',
      '@midnight-ntwrk/onchain-runtime-v3',
      '@midnight-ntwrk/zkir-v2',
    ],
  },
})