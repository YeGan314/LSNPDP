/**
 * @Description: 行政区数据API服务
 * @Date: 2025-11-18
 * @Update: 2025-11-24 - 改为使用阿里云DataV服务（无需本地数据库）
 */

import axios from 'axios';
import amapGeocoder from '@/utils/amapGeocoder';

// 阿里云DataV GeoAtlas API基础地址
const DATAV_BASE_URL = 'https://geo.datav.aliyun.com/areas_v3/bound';

// 缓存
const cache = new Map();

/**
 * 获取省级行政区列表
 * @returns {Promise<Array>} 省级列表
 */
export const getProvinces = async () => {
  try {
    // 检查缓存
    if (cache.has('provinces')) {
      console.log('✅ 使用缓存的省级数据');
      return cache.get('provinces');
    }

    console.log('🌐 从阿里云DataV获取省级数据...');
    
    // 获取全国数据（包含所有省份）
    const response = await axios.get(`${DATAV_BASE_URL}/100000_full.json`);
    
    if (response.data && response.data.features) {
      const provinces = response.data.features.map(feature => ({
        code: String(feature.properties.adcode).padEnd(12, '0'),
        name: feature.properties.name,
        level: 1,
        adcode: feature.properties.adcode,
        center: feature.properties.center || feature.properties.centroid,
        childrenNum: feature.properties.childrenNum || 0
      }));

      // 缓存数据
      cache.set('provinces', provinces);
      
      console.log(`✅ 获取省级数据成功，共 ${provinces.length} 个省份`);
      return provinces;
    }
    
    return [];
  } catch (error) {
    console.error('❌ 获取省份数据失败:', error);
    return [];
  }
};

/**
 * 获取市级行政区列表
 * @param {string} provinceCode - 省级行政区代码（12位或6位）
 * @returns {Promise<Array>} 市级列表
 */
export const getCities = async (provinceCode) => {
  try {
    // 转换为6位代码
    const adcode = String(provinceCode).substring(0, 6);
    
    // 检查缓存
    const cacheKey = `cities_${adcode}`;
    if (cache.has(cacheKey)) {
      console.log(`✅ 使用缓存的市级数据: ${adcode}`);
      return cache.get(cacheKey);
    }

    console.log(`🌐 从阿里云DataV获取市级数据: ${adcode}`);
    
    // 获取省份的完整数据（包含下属市）
    const response = await axios.get(`${DATAV_BASE_URL}/${adcode}_full.json`);
    
    if (response.data && response.data.features) {
      const cities = response.data.features.map(feature => ({
        code: String(feature.properties.adcode).padEnd(12, '0'),
        name: feature.properties.name,
        level: 2,
        adcode: feature.properties.adcode,
        center: feature.properties.center || feature.properties.centroid,
        childrenNum: feature.properties.childrenNum || 0,
        parent: adcode
      }));

      // 缓存数据
      cache.set(cacheKey, cities);
      
      console.log(`✅ 获取市级数据成功: ${adcode}，共 ${cities.length} 个城市`);
      return cities;
    }
    
    return [];
  } catch (error) {
    console.error(`❌ 获取城市数据失败: ${provinceCode}`, error);
    return [];
  }
};

/**
 * 获取县级行政区列表
 * @param {string} cityCode - 市级行政区代码（12位或6位）
 * @returns {Promise<Array>} 县级列表
 */
export const getCounties = async (cityCode) => {
  try {
    // 转换为6位代码
    const adcode = String(cityCode).substring(0, 6);
    
    // 检查缓存
    const cacheKey = `counties_${adcode}`;
    if (cache.has(cacheKey)) {
      console.log(`✅ 使用缓存的区县数据: ${adcode}`);
      return cache.get(cacheKey);
    }

    console.log(`🌐 从阿里云DataV获取区县数据: ${adcode}`);
    
    // 获取城市的完整数据（包含下属区县）
    const response = await axios.get(`${DATAV_BASE_URL}/${adcode}_full.json`);
    
    if (response.data && response.data.features) {
      const counties = response.data.features.map(feature => ({
        code: String(feature.properties.adcode).padEnd(12, '0'),
        name: feature.properties.name,
        level: 3,
        adcode: feature.properties.adcode,
        center: feature.properties.center || feature.properties.centroid,
        childrenNum: feature.properties.childrenNum || 0,
        parent: adcode
      }));

      // 缓存数据
      cache.set(cacheKey, counties);
      
      console.log(`✅ 获取区县数据成功: ${adcode}，共 ${counties.length} 个区县`);
      return counties;
    }
    
    return [];
  } catch (error) {
    console.error(`❌ 获取区县数据失败: ${cityCode}`, error);
    return [];
  }
};

