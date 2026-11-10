/**
 * GeoServer 服务信息获取工具
 * @author YG
 * @date 2025-11-27
 */

import { GEOSERVER_CONFIG } from '@/config/geoserver.config';

// 使用配置文件中的地址
const GEOSERVER_BASE = GEOSERVER_CONFIG.baseUrl;

// 需要关注的工作空间列表（按优先级排序）
const PRIORITY_WORKSPACES = ['LSNPDP', 'GSWR', 'Basic_Services', 'xwrw', 'veg', 'YG', 'ne', 'topp', 'tiger', 'sf', 'nurc', 'cite', 'it.geosolutions', 'sde'];

// 缓存已发现的工作空间
let cachedWorkspaces = null;

/**
 * 自动获取 GeoServer 所有工作空间
 * @returns {Promise<Array<string>>} 工作空间名称列表
 */
export async function fetchWorkspaces() {
  if (cachedWorkspaces) {
    return cachedWorkspaces;
  }
  
  try {
    // 方法1: 通过 REST API 获取工作空间列表
    const restUrl = `${GEOSERVER_BASE}/rest/workspaces.json`;
    console.log('🔍 尝试获取工作空间列表:', restUrl);
    
    const response = await fetch(restUrl);
    if (response.ok) {
      const data = await response.json();
      if (data.workspaces?.workspace) {
        cachedWorkspaces = data.workspaces.workspace.map(ws => ws.name);
        console.log('✅ 发现工作空间:', cachedWorkspaces);
        return cachedWorkspaces;
      }
    }
  } catch (error) {
    console.warn('⚠️ REST API 获取工作空间失败，尝试从 WMS 解析:', error.message);
  }
  
  try {
    // 方法2: 从全局 WMS GetCapabilities 解析工作空间
    const wmsUrl = `${GEOSERVER_BASE}/wms?service=WMS&version=1.1.0&request=GetCapabilities`;
    const response = await fetch(wmsUrl);
    if (response.ok) {
      const text = await response.text();
      const workspaces = new Set();
      
      // 从图层名称中提取工作空间
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, 'text/xml');
      const layerNodes = xml.querySelectorAll('Layer > Layer > Name');
      
      layerNodes.forEach(node => {
        const name = node.textContent || '';
        if (name.includes(':')) {
          workspaces.add(name.split(':')[0]);
        }
      });
      
      if (workspaces.size > 0) {
        cachedWorkspaces = Array.from(workspaces);
        console.log('✅ 从 WMS 解析到工作空间:', cachedWorkspaces);
        return cachedWorkspaces;
      }
    }
  } catch (error) {
    console.warn('⚠️ WMS 解析工作空间失败:', error.message);
  }
  
  // 返回默认列表
  console.log('⚠️ 使用默认工作空间列表');
  return PRIORITY_WORKSPACES;
}

/**
 * 获取 GeoServer 所有图层列表 (通过 WMS GetCapabilities)
 * @returns {Promise<Array>} 图层列表
 */
