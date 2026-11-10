/**
 * 通过GeoServer REST API获取栅格统计信息
 */

const GEOSERVER_URL = 'http://8.146.208.20/geoserver';
const WORKSPACE = 'veg';
const LAYER_NAME = 'risk_shange_2000';

// 像素面积（100米 × 100米）
const PIXEL_AREA_M2 = 10000;

async function getLayerStats() {
  try {
    // 1. 获取图层信息
    const url = `${GEOSERVER_URL}/rest/workspaces/${WORKSPACE}/coveragestores/${LAYER_NAME}/coverages/${LAYER_NAME}.json`;
    
    console.log('请求URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        // 如果需要认证，添加：
        // 'Authorization': 'Basic ' + btoa('admin:geoserver')
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('图层信息:', JSON.stringify(data, null, 2));
    
    // 2. 获取栅格尺寸
    const grid = data.coverage.grid;
    const dimensions = grid.dimension;
    
    console.log('\n栅格尺寸:');
    dimensions.forEach(dim => {
      console.log(`  ${dim.name}: ${dim.range.min} - ${dim.range.max}`);
    });
    
    // 3. 获取边界范围
    const bbox = data.coverage.latLonBoundingBox;
    console.log('\n边界范围:');
    console.log(`  经度: ${bbox.minx} - ${bbox.maxx}`);
    console.log(`  纬度: ${bbox.miny} - ${bbox.maxy}`);
    
    return data;
    
  } catch (error) {
    console.error('获取图层信息失败:', error);
    throw error;
  }
}

async function sampleAndCalculate() {
  console.log('⚠️ 注意: GeoServer REST API不直接提供像素值统计');
  console.log('建议使用以下方法之一:');
  console.log('1. Python GDAL脚本（最快）');
  console.log('2. WMS GetFeatureInfo采样（适合小范围）');
  console.log('3. 下载TIF文件本地分析');
}

// 执行
getLayerStats().then(() => {
  sampleAndCalculate();
});
