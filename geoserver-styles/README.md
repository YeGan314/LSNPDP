# GeoServer 省级行政区划样式文件

## 文件列表

### 1. china_provinces.sld（棕色经典版）
- **配色**: 棕色系，仿照图片中的样式
- **边界**: 深棕色，2px 宽度
- **标注**: 黑色文字 + 白色光晕（半径 3px）
- **适用场景**: 地理信息展示、历史地图风格

### 2. china_provinces_clean.sld（清爽简洁版）
- **配色**: 浅灰色半透明填充
- **边界**: 深灰色，2.5px 宽度
- **标注**: 深灰色文字 + 白色光晕（半径 4px）
- **适用场景**: 现代化界面、数据可视化背景

### 3. china_provinces_colorful.sld（彩色分区版）
- **配色**: 每个省份不同颜色（按地理区域分组）
- **边界**: 各省独立配色，2px 宽度
- **标注**: 黑色文字 + 白色光晕（半径 3px）
- **适用场景**: 区域对比、专题地图

## 使用方法

### 方法一：通过 GeoServer Web 界面上传

1. 登录 GeoServer 管理界面
   ```
   http://8.140.227.53:8080/geoserver/web
   用户名: admin
   密码: geoserver
   ```

2. 进入 **Styles** 页面
   - 左侧菜单：Data → Styles

3. 点击 **Add a new style**

4. 填写样式信息：
   - **Name**: `china_provinces`（或其他名称）
   - **Workspace**: 选择你的工作空间（如 `veg`）
   - **Format**: 选择 `SLD`

5. 上传 SLD 文件：
   - 点击 **Choose File** 按钮
   - 选择对应的 `.sld` 文件
   - 点击 **Upload** 按钮

6. 点击 **Validate** 验证语法

7. 点击 **Submit** 保存

### 方法二：通过 REST API 上传

```bash
# 上传 SLD 样式文件
curl -u admin:geoserver -X POST \
  -H "Content-Type: application/vnd.ogc.sld+xml" \
  -d @china_provinces.sld \
  "http://8.140.227.53:8080/geoserver/rest/styles?name=china_provinces"
```

### 方法三：直接复制到 GeoServer 数据目录

```bash
# 将 SLD 文件复制到 GeoServer 样式目录
cp china_provinces.sld /path/to/geoserver/data_dir/styles/
```

## 应用样式到图层

### 通过 Web 界面

1. 进入 **Layers** 页面
   - 左侧菜单：Data → Layers

2. 找到你的省级行政区图层，点击图层名称

3. 切换到 **Publishing** 标签

4. 在 **Default Style** 下拉框中选择刚才创建的样式
   - 例如：`china_provinces`

5. 点击 **Save** 保存

### 通过 REST API

```bash
# 设置图层的默认样式
curl -u admin:geoserver -X PUT \
  -H "Content-Type: text/xml" \
  -d "<layer><defaultStyle><name>china_provinces</name></defaultStyle></layer>" \
  "http://8.140.227.53:8080/geoserver/rest/layers/veg:provinces"
```

## 样式参数说明

### 关键参数

| 参数 | 说明 | 示例值 |
|------|------|--------|
| `fill` | 填充颜色 | `#A67C52` |
| `fill-opacity` | 填充透明度 | `0.85` (0-1) |
| `stroke` | 边界线颜色 | `#654321` |
| `stroke-width` | 边界线宽度 | `2` (像素) |
| `font-size` | 字体大小 | `16` (像素) |
| `font-weight` | 字体粗细 | `bold` |
| `Halo Radius` | 光晕半径 | `3` (像素) |
| `Halo Fill` | 光晕颜色 | `#FFFFFF` |

### 文字标注字段

确保你的数据表中有以下字段：
- `name` 或 `xzq_name` - 省份名称（如"湖南省"）
- `code` 或 `xzq_code` - 行政区代码（如"430000"）

如果字段名不同，需要修改 SLD 文件中的：
```xml
<ogc:PropertyName>name</ogc:PropertyName>
```
改为你的实际字段名，例如：
```xml
<ogc:PropertyName>xzq_name</ogc:PropertyName>
```

## 自定义样式

### 修改填充颜色

在 `<Fill>` 标签中修改：
```xml
<Fill>
  <CssParameter name="fill">#YOUR_COLOR</CssParameter>
  <CssParameter name="fill-opacity">0.85</CssParameter>
</Fill>
```

### 修改边界线样式

在 `<Stroke>` 标签中修改：
```xml
<Stroke>
  <CssParameter name="stroke">#YOUR_COLOR</CssParameter>
  <CssParameter name="stroke-width">2</CssParameter>
  <CssParameter name="stroke-opacity">1.0</CssParameter>
</Stroke>
```

### 修改文字标注

在 `<TextSymbolizer>` 标签中修改：
```xml
<Font>
  <CssParameter name="font-family">Microsoft YaHei</CssParameter>
  <CssParameter name="font-size">16</CssParameter>
  <CssParameter name="font-weight">bold</CssParameter>
</Font>
```

### 修改白色掩膜（光晕）

在 `<Halo>` 标签中修改：
```xml
<Halo>
  <Radius>3</Radius>
  <Fill>
    <CssParameter name="fill">#FFFFFF</CssParameter>
    <CssParameter name="fill-opacity">0.9</CssParameter>
  </Fill>
</Halo>
```

## 常见问题

### 1. 标注不显示？

**原因**: 字段名不匹配
**解决**: 检查并修改 `<ogc:PropertyName>` 中的字段名

### 2. 中文显示乱码？

**原因**: 字体不支持中文
**解决**: 确保 GeoServer 服务器安装了中文字体（如微软雅黑、黑体）

### 3. 边界线不清晰？

**原因**: 线宽太细或颜色对比度不够
**解决**: 增加 `stroke-width` 值，或使用更深的颜色

### 4. 标注重叠？

**原因**: 标注冲突检测未启用
**解决**: 调整 `VendorOption` 参数：
```xml
<VendorOption name="conflictResolution">true</VendorOption>
<VendorOption name="spaceAround">10</VendorOption>
```

## 预览效果

上传样式后，可以通过以下方式预览：

1. **Layer Preview** 页面
   - 左侧菜单：Data → Layer Preview
   - 找到你的图层，点击 **OpenLayers** 预览

2. **WMS GetMap 请求**
   ```
   http://8.140.227.53:8080/geoserver/veg/wms?
     service=WMS&
     version=1.1.0&
     request=GetMap&
     layers=veg:provinces&
     styles=china_provinces&
     bbox=73,18,135,54&
     width=800&
     height=600&
     srs=EPSG:4326&
     format=image/png
   ```

## 技术支持

如需进一步自定义样式，请参考：
- [GeoServer SLD 官方文档](https://docs.geoserver.org/stable/en/user/styling/sld/index.html)
- [OGC SLD 规范](https://www.ogc.org/standards/sld)

## 版本信息

- **创建日期**: 2025-12-06
- **GeoServer 版本**: 2.x+
- **SLD 版本**: 1.0.0

## 本地流域边界样式

`lybj-transparent-highlight.sld` 已发布到本机 GeoServer 的 `LSNPDP:lybj` 默认样式。内部填充透明，边界使用 8 像素半透明青色外描边叠加 3.5 像素亮青色主线。
