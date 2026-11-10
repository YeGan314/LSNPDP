/**
 * 天气API服务
 * 使用高德天气API获取城市级实时天气数据
 * 文档: https://lbs.amap.com/api/webservice/guide/api/weatherinfo
 */

// 复用高德地图API Key
const AMAP_WEB_API_KEY = '5dc9139439c4a7ff7347a215a785010b';
const AMAP_API_BASE = 'https://restapi.amap.com/v3';

// 💾 内存缓存：Map<cityKey, {data, timestamp}>
const weatherCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 缓存10分钟

/**
 * 获取实时天气信息
 * @param {string} city - 城市名称或adcode（如：武汉、420100）
 * @param {string} extensions - base=实况天气，all=预报天气
 * @returns {Promise<Object>} 天气数据
 */
export const getWeather = async (city = '武汉', extensions = 'base') => {
  const cacheKey = `${city}_${extensions}`;
  
  // 1. 检查缓存
  if (weatherCache.has(cacheKey)) {
    const cached = weatherCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`💾 使用天气缓存: ${city} (${extensions})`);
      return cached.data;
    } else {
      weatherCache.delete(cacheKey); // 过期清理
    }
  }

  try {
    const params = new URLSearchParams({
      key: AMAP_WEB_API_KEY,
      city: city,
      extensions: extensions,
      output: 'json'
    });

    const response = await fetch(`${AMAP_API_BASE}/weather/weatherInfo?${params}`);
    const data = await response.json();

    let result = { success: false, error: data.info || '天气查询失败' };

    if (data.status === '1') {
      if (extensions === 'base' && data.lives && data.lives.length > 0) {
        const live = data.lives[0];
        result = {
          success: true,
          province: live.province,
          city: live.city,
          adcode: live.adcode,
          weather: live.weather,
          temperature: live.temperature,
          winddirection: live.winddirection,
          windpower: live.windpower,
          humidity: live.humidity,
          reporttime: live.reporttime
        };
      } else if (extensions === 'all' && data.forecasts && data.forecasts.length > 0) {
        const forecast = data.forecasts[0];
        result = {
          success: true,
          city: forecast.city,
          adcode: forecast.adcode,
          reporttime: forecast.reporttime,
          casts: forecast.casts // 预报列表
        };
      }
    }

    // 2. 写入缓存（仅当成功时）
    if (result.success) {
      weatherCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
    }

    return result;
  } catch (error) {
    console.error('❌ 天气查询失败:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 根据行政区代码获取天气
 * @param {string} adcode - 行政区代码（城市级，如：420100）
 * @returns {Promise<Object>} 天气数据
 */
export const getWeatherByAdcode = async (adcode) => {
  // 高德天气API支持adcode查询
  return await getWeather(adcode);
};

/**
 * 根据城市名称获取天气
 * @param {string} cityName - 城市名称（如：武汉、岳阳）
 * @returns {Promise<Object>} 天气数据
 */
export const getWeatherByCity = async (cityName) => {
  return await getWeather(cityName);
};

/**
 * 格式化风向和风力显示
 * @param {string} direction - 风向
 * @param {string} power - 风力级别
 * @returns {string} 格式化后的风向风力
 */
export const formatWind = (direction, power) => {
  if (!direction || direction === '无持续风向') {
    return '无风';
  }
  
  // 将风力级别转换为大致风速
  // 参考：0级=0m/s, 1级=1m/s, 2级=2.5m/s, 3级=4.5m/s, 4级=7m/s...
  const powerMap = {
    '0': 0,
    '1': 1,
    '2': 2.5,
    '3': 4.5,
    '4': 7,
    '5': 10,
    '6': 13,
    '7': 16,
    '8': 20
  };
  
  // 处理如 '≤3' 这种格式
  let cleanPower = power;
  if (typeof power === 'string') {
    // 提取数字
    const match = power.match(/\d+/);
    if (match) {
      cleanPower = match[0];
    }
  }
  
  const speed = powerMap[cleanPower] || parseInt(cleanPower) * 2;
  
  if (isNaN(speed)) {
    return `${direction} --`;
  }
  
  const speedKmh = (speed * 3.6).toFixed(0); // m/s转km/h
  
  return `${direction} ${speedKmh} km/h`;
};

/**
 * 获取默认城市天气（武汉）
 * @returns {Promise<Object>} 武汉天气数据
 */
export const getDefaultWeather = async () => {
  console.log('📍 获取默认天气: 武汉');
  return await getWeather('武汉');
};

/**
 * 🌏 省会城市映射表（扩展版）
 */
export const PROVINCE_CAPITALS = {
  '北京市': '北京', '天津市': '天津', '上海市': '上海', '重庆市': '重庆',
  '河北省': '石家庄', '山西省': '太原', '辽宁省': '沈阳', '吉林省': '长春', '黑龙江省': '哈尔滨',
  '江苏省': '南京', '浙江省': '杭州', '安徽省': '合肥', '福建省': '福州', '江西省': '南昌',
  '山东省': '济南', '河南省': '郑州', '湖北省': '武汉', '湖南省': '长沙', '广东省': '广州',
  '海南省': '海口', '四川省': '成都', '贵州省': '贵阳', '云南省': '昆明', '陕西省': '西安',
  '甘肃省': '兰州', '青海省': '西宁', '台湾省': '台北',
  '内蒙古自治区': '呼和浩特', '广西壮族自治区': '南宁', '西藏自治区': '拉萨',
  '宁夏回族自治区': '银川', '新疆维吾尔自治区': '乌鲁木齐',
  '香港特别行政区': '香港', '澳门特别行政区': '澳门',
  // 简写兼容
  '河北': '石家庄', '山西': '太原', '辽宁': '沈阳', '吉林': '长春', '黑龙江': '哈尔滨',
  '江苏': '南京', '浙江': '杭州', '安徽': '合肥', '福建': '福州', '江西': '南昌',
  '山东': '济南', '河南': '郑州', '湖北': '武汉', '湖南': '长沙', '广东': '广州',
  '海南': '海口', '四川': '成都', '贵州': '贵阳', '云南': '昆明', '陕西': '西安',
  '甘肃': '兰州', '青海': '西宁', '台湾': '台北', '内蒙古': '呼和浩特', '广西': '南宁',
  '西藏': '拉萨', '宁夏': '银川', '新疆': '乌鲁木齐', '香港': '香港', '澳门': '澳门'
};

export default {
  getWeather,
  getWeatherByAdcode,
  getWeatherByCity,
  formatWind,
  getDefaultWeather,
  PROVINCE_CAPITALS
};