/**
 * 获取乡镇级行政区列表
 * ⚠️ 阿里云DataV不提供乡镇级数据，使用高德地图API获取
 * @param {string} countyCode - 区县级行政区代码
 * @returns {Promise<Array>} 乡镇列表
 */
export const getTowns = async (countyCode) => {
  try {
    // 转换为6位代码
    const adcode = String(countyCode).substring(0, 6);
    const cacheKey = `towns_${adcode}`;

    // 检查缓存
    if (cache.has(cacheKey)) {
      console.log(`✅ 使用缓存的乡镇数据: ${adcode}`);
      return cache.get(cacheKey);
    }

    console.log(`🌐 从高德API获取乡镇数据: ${adcode}`);
    
    // 检查API配置
    if (!amapGeocoder.isApiKeyConfigured()) {
      console.warn('⚠️ 高德API Key未配置，无法获取乡镇数据');
      return [];
    }

    // 调用高德API获取下一级行政区（乡镇）
    const result = await amapGeocoder.getDistrict(adcode, 1);
    
    if (result.success && result.districts && result.districts.length > 0) {
      const towns = result.districts.map(town => ({
        code: String(town.adcode).padEnd(12, '0'),
        name: town.name,
        level: 4, // 乡镇级
        adcode: town.adcode,
        center: town.center.split(',').map(Number),
        childrenNum: 0, // 暂不获取村级数量
        parent: adcode
      }));

      // 缓存数据
      cache.set(cacheKey, towns);
      
      console.log(`✅ 获取乡镇数据成功: ${adcode}，共 ${towns.length} 个乡镇`);
      return towns;
    }
    
    return [];
  } catch (error) {
    console.error('❌ 获取乡镇数据失败:', error);
    return [];
  }
};

/**
 * 获取村级行政区列表
 * ⚠️ 阿里云DataV不提供村级数据，尝试使用高德地图API获取
 * @param {string} townCode - 乡镇级行政区代码
 * @returns {Promise<Array>} 村级列表
 */
export const getVillages = async (townCode) => {
  try {
    // 注意：村级查询可能需要更精确的代码，但高德主要基于区县查下级
    // 实际上高德API行政区查询行政区划最深只到乡镇(subdistrict=1 on district)，村级数据通常不通过此接口直接提供全量列表
    // 但我们可以尝试查询该乡镇的POI或下一级，不过standard district API usually stops at town.
    // 此处我们尝试复用getDistrict但指定关键字为乡镇代码，看是否有下级
    // 如果没有，返回空数组
    
    console.log(`🌐 尝试从高德API获取村级数据: ${townCode}`);
    
    // 检查API配置
    if (!amapGeocoder.isApiKeyConfigured()) {
      return [];
    }

    // 尝试查询该乡镇的下级
    // 1. 先尝试标准行政区查询 (有些区域可能支持)
    const result = await amapGeocoder.getDistrict(townCode, 1);
    
    if (result.success && result.districts && result.districts.length > 0) {
        // 检查是否真的有下一级
        const town = result.districts[0];
        if (town.districts && town.districts.length > 0) {
             const villages = town.districts.map(v => ({
                code: String(v.adcode).padEnd(12, '0'),
                name: v.name,
                level: 5, // 村级
                adcode: v.adcode,
                center: v.center.split(',').map(Number),
                childrenNum: 0,
                parent: townCode
              }));
              console.log(`✅ getDistrict获取村级数据成功: ${townCode}，共 ${villages.length} 个`);
              return villages;
        }
    }
    
    // 2. 如果标准查询失败，尝试使用POI搜索关键字 "村" 或 "社区"
    // 获取乡镇名称（如果 result 成功获取了乡镇信息）
    let townName = '';
    if (result.success && result.districts && result.districts.length > 0) {
        townName = result.districts[0].name;
    }
    
    // 如果没有拿到名称，暂时无法搜索（或者需要先查乡镇详情）
    if (townName) {
        console.log(`🔄 尝试POI搜索获取村级数据: ${townName} (村/社区)`);
        // 搜索关键字：乡镇名 + "村" 或 "社区"
        // 注意：这里搜索可能会包含杂项，需要过滤
        // 简单起见，我们搜索 "村" 关键字，限制在当前城市/乡镇
        // 但 POI 搜索的 city 参数通常是 city adcode
        
        // 组合查询：先搜"村"，再搜"社区"
        const pois = await amapGeocoder.searchPois(`${townName}村`, townCode); // 尝试限定在乡镇代码区域(如果API支持)
        
        if (pois && pois.length > 0) {
             // 过滤结果，只保留看起来像村名的
             // 这里的 type 过滤可能需要调整
             const villages = pois.map(poi => ({
                code: String(poi.id).padEnd(12, '0'), // 使用POI ID作为临时代码
                name: poi.name,
                level: 5, // 村级
                adcode: poi.adcode,
                center: [poi.location.lng, poi.location.lat],
                childrenNum: 0,
                parent: townCode
             }));
             console.log(`✅ POI搜索获取村级数据成功: ${townCode}，共 ${villages.length} 个`);
             return villages;
        }
    }
    
    console.warn('⚠️ 高德API标准接口及POI搜索均未返回村级数据');
    return [];
  } catch (error) {
    console.error('❌ 获取村级数据失败:', error);
    return [];
  }
};

