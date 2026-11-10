/**
 * 行政区数据服务
 * 管理行政区边界数据和相关操作
 */

// 从geo.js导入行政区数据
import { ListGuanQu } from '@/views/big-screen/js/geo.js';
import * as Cesium from 'cesium';

class DistrictDataService {
  /**
   * 获取所有行政区列表
   */
  getAllDistricts() {
    return [
      {
        id: 'heshan',
        name: '赫山区实验区域',
        type: 'polygon',
        positions: ListGuanQu,
        bounds: this.calculateBounds(ListGuanQu)
      }
      // 可以添加更多行政区
    ];
  }

  /**
   * 根据ID获取行政区
   */
  getDistrictById(id) {
    const districts = this.getAllDistricts();
    return districts.find(d => d.id === id);
  }

  /**
   * 将positions数组转换为coordinates数组
   * @param {Array} positions - [lon1, lat1, lon2, lat2, ...]
   * @returns {Array} [[lon1, lat1], [lon2, lat2], ...]
   */
  positionsToCoordinates(positions) {
    const coordinates = [];
    for (let i = 0; i < positions.length; i += 2) {
      coordinates.push([positions[i], positions[i + 1]]);
    }
    
    // 确保多边形闭合
    if (coordinates.length > 0) {
      const first = coordinates[0];
      const last = coordinates[coordinates.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        coordinates.push([...first]);
      }
    }
    
    return coordinates;
  }

  /**
   * 计算positions数组的边界框
   * @param {Array} positions - [lon1, lat1, lon2, lat2, ...]
   * @returns {Object} {minLon, maxLon, minLat, maxLat}
   */
  calculateBounds(positions) {
    if (!positions || positions.length < 2) {
      return null;
    }

    let minLon = Infinity;
    let maxLon = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    for (let i = 0; i < positions.length; i += 2) {
      const lon = positions[i];
      const lat = positions[i + 1];
      
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }

    return {
      minLon,
      maxLon,
      minLat,
      maxLat
    };
  }

  /**
   * 获取行政区的中心点
   * @param {Object} bounds - 边界框
   * @returns {Object} {lon, lat}
   */
  getCenter(bounds) {
    if (!bounds) return null;
    
    return {
      lon: (bounds.minLon + bounds.maxLon) / 2,
      lat: (bounds.minLat + bounds.maxLat) / 2
    };
  }

  /**
   * 在Cesium地图上高亮显示行政区
   * @param {Object} viewer - Cesium Viewer
   * @param {Array} positions - 行政区坐标
   * @param {Object} options - 样式选项
   */
  highlightDistrict(viewer, positions, options = {}) {
    if (!viewer || !positions) return null;

    const {
      fillColor = Cesium.Color.CYAN.withAlpha(0.2),
      outlineColor = Cesium.Color.CYAN.withAlpha(0.8),
      outlineWidth = 3
    } = options;

    // 创建多边形实体
    const entity = viewer.entities.add({
      name: 'district-highlight',
      polygon: {
        hierarchy: Cesium.Cartesian3.fromDegreesArray(positions),
        material: fillColor,
        outline: true,
        outlineColor: outlineColor,
        outlineWidth: outlineWidth,
        height: 0
      }
    });

    // 飞到该区域
    viewer.flyTo(entity, {
      duration: 1.5,
      offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-45), 50000)
    });

    return entity;
  }

  /**
   * 移除高亮
   * @param {Object} viewer - Cesium Viewer
   */
  removeHighlight(viewer) {
    if (!viewer) return;
    
    const entities = viewer.entities.values.filter(
      entity => entity.name === 'district-highlight'
    );
    
    entities.forEach(entity => {
      viewer.entities.remove(entity);
    });
  }

  /**
   * 获取行政区边界坐标
   * @param {string} districtId - 行政区ID
   * @returns {Array|null} 边界坐标数组 [[lon, lat], ...]
   */
  getDistrictBoundary(districtId) {
    const district = this.getDistrictById(districtId);
    if (!district || !district.positions) {
      return null;
    }
    return this.positionsToCoordinates(district.positions);
  }

  /**
   * 获取行政区完整数据（包含边界和元数据）
   * @param {string} districtId - 行政区ID
   * @returns {Object|null} 行政区数据
   */
  getDistrictData(districtId) {
    const district = this.getDistrictById(districtId);
    if (!district) {
      return null;
    }

    return {
      id: district.id,
      name: district.name,
      type: district.type,
      positions: district.positions,
      coordinates: this.positionsToCoordinates(district.positions),
      bounds: district.bounds,
      center: this.getCenter(district.bounds)
    };
  }
}

// 导出单例
export default new DistrictDataService();