export async function getGeoServerLayers() {
  // 先获取所有工作空间
  const workspaces = await fetchWorkspaces();
  
  // 构建端点列表：全局端点 + 各工作空间端点
  const endpoints = [
    { url: `${GEOSERVER_BASE}/wms?service=WMS&version=1.1.0&request=GetCapabilities`, workspace: null },
    { url: `${GEOSERVER_BASE}/ows?service=WMS&version=1.1.0&request=GetCapabilities`, workspace: null }
  ];
  
  // 为每个工作空间添加专属端点
  workspaces.forEach(ws => {
    endpoints.push({
      url: `${GEOSERVER_BASE}/${ws}/wms?service=WMS&version=1.1.0&request=GetCapabilities`,
      workspace: ws
    });
  });
  
  let allLayers = [];
  
  for (const endpoint of endpoints) {
    try {
      console.log('🔍 尝试获取图层:', endpoint.url);
      const response = await fetch(endpoint.url);
      if (!response.ok) continue;
      
      const text = await response.text();
      const layers = parseWmsCapabilities(text, endpoint.workspace);
      
      // 合并图层，避免重复。工作空间专属端点比全局端点解析出的 default 更可靠。
      layers.forEach(layer => {
        const existingIndex = allLayers.findIndex(l => l.name === layer.name);
        if (existingIndex === -1) {
          allLayers.push(layer);
          return;
        }
        const existing = allLayers[existingIndex];
        if (existing.workspace === 'default' && layer.workspace !== 'default') {
          allLayers.splice(existingIndex, 1, layer);
        }
      });
      
      console.log(`✅ 从 ${endpoint.url} 获取到 ${layers.length} 个图层`);
    } catch (error) {
      console.warn(`⚠️ 端点 ${endpoint.url} 获取失败:`, error.message);
    }
  }
  
  // 按工作空间优先级排序
  allLayers.sort((a, b) => {
    const aIndex = PRIORITY_WORKSPACES.indexOf(a.workspace);
    const bIndex = PRIORITY_WORKSPACES.indexOf(b.workspace);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
  
  return allLayers;
}

/**
 * 解析 WMS GetCapabilities XML
 * @param {string} text XML 文本
 * @param {string|null} defaultWorkspace 默认工作空间（从请求URL推断）
 * @returns {Array} 图层列表
 */
function parseWmsCapabilities(text, defaultWorkspace = null) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, 'text/xml');
  
  // 解析图层信息
  const layers = [];
  const layerNodes = xml.querySelectorAll('Layer > Layer');
  
  layerNodes.forEach(layerNode => {
    const name = layerNode.querySelector('Name')?.textContent || '';
    const title = layerNode.querySelector('Title')?.textContent || '';
    const abstract = layerNode.querySelector('Abstract')?.textContent || '';
    
    // 获取边界框
    const bbox = layerNode.querySelector('LatLonBoundingBox');
    const boundingBox = bbox ? {
      minx: parseFloat(bbox.getAttribute('minx')),
      miny: parseFloat(bbox.getAttribute('miny')),
      maxx: parseFloat(bbox.getAttribute('maxx')),
      maxy: parseFloat(bbox.getAttribute('maxy'))
    } : null;
    
    // 获取 SRS
    const srsNodes = layerNode.querySelectorAll('SRS');
    const srs = Array.from(srsNodes).map(n => n.textContent);
    
    // 获取样式
    const styleNodes = layerNode.querySelectorAll('Style');
    const styles = Array.from(styleNodes).map(styleNode => ({
      name: styleNode.querySelector('Name')?.textContent || '',
      title: styleNode.querySelector('Title')?.textContent || ''
    }));
    
    // 推断工作空间：优先从图层名称中解析，其次使用请求URL推断的默认值。
    // 全局 GetCapabilities 中部分图层名称不带工作空间前缀，但图例 URL 会暴露真实工作空间。
    const legendHref = layerNode.querySelector('LegendURL OnlineResource')?.getAttribute('xlink:href') ||
      layerNode.querySelector('LegendURL OnlineResource')?.getAttribute('href') ||
      '';
    const legendWorkspaceMatch = legendHref.match(/\/geoserver\/([^/?#]+)\/wms/i);
    let workspace = 'default';
    if (name.includes(':')) {
      workspace = name.split(':')[0];
    } else if (legendWorkspaceMatch?.[1]) {
      workspace = legendWorkspaceMatch[1];
    } else if (defaultWorkspace) {
      workspace = defaultWorkspace;
    }
    
    if (name) {
      layers.push({
        name,
        title,
        abstract,
        boundingBox,
        srs,
        styles,
        workspace
      });
    }
  });
  
  return layers;
}

/**
 * 获取指定工作空间的图层
 * @param {string} workspace 工作空间名称
 * @returns {Promise<Array>} 图层列表
 */
export async function getLayersByWorkspace(workspace) {
  const layers = await getGeoServerLayers();
  return layers.filter(layer => layer.workspace === workspace);
}

/**
 * 获取所有工作空间列表
 * @returns {Promise<Array>} 工作空间列表
 */
export async function getWorkspaces() {
  const layers = await getGeoServerLayers();
  const workspaces = [...new Set(layers.map(l => l.workspace))];
  return workspaces.map(ws => ({
    name: ws,
    layerCount: layers.filter(l => l.workspace === ws).length
  }));
}

/**
 * 生成图层预览 URL
 * @param {string} layerName 图层名称 (如 YG:EVI_2023353)
 * @param {Object} options 选项
 * @returns {string} 预览图片 URL
 */
export function getLayerPreviewUrl(layerName, options = {}) {
  const {
    width = 200,
    height = 150,
    format = 'image/png',
    bbox = '-180,-90,180,90'
  } = options;
  
  return `${GEOSERVER_BASE}/wms?service=WMS&version=1.1.0&request=GetMap` +
    `&layers=${encodeURIComponent(layerName)}` +
    `&bbox=${bbox}` +
    `&width=${width}&height=${height}` +
    `&srs=EPSG:4326` +
    `&format=${encodeURIComponent(format)}` +
    `&transparent=true`;
}

/**
 * 在控制台打印图层信息表格
 */
export async function printLayerTable() {
  try {
    console.log('🔍 正在获取 GeoServer 图层信息...');
    const layers = await getGeoServerLayers();
    
    console.log('\n📊 GeoServer 图层列表:');
    console.table(layers.map(l => ({
      '工作空间': l.workspace,
      '图层名称': l.name,
      '标题': l.title,
      'SRS': l.srs[0] || 'N/A'
    })));
    
    // 按工作空间分组
    const workspaces = await getWorkspaces();
    console.log('\n📁 工作空间统计:');
    console.table(workspaces);
    
    return layers;
  } catch (error) {
    console.error('❌ 获取失败:', error.message);
    return [];
  }
}

/**
 * 获取图层的详细信息
 * @param {string} layerName 图层名称
 * @returns {Promise<Object>} 图层详情
 */
export async function getLayerInfo(layerName) {
  const layers = await getGeoServerLayers();
  return layers.find(l => l.name === layerName);
}

export default {
  getGeoServerLayers,
  getLayersByWorkspace,
  getWorkspaces,
  getLayerPreviewUrl,
  printLayerTable,
  getLayerInfo
};
