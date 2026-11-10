/**
 * 通过WMS GetFeatureInfo全图采样统计
 * 适用于已发布到GeoServer的图层
 */

const GEOSERVER_URL = 'http://localhost:3000/geoserver';  // 使用代理
const WORKSPACE = 'veg';
const LAYER_NAME = 'risk_shange_2000';
const PIXEL_AREA_M2 = 10000;  // 100m × 100m

// 图层范围（需要从GeoServer获取或手动设置）
const BOUNDS = {
  minLon: 112.5,  // 根据实际情况调整
  maxLon: 113.5,
  minLat: 28.5,
  maxLat: 29.5
};

// 采样策略：系统采样
// 如果栅格是100m×100m，在经纬度约0.001度的分辨率
// 可以设置采样间隔为0.001度，确保覆盖所有像素
const SAMPLE_INTERVAL = 0.001;  // 约100米

async function getPixelValue(lon, lat) {
  const fullLayerName = `${WORKSPACE}:${LAYER_NAME}`;
  const wmsUrl = `${GEOSERVER_URL}/${WORKSPACE}/wms`;
  
  const params = new URLSearchParams({
    SERVICE: 'WMS',
    VERSION: '1.1.1',
    REQUEST: 'GetFeatureInfo',
    LAYERS: fullLayerName,
    QUERY_LAYERS: fullLayerName,
    STYLES: '',
    BBOX: `${lon - 0.0005},${lat - 0.0005},${lon + 0.0005},${lat + 0.0005}`,
    WIDTH: '101',
    HEIGHT: '101',
    X: '50',
    Y: '50',
    INFO_FORMAT: 'application/json',
    SRS: 'EPSG:4326'
  });

  const url = `${wmsUrl}?${params.toString()}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const properties = data.features[0].properties;
      return properties.GRAY_INDEX || properties[Object.keys(properties)[0]];
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function fullAreaStatistics() {
  console.log('🚀 开始全图采样统计');
  console.log(`范围: [${BOUNDS.minLon}, ${BOUNDS.minLat}] - [${BOUNDS.maxLon}, ${BOUNDS.maxLat}]`);
  console.log(`采样间隔: ${SAMPLE_INTERVAL}度`);
  
  // 生成采样点
  const points = [];
  for (let lon = BOUNDS.minLon; lon <= BOUNDS.maxLon; lon += SAMPLE_INTERVAL) {
    for (let lat = BOUNDS.minLat; lat <= BOUNDS.maxLat; lat += SAMPLE_INTERVAL) {
      points.push({ lon, lat });
    }
  }
  
  console.log(`总采样点: ${points.length.toLocaleString()}`);
  console.log(`预计耗时: ${(points.length * 0.1 / 60).toFixed(1)} 分钟`);
  
  const valueCounts = new Map();
  let processed = 0;
  const startTime = Date.now();
  
  // 批量处理（并行10个请求）
  const batchSize = 10;
  for (let i = 0; i < points.length; i += batchSize) {
    const batch = points.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(p => getPixelValue(p.lon, p.lat))
    );
    
    results.forEach(value => {
      if (value !== null && value !== undefined) {
        valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
      }
    });
    
    processed += batch.length;
    
    // 进度显示
    if (processed % 100 === 0) {
      const progress = (processed / points.length * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      console.log(`进度: ${progress}% (${processed}/${points.length}) - 用时: ${elapsed}s`);
    }
  }
  
  // 计算面积
  console.log('\n' + '='.repeat(60));
  console.log('污染风险等级面积统计');
  console.log('='.repeat(60));
  
  const results = [];
  let totalArea = 0;
  
  for (let level = 1; level <= 5; level++) {
    const count = valueCounts.get(level) || 0;
    const area_m2 = count * PIXEL_AREA_M2;
    const area_km2 = area_m2 / 1_000_000;
    
    results.push({
      level,
      count,
      area_m2,
      area_km2
    });
    
    totalArea += area_m2;
    
    console.log(`风险等级 ${level}:`);
    console.log(`  采样点数: ${count.toLocaleString()}`);
    console.log(`  面积: ${area_m2.toLocaleString()} m² (${area_km2.toFixed(4)} km²)`);
  }
  
  console.log('='.repeat(60));
  console.log(`总面积: ${totalArea.toLocaleString()} m² (${(totalArea/1_000_000).toFixed(4)} km²)`);
  console.log(`总耗时: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
  
  return results;
}

// 注意：这个脚本需要在浏览器控制台或Node.js环境中运行
// 如果在浏览器中运行，需要先访问 http://localhost:3000/test-raster-stats.html
console.log('⚠️ 警告: 全图采样可能需要很长时间！');
console.log('建议先使用 Python GDAL 脚本进行精确统计');
console.log('或者在测试页面中使用小范围测试');
