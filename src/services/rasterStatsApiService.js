/**
 * 栅格统计API服务客户端
 * 用于调用Python后端的栅格统计分析服务
 */

const API_BASE_URL = 'http://localhost:3000/api';

class RasterStatsApiService {
  /**
   * 健康检查
   */
  async healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return await response.json();
    } catch (error) {
      console.error('健康检查失败:', error);
      throw error;
    }
  }

  /**
   * 矩形范围统计
   * @param {Object} bounds - 范围 {minLon, maxLon, minLat, maxLat}
   * @param {string} tifPath - TIF文件路径（可选）
   * @param {number} pixelSizeM - 格网大小（米，可选，默认100）
   * @returns {Promise<Object>} 统计结果
   */
  async analyzeByBounds(bounds, tifPath = null, pixelSizeM = 100) {
    console.log('📊 开始矩形范围统计:', bounds);
    
    const requestData = {
      bounds: bounds,
      pixel_size_m: pixelSizeM
    };
    
    if (tifPath) {
      requestData.tif_path = tifPath;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/stats/bounds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ 统计成功:', result.data);
        return result;
      } else {
        console.error('❌ 统计失败:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('请求失败:', error);
      throw error;
    }
  }

  /**
   * 多边形范围统计
   * @param {Array} coordinates - 多边形坐标 [[lon, lat], ...]
   * @param {string} tifPath - TIF文件路径（可选）
   * @param {number} pixelSizeM - 格网大小（米，可选，默认100）
   * @returns {Promise<Object>} 统计结果
   */
  async analyzeByPolygon(coordinates, tifPath = null, pixelSizeM = 100) {
    console.log('📊 开始多边形范围统计, 顶点数:', coordinates.length);
    
    const requestData = {
      coordinates: coordinates,
      pixel_size_m: pixelSizeM
    };
    
    if (tifPath) {
      requestData.tif_path = tifPath;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/stats/polygon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ 统计成功:', result.data);
        return result;
      } else {
        console.error('❌ 统计失败:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('请求失败:', error);
      throw error;
    }
  }

  /**
   * 批量统计多个范围
   * @param {Array} ranges - 范围数组
   * @param {string} tifPath - TIF文件路径（可选）
   * @param {number} pixelSizeM - 格网大小（米，可选，默认100）
   * @returns {Promise<Object>} 统计结果
   */
  async analyzeBatch(ranges, tifPath = null, pixelSizeM = 100) {
    console.log('📊 开始批量统计, 范围数:', ranges.length);
    
    const requestData = {
      ranges: ranges,
      pixel_size_m: pixelSizeM
    };
    
    if (tifPath) {
      requestData.tif_path = tifPath;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/stats/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ 批量统计成功');
        return result;
      } else {
        console.error('❌ 批量统计失败:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('请求失败:', error);
      throw error;
    }
  }

  /**
   * 从positions数组转换为coordinates数组
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
   * 格式化统计结果为表格数据
   * @param {Object} statsData - API返回的统计数据
   * @returns {Array} 表格数据
   */
  formatStatsForTable(statsData) {
    if (!statsData || !statsData.risk_levels) {
      return [];
    }
    
    return statsData.risk_levels.map(level => ({
      level: level.level,
      levelName: `风险等级 ${level.level}`,
      pixelCount: level.pixel_count,
      areaM2: level.area_m2,
      areaKm2: level.area_km2,
      areaHectare: level.area_hectare,
      percentage: level.percentage
    }));
  }

  /**
   * 生成统计报告文本
   * @param {Object} statsData - API返回的统计数据
   * @returns {string} 报告文本
   */
  generateReport(statsData) {
    if (!statsData) return '';
    
    let report = '栅格统计分析报告\n';
    report += '='.repeat(60) + '\n\n';
    
    if (statsData.bounds) {
      report += `分析范围:\n`;
      report += `  经度: ${statsData.bounds.minLon} - ${statsData.bounds.maxLon}\n`;
      report += `  纬度: ${statsData.bounds.minLat} - ${statsData.bounds.maxLat}\n\n`;
    }
    
    if (statsData.polygon) {
      report += `多边形:\n`;
      report += `  顶点数: ${statsData.polygon.vertices}\n\n`;
    }
    
    report += `格网大小: ${statsData.pixel_size_m}米\n`;
    report += `总像素数: ${statsData.total_pixels.toLocaleString()}\n`;
    report += `总面积: ${statsData.total_area_km2} km²\n\n`;
    
    report += '风险等级分布:\n';
    report += '-'.repeat(60) + '\n';
    
    statsData.risk_levels.forEach(level => {
      report += `等级 ${level.level}: ${level.area_km2} km² (${level.percentage}%)\n`;
    });
    
    report += '='.repeat(60) + '\n';
    
    return report;
  }
}

// 导出单例
export default new RasterStatsApiService();
