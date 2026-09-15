import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()

describe('生产接口地址配置', () => {
  it('不再把小程序生产请求指向历史占位域名', () => {
    const config = fs.readFileSync(path.join(root, 'src', 'config', 'env.js'), 'utf8')
    const env = fs.readFileSync(path.join(root, 'src', 'utils', 'env.js'), 'utf8')
    const example = fs.readFileSync(path.join(root, '.env.production.example'), 'utf8')

    expect(config).toContain("PRODUCTION_API_BASE_URL = 'https://www.mediamatch.cn/api'")
    expect(env).toContain('PRODUCTION_API_BASE_URL')
    expect(example).toContain('https://www.mediamatch.cn/api')
    expect(`${config}\n${env}\n${example}`).not.toContain('api.qiyeku.com')
  })
})

describe('H5 构建依赖配置', () => {
  it('使用 vue-router 正式入口，避免 uni-app deprecated warning', () => {
    const viteConfig = fs.readFileSync(path.join(root, 'vite.config.js'), 'utf8')

    expect(viteConfig).toContain("find: 'vue-router'")
    expect(viteConfig).toContain("node_modules/vue-router/dist/vue-router.mjs")
    expect(viteConfig).not.toContain('vue-router.esm-bundler.js')
    expect(viteConfig).toContain("silenceDeprecations: ['legacy-js-api']")
  })
})
