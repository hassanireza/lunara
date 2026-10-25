import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/** The renderer worker needs React's *development* builds, because act() (which flushes effects and timers
 *  deterministically) does not exist in production builds. Only the worker gets this; the app itself stays production. */
const devReactInWorker = (): Plugin => ({
  name: 'lunara-dev-react-in-worker',
  enforce: 'pre',
  transform(code, id) {
    if (!/node_modules[\\/](react|react-test-renderer|scheduler)[\\/]/.test(id) || !code.includes('process.env.NODE_ENV')) return null;
    return { code: code.replaceAll('process.env.NODE_ENV', '"development"'), map: null };
  },
});

// Served from https://<user>.github.io/lunara/ . Change `base` if the repository is named differently.
export default defineConfig({
  plugins: [react()],
  base: '/lunara/',
  worker: { format: 'es', plugins: () => [devReactInWorker()] },
  build: { target: 'es2022', chunkSizeWarningLimit: 1000 },
});
