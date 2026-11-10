/**
 * 高德地图地理编码工具类
 * 用于行政区划定位、地址解析、坐标转换等
 * 
 * API文档: https://lbs.amap.com/api/webservice/guide/api/georegeo
 */

// 高德地图 Web 服务 API Key
// 请在高德开放平台申请: https://console.amap.com/dev/key/app
const AMAP_WEB_API_KEY = '5dc9139439c4a7ff7347a215a785010b'; // 请替换为你的API Key

// API 基础地址
const AMAP_API_BASE = 'https://restapi.amap.com/v3';

/**
 * 地理编码 - 通过地址获取坐标
 * @param {string} address - 地址字符串（如"湖南省岳阳市岳阳楼区"）
 * @param {string} city - 城市名称（可选，用于提高准确性）
 * @returns {Promise<Object>} 包含经纬度的结果
 */
export const geocode = async (address, city = '') => {
  try {
    const params = new URLSearchParams({
      key: AMAP_WEB_API_KEY,
      address: address,
      city: city || '',
      output: 'json'
    });

    const response = await fetch(`${AMAP_API_BASE}/geocode/geo?${params}`);
    const data = await response.json();

    if (data.status === '1' && data.geocodes && data.geocodes.length > 0) {
      const result = data.geocodes[0];
      const [lng, lat] = result.location.split(',').map(Number);
      
      return {
        success: true,
        longitude: lng,
        latitude: lat,
        formatted_address: result.formatted_address,
        province: result.province,
        city: result.city,
        district: result.district,
        adcode: result.adcode,
        level: result.level
      };
    } else {
      return {
        success: false,
        error: data.info || '地理编码失败'
      };
    }
  } catch (error) {
    console.error('地理编码请求失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 逆地理编码 - 通过坐标获取地址信息
 * @param {number} lng - 经度
 * @param {number} lat - 纬度
 * @returns {Promise<Object>} 地址信息
 */
export const regeocode = async (lng, lat) => {
  try {
    const params = new URLSearchParams({
      key: AMAP_WEB_API_KEY,
      location: `${lng},${lat}`,
      output: 'json',
      extensions: 'all'
    });

    const response = await fetch(`${AMAP_API_BASE}/geocode/regeo?${params}`);
    const data = await response.json();

    if (data.status === '1' && data.regeocode) {
      const addressComponent = data.regeocode.addressComponent;
      
      return {
        success: true,
        formatted_address: data.regeocode.formatted_address,
        province: addressComponent.province,
        city: addressComponent.city,
        district: addressComponent.district,
        township: addressComponent.township,
        street: addressComponent.streetNumber?.street || '',
        adcode: addressComponent.adcode,
        location: { lng, lat }
      };
    } else {
      return {
        success: false,
        error: data.info || '逆地理编码失败'
      };
    }
  } catch (error) {
    console.error('逆地理编码请求失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 获取行政区划信息
 * @param {string} keywords - 行政区关键词（如"岳阳市"）
 * @param {number} subdistrict - 子级别（0=不返回，1=返回下一级，2=返回下两级，3=返回下三级）
 * @param {boolean} extensions - 是否返回边界坐标
 * @returns {Promise<Object>} 行政区划信息
 */
export const getDistrict = async (keywords, subdistrict = 1, extensions = false) => {
  try {
    const params = new URLSearchParams({
      key: AMAP_WEB_API_KEY,
      keywords: keywords,
      subdistrict: subdistrict.toString(),
      extensions: extensions ? 'all' : 'base',
      output: 'json'
    });

    const response = await fetch(`${AMAP_API_BASE}/config/district?${params}`);
    const data = await response.json();

    // 增加调试日志
    if (data.status !== '1') {
        console.error('⚠️ 高德API请求返回错误:', data);
    } else if (!data.districts || data.districts.length === 0) {
        console.warn('⚠️ 高德API未查询到行政区数据:', { keywords, subdistrict, data });
    } else {
       // 检查是否真的获取到了下级数据
       const district = data.districts[0];
       if (Number(subdistrict) > 0 && (!district.districts || district.districts.length === 0)) {
           console.warn(`⚠️ 高德API: 已找到行政区 "${district.name}"，但未获取到下级行政区 (期望级别: ${subdistrict})`, district);
       }
    }

    if (data.status === '1' && data.districts && data.districts.length > 0) {
      const district = data.districts[0];
      const [lng, lat] = district.center.split(',').map(Number);
      
      return {
        success: true,
        adcode: district.adcode,
        name: district.name,
        center: { lng, lat },
        level: district.level,
        districts: district.districts || [],
        polyline: district.polyline || null // 边界坐标（如果 extensions=all）
      };
    } else {
      return {
        success: false,
        error: data.info || '行政区查询失败'
      };
    }
  } catch (error) {
    console.error('行政区查询失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 根据行政区代码获取中心点坐标
 * @param {string|number} adcode - 行政区代码（6位）
 * @returns {Promise<Object>} 中心点坐标
 */
export const getDistrictCenter = async (adcode) => {
  try {
    const params = new URLSearchParams({
      key: AMAP_WEB_API_KEY,
      keywords: adcode.toString(),
      subdistrict: '0',
      extensions: 'base',
      output: 'json'
    });

    const response = await fetch(`${AMAP_API_BASE}/config/district?${params}`);
    const data = await response.json();

    if (data.status === '1' && data.districts && data.districts.length > 0) {
      const district = data.districts[0];
      const [lng, lat] = district.center.split(',').map(Number);
      
      return {
        success: true,
        adcode: district.adcode,
        name: district.name,
        center: { lng, lat },
        level: district.level
      };
    } else {
      return {
        success: false,
        error: data.info || '行政区查询失败'
      };
    }
  } catch (error) {
    console.error('行政区中心点查询失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 批量获取行政区中心点
 * @param {Array<string|number>} adcodes - 行政区代码数组
 * @returns {Promise<Array>} 中心点坐标数组
 */
export const batchGetDistrictCenters = async (adcodes) => {
  const promises = adcodes.map(adcode => getDistrictCenter(adcode));
  const results = await Promise.all(promises);
  return results.filter(r => r.success);
};

/**
 * 坐标转换 - GCJ-02（火星坐标）转 WGS84
 * 高德地图使用的是 GCJ-02 坐标系，Cesium 使用 WGS84
 * 
 * @param {number} lng - 经度（GCJ-02）
 * @param {number} lat - 纬度（GCJ-02）
 * @returns {Object} WGS84 坐标
 */
export const gcj02ToWgs84 = (lng, lat) => {
  const a = 6378245.0; // 长半轴
  const ee = 0.00669342162296594323; // 偏心率平方
  
  const transformLat = (x, y) => {
    let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin(y / 3.0 * Math.PI)) * 2.0 / 3.0;
    ret += (160.0 * Math.sin(y / 12.0 * Math.PI) + 320 * Math.sin(y * Math.PI / 30.0)) * 2.0 / 3.0;
    return ret;
  };
  
  const transformLng = (x, y) => {
    let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin(x / 3.0 * Math.PI)) * 2.0 / 3.0;
    ret += (150.0 * Math.sin(x / 12.0 * Math.PI) + 300.0 * Math.sin(x / 30.0 * Math.PI)) * 2.0 / 3.0;
    return ret;
  };
  
  let dLat = transformLat(lng - 105.0, lat - 35.0);
  let dLng = transformLng(lng - 105.0, lat - 35.0);
  const radLat = lat / 180.0 * Math.PI;
  let magic = Math.sin(radLat);
  magic = 1 - ee * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * Math.PI);
  dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * Math.PI);
  
  const wgsLat = lat - dLat;
  const wgsLng = lng - dLng;
  
  return {
    lng: wgsLng,
    lat: wgsLat
  };
};

/**
 * 批量坐标转换
 * @param {Array<{lng: number, lat: number}>} coords - GCJ-02坐标数组
 * @returns {Array<{lng: number, lat: number}>} WGS84坐标数组
 */
export const batchGcj02ToWgs84 = (coords) => {
  return coords.map(coord => gcj02ToWgs84(coord.lng, coord.lat));
};

/**
 * 检查 API Key 是否配置
 * @returns {boolean}
 */
export const isApiKeyConfigured = () => {
  return AMAP_WEB_API_KEY && AMAP_WEB_API_KEY !== 'YOUR_AMAP_API_KEY';
};

/**
 * 获取配置状态
 * @returns {Object}
 */
export const getConfigStatus = () => {
  return {
    isConfigured: isApiKeyConfigured(),
    apiKey: AMAP_WEB_API_KEY === 'YOUR_AMAP_API_KEY' ? '未配置' : '已配置',
    message: isApiKeyConfigured() 
      ? '✅ 高德地图API已配置' 
      : '⚠️ 请在 src/utils/amapGeocoder.js 中配置高德地图 API Key'
  };
};

/**
 * 关键字搜索POI
 * @param {string} keywords - 关键词
 * @param {string} city - 城市（名称或adcode）
 * @returns {Promise<Array>} POI列表
 */
export const searchPois = async (keywords, city = '') => {
  try {
    const params = new URLSearchParams({
      key: AMAP_WEB_API_KEY,
      keywords: keywords,
      city: city,
      citylimit: 'true',
      output: 'json'
    });

    const response = await fetch(`${AMAP_API_BASE}/place/text?${params}`);
    const data = await response.json();

    if (data.status === '1' && data.pois && data.pois.length > 0) {
      return data.pois.map(poi => {
        const [lng, lat] = poi.location.split(',').map(Number);
        return {
          id: poi.id,
          name: poi.name,
          location: { lng, lat },
          address: poi.address,
          adcode: poi.adcode,
          type: poi.type
        };
      });
    } else {
      return [];
    }
  } catch (error) {
    console.error('POI搜索失败:', error);
    return [];
  }
};

// 默认导出
export default {
  geocode,
  regeocode,
  getDistrict,
  getDistrictCenter,
  batchGetDistrictCenters,
  gcj02ToWgs84,
  batchGcj02ToWgs84,
  isApiKeyConfigured,
  getConfigStatus,
  searchPois
};
