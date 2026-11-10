/**
 * @Description: 加载区县级行政区划边界（按城市动态加载）
 * @Date: 2025-11-20
 */

import { 
  Color,
  GeoJsonDataSource,
  ColorMaterialProperty,
  Cartesian3,
  HeightReference,
  Ellipsoid,
  Rectangle,
  PolylineGlowMaterialProperty,
  Math as CesiumMath
} from 'cesium';

// 缓存已加载的区县数据
const countyDataCache = new Map();

// 存储区县级发光边界实体
let countyGlowLineEntity = null;

/**
 * 加载指定城市的区县级行政区划边界
 * @param {Viewer} viewer - Cesium Viewer 实例
 * @param {string|number} cityCode - 城市代码（6位或9位，如：130100）
 * @param {Object} options - 配置选项
 * @param {Object} options.stroke - 边界线颜色
 * @param {Object} options.fill - 填充颜色
 * @param {number} options.strokeWidth - 边界线宽度
 * @param {boolean} options.clampToGround - 是否贴地
 * @returns {Promise<GeoJsonDataSource>} 返回数据源对象
 */
export async function loadCountyBoundary(viewer, cityCode, options = {}) {
  const {
    stroke = Color.fromCssColorString('#ffaa00'),
    fill = Color.TRANSPARENT,
    strokeWidth = 1,
    clampToGround = true
  } = options;

  // 转换为6位城市代码
  const shortCode = String(cityCode).substring(0, 6);
  const cityAdcode = parseInt(shortCode);
  
  // 检查缓存
  if (countyDataCache.has(cityAdcode)) {
    console.log(`📦 使用缓存的区县数据: ${cityAdcode}`);
    return countyDataCache.get(cityAdcode);
  }

  try {
    console.log(`🏢 开始加载城市 ${cityAdcode} 的区县级行政区划边界...`);
    
    // 构建API URL（使用阿里云DataV API）
    const url = `https://geo.datav.aliyun.com/areas_v3/bound/${cityAdcode}_full.json`;
    
    // 加载 GeoJSON 数据
    const dataSource = await GeoJsonDataSource.load(url, {
      stroke: stroke,
      fill: fill,
      strokeWidth: strokeWidth,
      clampToGround: clampToGround
    });

    // 添加到 viewer
    viewer.dataSources.add(dataSource);
    
    // 等待数据源完全加载后再处理实体
    await dataSource.readyPromise;
    
    // 遍历所有实体，设置样式
    const entities = dataSource.entities.values;
    entities.forEach(entity => {
      if (entity.polygon) {
        // 设置多边形样式
        entity.polygon.material = new ColorMaterialProperty(fill);
        entity.polygon.outline = true;
        entity.polygon.outlineColor = stroke;
        entity.polygon.outlineWidth = strokeWidth;
        
        // 添加区县信息
        const props = entity.properties;
        if (props && props.name) {
          const countyName = props.name.getValue();
          entity.name = countyName;
          entity.description = `
            <div style="padding: 10px;">
              <h3 style="color: #ffaa00; margin: 0 0 10px 0;">${countyName}</h3>
              <p style="margin: 5px 0;">行政区代码: ${props.adcode ? props.adcode.getValue() : 'N/A'}</p>
              <p style="margin: 5px 0;">级别: ${props.level ? props.level.getValue() : 'N/A'}</p>
            </div>
          `;
          
          // 计算多边形中心点并添加标签
          try {
            // 方法1: 尝试使用Rectangle计算中心点
            let centerPosition = null;
            if (entity.rectangle) {
              const rectangle = entity.rectangle.coordinates.getValue();
              if (rectangle) {
                const center = Rectangle.center(rectangle);
                centerPosition = Cartesian3.fromRadians(center.longitude, center.latitude);
              }
            }
            
            // 方法2: 如果Rectangle不可用，使用hierarchy计算
            if (!centerPosition) {
              const hierarchy = entity.polygon.hierarchy.getValue();
              if (hierarchy && hierarchy.positions && hierarchy.positions.length > 0) {
                // 计算所有顶点的平均位置作为中心点
                let lonSum = 0;
                let latSum = 0;
                let count = 0;
                
                hierarchy.positions.forEach(position => {
                  const cartographic = Ellipsoid.WGS84.cartesianToCartographic(position);
                  if (cartographic) {
                    lonSum += cartographic.longitude;
                    latSum += cartographic.latitude;
                    count++;
                  }
                });
                
                if (count > 0) {
                  const centerLon = lonSum / count;
                  const centerLat = latSum / count;
                  centerPosition = Cartesian3.fromRadians(centerLon, centerLat);
                }
              }
            }
            
            // 如果找到了中心点，添加标签
            if (centerPosition) {
              entity.position = centerPosition;
              entity.label = {
                show: true,
                text: countyName,
                font: 'bold 18px sans-serif',
                fillColor: Color.WHITE,
                outlineColor: Color.BLACK,
                outlineWidth: 2,
                style: 1, // FILL_AND_OUTLINE
                heightReference: HeightReference.CLAMP_TO_GROUND,
                verticalOrigin: 1, // CENTER
                horizontalOrigin: 1 // CENTER
              };
              console.log(`✅ 为区县 ${countyName} 添加标签成功`);
            } else {
              console.warn(`⚠️ 无法计算区县 ${countyName} 的中心点`);
            }
          } catch (error) {
            console.warn(`⚠️ 无法为区县 ${countyName} 添加标签:`, error);
          }
        }
      }
    });

    // 缓存数据源
    countyDataCache.set(cityAdcode, dataSource);
    
    console.log(`✅ 成功加载 ${entities.length} 个区县级行政区边界（城市: ${cityAdcode}）`);
    return dataSource;
    
  } catch (error) {
    console.error(`❌ 加载城市 ${cityAdcode} 的区县边界失败:`, error);
    throw error;
  }
}

