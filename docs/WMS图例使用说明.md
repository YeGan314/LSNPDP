# WMS图层图例功能使用说明

## 功能概述

本系统提供了完整的WMS图层图例获取和显示功能，可以自动获取地图上当前最上层的WMS服务图例，并在图层控制按钮右侧显示。

## 核心功能

### 1. 自动图例显示组件 (`wms-legend.vue`)

图例组件会自动显示在图层控制按钮右侧，实时跟踪当前最上层的WMS图层。

**特性：**
- 自动检测最上层WMS图层
- 实时更新图例
- 科技感UI设计
- 支持关闭/隐藏

**位置：** 
- 组件路径：`src/views/big-screen/compoments/wms-legend.vue`
- 显示位置：图层控制按钮右侧（Left: 510px, Bottom: 40px）

### 2. WMS图例工具函数 (`wms-legend-helper.js`)

提供了一系列工具函数，方便在代码中获取WMS图层信息和图例。

**位置：** `src/utils/wms-legend-helper.js`

## API 使用方法

### 获取最上层WMS图层图例

```javascript
import { getTopWmsLayerLegend } from '@/utils/wms-legend-helper';

// 获取Cesium viewer实例
const viewer = window.viewer;

// 获取最上层WMS图层的图例信息
const legendInfo = getTopWmsLayerLegend(viewer);

if (legendInfo) {
  console.log('图层名称:', legendInfo.layerName);
  console.log('图例URL:', legendInfo.legendUrl);
  console.log('图层索引:', legendInfo.index);
  
  // 在页面中显示图例
  const img = document.createElement('img');
  img.src = legendInfo.legendUrl;
  document.body.appendChild(img);
}
```

### 获取所有WMS图层

```javascript
import { getAllWmsLayers } from '@/utils/wms-legend-helper';

const viewer = window.viewer;
const allWmsLayers = getAllWmsLayers(viewer);

console.log(`共有 ${allWmsLayers.length} 个WMS图层`);

allWmsLayers.forEach((layer, index) => {
  console.log(`图层 ${index + 1}:`, layer.layers);
  console.log('  URL:', layer.url);
  console.log('  透明度:', layer.alpha);
  console.log('  可见性:', layer.show);
});
```

### 自定义图例样式

```javascript
import { getTopWmsLayerLegend } from '@/utils/wms-legend-helper';

const viewer = window.viewer;

// 自定义图例选项
const options = {
  width: 30,              // 图例符号宽度
  height: 30,             // 图例符号高度
  fontName: 'Arial',      // 字体名称
  fontSize: 16,           // 字体大小
  fontColor: '0x00FF00',  // 字体颜色（绿色）
  bgColor: '0x000000',    // 背景颜色（黑色）
  dpi: 120                // DPI设置
};

const legendInfo = getTopWmsLayerLegend(viewer, options);
```

### 构建自定义图例URL

```javascript
import { buildLegendGraphicUrl } from '@/utils/wms-legend-helper';

const wmsUrl = '/geoserver/YG/wms';
const layerName = 'YG:risk_shange_2000';

// 使用默认选项
const legendUrl1 = buildLegendGraphicUrl(wmsUrl, layerName);

// 使用自定义选项
const legendUrl2 = buildLegendGraphicUrl(wmsUrl, layerName, {
  width: 25,
  height: 25,
  fontSize: 12,
  fontColor: '0xFFFFFF',
  bgColor: '0x333333'
});

console.log('图例URL:', legendUrl2);
```

### 调试WMS图层信息

```javascript
import { debugWmsLayers } from '@/utils/wms-legend-helper';

const viewer = window.viewer;

// 在控制台打印所有WMS图层的详细信息
debugWmsLayers(viewer);

// 输出示例：
// ========== WMS图层信息 ==========
// 共找到 3 个WMS图层
// 
// 图层 1:
//   - 名称: YG:risk_shange_2000
//   - URL: /geoserver/YG/wms
//   - 索引: 5
//   - 透明度: 0.8
//   - 可见性: true
//   - 图例URL: /geoserver/YG/wms?SERVICE=WMS&VERSION=1.1.0...
// ================================
```

## 工作原理

### Cesium图层顺序规则

在Cesium中，图层的渲染顺序遵循以下规则：
- **索引越大的图层越在上面**
- 后添加的图层索引更大
- `viewer.imageryLayers.get(i)` 中，i越大，图层越靠上

### 图例获取流程

1. **检测WMS图层**
   - 遍历 `viewer.imageryLayers`
   - 从最大索引开始（最上层）
   - 检查 `imageryProvider` 类型是否为 `WebMapServiceImageryProvider`

2. **构建图例URL**
   - 提取WMS服务URL和图层名称
   - 构建WMS GetLegendGraphic请求
   - 添加样式参数（字体、颜色、大小等）

3. **显示图例**
   - 使用 `<img>` 标签加载图例图片
   - 处理加载错误
   - 提供加载状态反馈

## 事件系统

系统使用自定义事件 `wms-layer-changed` 来通知图例组件更新：

```javascript
// 在图层变化时触发事件
window.dispatchEvent(new CustomEvent('wms-layer-changed'));

// 图例组件监听事件
window.addEventListener('wms-layer-changed', () => {
  updateLegend();
});
```

**触发时机：**
- 添加/移除WMS图层
- 调整图层顺序
- 清除所有图层

## 图例URL格式

标准的WMS GetLegendGraphic请求格式：

