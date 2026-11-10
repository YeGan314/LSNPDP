# GeoServer 服务使用说明

## 📋 当前配置的服务

### 服务信息
- **GeoServer 地址**: `http://8.140.227.53:8080/geoserver/`
- **工作空间**: `YG`
- **服务类型**: WMS (Web Map Service)

### 已配置的图层

#### 1. 行政区划缓冲区
- **图层名称**: `YG:HSQ_XZQ_MAP_BUFFER`
- **显示名称**: 行政区划缓冲区
- **图层ID**: `xzq_buffer`
- **默认透明度**: 80%
- **状态**: ✅ 已配置并自动加载

---

## 🎮 使用方法

### 方法一：使用控制面板（推荐）

1. **在页面中引入控制组件**

在 `index-page.vue` 中添加：

```vue
<template>
  <div>
    <!-- 其他内容 -->
    
    <!-- GeoServer 控制面板 -->
    <GeoServerControl v-if="showGeoServerControl" @close="showGeoServerControl = false" />
    
    <!-- 打开控制面板的按钮 -->
    <button @click="showGeoServerControl = true" class="control-btn">
      📊 地理数据
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import GeoServerControl from './compoments/GeoServerControl.vue';

const showGeoServerControl = ref(false);
</script>
```

2. **控制面板功能**
   - ✅ 显示/隐藏图层
   - ✅ 调整透明度（0-100%）
   - ✅ 调整亮度（0-200%）
   - ✅ 调整对比度（0-200%）
   - ✅ 移动图层到顶层
   - ✅ 重置图层样式
   - ✅ 批量显示/隐藏

### 方法二：通过代码控制

```javascript
import { geoServerService } from '@/services/geoserverService';
import { viewerCesium } from './js/threeCesium';

// 1. 显示/隐藏图层
geoServerService.setLayerVisible('xzq_buffer', true);  // 显示
geoServerService.setLayerVisible('xzq_buffer', false); // 隐藏

// 2. 调整透明度 (0-1)
geoServerService.setLayerAlpha('xzq_buffer', 0.5);

// 3. 调整亮度 (0-2)
geoServerService.setLayerBrightness('xzq_buffer', 1.2);

// 4. 调整对比度 (0-2)
geoServerService.setLayerContrast('xzq_buffer', 1.5);

// 5. 移动到顶层
geoServerService.raiseLayerToTop(viewerCesium(), 'xzq_buffer');

// 6. 移除图层
geoServerService.removeLayer(viewerCesium(), 'xzq_buffer');

// 7. 获取图层信息
const layerInfo = geoServerService.getLayer('xzq_buffer');
console.log(layerInfo);

// 8. 获取所有图层
const allLayers = geoServerService.getAllLayers();
console.log(allLayers);
```

---

## ➕ 添加新的 GeoServer 图层

### 步骤 1: 在配置文件中添加

编辑 `src/config/geoserver.config.js`:

```javascript
export const GEOSERVER_CONFIG = {
  // ... 其他配置
  
  layers: {
    wms: [
      {
        id: 'xzq_buffer',
        name: 'YG:HSQ_XZQ_MAP_BUFFER',
        title: '行政区划缓冲区',
        description: '湖南省行政区划缓冲区图层',
        type: 'wms',
        visible: true,  // 是否默认显示
        alpha: 0.8,     // 透明度
        brightness: 1.0, // 亮度
        contrast: 1.0,   // 对比度
        parameters: {
          styles: '', // SLD 样式名称
        }
      },
      // 添加新图层
      {
        id: 'new_layer',              // 唯一标识
        name: 'YG:YOUR_LAYER_NAME',   // GeoServer 图层名称
        title: '新图层标题',           // 显示名称
        description: '图层描述',       // 描述信息
        type: 'wms',
        visible: false,               // 默认不显示
        alpha: 0.8,
        brightness: 1.0,
        contrast: 1.0,
        parameters: {
          styles: '',                 // 可选：自定义样式
        }
      },
    ],
  }
};
```

### 步骤 2: 在页面中加载

#### 方式 A: 使用服务类自动加载所有图层

```javascript
import { geoServerService } from '@/services/geoserverService';
import { GEOSERVER_CONFIG } from '@/config/geoserver.config';
import { viewerCesium } from './js/threeCesium';

// 加载所有配置的 WMS 图层
function loadAllLayers() {
  const viewer = viewerCesium();
  const { layers } = GEOSERVER_CONFIG;
  
  layers.wms.forEach(layerConfig => {
    if (layerConfig.visible) {
      geoServerService.loadWMSLayer(viewer, layerConfig);
    }
  });
}

// 在组件挂载时调用
onMounted(() => {
  setTimeout(() => {
    loadAllLayers();
  }, 2000);
});
```

