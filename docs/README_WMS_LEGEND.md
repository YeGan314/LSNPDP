# WMS图层图例功能实现

## 📋 功能概述

本次更新为系统添加了完整的WMS图层图例获取和显示功能。系统能够自动检测地图上当前最上层的WMS服务，并在图层控制按钮右侧显示对应的图例。

## ✨ 核心特性

- ✅ **自动检测最上层WMS图层** - 实时跟踪图层变化
- ✅ **图例自动显示** - 在图层控制按钮右侧显示图例
- ✅ **完整的工具函数库** - 提供丰富的API接口
- ✅ **事件驱动更新** - 图层变化时自动更新图例
- ✅ **科技感UI设计** - 与系统整体风格一致
- ✅ **自定义图例样式** - 支持字体、颜色、大小等自定义
- ✅ **调试工具** - 方便开发和排查问题

## 📁 新增文件

```
src/
├── views/big-screen/
│   └── compoments/
│       ├── wms-legend.vue              # 图例显示组件（新增）
│       └── wms-legend-test.vue         # 测试工具组件（新增）
├── utils/
│   └── wms-legend-helper.js            # 工具函数库（新增）
└── docs/
    └── WMS图例使用说明.md              # 使用文档（新增）
```

## 🔧 修改文件

```
src/views/big-screen/
├── index-page.vue                      # 引入图例组件
└── compoments/
    └── layer-panel.vue                 # 添加图层变化事件触发
```

## 🚀 快速开始

### 1. 基本使用

图例组件已自动集成到主页面，无需额外配置即可使用：

```vue
<!-- 已在 index-page.vue 中引入 -->
<WmsLegend ref="wmsLegendRef"></WmsLegend>
```

### 2. 获取最上层WMS图层图例

```javascript
import { getTopWmsLayerLegend } from '@/utils/wms-legend-helper';

const viewer = window.viewer;
const legendInfo = getTopWmsLayerLegend(viewer);

if (legendInfo) {
  console.log('图层名称:', legendInfo.layerName);
  console.log('图例URL:', legendInfo.legendUrl);
}
```

### 3. 获取所有WMS图层

```javascript
import { getAllWmsLayerLegends } from '@/utils/wms-legend-helper';

const viewer = window.viewer;
const allLegends = getAllWmsLayerLegends(viewer);

allLegends.forEach(legend => {
  console.log(legend.layerName, ':', legend.legendUrl);
});
```

### 4. 调试WMS图层

```javascript
import { debugWmsLayers } from '@/utils/wms-legend-helper';

const viewer = window.viewer;
debugWmsLayers(viewer);
```

## 📚 API文档

### getTopWmsLayerLegend(viewer, options)

获取当前最上层WMS图层的图例信息。

**参数：**
- `viewer` (Object) - Cesium viewer实例
- `options` (Object, 可选) - 图例样式选项

**返回：**
```javascript
{
  layerName: 'YG:risk_shange_2000',
  legendUrl: '/geoserver/YG/wms?SERVICE=WMS&...',
  imageryLayer: ImageryLayer,
  index: 5
}
```

### getAllWmsLayerLegends(viewer, options)

获取所有WMS图层的图例信息。

**参数：**
- `viewer` (Object) - Cesium viewer实例
- `options` (Object, 可选) - 图例样式选项

**返回：** Array - 图例信息数组

### buildLegendGraphicUrl(baseUrl, layers, options)

构建WMS GetLegendGraphic请求URL。

**参数：**
- `baseUrl` (String) - WMS服务基础URL
- `layers` (String) - 图层名称
- `options` (Object, 可选) - 图例样式选项

**选项参数：**
```javascript
{
  format: 'image/png',        // 图例格式
  width: 20,                  // 符号宽度
  height: 20,                 // 符号高度
  fontName: 'Microsoft YaHei', // 字体名称
  fontSize: 14,               // 字体大小
  fontColor: '0xFFFFFF',      // 字体颜色
  bgColor: '0x1a1a1a',        // 背景颜色
  dpi: 96                     // DPI设置
}
```

### debugWmsLayers(viewer)

在控制台打印所有WMS图层的详细信息。

**参数：**
- `viewer` (Object) - Cesium viewer实例

## 🎯 工作原理

### Cesium图层顺序

在Cesium中，图层的渲染遵循以下规则：
- 索引越大的图层越在上面
- `viewer.imageryLayers.get(i)` 中，i越大表示图层越靠上
- 后添加的图层索引更大

### 图例获取流程

```
1. 遍历 viewer.imageryLayers（从大索引到小索引）
   ↓
2. 检查 imageryProvider 类型是否为 WebMapServiceImageryProvider
   ↓
3. 提取 WMS URL 和图层名称
   ↓
4. 构建 GetLegendGraphic 请求URL
   ↓
5. 返回图例信息
```

### 事件系统

系统使用自定义事件 `wms-layer-changed` 实现图层变化通知：

```javascript
// 触发事件（在图层面板中）
window.dispatchEvent(new CustomEvent('wms-layer-changed'));

// 监听事件（在图例组件中）
window.addEventListener('wms-layer-changed', updateLegend);
```

**触发时机：**
- 添加/移除WMS图层
- 调整图层顺序（拖拽排序）
- 清除所有图层

## 🎨 UI展示

