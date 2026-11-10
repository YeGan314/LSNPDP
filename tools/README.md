# SHP 转坐标数组工具

将 Shapefile (SHP) 格式的地理数据转换为 JavaScript 坐标数组格式，用于 `geo.js` 文件。

## 方法一：Python 脚本（推荐）

### 安装依赖

```bash
pip install geopandas shapely
```

### 使用方法

```bash
# 基本用法（输出到控制台）
python shp_to_coords.py input.shp

# 输出到文件
python shp_to_coords.py input.shp -o output.js

# 指定变量名
python shp_to_coords.py input.shp -o output.js --name ListGuanQu

# 指定几何类型（可选：auto, Polygon, LineString, Point）
python shp_to_coords.py input.shp -o output.js --type Polygon
```

### 示例

```bash
# 转换灌区多边形数据
python shp_to_coords.py guanqu.shp -o guanqu_coords.js --name ListGuanQu

# 转换渠道线数据
python shp_to_coords.py qudao.shp -o qudao_coords.js --name ListQuDao --type LineString
```

## 方法二：Node.js 脚本

### 安装依赖

```bash
npm install shapefile
```

### 使用方法

```bash
# 基本用法
node shp_to_coords.js input.shp

# 输出到文件
node shp_to_coords.js input.shp output.js

# 指定变量名
node shp_to_coords.js input.shp output.js --name ListGuanQu
```

## 方法三：使用 QGIS + 在线工具

### 步骤

1. **在 QGIS 中打开 SHP 文件**
   - 打开 QGIS
   - 图层 → 添加图层 → 添加矢量图层
   - 选择你的 `.shp` 文件

2. **导出为 GeoJSON**
   - 右键图层 → 导出 → 另存为
   - 格式选择 `GeoJSON`
   - 保存文件

3. **使用在线转换工具或脚本**
   - 可以使用项目中的 `GeoJsonLocaToPositionsCesium` 函数
   - 或使用在线 GeoJSON 转坐标工具

## 方法四：使用在线工具

### 推荐工具

1. **Mapshaper** (https://mapshaper.org/)
   - 上传 SHP 文件
   - 导出为 GeoJSON
   - 然后转换为坐标数组

2. **ogr2ogr** (命令行工具)
   ```bash
   # 安装 GDAL
   # Windows: 下载 OSGeo4W
   # Mac: brew install gdal
   # Linux: sudo apt-get install gdal-bin
   
   # 转换为 GeoJSON
   ogr2ogr -f GeoJSON output.geojson input.shp
   ```

## 输出格式说明

### 单个要素（多边形/线）

```javascript
const ListGuanQu = [
  112.94469046, 29.02115674, 112.93865385, 29.0181246, 112.9369291, 29.00700599,
  112.92629317, 28.99108405, 112.91393248, 28.98779827, 112.90732095, 28.9850179,
  // ... 更多坐标
];
```

### 多个要素（对象数组）

```javascript
const ListQuDao = [
  {
    name: "二斗",
    positions: [
      112.949838638306, 28.990836824196, 112.939968109131, 28.978185767119,
      112.939968109131, 28.966546929982,
    ],
    type: "渠道",
  },
  // ... 更多要素
];
```

## 注意事项

1. **坐标系**: 脚本会自动将坐标系转换为 WGS84 (EPSG:4326)，确保输出的是经纬度坐标
2. **坐标顺序**: 输出格式为 `[经度, 纬度, 经度, 纬度, ...]`
3. **多边形**: 对于多边形，只提取外环坐标，不包含内环（洞）
4. **精度**: 默认保留坐标的原始精度，如需调整可在脚本中修改

## 常见问题

### Q: 转换后的坐标顺序不对？
A: 检查原始 SHP 文件的坐标系，脚本会自动转换为 WGS84。

### Q: 多边形有洞怎么办？
A: 当前脚本只提取外环坐标。如需处理内环，需要修改脚本逻辑。

### Q: 如何批量转换多个 SHP 文件？
A: 可以编写批处理脚本：

```bash
# Windows
for %f in (*.shp) do python shp_to_coords.py "%f" -o "%~nf.js"

# Linux/Mac
for f in *.shp; do python shp_to_coords.py "$f" -o "${f%.shp}.js"; done
```

