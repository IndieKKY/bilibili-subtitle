import {defineConfig, PluginOption} from 'vite'
import react from '@vitejs/plugin-react'
import {visualizer} from "rollup-plugin-visualizer";
import {crx} from '@crxjs/vite-plugin'
// @ts-ignore
import manifest from './manifest.json'

// https://vitejs.dev/config/
export default ({mode}) => {
  const plugins = [
    react(),
    visualizer() as PluginOption,
  ]
  // @ts-ignore
  if (mode === 'production_chrome') {
    plugins.push(crx({
      manifest,
    }))
  }
  return defineConfig({
    base: '/',
    plugins,
    css: {
      modules: {
        localsConvention: "camelCase"
      }
    }
  })
}