/**
 * 根据关键词搜索行政区
 * 💡 基于缓存数据进行本地搜索
 * @param {string} keyword - 搜索关键词
 * @param {number} level - 行政区级别（1=省，2=市，3=区县）
 * @returns {Promise<Array>} 搜索结果
 */
export const searchRegion = async (keyword, level = null) => {
  try {
    console.log(`🔍 搜索行政区: "${keyword}", 级别: ${level || '全部'}`);
    
    const results = [];
    
    // 搜索省级
    if (!level || level === 1) {
      const provinces = await getProvinces();
      const matched = provinces.filter(p => p.name.includes(keyword));
      results.push(...matched);
    }
    
    // 如果关键词较短，只搜索省级
    if (keyword.length < 2) {
      return results;
    }
    
    // 搜索市级（需要先确定省份）
    if (!level || level === 2) {
      const provinces = await getProvinces();
      for (const province of provinces) {
        const cities = await getCities(province.code);
        const matched = cities.filter(c => c.name.includes(keyword));
        results.push(...matched);
      }
    }
    
    console.log(`✅ 搜索完成，找到 ${results.length} 条结果`);
    return results;
  } catch (error) {
    console.error('❌ 搜索行政区失败:', error);
    return [];
  }
};

/**
 * 获取完整的行政区路径
 * 💡 基于行政区代码规则推导路径
 * @param {string} code - 行政区代码（12位）
 * @returns {Promise<Object>} 完整路径信息
 */
export const getRegionPath = async (code) => {
  try {
    const codeStr = String(code);
    const result = {
      province: null,
      city: null,
      county: null,
      town: null,
      village: null,
    };
    
    // 提取省级代码（前2位）
    const provinceCode = codeStr.substring(0, 2) + '0000';
    const provinces = await getProvinces();
    result.province = provinces.find(p => p.code.startsWith(provinceCode.substring(0, 2)));
    
    // 提取市级代码（前4位）
    if (codeStr.substring(2, 4) !== '00') {
      const cityCode = codeStr.substring(0, 4) + '00';
      const cities = await getCities(provinceCode);
      result.city = cities.find(c => c.code.startsWith(cityCode.substring(0, 4)));
      
      // 提取县级代码（前6位）
      if (codeStr.substring(4, 6) !== '00') {
        const countyCode = codeStr.substring(0, 6);
        const counties = await getCounties(cityCode);
        result.county = counties.find(c => c.code.startsWith(countyCode));
      }
    }
    
    console.log(`✅ 获取行政区路径成功: ${code}`, result);
    return result;
  } catch (error) {
    console.error('❌ 获取行政区路径失败:', error);
    return {
      province: null,
      city: null,
      county: null,
      town: null,
      village: null,
    };
  }
};

/**
 * 批量获取行政区信息
 * @param {Array<string>} codes - 行政区代码数组
 * @returns {Promise<Array>} 行政区信息列表
 */
export const getBatchRegions = (codes) => {
  // 实际使用时替换为：
  // return request.post('/api/region/batch', { codes });
  
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`批量获取行政区信息，数量: ${codes.length}`);
      resolve([]);
    }, 300);
  });
};

export default {
  getProvinces,
  getCities,
  getCounties,
  getTowns,
  getVillages,
  searchRegion,
  getRegionPath,
  getBatchRegions,
};

