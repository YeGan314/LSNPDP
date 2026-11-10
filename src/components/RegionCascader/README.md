# 行政区级联选择组件

一个功能完整的五级行政区（省-市-县-乡镇-村）级联选择组件，支持动态加载、搜索、缓存等功能。

## 功能特性

### ✨ 核心功能

1. **五级行政区选择**
   - 省级（一级）
   - 市级（二级）
   - 县级（三级）
   - 乡镇级（四级）
   - 村级（五级）

2. **级联加载**
   - 选择上级后自动加载下级数据
   - 避免一次性加载大量数据
   - 提升用户体验

3. **搜索功能**
   - 每个级别都支持关键词搜索
   - 实时过滤结果
   - 不区分大小写

4. **面包屑导航**
   - 显示完整的选择路径
   - 清晰的层级反馈
   - 便于查看当前选择

5. **重置功能**
   - 一键清除所有选择
   - 快速返回初始状态

6. **数据缓存**
   - 自动缓存已加载的数据
   - 避免重复请求
   - 提升加载速度

7. **加载提示**
   - 加载动画
   - 空数据提示
   - 友好的用户反馈

8. **响应式设计**
   - 支持各种屏幕尺寸
   - 移动端友好
   - 自适应布局

## 使用方法

### 基础使用

```vue
<template>
  <div>
    <RegionCascader 
      @change="handleChange" 
      @complete="handleComplete" 
    />
  </div>
</template>

<script setup>
import RegionCascader from '@/components/RegionCascader/index.vue';

// 选择变化时触发（每次选择都会触发）
const handleChange = (selection) => {
  console.log('当前选择:', selection);
  // selection 包含: { province, city, county, town, village }
};

// 选择完成时触发（选择到村级时触发）
const handleComplete = (selection) => {
  console.log('选择完成:', selection);
  console.log('完整路径:', selection.path); // ['云南省', '昆明市', '官渡区', ...]
};
</script>
```

### 高级用法

#### 1. 设置初始值

```vue
<template>
  <RegionCascader :initial-value="initialRegion" />
</template>

<script setup>
import { ref } from 'vue';

const initialRegion = ref({
  province: { code: '530000', name: '云南省' },
  city: { code: '530100', name: '昆明市' },
  // ... 其他级别
});
</script>
```

#### 2. 获取选择结果

```javascript
// change 事件返回的数据结构
{
  province: { code: '530000', name: '云南省' },
  city: { code: '530100', name: '昆明市' },
  county: { code: '530102', name: '五华区' },
  town: { code: '530102001', name: '中心镇' },
  village: { code: '530102001001', name: '中心村' }
}

// complete 事件返回的数据结构（包含路径）
{
  province: { code: '530000', name: '云南省' },
  city: { code: '530100', name: '昆明市' },
  county: { code: '530102', name: '五华区' },
  town: { code: '530102001', name: '中心镇' },
  village: { code: '530102001001', name: '中心村' },
  path: ['云南省', '昆明市', '五华区', '中心镇', '中心村']
}
```

## API 接口对接

### 当前实现

组件当前使用模拟数据，数据接口定义在 `/src/api/region.js` 文件中。

### 接入真实 API

要接入真实的后端 API，请修改 `/src/api/region.js` 文件：

```javascript
// 示例：接入真实API
import request from '@/utils/request';

export const getProvinces = () => {
  return request.get('/api/region/provinces');
};

export const getCities = (provinceCode) => {
  return request.get(`/api/region/cities/${provinceCode}`);
};

export const getCounties = (cityCode) => {
  return request.get(`/api/region/counties/${cityCode}`);
};

export const getTowns = (countyCode) => {
  return request.get(`/api/region/towns/${countyCode}`);
};

export const getVillages = (townCode) => {
  return request.get(`/api/region/villages/${townCode}`);
};
```

### API 数据格式要求

所有接口都应返回以下格式的数组：

