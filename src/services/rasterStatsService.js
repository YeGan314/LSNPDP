/**
 * 栅格数据统计服务
 * 用于统计WMS栅格图层中各级别值的占比
 * @author YG
 * @date 2025-12-03
 */

import { GEOSERVER_CONFIG } from '@/config/geoserver.config';

class RasterStatsService {
  constructor() {
    this.config = GEOSERVER_CONFIG;
  }

  /**
   * 获取GeoServer REST API基础URL
   * @returns {string}
   */
  getRestApiUrl() {
    const baseUrl = this.config.baseUrl;
    return `${baseUrl}/rest`;
  }

  /**
   * 方法1: 通过GeoServer REST API获取栅格统计信息
   * 适用于已发布的栅格图层
   * @param {string} layerName - 图层名称，如 'risk_2000'
   * @param {string} workspace - 工作空间名称，默认使用配置中的workspace
   * @returns {Promise<Object>} 统计结果
   */
  async getRasterStatsFromGeoServer(layerName, workspace = null) {
    const ws = workspace || this.config.workspace;
    const url = `${this.getRestApiUrl()}/workspaces/${ws}/coveragestores/${layerName}/coverages/${layerName}.json`;
    
    console.log(`📊 获取栅格图层统计信息: ${layerName}`);
    console.log(`🔗 请求URL: ${url}`);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // 如果GeoServer需要认证，添加以下配置
        // credentials: 'include',
        // headers: {
        //   'Authorization': 'Basic ' + btoa('admin:geoserver'),
        //   'Accept': 'application/json',
        // }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ 栅格图层信息获取成功:', data);
      
      return {
        success: true,
        data: data,
        layerInfo: this.parseLayerInfo(data)
      };
    } catch (error) {
      console.error('❌ 获取栅格统计失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 点在多边形内判断 (射线法)
   * @param {Object} point - 点坐标 {lon, lat}
   * @param {Array} polygon - 多边形顶点数组 [{lon, lat}, ...]
   * @returns {boolean}
   */
  isPointInPolygon(point, polygon) {
    let inside = false;
    const x = point.lon;
    const y = point.lat;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lon;
      const yi = polygon[i].lat;
      const xj = polygon[j].lon;
      const yj = polygon[j].lat;
      
      const intersect = ((yi > y) !== (yj > y)) &&
                       (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    
    return inside;
  }

  /**
   * 方法2: 通过WMS GetFeatureInfo采样统计 - 矩形区域
   * 在栅格范围内进行网格采样，统计各级别值的分布
   * @param {Object} viewer - Cesium Viewer对象
   * @param {string} layerName - 图层名称
   * @param {Object} bounds - 采样范围 {west, south, east, north}
   * @param {number} sampleSize - 采样点数量（每边）
   * @returns {Promise<Object>} 统计结果
   */
  async sampleRasterValues(viewer, layerName, bounds, sampleSize = 50) {
    console.log(`📊 开始栅格采样统计: ${layerName}`);
    console.log(`📍 采样范围:`, bounds);
    console.log(`🔢 采样密度: ${sampleSize}x${sampleSize} = ${sampleSize * sampleSize} 个点`);

    const { west, south, east, north } = bounds;
    const lonStep = (east - west) / sampleSize;
    const latStep = (north - south) / sampleSize;

    const valueCounts = new Map(); // 存储各级别值的数量
    let totalSamples = 0;
    let successSamples = 0;

    // 创建采样点网格
    const samplePromises = [];
    
    for (let i = 0; i < sampleSize; i++) {
      for (let j = 0; j < sampleSize; j++) {
        const lon = west + lonStep * (i + 0.5);
        const lat = south + latStep * (j + 0.5);
        
        samplePromises.push(
          this.getPixelValue(layerName, lon, lat)
            .then(value => {
              if (value !== null && value !== undefined) {
                successSamples++;
                const key = String(value);
                valueCounts.set(key, (valueCounts.get(key) || 0) + 1);
              }
              totalSamples++;
            })
            .catch(err => {
              console.warn(`采样点 (${lon.toFixed(4)}, ${lat.toFixed(4)}) 失败:`, err.message);
              totalSamples++;
            })
        );
      }
    }

    // 等待所有采样完成
    await Promise.all(samplePromises);

    console.log(`✅ 采样完成: ${successSamples}/${totalSamples} 个有效样本`);

    // 计算占比
    const statistics = this.calculatePercentages(valueCounts, successSamples);

    return {
      success: true,
      layerName,
      bounds,
      totalSamples,
      successSamples,
      statistics,
      valueCounts: Object.fromEntries(valueCounts)
    };
  }

  /**
   * 方法2B: 通过WMS GetFeatureInfo采样统计 - 多边形区域
   * 在多边形区域内进行网格采样，统计各级别值的分布
   * @param {string} layerName - 图层名称
   * @param {Array} polygon - 多边形顶点数组 [{lon, lat}, ...]
   * @param {number} interval - 采样间隔（度）
   * @param {Function} onProgress - 进度回调函数
   * @returns {Promise<Object>} 统计结果
   */
  async samplePolygonArea(layerName, polygon, interval = 0.01, onProgress = null) {
    console.log(`📊 开始多边形区域采样统计: ${layerName}`);
    console.log(`📍 多边形顶点数: ${polygon.length}`);
    
    // 计算多边形的边界框
    let minLon = Infinity, maxLon = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;
    
    polygon.forEach(p => {
      minLon = Math.min(minLon, p.lon);
      maxLon = Math.max(maxLon, p.lon);
      minLat = Math.min(minLat, p.lat);
      maxLat = Math.max(maxLat, p.lat);
    });

    console.log(`📦 多边形边界: [${minLon.toFixed(4)}, ${minLat.toFixed(4)}] - [${maxLon.toFixed(4)}, ${maxLat.toFixed(4)}]`);

    // 在边界框内生成网格点，然后过滤出多边形内的点
    const allPoints = [];
    for (let lon = minLon; lon <= maxLon; lon += interval) {
      for (let lat = minLat; lat <= maxLat; lat += interval) {
        const point = { lon, lat };
        if (this.isPointInPolygon(point, polygon)) {
          allPoints.push(point);
        }
      }
    }

    const total = allPoints.length;
    console.log(`🔢 多边形内采样点: ${total} 个`);

    if (total === 0) {
      throw new Error('多边形内没有采样点，请检查坐标或减小采样间隔');
    }

    const valueCounts = new Map();
    let successCount = 0;

    for (let i = 0; i < allPoints.length; i++) {
      const { lon, lat } = allPoints[i];
      
      try {
        const value = await this.getPixelValue(layerName, lon, lat);
        if (value !== null && value !== undefined) {
          valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
          successCount++;
        }
      } catch (error) {
        // 忽略单个点的错误
        console.warn(`采样点 (${lon.toFixed(4)}, ${lat.toFixed(4)}) 失败:`, error.message);
      }

      // 进度回调
      if (onProgress && (i % 10 === 0 || i === allPoints.length - 1)) {
        onProgress({
          current: i + 1,
          total: total,
          percent: Math.round(((i + 1) / total) * 100)
        });
      }
    }

    console.log(`✅ 采样完成: ${successCount}/${total} 个有效样本`);

    // 计算统计信息
    const statistics = this.calculatePercentages(valueCounts, successCount);

    return {
      success: true,
      layerName,
      polygon: polygon,
      bounds: { minLon, minLat, maxLon, maxLat },
      interval,
      totalSamples: total,
      successSamples: successCount,
      statistics,
      valueCounts: Object.fromEntries(valueCounts)
    };
  }

  /**
   * 获取指定坐标点的像素值
   * 使用WMS GetFeatureInfo请求
   * @param {string} layerName - 图层名称（可以是 "layer" 或 "workspace:layer"）
   * @param {number} lon - 经度
   * @param {number} lat - 纬度
   * @returns {Promise<number|null>} 像素值
   */
  async getPixelValue(layerName, lon, lat) {
    const ws = this.config.workspace;
    const wmsUrl = `${this.config.baseUrl}/${ws}/wms`;
    
    // 如果图层名称不包含工作空间前缀，自动添加
    const fullLayerName = layerName.includes(':') ? layerName : `${ws}:${layerName}`;
    
    // 构建GetFeatureInfo请求参数
    const params = new URLSearchParams({
      SERVICE: 'WMS',
      VERSION: '1.1.1',
      REQUEST: 'GetFeatureInfo',
      LAYERS: fullLayerName,
      QUERY_LAYERS: fullLayerName,
      STYLES: '',
      BBOX: `${lon - 0.001},${lat - 0.001},${lon + 0.001},${lat + 0.001}`,
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
      if (!response.ok) {
        const errorText = await response.text();
        console.error('WMS GetFeatureInfo错误:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('非JSON响应:', text);
        throw new Error('服务器返回非JSON格式数据');
      }

      const data = await response.json();
      
      // 解析返回的像素值
      if (data.features && data.features.length > 0) {
        const properties = data.features[0].properties;
        // 根据实际返回的字段名调整，可能是 'GRAY_INDEX', 'value', 'band_1' 等
        const value = properties.GRAY_INDEX || 
                     properties.value || 
                     properties.band_1 || 
                     properties['BAND_1'] ||
                     properties.gray_index ||
                     properties[Object.keys(properties)[0]];
        return value;
      }
      
      return null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 方法3: 使用Canvas采样（适用于已加载到Cesium的WMS图层）
   * 从渲染的图层中直接读取像素值
   * @param {Object} viewer - Cesium Viewer对象
   * @param {Object} layer - Cesium ImageryLayer对象
   * @param {Object} bounds - 采样范围
   * @param {number} sampleSize - 采样点数量
   * @returns {Promise<Object>} 统计结果
   */
  async sampleFromCanvas(viewer, layer, bounds, sampleSize = 100) {
    console.log(`📊 从Canvas采样统计`);
    
    // 注意: 这个方法需要等待图层完全加载并渲染
    // 实现较复杂，需要访问Cesium的内部渲染缓冲区
    
    return {
      success: false,
      error: '此方法需要进一步实现，建议使用方法1或方法2'
    };
  }

  /**
   * 计算各级别值的占比
   * @param {Map} valueCounts - 值计数Map
   * @param {number} total - 总样本数
   * @returns {Array} 统计结果数组
   */
  calculatePercentages(valueCounts, total) {
    const statistics = [];
    
    // 按值排序
    const sortedEntries = Array.from(valueCounts.entries()).sort((a, b) => {
      const numA = parseFloat(a[0]);
      const numB = parseFloat(b[0]);
      return numA - numB;
    });

    for (const [value, count] of sortedEntries) {
      const percentage = (count / total * 100).toFixed(2);
      statistics.push({
        value: parseFloat(value),
        count,
        percentage: parseFloat(percentage),
        percentageText: `${percentage}%`
      });
    }

    return statistics;
  }

  /**
   * 解析GeoServer返回的图层信息
   * @param {Object} data - GeoServer REST API返回的数据
   * @returns {Object} 解析后的图层信息
   */
  parseLayerInfo(data) {
    const coverage = data.coverage || {};
    
    return {
      name: coverage.name,
      title: coverage.title,
      abstract: coverage.abstract,
      nativeCRS: coverage.nativeCRS,
      nativeBoundingBox: coverage.nativeBoundingBox,
      latLonBoundingBox: coverage.latLonBoundingBox,
      dimensions: coverage.dimensions,
      grid: coverage.grid,
      supportedFormats: coverage.supportedFormats
    };
  }

  /**
   * 格式化统计结果为表格数据
   * @param {Array} statistics - 统计结果
   * @returns {Array} 表格数据
   */
  formatAsTableData(statistics) {
    return statistics.map((item, index) => ({
      序号: index + 1,
      级别值: item.value,
      数量: item.count,
      占比: item.percentageText
    }));
  }

  /**
   * 导出统计结果为CSV
   * @param {Array} statistics - 统计结果
   * @param {string} filename - 文件名
   */
  exportToCSV(statistics, filename = 'raster_statistics.csv') {
    const headers = ['级别值', '数量', '占比(%)'];
    const rows = statistics.map(item => [
      item.value,
      item.count,
      item.percentage
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    
    console.log(`📥 统计结果已导出: ${filename}`);
  }

  /**
   * 生成统计图表配置（用于ECharts）
   * @param {Array} statistics - 统计结果
   * @param {string} title - 图表标题
   * @returns {Object} ECharts配置对象
   */
  generateChartConfig(statistics, title = '栅格数据级别分布') {
    return {
      title: {
        text: title,
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [
        {
          name: '级别分布',
          type: 'pie',
          radius: '50%',
          data: statistics.map(item => ({
            name: `级别 ${item.value}`,
            value: item.count
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };
  }
}

// 导出单例
export const rasterStatsService = new RasterStatsService();
export default RasterStatsService;
