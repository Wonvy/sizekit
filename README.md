# SizeKit

SizeKit is a static design-size artboard tool for quickly browsing social media, content platform, and print dimensions.

SizeKit 是一个静态的设计尺寸画板工具，用于快速查看社媒平台、内容平台和平面印刷物料尺寸。

## Features

- Platform icon navigation with fixed All / theme / language controls.
- Ratio-aware artboard cards for quick visual comparison.
- Filters for platform category, unit, ratio, image preview, size text, and sorting.
- Drag-and-drop image preview with local browser caching.
- Light and dark themes.
- Chinese / English interface switching.
- Print sizes include 72 / 150 / 300 dpi pixel conversion.

## 功能

- 平台图标导航，左侧固定“全部”，右侧固定主题和语言按钮。
- 按比例展示尺寸画板，方便快速比较视觉形态。
- 支持平台类型、单位、比例、图片预览、尺寸显示和排序过滤。
- 支持拖入图片预览，并缓存到浏览器本地。
- 支持浅色 / 暗色主题。
- 支持中文 / 英文界面切换。
- 印刷尺寸支持 72 / 150 / 300 dpi 像素换算。

## Run

Keep these files in the same directory:

```text
index.html
styles.css
app.js
data.json
```

Then open `index.html` through a local static server.

For example:

```bash
python -m http.server 5851
```

Open:

```text
http://127.0.0.1:5851/
```

You can also use VS Code Live Server.

## 运行

请保持以下文件在同一目录：

```text
index.html
styles.css
app.js
data.json
```

建议通过本地静态服务器打开 `index.html`。

例如：

```bash
python -m http.server 5851
```

然后访问：

```text
http://127.0.0.1:5851/
```

也可以使用 VS Code 的 Live Server。

## Usage

1. Click a platform icon to filter dimensions.
2. Use the toolbar to filter by category, unit, ratio, image preview, size text, or sort order.
3. Click an artboard card to open details.
4. Double-click a card to copy its size.
5. Drag images into the page to preview them inside matching artboard ratios.
6. Use the theme icon to switch light / dark mode.
7. Use the language icon to switch Chinese / English UI.

## 使用方式

1. 点击平台图标筛选尺寸。
2. 使用工具栏按类型、单位、比例、图片预览、尺寸文本或排序方式过滤。
3. 点击画板卡片查看详情。
4. 双击卡片复制尺寸。
5. 将图片拖入页面，可按比例填充预览。
6. 点击主题图标切换浅色 / 暗色模式。
7. 点击语言图标切换中文 / 英文界面。

## Data

All platform and preset dimensions are stored in `data.json`.

Basic preset shape:

```json
{
  "id": "youtube-thumbnail",
  "platformId": "youtube",
  "title": "视频缩略图",
  "width": 3840,
  "height": 2160,
  "unit": "px",
  "ratio": "16:9",
  "bleed": "Keep key text away from edges",
  "note": "Common YouTube thumbnail size.",
  "tags": ["video", "cover"],
  "dpi": null
}
```

## 数据

平台和尺寸配置都在 `data.json` 中。

基本尺寸条目结构：

```json
{
  "id": "youtube-thumbnail",
  "platformId": "youtube",
  "title": "视频缩略图",
  "width": 3840,
  "height": 2160,
  "unit": "px",
  "ratio": "16:9",
  "bleed": "关键文字不要贴边",
  "note": "常用 YouTube 缩略图尺寸。",
  "tags": ["视频", "封面"],
  "dpi": null
}
```

## Deploy

This is a static app. You can host it on GitHub Pages, Netlify, Vercel, or any static file server.

## 部署

这是一个静态应用，可以部署到 GitHub Pages、Netlify、Vercel 或任意静态文件服务器。
