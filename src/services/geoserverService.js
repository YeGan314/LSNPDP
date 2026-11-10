/**
 * GeoServer 服务管理类
 * 统一管理 WMS、WMTS 等服务的加载和控制
 * @author YG
 * @date 2025-11-13
 */

import { 
  WebMapServiceImageryProvider,
  WebMapTileServiceImageryProvider,
  Credit 
} from 'cesium';
import { GEOSERVER_CONFIG } from '@/config/geoserver.config';

class GeoServerService {
  constructor() {
    this.config = GEOSERVER_CONFIG;
    this.layers = new Map(); // 存储已加载的图层
  }

  /**
   * 获取完整的服务 URL
   * @param {string} serviceType - 服务类型: 'wms', 'wmts', 'wfs'
   * @returns {string} 完整的服务 URL
   */
  getServiceUrl(serviceType = 'wms') {
    const { baseUrl, workspace, endpoints } = this.config;
    return `${baseUrl}/${workspace}${endpoints[serviceType]}`;
  }

  /**
   * 加载 WMS 图层
   * @param {Object} viewer - Cesium Viewer 对象
   * @param {Object} layerConfig - 图层配置
   * @returns {Object|null} Cesium ImageryLayer 对象
   */
  loadWMSLayer(viewer, layerConfig) {
    const {
      id,
      name,
      title,
      alpha = 1.0,
      brightness = 1.0,
      contrast = 1.0,
      parameters = {}
    } = layerConfig;

    console.log(`🗺️ 加载 WMS 图层: ${title} (${name})`);

    try {
      // 合并默认参数和自定义参数
      const wmsParams = {
        ...this.config.defaults.wms,
        ...parameters,
      };

      // 创建 WMS ImageryProvider
      const imageryProvider = new WebMapServiceImageryProvider({
        url: this.getServiceUrl('wms'),
        layers: name,
        parameters: wmsParams,
        credit: new Credit(title),
        enablePickFeatures: false,
        getFeatureInfoFormats: [],
      });

      // 监听就绪事件
      imageryProvider.readyPromise
        .then(() => {
          console.log(`✅ WMS 图层就绪: ${title}`);
          console.log('  - 瓦片尺寸:', imageryProvider.tileWidth, 'x', imageryProvider.tileHeight);
          console.log('  - 最大级别:', imageryProvider.maximumLevel);
        })
        .catch((error) => {
          console.error(`❌ WMS 图层加载失败: ${title}`, error);
        });

      // 添加到地图
      const layer = viewer.imageryLayers.addImageryProvider(imageryProvider);
      layer.alpha = alpha;
      layer.brightness = brightness;
      layer.contrast = contrast;

      // 保存图层引用
      this.layers.set(id, {
        id,
        name,
        title,
        type: 'wms',
        layer,
        imageryProvider,
        config: layerConfig,
      });

      return layer;
    } catch (error) {
      console.error(`❌ WMS 图层加载异常: ${title}`, error);
      return null;
    }
  }

  /**
   * 加载 WMTS 图层
   * @param {Object} viewer - Cesium Viewer 对象
   * @param {Object} layerConfig - 图层配置
   * @returns {Object|null} Cesium ImageryLayer 对象
   */
  loadWMTSLayer(viewer, layerConfig) {
    const {
      id,
      name,
      title,
      alpha = 1.0,
      brightness = 1.0,
      contrast = 1.0,
      style = 'default',
      tileMatrixSetID = 'EPSG:4326',
      format = 'image/png',
      maximumLevel = 18,
    } = layerConfig;

    console.log(`🗺️ 加载 WMTS 图层: ${title} (${name})`);

    try {
      // 创建 WMTS ImageryProvider
      const imageryProvider = new WebMapTileServiceImageryProvider({
        url: this.getServiceUrl('wmts'),
        layer: name,
        style: style,
        format: format,
        tileMatrixSetID: tileMatrixSetID,
        credit: new Credit(title),
        maximumLevel: maximumLevel,
      });

      // 监听就绪事件
      imageryProvider.readyPromise
        .then(() => {
          console.log(`✅ WMTS 图层就绪: ${title}`);
          console.log('  - 瓦片尺寸:', imageryProvider.tileWidth, 'x', imageryProvider.tileHeight);
          console.log('  - 最大级别:', imageryProvider.maximumLevel);
        })
        .catch((error) => {
          console.error(`❌ WMTS 图层加载失败: ${title}`, error);
        });

      // 添加到地图
      const layer = viewer.imageryLayers.addImageryProvider(imageryProvider);
      layer.alpha = alpha;
      layer.brightness = brightness;
      layer.contrast = contrast;

      // 保存图层引用
      this.layers.set(id, {
        id,
        name,
        title,
        type: 'wmts',
        layer,
        imageryProvider,
        config: layerConfig,
      });

      return layer;
    } catch (error) {
      console.error(`❌ WMTS 图层加载异常: ${title}`, error);
      return null;
    }
  }

  /**
   * 显示/隐藏图层
   * @param {string} layerId - 图层 ID
   * @param {boolean} visible - 是否显示
   */
  setLayerVisible(layerId, visible) {
    const layerInfo = this.layers.get(layerId);
    if (layerInfo && layerInfo.layer) {
      layerInfo.layer.show = visible;
      console.log(`🔄 图层 ${layerInfo.title}: ${visible ? '显示' : '隐藏'}`);
      return true;
    }
    return false;
  }

