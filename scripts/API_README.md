# 栅格统计分析 REST API 文档

## 📋 目录

- [快速开始](#快速开始)
- [API端点](#api端点)
- [请求示例](#请求示例)
- [在Vue项目中使用](#在vue项目中使用)
- [错误处理](#错误处理)

## 🚀 快速开始

### 1. 安装依赖

```bash
pip install flask flask-cors rasterio numpy shapely
```

### 2. 启动服务

```bash
cd /Volumes/YG_M2_DATA/code/GQWR/scripts  # 根据你的项目路径调整
python3 raster_stats_api.py
```

服务将在 `http://localhost:5001` 启动

### 3. 测试服务

```bash
# 健康检查
curl http://localhost:5001/api/health

# 或运行测试客户端
python f:\code\GQWR\scripts\test_api_client.py
```

## 📡 API端点

### 1. 健康检查

**GET** `/api/health`

**响应示例:**
```json
{
  "status": "ok",
  "service": "Raster Statistics API",
  "version": "1.0.0"
}
```

---

### 2. 矩形范围统计

**POST** `/api/stats/bounds`

**请求参数:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| bounds | Object | 是 | 矩形范围 |
| bounds.minLon | Number | 是 | 最小经度 |
| bounds.maxLon | Number | 是 | 最大经度 |
| bounds.minLat | Number | 是 | 最小纬度 |
| bounds.maxLat | Number | 是 | 最大纬度 |
| tif_path | String | 否 | TIF文件路径（默认使用配置路径） |
| pixel_size_m | Number | 否 | 格网大小（米，默认100） |

**请求示例:**
```json
{
  "bounds": {
    "minLon": 112.5,
    "maxLon": 113.0,
    "minLat": 28.5,
    "maxLat": 29.0
  },
  "pixel_size_m": 100
}
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "bounds": {
      "minLon": 112.5,
      "maxLon": 113.0,
      "minLat": 28.5,
      "maxLat": 29.0
    },
    "pixel_size_m": 100,
    "total_pixels": 123456,
    "valid_pixels": 123456,
    "total_area_m2": 1234560000.0,
    "total_area_km2": 1234.56,
    "total_area_hectare": 123456.0,
    "risk_levels": [
      {
        "level": 1,
        "pixel_count": 15000,
        "area_m2": 150000000.0,
        "area_km2": 150.0,
        "area_hectare": 15000.0,
        "percentage": 12.16
      },
      {
        "level": 2,
        "pixel_count": 30000,
        "area_m2": 300000000.0,
        "area_km2": 300.0,
        "area_hectare": 30000.0,
        "percentage": 24.31
      }
    ]
  }
}
```

---

### 3. 多边形范围统计

**POST** `/api/stats/polygon`

**请求参数:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| coordinates | Array | 是 | 多边形坐标数组 [[lon, lat], ...] |
| tif_path | String | 否 | TIF文件路径 |
| pixel_size_m | Number | 否 | 格网大小（米，默认100） |

**请求示例:**
```json
{
  "coordinates": [
    [112.957, 28.874],
    [112.954, 28.871],
    [112.952, 28.868],
    [112.950, 28.866],
    [112.957, 28.874]
  ],
  "pixel_size_m": 100
}
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "polygon": {
      "vertices": 5,
      "bounds": [112.950, 28.866, 112.957, 28.874]
    },
    "pixel_size_m": 100,
    "total_pixels": 5678,
    "valid_pixels": 5678,
    "total_area_m2": 56780000.0,
    "total_area_km2": 56.78,
    "total_area_hectare": 5678.0,
    "risk_levels": [...]
  }
}
```

---

### 4. 批量统计

**POST** `/api/stats/batch`

**请求参数:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ranges | Array | 是 | 范围数组 |
| ranges[].name | String | 是 | 范围名称 |
| ranges[].type | String | 是 | 类型: "bounds" 或 "polygon" |
| ranges[].bounds | Object | 条件 | type为bounds时必填 |
| ranges[].coordinates | Array | 条件 | type为polygon时必填 |
| tif_path | String | 否 | TIF文件路径 |
| pixel_size_m | Number | 否 | 格网大小（米） |

**请求示例:**
```json
{
  "pixel_size_m": 100,
  "ranges": [
    {
      "name": "区域A",
      "type": "bounds",
      "bounds": {
        "minLon": 112.5,
        "maxLon": 113.0,
        "minLat": 28.5,
        "maxLat": 29.0
      }
    },
    {
      "name": "北洲河",
      "type": "polygon",
      "coordinates": [
        [112.957, 28.874],
        [112.954, 28.871],
        [112.952, 28.868],
        [112.957, 28.874]
      ]
    }
  ]
}
```

**响应示例:**
```json
{
  "success": true,
  "results": {
    "区域A": {
      "success": true,
      "data": {...}
    },
    "北洲河": {
      "success": true,
      "data": {...}
    }
  }
}
```

## 💻 请求示例

### cURL

```bash
# 矩形范围统计
curl -X POST http://localhost:5001/api/stats/bounds \
  -H "Content-Type: application/json" \
  -d '{
    "bounds": {
      "minLon": 112.5,
      "maxLon": 113.0,
      "minLat": 28.5,
      "maxLat": 29.0
    },
    "pixel_size_m": 100
  }'
```

### Python

```python
import requests

# 矩形范围统计
response = requests.post(
    'http://localhost:5001/api/stats/bounds',
    json={
        'bounds': {
            'minLon': 112.5,
            'maxLon': 113.0,
            'minLat': 28.5,
            'maxLat': 29.0
        },
        'pixel_size_m': 100
    }
)

result = response.json()
if result['success']:
    print(f"总面积: {result['data']['total_area_km2']} km²")
    for level in result['data']['risk_levels']:
        print(f"等级 {level['level']}: {level['percentage']}%")
```

### JavaScript (Fetch)

```javascript
// 矩形范围统计
const response = await fetch('http://localhost:5001/api/stats/bounds', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    bounds: {
      minLon: 112.5,
      maxLon: 113.0,
      minLat: 28.5,
      maxLat: 29.0
    },
    pixel_size_m: 100
  })
});

const result = await response.json();
if (result.success) {
  console.log('总面积:', result.data.total_area_km2, 'km²');
  result.data.risk_levels.forEach(level => {
    console.log(`等级 ${level.level}: ${level.percentage}%`);
  });
}
```

## 🎨 在Vue项目中使用

### 1. 导入服务

```javascript
import rasterStatsApi from '@/services/rasterStatsApiService';
```

### 2. 矩形范围统计

```javascript
async analyzeArea() {
  try {
    const bounds = {
      minLon: 112.5,
      maxLon: 113.0,
      minLat: 28.5,
      maxLat: 29.0
    };
    
    const result = await rasterStatsApi.analyzeByBounds(bounds, null, 100);
    
    if (result.success) {
      console.log('统计结果:', result.data);
      this.statsData = result.data;
      
      // 格式化为表格数据
      this.tableData = rasterStatsApi.formatStatsForTable(result.data);
      
      // 生成报告
      const report = rasterStatsApi.generateReport(result.data);
      console.log(report);
    }
  } catch (error) {
    console.error('统计失败:', error);
    this.$message.error('统计分析失败');
  }
}
```

### 3. 多边形范围统计

```javascript
async analyzePolygon() {
  try {
    // 从 geo.js 的 positions 转换为 coordinates
    const positions = [
      112.957262992859, 28.874103168171,
      112.954859733582, 28.871397356238,
      112.952284812927, 28.868616309441,
      // ...
    ];
    
    const coordinates = rasterStatsApi.positionsToCoordinates(positions);
    
    const result = await rasterStatsApi.analyzeByPolygon(coordinates, null, 100);
    
    if (result.success) {
      console.log('多边形统计结果:', result.data);
      this.statsData = result.data;
    }
  } catch (error) {
    console.error('统计失败:', error);
  }
}
```

### 4. 批量统计

```javascript
async analyzeBatch() {
  try {
    const ranges = [
      {
        name: '赫山区',
        type: 'bounds',
        bounds: {
          minLon: 112.5,
          maxLon: 113.0,
          minLat: 28.5,
          maxLat: 29.0
        }
      },
      {
        name: '资阳区',
        type: 'bounds',
        bounds: {
          minLon: 113.0,
          maxLon: 113.5,
          minLat: 28.5,
          maxLat: 29.0
        }
      }
    ];
    
    const result = await rasterStatsApi.analyzeBatch(ranges, null, 100);
    
    if (result.success) {
      Object.entries(result.results).forEach(([name, stats]) => {
        if (stats.success) {
          console.log(`${name}: ${stats.data.total_area_km2} km²`);
        }
      });
    }
  } catch (error) {
    console.error('批量统计失败:', error);
  }
}
```

## ⚠️ 错误处理

### 错误响应格式

```json
{
  "success": false,
  "error": "错误信息",
  "traceback": "详细堆栈信息（仅开发模式）"
}
```

### 常见错误

| 状态码 | 错误 | 说明 |
|--------|------|------|
| 400 | Bad Request | 请求参数错误 |
| 404 | Not Found | TIF文件不存在 |
| 500 | Internal Server Error | 服务器内部错误 |

### 错误处理示例

```javascript
try {
  const result = await rasterStatsApi.analyzeByBounds(bounds);
  
  if (!result.success) {
    console.error('统计失败:', result.error);
    // 处理业务错误
  }
} catch (error) {
  if (error.message.includes('fetch')) {
    console.error('网络错误，请检查API服务是否启动');
  } else {
    console.error('未知错误:', error);
  }
}
```

## 🔧 配置

### 修改默认配置

编辑 `raster_stats_api.py`:

```python
# 默认TIF文件路径（基于项目根目录 geodata）
DEFAULT_TIF_PATH = os.path.join(PROJECT_ROOT, "geodata", "risk_shange_2000.tif")

# 默认格网大小（米）
DEFAULT_PIXEL_SIZE = 100

# 服务端口
app.run(host='0.0.0.0', port=5001, debug=True)
```

### 修改API地址

编辑 `rasterStatsApiService.js`:

```javascript
const API_BASE_URL = 'http://localhost:5001/api';
// 或生产环境
// const API_BASE_URL = 'http://your-server:5001/api';
```

## 📝 注意事项

1. **格网大小**: `pixel_size_m` 参数影响面积计算，确保与实际栅格分辨率匹配
2. **多边形闭合**: 多边形坐标数组会自动闭合，无需手动添加首尾相同的点
3. **坐标顺序**: 坐标格式为 `[经度, 纬度]`
4. **性能**: 大范围统计可能耗时较长，建议使用合适的范围
5. **CORS**: API已启用CORS，支持跨域请求

## 🚀 部署到生产环境

### 使用Gunicorn

```bash
pip install gunicorn

gunicorn -w 4 -b 0.0.0.0:5000 raster_stats_api:app
```

### 使用Nginx反向代理

```nginx
location /api {
    proxy_pass http://localhost:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## 📞 支持

如有问题，请查看日志或联系开发团队。
