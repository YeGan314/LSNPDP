/**
 * WMS图例辅助工具
 * @author YG
 * @date 2025-12-04
 */

/**
 * 获取Cesium viewer中当前最上层的WMS图层
 * @param {Object} viewer - Cesium viewer实例
 * @returns {Object|null} 返回包含图层信息的对象，如果没有WMS图层则返回null
 */
export function getTopWmsLayer(viewer) {
  if (!viewer) {
    console.warn('⚠️ Cesium viewer 未初始化');
    return null;
  }

  const imageryLayers = viewer.imageryLayers;
  const layerCount = imageryLayers.length;
  
  // 从最上层开始遍历（索引从大到小）
  // Cesium的图层顺序：索引越大，图层越在上面
  for (let i = layerCount - 1; i >= 0; i--) {
    const imageryLayer = imageryLayers.get(i);
    const provider = imageryLayer.imageryProvider;
    
    // 检查是否是WMS图层
    // WebMapServiceImageryProvider是Cesium中WMS服务的提供者类
    if (
      provider &&
      provider.constructor.name === 'WebMapServiceImageryProvider' &&
      imageryLayer.show !== false &&
      imageryLayer.alpha !== 0
    ) {
      return {
        imageryLayer: imageryLayer,
        provider: provider,
        index: i,
        layers: provider.layers,
        url: provider.url,
        alpha: imageryLayer.alpha,
        show: imageryLayer.show
      };
    }
  }
  
  console.warn('⚠️ 未找到WMS图层');
  return null;
}

/**
 * 获取所有WMS图层（从上到下排序）
 * @param {Object} viewer - Cesium viewer实例
 * @returns {Array} WMS图层数组
 */
export function getAllWmsLayers(viewer) {
  if (!viewer) {
    console.warn('⚠️ Cesium viewer 未初始化');
    return [];
  }

  const imageryLayers = viewer.imageryLayers;
  const layerCount = imageryLayers.length;
  const wmsLayers = [];
  
  // 从最上层开始遍历
  for (let i = layerCount - 1; i >= 0; i--) {
    const imageryLayer = imageryLayers.get(i);
    const provider = imageryLayer.imageryProvider;
    
    if (
      provider &&
      provider.constructor.name === 'WebMapServiceImageryProvider' &&
      imageryLayer.show !== false &&
      imageryLayer.alpha !== 0
    ) {
      wmsLayers.push({
        imageryLayer: imageryLayer,
        provider: provider,
        index: i,
        layers: provider.layers,
        url: provider.url,
        alpha: imageryLayer.alpha,
        show: imageryLayer.show
      });
    }
  }
  
  return wmsLayers;
}

/**
 * 构建WMS GetLegendGraphic请求URL
 * @param {string} baseUrl - WMS服务基础URL
 * @param {string} layers - 图层名称（可以是单个图层或多个图层，用逗号分隔）
 * @param {Object} options - 可选参数
 * @param {string} options.format - 图例格式，默认'image/png'
 * @param {number} options.width - 图例符号宽度，默认20
 * @param {number} options.height - 图例符号高度，默认20
 * @param {string} options.fontName - 字体名称，默认'Microsoft YaHei'
 * @param {number} options.fontSize - 字体大小，默认14
 * @param {string} options.fontColor - 字体颜色（十六进制），默认'0xFFFFFF'（白色）
 * @param {string} options.bgColor - 背景颜色（十六进制），默认'0x1a1a1a'（深灰）
 * @param {number} options.dpi - DPI设置，默认96
 * @returns {string} GetLegendGraphic请求URL
 */
export function buildLegendGraphicUrl(baseUrl, layers, options = {}) {
  // 确保URL不以/结尾
  const cleanUrl = baseUrl.replace(/\/$/, '');
  
  // 默认选项
  const defaultOptions = {
    format: 'image/png',
    width: 20,
    height: 20,
    fontName: 'Microsoft YaHei',
    fontSize: 14,
    fontColor: '0xFFFFFF',
    bgColor: '0x1a1a1a',
    dpi: 96
  };
  
  const opts = { ...defaultOptions, ...options };
  
  // 构建LEGEND_OPTIONS字符串
  const legendOptions = [
    `fontName:${opts.fontName}`,
    `fontSize:${opts.fontSize}`,
    'fontAntiAliasing:true',
    `fontColor:${opts.fontColor}`,
    `bgColor:${opts.bgColor}`,
    `dpi:${opts.dpi}`
  ].join(';');
  
  // 构建GetLegendGraphic参数
  const params = new URLSearchParams({
    SERVICE: 'WMS',
    VERSION: '1.1.0',
    REQUEST: 'GetLegendGraphic',
    LAYER: layers,
    FORMAT: opts.format,
    WIDTH: opts.width.toString(),
    HEIGHT: opts.height.toString(),
    LEGEND_OPTIONS: legendOptions
  });
  
  return `${cleanUrl}?${params.toString()}`;
}

/**
 * 获取当前最上层WMS图层的图例URL
 * @param {Object} viewer - Cesium viewer实例
 * @param {Object} options - 图例选项（同buildLegendGraphicUrl的options参数）
 * @returns {Object|null} 返回包含图层名称和图例URL的对象
 */
export function getTopWmsLayerLegend(viewer, options = {}) {
  const topLayer = getTopWmsLayer(viewer);
  
  if (!topLayer) {
    return null;
  }
  
  const legendUrl = buildLegendGraphicUrl(topLayer.url, topLayer.layers, options);
  
  return {
    layerName: topLayer.layers,
    legendUrl: legendUrl,
    imageryLayer: topLayer.imageryLayer,
    index: topLayer.index
  };
}

/**
 * 获取所有WMS图层的图例URL
 * @param {Object} viewer - Cesium viewer实例
 * @param {Object} options - 图例选项
 * @returns {Array} 包含所有WMS图层图例信息的数组
 */
export function getAllWmsLayerLegends(viewer, options = {}) {
  const wmsLayers = getAllWmsLayers(viewer);
  
  return wmsLayers.map(layer => ({
    layerName: layer.layers,
    legendUrl: buildLegendGraphicUrl(layer.url, layer.layers, options),
    imageryLayer: layer.imageryLayer,
    index: layer.index
  }));
}

/**
 * 在控制台打印当前所有WMS图层信息（用于调试）
 * @param {Object} viewer - Cesium viewer实例
 */
export function debugWmsLayers(viewer) {
  const wmsLayers = getAllWmsLayers(viewer);
  
  console.log('========== WMS图层信息 ==========');
  console.log(`共找到 ${wmsLayers.length} 个WMS图层`);
  
  wmsLayers.forEach((layer, idx) => {
    console.log(`\n图层 ${idx + 1}:`);
    console.log('  - 名称:', layer.layers);
    console.log('  - URL:', layer.url);
    console.log('  - 索引:', layer.index);
    console.log('  - 透明度:', layer.alpha);
    console.log('  - 可见性:', layer.show);
    console.log('  - 图例URL:', buildLegendGraphicUrl(layer.url, layer.layers));
  });
  
  console.log('================================');
}

// 默认导出
export default {
  getTopWmsLayer,
  getAllWmsLayers,
  buildLegendGraphicUrl,
  getTopWmsLayerLegend,
  getAllWmsLayerLegends,
  debugWmsLayers
};