#### 方式 B: 使用简单方法直接加载

```javascript
import { initWMSService } from './js/threeCesium';

// 直接加载单个图层
const layer = initWMSService({
  url: "/geoserver/YG/wms",
  layers: "YG:YOUR_LAYER_NAME",
  parameters: {
    transparent: true,
    format: "image/png",
  },
  alpha: 0.8,
});
```

---

## 🎨 图层样式配置

### 在 GeoServer 中配置 SLD 样式

1. **登录 GeoServer 管理界面**
   ```
   http://8.140.227.53:8080/geoserver/web/
   ```

2. **创建新样式**
   - 点击 "样式" (Styles)
   - 点击 "添加新样式"
   - 输入样式名称，例如：`buffer_style`
   - 编写 SLD XML 内容

3. **SLD 样式示例**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0">
  <NamedLayer>
    <Name>YG:HSQ_XZQ_MAP_BUFFER</Name>
    <UserStyle>
      <Name>buffer_style</Name>
      <FeatureTypeStyle>
        <Rule>
          <PolygonSymbolizer>
            <Fill>
              <CssParameter name="fill">#4CAF50</CssParameter>
              <CssParameter name="fill-opacity">0.6</CssParameter>
            </Fill>
            <Stroke>
              <CssParameter name="stroke">#2E7D32</CssParameter>
              <CssParameter name="stroke-width">2</CssParameter>
            </Stroke>
          </PolygonSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>
```

4. **应用样式到图层**

在配置文件中指定样式：

```javascript
{
  id: 'xzq_buffer',
  name: 'YG:HSQ_XZQ_MAP_BUFFER',
  title: '行政区划缓冲区',
  type: 'wms',
  visible: true,
  alpha: 0.8,
  parameters: {
    styles: 'buffer_style',  // 使用自定义样式
  }
}
```

---

## 🔧 常见问题

### 1. 图层不显示

**检查步骤：**

```javascript
// 1. 检查图层是否加载
const layer = geoServerService.getLayer('xzq_buffer');
console.log('图层信息:', layer);

// 2. 检查图层显示状态
console.log('显示状态:', layer.layer.show);
console.log('透明度:', layer.layer.alpha);

// 3. 检查所有图层
const viewer = viewerCesium();
console.log('图层总数:', viewer.imageryLayers.length);

// 4. 强制显示并移到顶层
geoServerService.setLayerVisible('xzq_buffer', true);
geoServerService.setLayerAlpha('xzq_buffer', 1.0);
geoServerService.raiseLayerToTop(viewer, 'xzq_buffer');
```

### 2. 跨域问题

已通过 Vue 代理解决，配置在 `vue.config.js`:

```javascript
devServer: {
  proxy: {
    '/geoserver': {
      target: 'http://8.140.227.53:8080',
      changeOrigin: true,
      secure: false,
    }
  }
}
```

### 3. 图层模糊

调整对比度和亮度：

```javascript
geoServerService.setLayerBrightness('xzq_buffer', 1.2);
geoServerService.setLayerContrast('xzq_buffer', 1.3);
```

### 4. 测试 GeoServer 连接

```javascript
import { geoServerService } from '@/services/geoserverService';

const result = await geoServerService.testConnection();
if (result.success) {
  console.log('✅ 连接成功');
  console.log('可用图层:', result.layers);
} else {
  console.error('❌ 连接失败:', result.error);
}
```

---

## 📊 图层数据格式

### WMS GetMap 请求示例

```
http://8.140.227.53:8080/geoserver/YG/wms?
  service=WMS
  &version=1.1.0
  &request=GetMap
  &layers=YG:HSQ_XZQ_MAP_BUFFER
  &bbox=112.60,28.49,112.62,28.51
  &width=768
  &height=464
  &srs=EPSG:4326
  &format=image/png
  &transparent=true
```

### GetCapabilities 请求

```
http://8.140.227.53:8080/geoserver/YG/wms?
  service=WMS
  &version=1.1.0
  &request=GetCapabilities
```

---

## 📚 相关文档

- [GeoServer 集成方案](./GeoServer集成方案.md) - 完整的技术方案
- [快速开始](./快速开始.md) - 快速使用指南
- [WMS 诊断指南](../WMS-诊断指南.md) - 故障排查

---

## 🎯 总结

现在你可以：

✅ **查看图层** - 在地图上看到 `YG:HSQ_XZQ_MAP_BUFFER` 图层  
✅ **控制显示** - 通过控制面板或代码控制图层  
✅ **调整样式** - 修改透明度、亮度、对比度  
✅ **添加新图层** - 按照步骤添加更多 GeoServer 图层  
✅ **自定义样式** - 在 GeoServer 中配置 SLD 样式

需要帮助？查看完整文档或联系技术支持。

