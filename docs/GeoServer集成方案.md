# GeoServer WMS/WMTS 服务集成到 Cesium 三维地图方案

## 📋 方案概述

本方案提供完整的 GeoServer 服务集成解决方案，包括 WMS、WMTS 两种服务类型，支持矢量数据、栅格数据、TIF 影像等多种数据源。

---

## 🎯 目标

1. ✅ 支持 WMS 服务（已完成）
2. ✅ 支持 WMTS 服务
3. ✅ 统一的图层管理
4. ✅ 解决跨域问题
5. ✅ 图层样式配置
6. ✅ 性能优化

---

## 🏗️ 技术架构

```
┌─────────────────────────────────────────┐
│           Vue 3 应用层                   │
│  ┌─────────────────────────────────┐   │
│  │   index-page.vue (地图页面)      │   │
│  └─────────────────────────────────┘   │
│              ↓                           │
│  ┌─────────────────────────────────┐   │
│  │  geoserverService.js (服务层)    │   │
│  └─────────────────────────────────┘   │
│              ↓                           │
│  ┌─────────────────────────────────┐   │
│  │  threeCesium.js (Cesium 封装)    │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│      Vue Dev Server (代理层)             │
│        vue.config.js proxy               │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│         GeoServer 服务器                 │
│  ┌──────────┐  ┌──────────┐            │
│  │   WMS    │  │   WMTS   │            │
│  └──────────┘  └──────────┘            │
└─────────────────────────────────────────┘
```

---

## 📦 第一阶段：项目准备

### 1.1 安装依赖
```bash
# 已有依赖，无需额外安装
npm install cesium vue@3
```

### 1.2 配置代理（已完成）

**文件**: `vue.config.js`
```javascript
module.exports = defineConfig({
  devServer: {
    port: 8080,
    proxy: {
      '/geoserver': {
        target: 'http://8.140.227.53:8080',
        changeOrigin: true,
        secure: false,
        ws: true,
        logLevel: 'debug',
      }
    }
  }
});
```

---

## 🔧 第二阶段：创建 GeoServer 服务管理模块

### 2.1 创建服务配置文件

**文件**: `src/config/geoserver.config.js`
```javascript
/**
 * GeoServer 服务配置
 */
export const GEOSERVER_CONFIG = {
  // 开发环境使用代理
  baseUrl: process.env.NODE_ENV === 'development' 
    ? '/geoserver'  // 开发环境代理
    : 'http://8.140.227.53:8080/geoserver',  // 生产环境直连
  
  // 工作空间
  workspace: 'YG',
  
  // 服务端点
  endpoints: {
    wms: '/wms',
    wmts: '/gwc/service/wmts',
    wfs: '/wfs',
  },
  
  // 默认参数
  defaults: {
    wms: {
      version: '1.1.0',
      format: 'image/png',
      transparent: true,
      tiled: true,
    },
    wmts: {
      version: '1.0.0',
      format: 'image/png',
      style: 'default',
      tileMatrixSetID: 'EPSG:4326',
    }
  },
  
  // 图层配置
  layers: {
    // WMS 图层
    wms: [
      {
        id: 'xzq_buffer',
        name: 'YG:HSQ_XZQ_MAP_BUFFER',
        title: '行政区划缓冲区',
        type: 'wms',
        visible: true,
        alpha: 0.8,
      }
    ],   
     wms: [
      {
        id: 'XJLY_DEM',
        name: '	YG:XJLY_DEM',
        title: '湘江流域高程地图',
        type: 'wms',
        visible: true,
        alpha: 0.8,
      }
    ],
    // WMTS 图层
    wmts: [
      {
        id: 'base_map',
        name: 'YG:base_layer',
        title: '底图',
        type: 'wmts',
        visible: true,
        alpha: 1.0,
      }
    ]
  }
};
```

### 2.2 创建 GeoServer 服务类