```
/geoserver/YG/wms?
  SERVICE=WMS&
  VERSION=1.1.0&
  REQUEST=GetLegendGraphic&
  LAYER=YG:risk_shange_2000&
  FORMAT=image/png&
  WIDTH=20&
  HEIGHT=20&
  LEGEND_OPTIONS=fontName:Microsoft YaHei;fontSize:14;fontAntiAliasing:true;fontColor:0xFFFFFF;bgColor:0x1a1a1a;dpi:96
```

## 常见问题

### Q1: 图例不显示怎么办？

**检查清单：**
1. 确认Cesium viewer已初始化（`window.viewer`存在）
2. 确认已添加WMS图层
3. 检查浏览器控制台是否有错误
4. 使用 `debugWmsLayers(viewer)` 查看图层信息
5. 检查GeoServer服务是否正常

### Q2: 如何获取特定图层的图例？

```javascript
import { getAllWmsLayers, buildLegendGraphicUrl } from '@/utils/wms-legend-helper';

const viewer = window.viewer;
const allLayers = getAllWmsLayers(viewer);

// 查找特定图层
const targetLayer = allLayers.find(layer => 
  layer.layers === 'YG:risk_shange_2000'
);

if (targetLayer) {
  const legendUrl = buildLegendGraphicUrl(targetLayer.url, targetLayer.layers);
  console.log('图例URL:', legendUrl);
}
```

### Q3: 如何手动刷新图例？

```javascript
// 在Vue组件中
const wmsLegendRef = ref(null);

// 手动触发更新
wmsLegendRef.value?.updateLegend();

// 或者触发全局事件
window.dispatchEvent(new CustomEvent('wms-layer-changed'));
```

### Q4: 图例样式如何自定义？

修改 `wms-legend.vue` 组件中的样式参数：

```javascript
const buildLegendGraphicUrl = (baseUrl, layers) => {
  const params = new URLSearchParams({
    SERVICE: 'WMS',
    VERSION: '1.1.0',
    REQUEST: 'GetLegendGraphic',
    LAYER: layers,
    FORMAT: 'image/png',
    WIDTH: '30',  // 修改宽度
    HEIGHT: '30', // 修改高度
    LEGEND_OPTIONS: 'fontName:Arial;fontSize:16;fontColor:0x00FF00;bgColor:0x000000'
  });
  return `${cleanUrl}?${params.toString()}`;
};
```

## 完整示例

### 在Vue组件中使用

```vue
<template>
  <div>
    <button @click="showTopLayerLegend">显示最上层图例</button>
    <button @click="showAllLegends">显示所有图例</button>
    <div v-if="currentLegend">
      <h3>{{ currentLegend.layerName }}</h3>
      <img :src="currentLegend.legendUrl" alt="图例" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { 
  getTopWmsLayerLegend, 
  getAllWmsLayerLegends 
} from '@/utils/wms-legend-helper';

const currentLegend = ref(null);

const showTopLayerLegend = () => {
  const viewer = window.viewer;
  currentLegend.value = getTopWmsLayerLegend(viewer);
};

const showAllLegends = () => {
  const viewer = window.viewer;
  const legends = getAllWmsLayerLegends(viewer);
  console.log('所有图例:', legends);
};
</script>
```

### 在普通JavaScript中使用

```javascript
import wmsLegendHelper from '@/utils/wms-legend-helper';

// 获取viewer
const viewer = window.viewer;

// 方法1: 获取最上层图层图例
const topLegend = wmsLegendHelper.getTopWmsLayerLegend(viewer);
if (topLegend) {
  console.log('最上层图层:', topLegend.layerName);
  console.log('图例URL:', topLegend.legendUrl);
}

// 方法2: 获取所有图层图例
const allLegends = wmsLegendHelper.getAllWmsLayerLegends(viewer);
allLegends.forEach(legend => {
  console.log(legend.layerName, ':', legend.legendUrl);
});

// 方法3: 调试信息
wmsLegendHelper.debugWmsLayers(viewer);
```

## 技术细节

### 支持的WMS版本
- WMS 1.1.0（默认）
- WMS 1.3.0（需修改VERSION参数）

### 支持的图例格式
- image/png（默认，推荐）
- image/jpeg
- image/gif

### GeoServer LEGEND_OPTIONS参数

| 参数 | 说明 | 示例值 |
|------|------|--------|
| fontName | 字体名称 | Microsoft YaHei, Arial |
| fontSize | 字体大小 | 14, 16, 18 |
| fontAntiAliasing | 字体抗锯齿 | true, false |
| fontColor | 字体颜色（十六进制） | 0xFFFFFF, 0x000000 |
| bgColor | 背景颜色（十六进制） | 0x1a1a1a, 0xFFFFFF |
| dpi | DPI设置 | 96, 120, 144 |

## 更新日志

### v1.0.0 (2025-12-04)
- ✅ 实现WMS图例自动显示组件
- ✅ 创建WMS图例工具函数库
- ✅ 支持获取最上层WMS图层
- ✅ 支持获取所有WMS图层
- ✅ 支持自定义图例样式
- ✅ 实现图层变化事件系统
- ✅ 添加调试工具函数

## 相关文件

```
src/
├── views/big-screen/
│   ├── compoments/
│   │   ├── wms-legend.vue          # 图例显示组件
│   │   └── layer-panel.vue         # 图层控制面板（已修改）
│   └── index-page.vue              # 主页面（已引入图例组件）
├── utils/
│   └── wms-legend-helper.js        # WMS图例工具函数
└── docs/
    └── WMS图例使用说明.md          # 本文档
```

## 联系与支持

如有问题或建议，请联系开发团队。
