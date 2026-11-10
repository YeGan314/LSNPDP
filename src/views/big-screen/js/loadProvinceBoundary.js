/**
 * @Description: 加载中国省级行政区划边界
 * @Date: 2025-11-20
 */

import { 
  GeoJsonDataSource,
  Color,
  ColorMaterialProperty,
  Cartesian2,
  Cartesian3,
  HeightReference,
  Ellipsoid,
  Rectangle,
  LabelStyle,
  VerticalOrigin,
  HorizontalOrigin,
  PolygonHierarchy,
  PolylineGlowMaterialProperty,
  Math as CesiumMath
} from 'cesium';

/**
 * 加载省级行政区划边界
 * @param {Viewer} viewer - Cesium Viewer 实例
 * @param {Object} options - 配置选项
 * @param {string} options.url - GeoJSON 文件路径
 * @param {Object} options.stroke - 边界线颜色
 * @param {Object} options.fill - 填充颜色
 * @param {number} options.strokeWidth - 边界线宽度
 * @param {boolean} options.clampToGround - 是否贴地
 * @returns {Promise<GeoJsonDataSource>} 返回数据源对象
 */
export async function loadProvinceBoundary(viewer, options = {}) {
  const {
    url = '/geodata/china_province.geojson',
    stroke = Color.CYAN,
    fill = Color.TRANSPARENT,
    strokeWidth = 2,
    clampToGround = true
  } = options;

  try {
    console.log('🗺️ 开始加载省级行政区划边界...');
    
    // 加载 GeoJSON 数据
    const dataSource = await GeoJsonDataSource.load(url, {
      stroke: stroke,
      fill: fill,
      strokeWidth: strokeWidth,
      clampToGround: clampToGround
    });

    // 添加到 viewer
    viewer.dataSources.add(dataSource);
    
    console.log('📦 数据源已添加到viewer，等待完全加载...');
    
    // 等待数据源完全加载后再处理实体
    await dataSource.readyPromise;
    
    console.log('✅ 数据源已完全加载！');
    
    // 遍历所有实体，设置样式
    const entities = dataSource.entities.values;
    console.log(`📊 共加载了 ${entities.length} 个实体`);
    
    let entityCount = 0;
    let polygonCount = 0;
    let nameFoundCount = 0;
    let nameNotFoundCount = 0;
    
    // 用于去重的Set，存储已添加标签的省份代码
    const labeledProvinces = new Set();
    
    entities.forEach((entity, index) => {
      entityCount++;
      
      // 调试：打印第一个实体的完整信息
      if (index === 0) {
        console.log('🔍 第一个实体的详细信息:');
        console.log('  - entity:', entity);
        console.log('  - entity.polygon:', entity.polygon);
        console.log('  - entity.properties:', entity.properties);
        
        if (entity.properties) {
          console.log('  - properties keys:', Object.keys(entity.properties));
          // 尝试获取所有属性
          const props = entity.properties;
          Object.keys(props).forEach(key => {
            try {
              const value = props[key].getValue ? props[key].getValue() : props[key];
              console.log(`  - ${key}:`, value);
            } catch (e) {
              console.log(`  - ${key}: [无法获取值]`, e);
            }
          });
        }
      }
      
      if (entity.polygon) {
        polygonCount++;
        // 设置多边形样式
        entity.polygon.material = new ColorMaterialProperty(fill);
        entity.polygon.outline = true;
        entity.polygon.outlineColor = stroke;
        entity.polygon.outlineWidth = strokeWidth;
        
        // 添加省份信息
        const props = entity.properties;
        console.log(`\n📍 处理实体 #${index + 1}:`);
        console.log('  - 是否有properties:', !!props);
        
        if (props) {
          console.log('  - properties类型:', typeof props);
          console.log('  - properties内容:', props);
          
          // 检查是否有name属性
          if (props.name) {
            console.log('  - ✅ 找到name属性');
            try {
              const provinceName = props.name.getValue();
              const provinceCode = props.adcode ? props.adcode.getValue() : null;
              console.log('  - name值:', provinceName);
              console.log('  - adcode值:', provinceCode);
              nameFoundCount++;
              
              entity.name = provinceName;
              entity.description = `
                <div style="padding: 10px;">
                  <h3 style="color: #00d4ff; margin: 0 0 10px 0;">${provinceName}</h3>
                  <p style="margin: 5px 0;">行政区代码: ${provinceCode || 'N/A'}</p>
                  <p style="margin: 5px 0;">下级数量: ${props.childrenNum ? props.childrenNum.getValue() : 'N/A'}</p>
                </div>
              `;
          
              // 检查该省份是否已添加过标签
              if (provinceCode && labeledProvinces.has(provinceCode)) {
                console.log(`⏭️ 省份 ${provinceName} (${provinceCode}) 已添加过标签，跳过`);
              } else {
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
                      text: provinceName,
                      font: '18px Microsoft YaHei, sans-serif',
                      fillColor: Color.BLACK,
                      outlineColor: Color.WHITE.withAlpha(0.4),
                      outlineWidth: 3,
                      style: LabelStyle.FILL_AND_OUTLINE,
                      heightReference: HeightReference.CLAMP_TO_GROUND,
                      verticalOrigin: VerticalOrigin.CENTER,
                      horizontalOrigin: HorizontalOrigin.CENTER,
                      pixelOffset: new Cartesian2(0, 0),
                      disableDepthTestDistance: Number.POSITIVE_INFINITY
                    };
                    
                    // 标记该省份已添加标签
                    if (provinceCode) {
                      labeledProvinces.add(provinceCode);
                    }
                    console.log(`✅ 为省份 ${provinceName} (${provinceCode}) 添加标签成功`);
                  } else {
                    console.warn(`⚠️ 无法计算省份 ${provinceName} 的中心点`);
                  }
                } catch (error) {
                  console.warn(`⚠️ 无法为省份 ${provinceName} 添加标签:`, error);
                  console.error('  错误详情:', error);
                }
              }
            } catch (error) {
              console.error('  ❌ 获取name值失败:', error);
              nameNotFoundCount++;
            }
          } else {
            console.log('  - ❌ 未找到name属性');
            console.log('  - 可用属性键:', Object.keys(props));
            nameNotFoundCount++;
          }
        } else {
          console.log('  - ❌ 实体没有properties');
          nameNotFoundCount++;
        }
      } else {
        console.log(`  - ⚠️ 实体 #${index + 1} 不是polygon类型`);
      }
    });

    console.log('\n📈 统计信息:');
    console.log(`  - 总实体数: ${entityCount}`);
    console.log(`  - Polygon实体数: ${polygonCount}`);
    console.log(`  - 找到name的实体数: ${nameFoundCount}`);
    console.log(`  - 未找到name的实体数: ${nameNotFoundCount}`);
    console.log(`✅ 成功加载 ${entities.length} 个省级行政区边界`);
    return dataSource;
    
  } catch (error) {
    console.error('❌ 加载省级边界失败:', error);
    throw error;
  }
}