/**
 * 根据区县代码高亮指定区县
 * @param {Viewer} viewer - Cesium Viewer 实例
 * @param {GeoJsonDataSource} dataSource - 数据源对象
 * @param {string|number} countyCode - 区县代码（6位或9位，如：130102）
 */
export function highlightCounty(viewer, dataSource, countyCode) {
  if (!dataSource) {
    console.warn('⚠️ 数据源不存在，无法高亮区县');
    return;
  }

  // 清除之前的发光边界
  if (countyGlowLineEntity && viewer) {
    viewer.entities.remove(countyGlowLineEntity);
    countyGlowLineEntity = null;
  }

  const entities = dataSource.entities.values;
  
  // 转换为6位代码进行匹配
  const shortCode = String(countyCode).substring(0, 6);
  const targetAdcode = parseInt(shortCode);
  
  // 重置所有区县样式
  entities.forEach(entity => {
    if (entity.polygon) {
      entity.polygon.material = new ColorMaterialProperty(Color.TRANSPARENT);
      entity.polygon.outline = true;
      entity.polygon.outlineColor = Color.fromCssColorString('#ffaa00');
      entity.polygon.outlineWidth = 1;
    }
  });

  // 找到目标区县
  let found = false;
  const targetEntity = entities.find(entity => {
    const props = entity.properties;
    if (props && props.adcode) {
      const adcode = props.adcode.getValue();
      return adcode === targetAdcode || String(adcode).substring(0, 6) === shortCode;
    }
    return false;
  });

  if (targetEntity && targetEntity.polygon) {
    const props = targetEntity.properties;
    const countyName = props.name ? props.name.getValue() : '未知区县';
    console.log(`🎯 高亮区县: ${countyName}`);
    
    // 隐藏目标区县原本的细边框，由发光线代替
    targetEntity.polygon.outline = false;
    
    // 获取区县的边界坐标
    const hierarchy = targetEntity.polygon.hierarchy.getValue();
    if (hierarchy && hierarchy.positions && viewer) {
      // 创建发光边界线
      countyGlowLineEntity = viewer.entities.add({
        name: '区县发光边界',
        polyline: {
          positions: hierarchy.positions,
          width: 10, // 宽度适中
          material: new PolylineGlowMaterialProperty({
            glowPower: 0.2,
            color: Color.fromBytes(255, 170, 0, 255) // 橙色 #ffaa00
          }),
          clampToGround: true
        }
      });
    }
    found = true;
  }

  if (!found) {
    console.warn(`⚠️ 未找到区县代码: ${countyCode}`);
  }
}

/**
 * 根据区县名称高亮
 * @param {GeoJsonDataSource} dataSource - 数据源对象
 * @param {string} countyName - 区县名称（如：长安区）
 * @param {Object} highlightColor - 高亮颜色
 */