**文件**: `src/services/geoserverService.js`
```javascript
import { 
  WebMapServiceImageryProvider,
  WebMapTileServiceImageryProvider,
  Credit 
} from 'cesium';
import { GEOSERVER_CONFIG } from '@/config/geoserver.config';

/**
 * GeoServer 服务管理类
 */
class GeoServerService {
  constructor() {
    this.config = GEOSERVER_CONFIG;
    this.layers = new Map(); // 存储已加载的图层
  }

  /**
   * 获取完整的服务 URL
   * @param {string} serviceType - 服务类型: 'wms', 'wmts', 'wfs'
   */
  getServiceUrl(serviceType = 'wms') {
    const { baseUrl, workspace, endpoints } = this.config;
    return `${baseUrl}/${workspace}${endpoints[serviceType]}`;
  }

  /**
   * 加载 WMS 图层
   * @param {Object} viewer - Cesium Viewer 对象
   * @param {Object} layerConfig - 图层配置
   */
  loadWMSLayer(viewer, layerConfig) {
    const {
      id,
      name,
      title,
      alpha = 1.0,
      brightness = 1.0,
      contrast = 1.0,
      parameters = {}
    } = layerConfig;

    console.log(`🗺️ 加载 WMS 图层: ${title} (${name})`);

    try {
      // 合并默认参数和自定义参数
      const wmsParams = {
        ...this.config.defaults.wms,
        ...parameters,
      };

      // 创建 WMS ImageryProvider
      const imageryProvider = new WebMapServiceImageryProvider({
        url: this.getServiceUrl('wms'),
        layers: name,
        parameters: wmsParams,
        credit: new Credit(title),
        enablePickFeatures: false,
      });

      // 监听就绪事件
      imageryProvider.readyPromise
        .then(() => {
          console.log(`✅ WMS 图层就绪: ${title}`);
          console.log('  - 瓦片尺寸:', imageryProvider.tileWidth, 'x', imageryProvider.tileHeight);
          console.log('  - 最大级别:', imageryProvider.maximumLevel);
        })
        .catch((error) => {
          console.error(`❌ WMS 图层加载失败: ${title}`, error);
        });

      // 添加到地图
      const layer = viewer.imageryLayers.addImageryProvider(imageryProvider);
      layer.alpha = alpha;
      layer.brightness = brightness;
      layer.contrast = contrast;

      // 保存图层引用
      this.layers.set(id, {
        id,
        name,
        title,
        type: 'wms',
        layer,
        imageryProvider,
      });

      return layer;
    } catch (error) {
      console.error(`❌ WMS 图层加载异常: ${title}`, error);
      return null;
    }
  }

  /**
   * 加载 WMTS 图层
   * @param {Object} viewer - Cesium Viewer 对象
   * @param {Object} layerConfig - 图层配置
   */
  loadWMTSLayer(viewer, layerConfig) {
    const {
      id,
      name,
      title,
      alpha = 1.0,
      brightness = 1.0,
      contrast = 1.0,
      style = 'default',
      tileMatrixSetID = 'EPSG:4326',
      format = 'image/png',
    } = layerConfig;

    console.log(`🗺️ 加载 WMTS 图层: ${title} (${name})`);

    try {
      // 创建 WMTS ImageryProvider
      const imageryProvider = new WebMapTileServiceImageryProvider({
        url: this.getServiceUrl('wmts'),
        layer: name,
        style: style,
        format: format,
        tileMatrixSetID: tileMatrixSetID,
        credit: new Credit(title),
        maximumLevel: 18,
      });

      // 监听就绪事件
      imageryProvider.readyPromise
        .then(() => {
          console.log(`✅ WMTS 图层就绪: ${title}`);
          console.log('  - 瓦片尺寸:', imageryProvider.tileWidth, 'x', imageryProvider.tileHeight);
        })
        .catch((error) => {
          console.error(`❌ WMTS 图层加载失败: ${title}`, error);
        });

      // 添加到地图
      const layer = viewer.imageryLayers.addImageryProvider(imageryProvider);
      layer.alpha = alpha;
      layer.brightness = brightness;
      layer.contrast = contrast;

      // 保存图层引用
      this.layers.set(id, {
        id,
        name,
        title,
        type: 'wmts',
        layer,
        imageryProvider,
      });

      return layer;
    } catch (error) {
      console.error(`❌ WMTS 图层加载异常: ${title}`, error);
      return null;
    }
  }

  /**
   * 显示/隐藏图层
   * @param {string} layerId - 图层 ID
   * @param {boolean} visible - 是否显示
   */
  setLayerVisible(layerId, visible) {
    const layerInfo = this.layers.get(layerId);
    if (layerInfo && layerInfo.layer) {
      layerInfo.layer.show = visible;
      console.log(`🔄 图层 ${layerInfo.title}: ${visible ? '显示' : '隐藏'}`);
    }
  }

  /**
   * 设置图层透明度
   * @param {string} layerId - 图层 ID
   * @param {number} alpha - 透明度 (0-1)
   */
  setLayerAlpha(layerId, alpha) {
    const layerInfo = this.layers.get(layerId);
    if (layerInfo && layerInfo.layer) {
      layerInfo.layer.alpha = alpha;
      console.log(`🎨 图层 ${layerInfo.title} 透明度: ${alpha}`);
    }
  }

  /**
   * 调整图层顺序
   * @param {Object} viewer - Cesium Viewer 对象
   * @param {string} layerId - 图层 ID
   * @param {number} index - 目标索引
   */
  moveLayerToIndex(viewer, layerId, index) {
    const layerInfo = this.layers.get(layerId);
    if (layerInfo && layerInfo.layer) {
      const currentIndex = viewer.imageryLayers.indexOf(layerInfo.layer);
      if (currentIndex !== -1) {
        viewer.imageryLayers.remove(layerInfo.layer, false);
        viewer.imageryLayers.add(layerInfo.layer, index);
        console.log(`🔀 图层 ${layerInfo.title} 移动到索引: ${index}`);
      }
    }
  }

  /**
   * 移除图层
   * @param {Object} viewer - Cesium Viewer 对象
   * @param {string} layerId - 图层 ID
   */
  removeLayer(viewer, layerId) {
    const layerInfo = this.layers.get(layerId);
    if (layerInfo && layerInfo.layer) {
      viewer.imageryLayers.remove(layerInfo.layer);
      this.layers.delete(layerId);
      console.log(`🗑️ 移除图层: ${layerInfo.title}`);
    }
  }

  /**
   * 获取所有图层
   */
  getAllLayers() {
    return Array.from(this.layers.values());
  }

  /**
   * 获取指定图层
   * @param {string} layerId - 图层 ID
   */
  getLayer(layerId) {
    return this.layers.get(layerId);
  }

  /**
   * 测试 GeoServer 连接
   */
  async testConnection() {
    console.log('🔍 测试 GeoServer 连接...');
    const url = `${this.getServiceUrl('wms')}?service=WMS&version=1.1.0&request=GetCapabilities`;
    
    try {
      const response = await fetch(url);
      if (response.ok) {
        const text = await response.text();
        console.log('✅ GeoServer 连接成功');
        return { success: true, data: text };
      } else {
        console.error('❌ GeoServer 连接失败:', response.status);
        return { success: false, error: response.statusText };
      }
    } catch (error) {
      console.error('❌ GeoServer 连接异常:', error);
      return { success: false, error: error.message };
    }
  }
}

// 导出单例
export const geoServerService = new GeoServerService();
export default GeoServerService;
```

