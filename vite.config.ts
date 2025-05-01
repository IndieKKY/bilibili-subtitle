import {defineConfig, PluginOption} from 'vite'
import react from '@vitejs/plugin-react'
import {visualizer} from "rollup-plugin-visualizer";
import {crx} from '@crxjs/vite-plugin'
import path from "path"
// @ts-ignore
import manifest from './manifest.config'

// https://vitejs.dev/config/
export default () => {
  return defineConfig({
    base: '/',
    build: {
      rollupOptions: {
        input: {
          index: 'index.html',
        },
      },
      minify: false, // fuyc. set this during dev
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    plugins: [
      react(),
      crx({
        manifest,
      }),
      visualizer() as PluginOption,
    ],
    css: {
      modules: {
        localsConvention: "camelCase"
      }
    }
  })
}
