# 栅格分析功能集成指南

## 📦 已创建的组件

```
src/views/big-screen/compoments/raster-analysis/
├── RasterAnalysisPanel.vue      # 右侧分析面板
├── RasterAnalysisToolbar.vue    # 顶部工具栏
├── DistrictSelector.vue         # 行政区选择器
├── BarChart.vue                 # 柱状图组件
├── PieChart.vue                 # 饼图组件
└── index.js                     # 模块导出

src/services/
├── rasterStatsApiService.js     # API调用服务
└── districtDataService.js       # 行政区数据服务
```

## 🔧 集成步骤

### 步骤1: 在 index-page.vue 中导入组件

在 `<script setup>` 部分添加导入：

```javascript
// 在现有import语句后添加
import { RasterAnalysisPanel, RasterAnalysisToolbar } from "./compoments/raster-analysis";
import rasterStatsApi from "@/services/rasterStatsApiService";
import districtDataService from "@/services/districtDataService";
```

### 步骤2: 添加响应式数据

在 `<script setup>` 中添加：

```javascript
// 栅格分析相关状态
const rasterAnalysisVisible = ref(false);  // 分析面板显示状态
const rasterAnalysisLoading = ref(false);  // 分析加载状态
const rasterAnalysisData = ref(null);      // 分析结果数据
const rasterAnalysisRegion = ref('全图');  // 当前分析区域名称
const currentDistrictEntity = ref(null);   // 当前高亮的行政区实体
```

### 步骤3: 添加分析方法

```javascript
/**
 * 处理栅格分析
 */
const handleRasterAnalyze = async ({ layer, district }) => {
  try {
    rasterAnalysisLoading.value = true;
    rasterAnalysisVisible.value = true;
    
    console.log('开始栅格分析:', { layer, district });
    
    // 移除之前的高亮
    if (currentDistrictEntity.value) {
      districtDataService.removeHighlight(viewer);
      currentDistrictEntity.value = null;
    }
    
    let result;
    
    if (district) {
      // 行政区分析
      rasterAnalysisRegion.value = district.name;
      
      // 高亮显示行政区
      currentDistrictEntity.value = districtDataService.highlightDistrict(
        viewer,
        district.positions,
        {
          fillColor: Cesium.Color.CYAN.withAlpha(0.2),
          outlineColor: Cesium.Color.CYAN.withAlpha(0.8),
          outlineWidth: 3
        }
      );
      
      // 转换坐标格式
      const coordinates = districtDataService.positionsToCoordinates(district.positions);
      
      // 调用API分析
      result = await rasterStatsApi.analyzeByPolygon(
        coordinates,
        layer.tifPath,
        100  // 格网大小100米
      );
    } else {
      // 全图分析
      rasterAnalysisRegion.value = '全图';
      
      // 使用完整TIF文件路径
      // 注意：这里需要调用全图统计的Python脚本
      // 暂时使用一个大范围的bounds来模拟全图
      const fullBounds = {
        minLon: 110.94,
        maxLon: 114.32,
        minLat: 24.61,
        maxLat: 29.01
      };
      
      result = await rasterStatsApi.analyzeByBounds(
        fullBounds,
        layer.tifPath,
        100
      );
    }
    
    if (result.success) {
      rasterAnalysisData.value = result.data;
      console.log('分析成功:', result.data);
    } else {
      throw new Error(result.error || '分析失败');
    }
    
  } catch (error) {
    console.error('栅格分析失败:', error);
    ElMessage.error(`分析失败: ${error.message}`);
    rasterAnalysisVisible.value = false;
  } finally {
    rasterAnalysisLoading.value = false;
  }
};

/**
 * 关闭分析面板
 */
const handleCloseAnalysisPanel = () => {
  rasterAnalysisVisible.value = false;
  
  // 移除高亮
  if (currentDistrictEntity.value) {
    districtDataService.removeHighlight(viewer);
    currentDistrictEntity.value = null;
  }
};

/**
 * 图层变化处理
 */
const handleLayerChange = (layer) => {
  console.log('切换图层:', layer);
  // 可以在这里做一些图层切换的处理
};

/**
 * 行政区变化处理
 */
const handleDistrictChange = (district) => {
  console.log('选择行政区:', district);
  
  // 移除之前的高亮
  if (currentDistrictEntity.value) {
    districtDataService.removeHighlight(viewer);
    currentDistrictEntity.value = null;
  }
  
  if (district) {
    // 高亮新选择的行政区
    currentDistrictEntity.value = districtDataService.highlightDistrict(
      viewer,
      district.positions
    );
  }
};
```