---

## 🎨 第三阶段：在 Cesium 中集成

### 3.1 更新 threeCesium.js

**文件**: `src/views/big-screen/js/threeCesium.js`

在现有的导出中添加 GeoServer 相关函数：

```javascript
// 在文件末尾添加

/**
 * 加载 WMTS 服务
 * @param {Object} config - WMTS 配置
 */
function initWMTSService(config) {
  const {
    url,
    layer,
    style = 'default',
    format = 'image/png',
    tileMatrixSetID = 'EPSG:4326',
    alpha = 1.0,
    brightness = 1.0,
    contrast = 1.0,
    maximumLevel = 18,
    credit = "",
  } = config;

  if (!url || !layer) {
    console.error("url 和 layer 参数不能为空");
    return null;
  }

  try {
    console.log("🔧 正在加载 WMTS 服务...");
    console.log("📍 URL:", url);
    console.log("📊 图层:", layer);
    console.log("🎨 样式:", style);

    // 创建 WMTS ImageryProvider
    const imageryProvider = new WebMapTileServiceImageryProvider({
      url,
      layer,
      style,
      format,
      tileMatrixSetID,
      maximumLevel,
      credit: credit ? new Credit(credit) : undefined,
    });

    // 监听加载事件
    imageryProvider.readyPromise
      .then(() => {
        console.log("✅ WMTS ImageryProvider 已就绪");
        console.log("- 瓦片宽度:", imageryProvider.tileWidth);
        console.log("- 瓦片高度:", imageryProvider.tileHeight);
        console.log("- 最大层级:", imageryProvider.maximumLevel);
      })
      .catch((error) => {
        console.error("❌ WMTS ImageryProvider 加载失败:", error);
      });

    // 添加到图层并设置样式
    const imageryLayer = viewer.imageryLayers.addImageryProvider(imageryProvider);
    imageryLayer.alpha = alpha;
    imageryLayer.brightness = brightness;
    imageryLayer.contrast = contrast;

    console.log("✅ WMTS 图层加载成功:", layer);
    return imageryLayer;
  } catch (error) {
    console.error("❌ WMTS 图层加载失败:", error);
    return null;
  }
}

// 更新导出
export {
  // ... 现有导出
  initWMSService,    // 已有
  initWMTSService,   // 新增
  // ... 其他导出
};
```

