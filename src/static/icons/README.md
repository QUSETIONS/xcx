# 小程序图标说明

由于微信小程序不支持直接使用 SVG 文件，需要将 SVG 图标转换为 PNG 格式。

## 图标列表

### Tab 栏图标 (需提供两套：默认灰色 + 选中橙色)
- home.png / home-active.png
- list.png / list-active.png
- community.png / community-active.png
- mall.png / mall-active.png
- user.png / user-active.png

### 功能图标
- search.png
- bell.png
- eye.png
- handshake.png
- edit.png
- heart.png
- download.png
- settings.png
- help.png

### 分类图标
- cat_01.png ~ cat_10.png

### 服务类型图标
- member.png
- linker.png
- survey.png
- resource_pack.png
- certification.png

## 转换方法

1. 使用在线工具：https://convertio.co/svg-png/
2. 使用 Figma/Sketch 导出 PNG
3. 使用 iconfont 下载 PNG 格式

## 推荐尺寸

- Tab 图标：48x48px @2x (96x96px)
- 功能图标：24x24px @2x (48x48px)
- 分类图标：32x32px @2x (64x64px)

## 临时方案

上架前可使用 emoji 或 iconfont 方案替代：
```vue
<text class="icon">🔍</text>
```

或在 iconfont.cn 创建图标项目，生成 font-class 链接。