### 步骤4: 在模板中添加组件

在 `<template>` 中添加（建议放在 `<div id="cesiumContainer"></div>` 之前）：

```vue
<template>
  <Hearder></Hearder>
  <div class="container-integrate">
    <!-- 现有组件... -->
    <YeWu1 v-if="yeWuKey == 1"></YeWu1>
    <YeWu2 v-if="yeWuKey == 2"></YeWu2>
    <YeWu3 v-if="yeWuKey == 3"></YeWu3>
    <TopBtn @clicks="topBtnbtnClick" :list="headBarList"></TopBtn>
    <BottomBtn @btnClick="BottomBtnbtnClick" :yeWuKey="yeWuKey"></BottomBtn>
    <MapSwitcher></MapSwitcher>
    <LayerPanel></LayerPanel>
    
    <!-- 🆕 栅格分析工具栏 -->
    <div class="raster-analysis-toolbar-container">
      <RasterAnalysisToolbar
        :analyzing="rasterAnalysisLoading"
        @analyze="handleRasterAnalyze"
        @layer-change="handleLayerChange"
        @district-change="handleDistrictChange"
      />
    </div>
    
    <!-- 🆕 栅格分析面板 -->
    <RasterAnalysisPanel
      :visible="rasterAnalysisVisible"
      :loading="rasterAnalysisLoading"
      :analysis-data="rasterAnalysisData"
      :region-name="rasterAnalysisRegion"
      @update:visible="rasterAnalysisVisible = $event"
      @close="handleCloseAnalysisPanel"
    />
    
    <div id="cesiumContainer"></div>
    <!-- 其他组件... -->
  </div>
</template>
```

### 步骤5: 添加样式

在 `<style>` 中添加：

```scss
<style scoped lang="scss">
// 现有样式...

// 🆕 栅格分析工具栏容器
.raster-analysis-toolbar-container {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  pointer-events: none;
  
  > * {
    pointer-events: auto;
  }
}
</style>
```

## 🚀 启动Python API服务

在使用栅格分析功能前，需要先启动Python API服务：

```bash
# 1. 确保已安装依赖
pip install flask flask-cors rasterio numpy shapely

# 2. 启动API服务
python f:\code\GQWR\scripts\raster_stats_api.py
```

服务将在 `http://localhost:5000` 启动。

## 📝 使用流程

### 全图分析

1. 在工具栏选择"风险等级图层 (2000)"
2. 不选择行政区（保持为空）
3. 点击"开始分析"按钮
4. 等待分析完成
5. 右侧弹出分析面板，展示结果

### 行政区分析

1. 在工具栏选择"风险等级图层 (2000)"
2. 在"分析范围"下拉框中选择"赫山区实验区域"
3. 地图会自动定位并高亮该行政区
4. 点击"开始分析"按钮
5. 等待分析完成
6. 右侧弹出分析面板，展示该行政区的统计结果

## 🎨 界面效果

- **工具栏**: 顶部居中显示，半透明深蓝色背景，带模糊效果
- **分析面板**: 右侧滑入，宽度450px，深蓝色渐变背景
- **图表**: ECharts柱状图和饼图，带动画效果
- **高亮**: 选中行政区时，边界会以青色高亮显示

## ⚠️ 注意事项

1. **API服务**: 必须先启动Python API服务才能使用分析功能
2. **TIF路径**: 当前写死为 `f:/code/GQWR/geodata/risk_shange_2000.tif`
3. **行政区数据**: 目前只有"赫山区实验区域"，可在 `districtDataService.js` 中添加更多
4. **全图分析**: 目前使用bounds模拟，后续可优化为直接读取完整TIF
5. **格网大小**: 固定为100米，与TIF数据的实际分辨率一致

## 🔧 后续优化建议

1. **动态TIF路径**: 从图层配置中读取，而不是写死
2. **更多行政区**: 添加更多行政区数据
3. **缓存结果**: 缓存分析结果，避免重复计算
4. **导出功能**: 完善PDF导出功能
5. **对比分析**: 支持多个行政区的对比分析

## 📞 测试

完成集成后，可以：

1. 访问 `http://localhost:3000`
2. 查看顶部是否出现栅格分析工具栏
3. 选择图层和行政区
4. 点击"开始分析"测试功能

如有问题，检查：
- Python API服务是否启动
- 浏览器控制台是否有错误
- Network标签中API请求是否成功