---

## 💻 第四阶段：在页面中使用

### 4.1 简单使用方式（直接调用）

**文件**: `src/views/big-screen/index-page.vue`

```vue
<script setup>
import { onMounted } from 'vue';
import { 
  initCesium,
  viewerCesium,
  initWMSService,
  initWMTSService,
} from './js/threeCesium';

let wmsLayer = null;
let wmtsLayer = null;

onMounted(() => {
  // 初始化地图
  initCesium("cesiumContainer");
  
  // 延迟加载，确保 viewer 初始化完成
  setTimeout(() => {
    loadGeoServerLayers();
  }, 2000);
});

// 加载 GeoServer 图层
function loadGeoServerLayers() {
  const viewer = viewerCesium();
  
  // 1. 加载 WMS 图层
  wmsLayer = initWMSService({
    url: "/geoserver/YG/wms",
    layers: "YG:HSQ_XZQ_MAP_BUFFER",
    parameters: {
      transparent: true,
      format: "image/png",
      version: "1.1.0",
    },
    alpha: 0.8,
  });
  
  // 2. 加载 WMTS 图层（如果有）
  wmtsLayer = initWMTSService({
    url: "/geoserver/gwc/service/wmts",
    layer: "YG:base_layer",
    style: "default",
    format: "image/png",
    tileMatrixSetID: "EPSG:4326",
    alpha: 1.0,
  });
  
  console.log("GeoServer 图层加载完成");
}

// 控制图层显示/隐藏
function toggleWMSLayer() {
  if (wmsLayer) {
    wmsLayer.show = !wmsLayer.show;
  }
}

function toggleWMTSLayer() {
  if (wmtsLayer) {
    wmtsLayer.show = !wmtsLayer.show;
  }
}
</script>
```

### 4.2 高级使用方式（使用服务类）

