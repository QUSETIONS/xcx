import { defineConfig } from 'vitest/config'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'

const __dirname = dirname(fileURLToPath(import.meta.url))
const UNI_CUSTOM_ELEMENTS = new Set([
  'view', 'text', 'image', 'scroll-view', 'swiper', 'swiper-item', 'switch', 'picker',
  'picker-view', 'picker-view-column', 'movable-area', 'movable-view', 'cover-view',
  'cover-image', 'web-view', 'rich-text', 'navigator', 'slider', 'progress', 'icon',
  'map', 'canvas', 'block', 'skeleton'
])
const isUniCustomElement = (tag) => UNI_CUSTOM_ELEMENTS.has(tag)

// 注意：测试配置不加载 @dcloudio/vite-plugin-uni；页面渲染由 render-smoke.test.js
// 提供最小的 uni 自定义元素编译配置，避免测试环境把运行时标签误当 Vue 组件。
export default defineConfig({
  plugins: [vue({ template: { compilerOptions: { isCustomElement: isUniCustomElement } } })],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  css: {
    preprocessorOptions: {
      scss: { api: 'modern-compiler' }
    }
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./test/setup.js'],
    include: ['test/**/*.test.js'],
    // 页面桥接测试会反复 resetModules，并加载同一套 Uni/Web Agent 运行时。
    // 多 worker 并行时这些模块转换与全局 mock 会互相争用，导致 5s 假超时；
    // 测试本身在单 worker 下稳定通过，生产代码不受影响。
    fileParallelism: false,
    maxWorkers: 1,
    minWorkers: 1,
    onConsoleLog(log) {
      // bridge 契约测试刻意不安装 Pinia，只验证真实端点映射；过滤这条预期提示。
      if (log.includes('[bridge] Pinia is not active; skip login gate')) return false
      return true
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/mock/**',
        'src/utils/**',
        'src/i18n/**',
        'src/config/**'
      ],
      exclude: [
        'src/utils/request.js',
        'src/config/index.js'
      ],
      thresholds: {
        statements: 96,
        branches: 82,
        functions: 86,
        lines: 96
      }
    }
  }
})
