# WMS "Expected longitude" 错误排查指南

## 🐛 错误信息

```
DeveloperError {
  name: 'DeveloperError', 
  message: 'Expected longitude to be typeof number, actual typeof was undefined'
}
```

---

## 🔍 错误原因分析

### 可能的原因

#### 1. GeoServer 图层缺少边界框（BoundingBox）信息

**最常见原因**！Cesium 的 `WebMapServiceImageryProvider` 需要从 GetCapabilities 响应中读取图层的边界框信息。

**检查方法：**
访问：`http://localhost:你的端口/test-wms-getcapabilities.html`

查看 XML 中是否包含：
```xml
<Layer>
  <Name>YG:HSQ_XZQ_MAP_BUFFER</Name>
  <LatLonBoundingBox minx="..." miny="..." maxx="..." maxy="..." />
  <!-- 或 -->
  <BoundingBox SRS="EPSG:4326" minx="..." miny="..." maxx="..." maxy="..." />
</Layer>
```

#### 2. GetCapabilities 响应异常

服务器返回了错误的 XML 或者没有正确配置图层。

#### 3. 坐标系统配置问题

图层只发布了特定坐标系（如 EPSG:4490），但没有包含 EPSG:4326。

---

## ✅ 解决方案

### 方案 1: 在 GeoServer 中配置图层边界框（推荐）

**步骤：**

1. **登录 GeoServer 管理界面**
   ```
   http://8.140.227.53:8080/geoserver/web/
   ```

2. **编辑图层**
   - 进入 "Layers"（图层）
   - 找到 `HSQ_XZQ_MAP_BUFFER`
   - 点击图层名称进入编辑

3. **设置边界框**
   - 找到 "Bounding Boxes" 部分
   - 点击 "Compute from data" 按钮
   - 或手动输入边界框坐标：
     ```
     Native Bounding Box (原生边界框):
     Min X: 112.60473851374479
     Min Y: 28.497291740158655
     Max X: 112.6169023176589
     Max Y: 28.504644274803756
     
     Lat/Lon Bounding Box (经纬度边界框):
     Min Lon: 112.60473851374479
     Min Lat: 28.497291740158655
     Max Lon: 112.6169023176589
     Max Lat: 28.504644274803756
     ```

4. **添加 EPSG:4326 坐标系**
   - 在 "Declared SRS" 中确保包含 `EPSG:4326`
   - 勾选 "SRS handling": Force declared

5. **保存并应用**

### 方案 2: 在 Cesium 中手动指定 Rectangle（临时方案）

修改 `initWMSService` 函数，手动指定边界框：

```javascript
// src/views/big-screen/js/threeCesium.js

import { Rectangle } from 'cesium';

function initWMSService(config) {
  // ... 现有代码
  
  // 创建 WMS ImageryProvider
  const providerOptions = {
    url,
    layers,
    parameters: defaultParameters,
    enablePickFeatures: false,
    // ✅ 新增：手动指定边界框（如果 GeoServer 没有提供）
    rectangle: Rectangle.fromDegrees(
      112.60473851374479,  // west (西经)
      28.497291740158655,  // south (南纬)
      112.6169023176589,   // east (东经)
      28.504644274803756   // north (北纬)
    ),
  };
  
  // ... 其余代码
}
```

### 方案 3: 使用 TiledWMS（性能更好）

如果 GeoServer 配置了 GeoWebCache，使用 WMTS 替代 WMS：

```javascript
// 使用 WMTS 替代 WMS
hsqBufferLayer = initWMTSService({
  url: "/geoserver/gwc/service/wmts",
  layer: "YG:HSQ_XZQ_MAP_BUFFER",
  style: "default",
  format: "image/png",
  tileMatrixSetID: "EPSG:4326",
  alpha: 0.8,
});
```

---

## 🔧 立即修复

我现在就为你实现**方案 2**（手动指定 Rectangle），这样可以立即解决问题：

### 修改 initWMSService 函数

**文件**: `src/views/big-screen/js/threeCesium.js`

在导入部分添加 Rectangle：
```javascript
import {
  // ... 现有导入
  Rectangle,  // 添加这行
} from "cesium";
```

然后修改函数：
```javascript
function initWMSService(config) {
  // ... 现有代码 ...
  
  const providerOptions = {
    url,
    layers,
    parameters: defaultParameters,
    enablePickFeatures: false,
    // 手动指定边界框（基于你提供的 bbox）
    rectangle: Rectangle.fromDegrees(
      112.60473851374479,   // west
      28.497291740158655,   // south  
      112.6169023176589,    // east
      28.504644274803756    // north
    ),
  };
  
  // ... 其余代码
}
```

---

## 🧪 诊断步骤

### 1. 访问测试页面

打开浏览器访问：
```
http://localhost:你的端口/test-wms-getcapabilities.html
```

### 2. 检查 GetCapabilities 响应

查看是否包含 BoundingBox 信息：
- ✅ 有 BoundingBox → GeoServer 配置正确
- ❌ 无 BoundingBox → 需要在 GeoServer 中配置

### 3. 查看控制台详细日志

勾选"赫山实验区域"后，查看：
```
准备调用 initWMSService，参数: {...}
ImageryProvider 配置: {...}
```

检查配置中是否包含有效的边界框信息。

---

## 📊 完整的修复代码

让我为你准备完整的修复代码...