```vue
<script setup>
import { onMounted, ref, reactive } from 'vue';
import { initCesium, viewerCesium } from './js/threeCesium';
import { geoServerService } from '@/services/geoserverService';
import { GEOSERVER_CONFIG } from '@/config/geoserver.config';

const layerList = ref([]);
const selectedLayers = reactive(new Set());

onMounted(async () => {
  // 初始化地图
  initCesium("cesiumContainer");
  
  // 测试连接
  const result = await geoServerService.testConnection();
  if (!result.success) {
    console.error('GeoServer 连接失败');
    return;
  }
  
  // 延迟加载
  setTimeout(() => {
    loadAllLayers();
  }, 2000);
});

// 加载所有配置的图层
function loadAllLayers() {
  const viewer = viewerCesium();
  const { layers } = GEOSERVER_CONFIG;
  
  // 加载 WMS 图层
  layers.wms.forEach(layerConfig => {
    if (layerConfig.visible) {
      geoServerService.loadWMSLayer(viewer, layerConfig);
      selectedLayers.add(layerConfig.id);
    }
  });
  
  // 加载 WMTS 图层
  layers.wmts.forEach(layerConfig => {
    if (layerConfig.visible) {
      geoServerService.loadWMTSLayer(viewer, layerConfig);
      selectedLayers.add(layerConfig.id);
    }
  });
  
  // 更新图层列表
  layerList.value = geoServerService.getAllLayers();
  console.log('所有图层加载完成:', layerList.value);
}

// 切换图层显示
function toggleLayer(layerId) {
  const isVisible = selectedLayers.has(layerId);
  geoServerService.setLayerVisible(layerId, !isVisible);
  
  if (isVisible) {
    selectedLayers.delete(layerId);
  } else {
    selectedLayers.add(layerId);
  }
}

// 调整图层透明度
function updateLayerAlpha(layerId, alpha) {
  geoServerService.setLayerAlpha(layerId, alpha);
}
</script>

<template>
  <div class="layer-control">
    <h3>图层控制</h3>
    <div v-for="layer in layerList" :key="layer.id" class="layer-item">
      <input 
        type="checkbox" 
        :checked="selectedLayers.has(layer.id)"
        @change="toggleLayer(layer.id)"
      />
      <span>{{ layer.title }}</span>
      <input 
        type="range" 
        min="0" 
        max="1" 
        step="0.1"
        :value="layer.layer.alpha"
        @input="e => updateLayerAlpha(layer.id, parseFloat(e.target.value))"
      />
    </div>
  </div>
</template>

<style scoped>
.layer-control {
  position: absolute;
  top: 100px;
  right: 20px;
  background: rgba(255, 255, 255, 0.9);
  padding: 15px;
  border-radius: 8px;
  min-width: 250px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.layer-item {
  margin: 10px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
```

---

## 📊 第五阶段：图层样式配置

### 5.1 在 GeoServer 中配置 SLD 样式

**创建 WMS 样式文件** (`hsq_buffer_style.sld`):

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

### 5.2 应用样式

```javascript
wmsLayer = initWMSService({
  url: "/geoserver/YG/wms",
  layers: "YG:HSQ_XZQ_MAP_BUFFER",
  parameters: {
    transparent: true,
    format: "image/png",
    styles: "buffer_style",  // 应用自定义样式
  },
  alpha: 0.8,
});
```

---

## 🚀 第六阶段：性能优化

### 6.1 启用瓦片缓存（GeoWebCache）

在 GeoServer 中为图层启用 GeoWebCache：

1. 登录 GeoServer 管理界面
2. 进入 "Tile Caching" → "Tile Layers"
3. 找到你的图层，点击 "Seed/Truncate"
4. 配置缓存级别和范围

### 6.2 使用 WMTS 替代 WMS

WMTS 性能更好，因为它使用预生成的瓦片：

```javascript
// 优先使用 WMTS
const layer = initWMTSService({
  url: "/geoserver/gwc/service/wmts",  // 使用 GeoWebCache
  layer: "YG:HSQ_XZQ_MAP_BUFFER",
  tileMatrixSetID: "EPSG:4326",
  format: "image/png",
});
```

### 6.3 控制加载的图层数量

```javascript
// 按需加载，不是一次性加载所有图层
function loadLayerOnDemand(layerId) {
  const layerConfig = GEOSERVER_CONFIG.layers.wms.find(l => l.id === layerId);
  if (layerConfig) {
    geoServerService.loadWMSLayer(viewerCesium(), layerConfig);
  }
}
```

---

## 🐛 第七阶段：调试和监控

### 7.1 创建调试工具

**文件**: `src/utils/geoserverDebug.js`