```javascript
[
  {
    code: '530000',  // 行政区代码（必需）
    name: '云南省'   // 行政区名称（必需）
  },
  // ... 更多项
]
```

## 样式自定义

### 修改主题色

组件使用科技蓝色主题，您可以通过修改组件的 CSS 变量来自定义颜色：

```vue
<style>
.region-cascader-container {
  /* 主色调 */
  --primary-color: #00d4ff;
  --primary-color-hover: rgba(0, 212, 255, 0.3);
  
  /* 背景色 */
  --bg-color: rgba(0, 30, 60, 0.6);
  --dropdown-bg: rgba(0, 20, 40, 0.95);
  
  /* 边框色 */
  --border-color: rgba(0, 120, 255, 0.3);
  --border-color-active: #00d4ff;
}
</style>
```

### 自定义尺寸

```vue
<style>
.region-cascader-container .select-input {
  height: 40px;  /* 默认 32px */
  font-size: 14px;  /* 默认 13px */
}

.region-cascader-container .select-item {
  min-width: 160px;  /* 默认 140px */
}
</style>
```

## 组件事件

| 事件名 | 说明 | 参数 |
|--------|------|------|
| change | 每次选择变化时触发 | selection: Object |
| complete | 选择到村级时触发 | selection: Object (包含 path) |

## Props

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| initialValue | 初始选中的行政区 | Object | {} |

## 性能优化建议

1. **数据缓存**
   - 组件内置了数据缓存机制
   - 已加载的数据会自动缓存
   - 无需额外配置

2. **懒加载**
   - 组件默认使用级联加载
   - 只加载当前需要的数据
   - 减少初始加载时间

3. **搜索优化**
   - 搜索功能使用客户端过滤
   - 不会触发额外的 API 请求
   - 响应速度快

## 常见问题

### Q: 如何修改默认显示的级别数？

A: 组件默认支持5级，如果您只需要3级（省-市-县），可以在选择到县级后直接使用结果，无需修改组件代码。

### Q: 如何实现多选功能？

A: 当前组件是单选模式，如需多选，建议：
1. 复制组件创建多选版本
2. 将单选逻辑改为数组存储
3. 添加复选框界面元素

### Q: 如何与地图联动？

A: 在 `change` 或 `complete` 事件中获取选择的行政区代码，然后：
1. 根据代码获取地理坐标
2. 更新地图中心点和缩放级别
3. 在地图上显示选中区域的边界

示例：
```javascript
const handleRegionChange = (selection) => {
  if (selection.city) {
    // 根据城市代码更新地图
    updateMapCenter(selection.city.code);
  }
};
```

### Q: 数据加载失败如何处理？

A: 组件内部已经包含错误处理：
1. 错误会输出到控制台
2. 界面显示"暂无数据"
3. 建议在 API 层添加统一的错误提示

## 技术栈

- Vue 3 Composition API
- CSS3 动画
- 响应式布局
- 异步数据加载

## 浏览器兼容性

- Chrome (推荐)
- Firefox
- Safari
- Edge
- 移动端浏览器

## 后续扩展建议

1. **添加收藏功能**
   - 保存常用的行政区选择
   - 快速访问

2. **历史记录**
   - 记录最近的选择
   - 快速重新选择

3. **批量选择**
   - 支持多个行政区同时选择
   - 导入导出功能

4. **地图集成**
   - 显示行政区边界
   - 可视化选择

5. **数据统计**
   - 显示各行政区的统计数据
   - 辅助决策

## 维护说明

- 组件路径: `/src/components/RegionCascader/index.vue`
- API 路径: `/src/api/region.js`
- 使用示例: `/src/views/navigation_page/index-page.vue`

## 更新日志

### v1.0.0 (2025-11-18)
- 初始版本发布
- 支持五级行政区选择
- 实现级联加载
- 添加搜索功能
- 实现数据缓存
- 响应式设计

