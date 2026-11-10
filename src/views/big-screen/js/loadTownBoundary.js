/**
 * @Description: 加载乡镇级点位（基于高德API）
 * @Date: 2025-11-25
 */

import { 
  Cartesian3,
  HeightReference,
  Color,
  VerticalOrigin,
  HorizontalOrigin,
  DistanceDisplayCondition,
  NearFarScalar
} from 'cesium';
import amapGeocoder from '@/utils/amapGeocoder';

// 缓存已加载的乡镇实体集合，key为区县adcode，value为Entity ID数组
const townEntitiesCache = new Map();

/**
 * 加载指定区县的乡镇级行政区划点位
 * @param {Viewer} viewer - Cesium Viewer 实例
 * @param {string|number} countyCode - 区县代码（6位或9位，如：130102）
 * @param {string} countyName - 区县名称（可选，用于日志显示）
 * @returns {Promise<Array<string>>} 返回添加的实体ID列表
 */
export async function loadTownBoundary(viewer, countyCode, countyName = '') {
  // 转换为6位区县代码
  const shortCode = String(countyCode).substring(0, 6);
  const countyAdcode = parseInt(shortCode);
  
  // 检查API配置
  if (!amapGeocoder.isApiKeyConfigured()) {
    console.warn('⚠️ 高德API Key未配置，无法加载乡镇点位');
    return [];
  }
  
  // 检查是否已加载
  if (townEntitiesCache.has(countyAdcode)) {
    console.log(`📦 区县 ${countyName || countyAdcode} 的乡镇点位已在缓存中`);
    // 如果实体还在viewer中，直接返回；如果不在了（被清除了），则需要重新添加
    // 简单起见，我们这里假设如果缓存有记录，但实体不在viewer里，就重新加载
    const cachedIds = townEntitiesCache.get(countyAdcode);
    const allExist = cachedIds.every(id => viewer.entities.getById(id));
    if (allExist) {
        return cachedIds;
    } else {
        // 清理旧缓存，重新加载
        townEntitiesCache.delete(countyAdcode);
    }
  }

  try {
    console.log(`🏘️ 开始加载区县 ${countyName || countyAdcode} 的乡镇级点位(高德API)...`);
    
    // 调用高德API获取乡镇列表
    // subdistrict=1 表示获取下一级行政区
    const result = await amapGeocoder.getDistrict(countyAdcode, 1);
    
    if (!result.success || !result.districts || result.districts.length === 0) {
        console.warn(`⚠️ 未查询到区县 ${countyAdcode} 的乡镇数据`);
        return [];
    }

    const towns = result.districts;
    console.log(`✅ 获取到 ${towns.length} 个乡镇数据 (所属区县: ${countyName || countyAdcode})`);

    const entityIds = [];

    // 遍历乡镇数据并在地图上打点
    for (const town of towns) {
        // 坐标转换 GCJ02 -> WGS84
        // town.center 是 "lng,lat" 字符串
        const [lng, lat] = town.center.split(',').map(Number);
        const wgs84 = amapGeocoder.gcj02ToWgs84(lng, lat);
        
        // 创建实体
        const entity = viewer.entities.add({
            name: town.name,
            position: Cartesian3.fromDegrees(wgs84.lng, wgs84.lat),
            point: {
                pixelSize: 5, // 缩小点位
                color: Color.fromCssColorString('#00ffff'),
                outlineColor: Color.BLACK,
                outlineWidth: 1,
                heightReference: HeightReference.CLAMP_TO_GROUND,
                // 距离远时不显示点
                distanceDisplayCondition: new DistanceDisplayCondition(0, 100000),
                scaleByDistance: new NearFarScalar(1.5e2, 2.0, 1.5e7, 0.5)
            },
            label: {
                text: town.name,
                font: '14px sans-serif',
                fillColor: Color.WHITE,
                outlineColor: Color.BLACK,
                outlineWidth: 2,
                style: 1, // FILL_AND_OUTLINE
                heightReference: HeightReference.CLAMP_TO_GROUND,
                verticalOrigin: VerticalOrigin.BOTTOM, 
                horizontalOrigin: HorizontalOrigin.CENTER,
                pixelOffset: { x: 0, y: -5 }, // 向上偏移调整
                // 距离控制：太远不显示文字
                distanceDisplayCondition: new DistanceDisplayCondition(0, 500000),
                scaleByDistance: new NearFarScalar(1.5e2, 1.5, 8.0e6, 0.0)
            },
            properties: {
                adcode: town.adcode,
                level: town.level,
                citycode: town.citycode,
                provinceName: '', // 补充省
                cityName: '',     // 补充市
                countyName: countyName // 补充县
            },
            description: `
                <div style="padding: 10px;">
                  <h3 style="color: #00ffff; margin: 0 0 10px 0;">${town.name}</h3>
                  <p style="margin: 5px 0;">行政区代码: ${town.adcode}</p>
                  <p style="margin: 5px 0;">级别: ${town.level}</p>
                </div>
            `
        });
        
        entityIds.push(entity.id);
    }

    // 缓存实体ID
    townEntitiesCache.set(countyAdcode, entityIds);
    
    return entityIds;
    
  } catch (error) {
    console.error(`❌ 加载区县 ${countyName || countyAdcode} 的乡镇点位失败:`, error);
    return [];
  }
}

/**
 * 移除指定区县的乡镇点位
 * @param {Viewer} viewer - Cesium Viewer 实例
 * @param {string|number} countyCode - 区县代码
 */
export function removeTownBoundary(viewer, countyCode) {
  const shortCode = String(countyCode).substring(0, 6);
  const countyAdcode = parseInt(shortCode);
  
  if (townEntitiesCache.has(countyAdcode)) {
    const entityIds = townEntitiesCache.get(countyAdcode);
    entityIds.forEach(id => {
        viewer.entities.removeById(id);
    });
    townEntitiesCache.delete(countyAdcode);
    console.log(`🗑️ 已移除区县 ${countyAdcode} 的乡镇点位`);
  }
}

/**
 * 清除所有已加载的乡镇点位
 * @param {Viewer} viewer 
 */
export function clearAllTownBoundaries(viewer) {
    townEntitiesCache.forEach((entityIds) => {
        entityIds.forEach(id => {
            viewer.entities.removeById(id);
        });
    });
    townEntitiesCache.clear();
    console.log('🗑️ 已清除所有乡镇点位');
}

export default {
  loadTownBoundary,
  removeTownBoundary,
  clearAllTownBoundaries
};
