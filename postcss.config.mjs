// 小程序独立使用 uni-app/Vite，不继承工作区根目录站点的 Tailwind 配置。
// 根目录是另一个 Web 项目；如果这里向上查找它的 PostCSS 配置，测试和 H5
// 构建会依赖根项目的 @tailwindcss/postcss，造成跨项目启动失败。
export default {
  plugins: {}
}
