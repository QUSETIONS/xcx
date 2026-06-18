import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'

// 注意：测试配置不加载 @dcloudio/vite-plugin-uni
// 单元测试只针对纯 JS 逻辑（mock 服务 / 智能引擎），
// 仅需 @ 别名 + 全局 uni mock（见 test/setup.js）
// vue() 插件用于渲染冒烟测试编译 .vue（见 test/render-smoke.test.js）
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./test/setup.js'],
    include: ['test/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // 只统计可单元测试的纯逻辑模块；.vue 页面/组件/HTTP 客户端不在单测范围
      include: [
        'src/mock/**',
        'src/utils/**',
        'src/i18n/**',
        'src/config/**'
      ],
      exclude: [
        'src/utils/request.js',   // HTTP 客户端，依赖运行时网络，不在单测范围
        'src/config/index.js'     // 纯 re-export 桶文件，无逻辑
      ],
      // 覆盖率门禁：低于阈值则 vitest run --coverage 非零退出，CI 失败
      // 阈值设在当前基线(96/84/74/96)下方，留出波动空间，仍能拦截显著回退
      thresholds: {
        statements: 95,
        branches: 80,
        functions: 72,
        lines: 95
      }
    }
  }
})