```javascript
export function debugGeoServerLayers(viewer) {
  console.log('\n========== GeoServer 图层调试信息 ==========');
  
  const layers = viewer.imageryLayers;
  console.log('图层总数:', layers.length);
  
  layers._layers.forEach((layer, index) => {
    console.log(`\n图层 ${index}:`);
    console.log('  显示:', layer.show);
    console.log('  透明度:', layer.alpha);
    console.log('  亮度:', layer.brightness);
    console.log('  对比度:', layer.contrast);
    console.log('  Provider:', layer.imageryProvider.constructor.name);
    
    if (layer.imageryProvider.layers) {
      console.log('  WMS 图层:', layer.imageryProvider.layers);
    }
    if (layer.imageryProvider.layer) {
      console.log('  WMTS 图层:', layer.imageryProvider.layer);
    }
  });
  
  console.log('\n===========================================\n');
}

// 在控制台使用
// import { debugGeoServerLayers } from '@/utils/geoserverDebug';
// debugGeoServerLayers(viewerCesium());
```

---

## ✅ 实施检查清单

### 准备阶段
- [ ] 确认 GeoServer 服务正常运行
- [ ] 确认图层已发布（WMS/WMTS）
- [ ] 配置 vue.config.js 代理
- [ ] 测试 GeoServer 连接

### 开发阶段
- [ ] 创建 geoserver.config.js 配置文件
- [ ] 创建 geoserverService.js 服务类
- [ ] 在 threeCesium.js 中添加 WMTS 支持
- [ ] 在页面中集成服务

### 测试阶段
- [ ] 测试 WMS 图层加载
- [ ] 测试 WMTS 图层加载
- [ ] 测试图层控制（显示/隐藏/透明度）
- [ ] 测试跨域问题
- [ ] 性能测试

### 优化阶段
- [ ] 启用 GeoWebCache
- [ ] 优化图层加载顺序
- [ ] 添加错误处理
- [ ] 添加加载动画

---

## 📝 使用示例

### 示例 1：加载单个 WMS 图层

```javascript
import { initWMSService } from './js/threeCesium';

const layer = initWMSService({
  url: "/geoserver/YG/wms",
  layers: "YG:HSQ_XZQ_MAP_BUFFER",
  parameters: {
    transparent: true,
    format: "image/png",
  },
  alpha: 0.8,
});
```

### 示例 2：加载多个图层并管理

```javascript
import { geoServerService } from '@/services/geoserverService';

// 加载多个图层
const layers = [
  { id: 'layer1', name: 'YG:layer1', title: '图层1', type: 'wms' },
  { id: 'layer2', name: 'YG:layer2', title: '图层2', type: 'wmts' },
];

layers.forEach(config => {
  if (config.type === 'wms') {
    geoServerService.loadWMSLayer(viewer, config);
  } else {
    geoServerService.loadWMTSLayer(viewer, config);
  }
});

// 控制图层
geoServerService.setLayerVisible('layer1', false);
geoServerService.setLayerAlpha('layer2', 0.5);
```

### 示例 3：动态切换底图

```javascript
let currentBaseMap = null;

function switchBaseMap(layerName) {
  // 移除当前底图
  if (currentBaseMap) {
    geoServerService.removeLayer(viewer, currentBaseMap);
  }
  
  // 加载新底图
  const config = {
    id: 'baseMap',
    name: layerName,
    title: '底图',
    type: 'wmts',
    alpha: 1.0,
  };
  
  currentBaseMap = 'baseMap';
  geoServerService.loadWMTSLayer(viewer, config);
}
```

---

## 🎯 总结

通过以上方案，你可以：

1. ✅ **统一管理** WMS 和 WMTS 服务
2. ✅ **解决跨域** 通过 Vue 代理
3. ✅ **灵活配置** 图层样式和参数
4. ✅ **动态控制** 图层显示、透明度、顺序
5. ✅ **性能优化** 使用 WMTS 和缓存
6. ✅ **易于调试** 详细的日志和调试工具

需要我帮你实现具体哪个部分？