// 存储镂空遮罩实体的全局变量
let holeMaskEntity = null;
// 存储发光边界实体的全局变量
let glowLineEntity = null;

/**
 * 根据省份代码高亮指定省份 - 使用镂空遮罩效果
 * @param {Viewer} viewer - Cesium Viewer 实例
 * @param {GeoJsonDataSource} dataSource - 数据源对象
 * @param {string|number} provinceCode - 省份代码（6位，如：130000）
 */
export function highlightProvince(viewer, dataSource, provinceCode) {
  const entities = dataSource.entities.values;
  
  // 清除之前的镂空遮罩和发光边界
  if (holeMaskEntity) {
    viewer.entities.remove(holeMaskEntity);
    holeMaskEntity = null;
  }
  if (glowLineEntity) {
    viewer.entities.remove(glowLineEntity);
    glowLineEntity = null;
  }
  
  // 重置所有省份样式为默认
  entities.forEach(entity => {
    if (entity.polygon) {
      entity.polygon.material = new ColorMaterialProperty(Color.TRANSPARENT);
      entity.polygon.outline = true; // 确保原来的细线显示
      entity.polygon.outlineColor = Color.fromCssColorString('#00d4ff');
      entity.polygon.outlineWidth = 2;
    }
  });

  // 找到目标省份
  const targetEntity = entities.find(entity => {
    const props = entity.properties;
    if (props && props.adcode) {
      const adcode = props.adcode.getValue();
      return adcode === parseInt(provinceCode) || adcode === provinceCode;
    }
    return false;
  });

  if (targetEntity && targetEntity.polygon) {
    const props = targetEntity.properties;
    const provinceName = props.name ? props.name.getValue() : '未知省份';
    console.log(`🎯 高亮省份: ${provinceName}`);
    
    // 隐藏目标省份原本的细边框，由发光线代替
    targetEntity.polygon.outline = false;
    
    // 获取省份的边界坐标
    const hierarchy = targetEntity.polygon.hierarchy.getValue();
    if (hierarchy && hierarchy.positions) {
      // 1. 创建镂空遮罩（全球范围，中间镂空省份区域）
      // 调整透明度为 0.3 以匹配 guanqu 效果
      holeMaskEntity = viewer.entities.add({
        name: '省份镂空遮罩',
        polygon: {
          hierarchy: new PolygonHierarchy(
            // 外部：覆盖全球的大矩形
            Cartesian3.fromDegreesArray([
              -180, -90,
              180, -90,
              180, 90,
              -180, 90
            ]),
            // 内部镂空：省份边界
            [new PolygonHierarchy(hierarchy.positions)]
          ),
          material: Color.BLACK.withAlpha(0.3), // 黑色半透明遮罩
          height: 0,
          outline: false
        }
      });

      // 2. 创建发光边界线
      // 使用青色发光材质
      glowLineEntity = viewer.entities.add({
        name: '省份发光边界',
        polyline: {
          positions: hierarchy.positions,
          width: 10, // 宽度适中
          material: new PolylineGlowMaterialProperty({
            glowPower: 0.2,
            color: Color.fromBytes(16, 209, 255, 255) // 青色
          }),
          clampToGround: true
        }
      });
    }
  }
}

