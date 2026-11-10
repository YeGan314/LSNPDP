/**
 * GeoServer 服务配置
 * @author YG
 * @date 2025-11-13
 */

export const GEOSERVER_CONFIG = {
  // 基础 URL 配置
  // 开发环境使用代理路径（避免跨域），生产环境直连
  baseUrl: process.env.NODE_ENV === 'production' 
    ? (process.env.VUE_APP_GEOSERVER_BASE_URL || 'http://localhost:8080/geoserver')
    : '/geoserver',
  
  // 工作空间
  workspace: 'LSNPDP',
  
  // 服务端点
  endpoints: {
    wms: '/wms',
    wmts: '/gwc/service/wmts',
    wfs: '/wfs',
  },
  
  // 默认参数配置
  defaults: {
    wms: {
      version: '1.1.0',
      format: 'image/png',
      transparent: true,
      tiled: true,
    },
    wmts: {
      version: '1.0.0',
      format: 'image/png',
      style: 'default',
      tileMatrixSetID: 'EPSG:4326',
      maximumLevel: 18,
    }
  },
  
  // 图层组配置
  layerGroups: [
    {
      id: 'base_layers',
      title: '底图图层',
      layers: ['base_map'],
      exclusive: true, // 同一时间只能显示一个
    },
    {
      id: 'overlay_layers',
      title: '叠加图层',
      layers: ['xzq_buffer'],
      exclusive: false,
    }
  ]
};

export default GEOSERVER_CONFIG;

