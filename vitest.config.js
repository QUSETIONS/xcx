import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

// 注意：测试配置不加载 @dcloudio/vite-plugin-uni
// 单元测试只针对纯 JS 逻辑（mock 服务 / 智能引擎），
// 仅需 @ 别名 + 全局 uni mock（见 test/setup.js）
export default defineConfig({
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
      include: ['src/mock/**']
    }
  }
})