/**
 * 根据省份名称高亮
 * @param {GeoJsonDataSource} dataSource - 数据源对象
 * @param {string} provinceName - 省份名称（如：河北省）
 * @param {Object} highlightColor - 高亮颜色
 */
export function highlightProvinceByName(dataSource, provinceName, highlightColor = Color.YELLOW.withAlpha(0.5)) {
  const entities = dataSource.entities.values;
  
  entities.forEach(entity => {
    const props = entity.properties;
    if (props && props.name) {
      const name = props.name.getValue();
      if (name === provinceName) {
        entity.polygon.material = new ColorMaterialProperty(highlightColor);
        entity.polygon.outlineColor = Color.YELLOW;
        entity.polygon.outlineWidth = 3;
        console.log(`🎯 高亮省份: ${name}`);
      }
    }
  });
}

/**
 * 飞行到指定省份
 * @param {Viewer} viewer - Cesium Viewer 实例
 * @param {GeoJsonDataSource} dataSource - 数据源对象
 * @param {string|number} provinceCode - 省份代码
 * @param {number} duration - 飞行时长（秒）
 */
export function flyToProvince(viewer, dataSource, provinceCode, duration = 2) {
  const entities = dataSource.entities.values;
  
  const targetEntity = entities.find(entity => {
    const props = entity.properties;
    if (props && props.adcode) {
      const adcode = props.adcode.getValue();
      return adcode === parseInt(provinceCode) || adcode === provinceCode;
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
        // 稍微扩大一点范围，避免边缘贴边
        // 保持长宽比
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
      // 降级方案：使用viewer.flyTo
      viewer.flyTo(targetEntity, {
        duration: duration,
        offset: {
          heading: 0,
          pitch: -CesiumMath.PI_OVER_TWO,
          range: 0 // auto calculate
        }
      });
    }
    
    console.log(`✈️ 飞行到省份: ${targetEntity.name}`);
  } else {
    console.warn(`⚠️ 未找到省份代码: ${provinceCode}`);
  }
}

/**
 * 清除高亮
 * @param {Viewer} viewer - Cesium Viewer 实例
 * @param {GeoJsonDataSource} dataSource - 数据源对象
 */
export function clearHighlight(viewer, dataSource) {
  const entities = dataSource.entities.values;
  
  // 清除镂空遮罩
  if (holeMaskEntity && viewer) {
    viewer.entities.remove(holeMaskEntity);
    holeMaskEntity = null;
  }
  
  // 清除发光边界
  if (glowLineEntity && viewer) {
    viewer.entities.remove(glowLineEntity);
    glowLineEntity = null;
  }
  
  // 重置所有省份样式
  entities.forEach(entity => {
    if (entity.polygon) {
      entity.polygon.material = new ColorMaterialProperty(Color.TRANSPARENT);
      entity.polygon.outline = true;
      entity.polygon.outlineColor = Color.fromCssColorString('#00d4ff');
      entity.polygon.outlineWidth = 2;
    }
  });
  
  console.log('🔄 已清除所有高亮');
}

export default {
  loadProvinceBoundary,
  highlightProvince,
  highlightProvinceByName,
  flyToProvince,
  clearHighlight
};