  /**
   * 设置图层透明度
   * @param {string} layerId - 图层 ID
   * @param {number} alpha - 透明度 (0-1)
   */
  setLayerAlpha(layerId, alpha) {
    const layerInfo = this.layers.get(layerId);
    if (layerInfo && layerInfo.layer) {
      layerInfo.layer.alpha = Math.max(0, Math.min(1, alpha));
      console.log(`🎨 图层 ${layerInfo.title} 透明度: ${alpha}`);
      return true;
    }
    return false;
  }

  /**
   * 设置图层亮度
   * @param {string} layerId - 图层 ID
   * @param {number} brightness - 亮度 (0-2)
   */
  setLayerBrightness(layerId, brightness) {
    const layerInfo = this.layers.get(layerId);
    if (layerInfo && layerInfo.layer) {
      layerInfo.layer.brightness = brightness;
      return true;
    }
    return false;
  }

  /**
   * 设置图层对比度
   * @param {string} layerId - 图层 ID
   * @param {number} contrast - 对比度 (0-2)
   */
  setLayerContrast(layerId, contrast) {
    const layerInfo = this.layers.get(layerId);
    if (layerInfo && layerInfo.layer) {
      layerInfo.layer.contrast = contrast;
      return true;
    }
    return false;
  }

  /**
   * 移动图层到顶部
   * @param {Object} viewer - Cesium Viewer 对象
   * @param {string} layerId - 图层 ID
   */
  raiseLayerToTop(viewer, layerId) {
    const layerInfo = this.layers.get(layerId);
    if (layerInfo && layerInfo.layer) {
      viewer.imageryLayers.raiseToTop(layerInfo.layer);
      console.log(`⬆️ 图层 ${layerInfo.title} 移至顶部`);
      return true;
    }
    return false;
  }

  /**
   * 移动图层到底部
   * @param {Object} viewer - Cesium Viewer 对象
   * @param {string} layerId - 图层 ID
   */
  lowerLayerToBottom(viewer, layerId) {
    const layerInfo = this.layers.get(layerId);
    if (layerInfo && layerInfo.layer) {
      viewer.imageryLayers.lowerToBottom(layerInfo.layer);
      console.log(`⬇️ 图层 ${layerInfo.title} 移至底部`);
      return true;
    }
    return false;
  }

  /**
   * 移除图层
   * @param {Object} viewer - Cesium Viewer 对象
   * @param {string} layerId - 图层 ID
   */
  removeLayer(viewer, layerId) {
    const layerInfo = this.layers.get(layerId);
    if (layerInfo && layerInfo.layer) {
      viewer.imageryLayers.remove(layerInfo.layer);
      this.layers.delete(layerId);
      console.log(`🗑️ 移除图层: ${layerInfo.title}`);
      return true;
    }
    return false;
  }

  /**
   * 移除所有图层
   * @param {Object} viewer - Cesium Viewer 对象
   */
  removeAllLayers(viewer) {
    this.layers.forEach((layerInfo) => {
      viewer.imageryLayers.remove(layerInfo.layer);
    });
    this.layers.clear();
    console.log('🗑️ 已移除所有图层');
  }

  /**
   * 获取所有图层信息
   * @returns {Array} 图层信息数组
   */
  getAllLayers() {
    return Array.from(this.layers.values());
  }

  /**
   * 获取指定图层信息
   * @param {string} layerId - 图层 ID
   * @returns {Object|undefined} 图层信息
   */
  getLayer(layerId) {
    return this.layers.get(layerId);
  }

  /**
   * 检查图层是否已加载
   * @param {string} layerId - 图层 ID
   * @returns {boolean}
   */
  hasLayer(layerId) {
    return this.layers.has(layerId);
  }

  /**
   * 带重试的 fetch 请求
   * @param {string} url - 请求 URL
   * @param {Object} options - fetch 选项
   * @param {number} maxRetries - 最大重试次数
   * @returns {Promise<Response>}
   */
  async fetchWithRetry(url, options = {}, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 请求尝试 ${attempt}/${maxRetries}: ${url}`);
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000); // 15秒超时
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        
        clearTimeout(timeout);
        
        if (response.ok) {
          console.log(`✅ 请求成功 (尝试 ${attempt}/${maxRetries})`);
          return response;
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ 请求失败 (尝试 ${attempt}/${maxRetries}):`, error.message);
        
        if (attempt < maxRetries) {
          // 指数退避: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000;
          console.log(`⏳ ${delay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * 测试 GeoServer 连接
   * @returns {Promise<Object>} 测试结果
   */
  async testConnection() {
    console.log('🔍 测试 GeoServer 连接...');
    const url = `${this.getServiceUrl('wms')}?service=WMS&version=1.1.0&request=GetCapabilities`;
    
    try {
      const response = await this.fetchWithRetry(url, {}, 3);
      const text = await response.text();
      console.log('✅ GeoServer 连接成功');
      
      // 解析可用图层
      const layerMatches = text.match(/<Name>([^<]+)<\/Name>/g);
      const availableLayers = layerMatches 
        ? layerMatches.map(match => match.replace(/<\/?Name>/g, ''))
        : [];
      
      return { 
        success: true, 
        data: text,
        layers: availableLayers 
      };
    } catch (error) {
      console.error('❌ GeoServer 连接失败:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * 获取图层的 GetCapabilities 信息
   * @param {string} serviceType - 服务类型: 'wms' 或 'wmts'
   * @returns {Promise<Object>}
   */
  async getCapabilities(serviceType = 'wms') {
    const url = `${this.getServiceUrl(serviceType)}?service=${serviceType.toUpperCase()}&version=1.1.0&request=GetCapabilities`;
    
    try {
      const response = await this.fetchWithRetry(url, {}, 3);
      const text = await response.text();
      return { success: true, data: text };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// 导出单例
export const geoServerService = new GeoServerService();
export default GeoServerService;

