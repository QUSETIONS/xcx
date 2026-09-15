import { defineConfig, searchForWorkspaceRoot } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { createRequire } from 'module'
import { dirname, resolve } from 'path'

const publicTunnelHost = String(process.env.PUBLIC_TUNNEL_HOST || '').trim()
const require = createRequire(import.meta.url)
const uniH5Root = dirname(require.resolve('@dcloudio/uni-h5/package.json'))
// uni-app 当前插件仍会把 vue-router 指向已弃用的 esm-bundler 入口。
// 直接锁定同一份依赖的现代入口，避免线上启动时输出 deprecation warning。
const vueRouterEntry = resolve(uniH5Root, 'node_modules/vue-router/dist/vue-router.mjs')

export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: [
      { find: 'vue-router', replacement: vueRouterEntry },
      { find: '@', replacement: resolve(__dirname, 'src') }
    ]
  },
  css: {
    preprocessorOptions: {
      scss: {
        // uni-app 会自动注入 src/uni.scss；这里仅切换 Sass 现代 API，避免重复注入设计令牌。
        api: 'modern-compiler',
        // 微信小程序编译器仍经由 uni-cli-shared 的 legacy render API；
        // 只静默这一项已知适配层提示，不屏蔽 Sass 语法或构建错误。
        silenceDeprecations: ['legacy-js-api']
      }
    }
  },
  server: {
    fs: {
      allow: [searchForWorkspaceRoot(__dirname), resolve(__dirname, '../server/domain')]
    },
    port: 8080,
    host: '0.0.0.0',
    // 临时公网预览通过 SSH 反向隧道访问；生产构建不使用这份开发服务器配置。
    // 隧道域名由启动命令注入，避免把旧的临时地址固化进开发配置。
    allowedHosts: publicTunnelHost ? [publicTunnelHost] : ['localhost', '127.0.0.1'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3101',
        changeOrigin: true
      }
    }
  }
})