### 图例组件位置

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
└─────────────────────────────────────┘
  [图层控制] [图例显示]
```

- **图层控制按钮**: Left: 40px, Bottom: 40px
- **图例显示组件**: Left: 510px, Bottom: 40px

### 图例样式

- 科技感深色背景
- 半透明毛玻璃效果
- 青色边框和装饰角
- 支持关闭按钮
- 自动适应图例大小

## 🔍 测试工具

系统提供了测试组件 `wms-legend-test.vue`，可用于：

- 测试获取最上层图层
- 查看所有WMS图层
- 预览图例效果
- 调试图层信息

**使用方法：**

在需要测试的页面引入组件：

```vue
<template>
  <WmsLegendTest v-if="showTest" @close="showTest = false" />
</template>

<script setup>
import WmsLegendTest from './compoments/wms-legend-test.vue';
import { ref } from 'vue';

const showTest = ref(false);
</script>
```

## 📝 使用示例

### 示例1: 在Vue组件中显示图例

```vue
<template>
  <div>
    <img v-if="legendUrl" :src="legendUrl" alt="图例" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getTopWmsLayerLegend } from '@/utils/wms-legend-helper';

const legendUrl = ref('');

onMounted(() => {
  const viewer = window.viewer;
  const legend = getTopWmsLayerLegend(viewer);
  if (legend) {
    legendUrl.value = legend.legendUrl;
  }
});
</script>
```

### 示例2: 监听图层变化

```javascript
// 监听图层变化事件
window.addEventListener('wms-layer-changed', () => {
  const viewer = window.viewer;
  const legend = getTopWmsLayerLegend(viewer);
  
  if (legend) {
    console.log('图层已变化，新的最上层图层:', legend.layerName);
    // 更新UI显示
  }
});
```

### 示例3: 自定义图例样式

```javascript
import { getTopWmsLayerLegend } from '@/utils/wms-legend-helper';

const viewer = window.viewer;

// 自定义样式
const customOptions = {
  width: 30,
  height: 30,
  fontSize: 16,
  fontColor: '0x00FF00',  // 绿色文字
  bgColor: '0x000000'     // 黑色背景
};

const legend = getTopWmsLayerLegend(viewer, customOptions);
```

## 🐛 常见问题

### Q: 图例不显示？

**解决方案：**
1. 检查 `window.viewer` 是否已初始化
2. 确认已添加WMS图层
3. 查看浏览器控制台错误信息
4. 使用 `debugWmsLayers(viewer)` 检查图层状态

### Q: 图例URL返回404？

**解决方案：**
1. 检查GeoServer服务是否正常运行
2. 确认图层名称格式正确（工作空间:图层名）
3. 检查代理配置是否正确
4. 在浏览器中直接访问图例URL测试

### Q: 如何获取特定图层的图例？

```javascript
import { getAllWmsLayers, buildLegendGraphicUrl } from '@/utils/wms-legend-helper';

const viewer = window.viewer;
const allLayers = getAllWmsLayers(viewer);

// 查找特定图层
const targetLayer = allLayers.find(layer => 
  layer.layers === 'YG:risk_shange_2000'
);

if (targetLayer) {
  const legendUrl = buildLegendGraphicUrl(
    targetLayer.url, 
    targetLayer.layers
  );
}
```

## 🔄 更新记录

### v1.0.0 (2025-12-04)

**新增功能：**
- ✅ WMS图例自动显示组件
- ✅ WMS图例工具函数库
- ✅ 图层变化事件系统
- ✅ 测试工具组件
- ✅ 完整使用文档

**修改内容：**
- 📝 更新 `layer-panel.vue` - 添加图层变化事件触发
- 📝 更新 `index-page.vue` - 引入图例组件

## 📖 相关文档

- [WMS图例使用说明](./docs/WMS图例使用说明.md) - 详细使用文档
- [GeoServer WMS规范](https://docs.geoserver.org/stable/en/user/services/wms/reference.html) - WMS标准文档

## 💡 技术要点

### WMS GetLegendGraphic请求

标准格式：
```
http://geoserver/workspace/wms?
  SERVICE=WMS&
  VERSION=1.1.0&
  REQUEST=GetLegendGraphic&
  LAYER=workspace:layername&
  FORMAT=image/png&
  WIDTH=20&
  HEIGHT=20&
  LEGEND_OPTIONS=fontName:Arial;fontSize:14;...
```

### Cesium ImageryLayer

```javascript
// 获取图层
const imageryLayer = viewer.imageryLayers.get(index);

// 获取提供者
const provider = imageryLayer.imageryProvider;

// 检查类型
if (provider.constructor.name === 'WebMapServiceImageryProvider') {
  // 这是WMS图层
  const layers = provider.layers;  // 图层名称
  const url = provider.url;        // 服务URL
}
```

## 🎓 最佳实践

1. **性能优化**
   - 避免频繁调用图例获取函数
   - 使用事件系统而非轮询
   - 缓存图例URL

2. **错误处理**
   - 检查viewer是否存在
   - 处理图片加载失败
   - 提供友好的错误提示

3. **用户体验**
   - 提供加载状态反馈
   - 支持关闭/隐藏图例
   - 图例大小自适应

## 👥 贡献者

- YG - 初始实现

## 📄 许可证

本项目遵循公司内部开发规范。

---

**最后更新:** 2025-12-04