export function highlightCountyByName(dataSource, countyName, highlightColor = Color.YELLOW.withAlpha(0.7)) {
  if (!dataSource) {
    console.warn('⚠️ 数据源不存在，无法高亮区县');
    return;
  }

  const entities = dataSource.entities.values;
  
  entities.forEach(entity => {
    const props = entity.properties;
    if (props && props.name) {
      const name = props.name.getValue();
      if (name === countyName || name.includes(countyName) || countyName.includes(name)) {
        entity.polygon.material = new ColorMaterialProperty(highlightColor);
        entity.polygon.outlineColor = Color.YELLOW;
        entity.polygon.outlineWidth = 3;
        console.log(`🎯 高亮区县: ${name}`);
      }
    }
  });
}

/**
 * 飞行到指定区县
 * @param {Viewer} viewer - Cesium Viewer 实例
 * @param {GeoJsonDataSource} dataSource - 数据源对象
 * @param {string|number} countyCode - 区县代码
 * @param {number} duration - 飞行时长（秒）
 */
export function flyToCounty(viewer, dataSource, countyCode, duration = 1.5) {
  if (!dataSource) {
    console.warn('⚠️ 数据源不存在，无法飞行到区县');
    return;
  }

  const entities = dataSource.entities.values;
  const shortCode = String(countyCode).substring(0, 6);
  const targetAdcode = parseInt(shortCode);
  
  const targetEntity = entities.find(entity => {
    const props = entity.properties;
    if (props && props.adcode) {
      const adcode = props.adcode.getValue();
      return adcode === targetAdcode || String(adcode).substring(0, 6) === shortCode;
    }
    return false;
  });

  if (targetEntity) {
    // 尝试计算实体的边界矩形
    let destination = targetEntity;
    
    if (targetEntity.polygon && targetEntity.polygon.hierarchy) {
      const hierarchy = targetEntity.polygon.hierarchy.getValue();
      if (hierarchy && hierarchy.positions) {
        // 计算包围盒
        const rectangle = Rectangle.fromCartesianArray(hierarchy.positions);
        destination = rectangle;
      }
    }

    if (destination instanceof Rectangle) {
      viewer.camera.flyTo({
        destination: destination,
        orientation: {
          heading: 0,
          pitch: -CesiumMath.PI_OVER_TWO, // 垂直俯视
          roll: 0
        },
        duration: duration
      });
    } else {
      // 降级方案
      viewer.flyTo(targetEntity, {
        duration: duration,
        offset: {
          heading: 0,
          pitch: -CesiumMath.PI_OVER_TWO,
          range: 0 // auto calculate
        }
      });
    }
    
    console.log(`✈️ 飞行到区县: ${targetEntity.name || countyCode}`);
  } else {
    console.warn(`⚠️ 未找到区县代码: ${countyCode}`);
  }
}

/**
 * 清除区县高亮
 * @param {Viewer} viewer - Cesium Viewer 实例
 * @param {GeoJsonDataSource} dataSource - 数据源对象
 */
export function clearCountyHighlight(viewer, dataSource) {
  if (!dataSource) {
    return;
  }

  // 清除发光边界
  if (countyGlowLineEntity && viewer) {
    viewer.entities.remove(countyGlowLineEntity);
    countyGlowLineEntity = null;
  }

  const entities = dataSource.entities.values;
  
  entities.forEach(entity => {
    if (entity.polygon) {
      entity.polygon.material = new ColorMaterialProperty(Color.TRANSPARENT);
      entity.polygon.outline = true;
      entity.polygon.outlineColor = Color.fromCssColorString('#ffaa00');
      entity.polygon.outlineWidth = 1;
    }
  });
  
  console.log('🔄 已清除所有区县高亮');
}

/**
 * 移除指定城市的区县边界
 * @param {Viewer} viewer - Cesium Viewer 实例
 * @param {string|number} cityCode - 城市代码
 */
export function removeCountyBoundary(viewer, cityCode) {
  const shortCode = String(cityCode).substring(0, 6);
  const cityAdcode = parseInt(shortCode);
  
  const dataSource = countyDataCache.get(cityAdcode);
  if (dataSource) {
    viewer.dataSources.remove(dataSource);
    countyDataCache.delete(cityAdcode);
    console.log(`🗑️ 已移除城市 ${cityAdcode} 的区县边界`);
  }
}

export default {
  loadCountyBoundary,
  highlightCounty,
  highlightCountyByName,
  flyToCounty,
  clearCountyHighlight,
  removeCountyBoundary
};

