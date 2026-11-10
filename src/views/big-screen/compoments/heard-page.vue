<!--
 * @Author: YG 
 * @Date: 2025-11-11 14:28:44
 * @LastEditTime: 2025-11-11 14:30:54
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: \DTSWeekly_zhyq\src\Views\home\header\index.vue
-->
<!-- header -->
<template>
  <div>
    <div class="header" v-show="true">
      <div class="title">耒水流域新污染物智慧管理大数据平台</div>
      <!-- 行政区选择器 -->
      <div class="region-selector-wrapper">
        <RegionCascader
          :initial-value="initialRegion"
          @change="handleRegionChange"
          @complete="handleRegionComplete"
        />
      </div>
    </div>
    <div class="left-bg" v-show="true">
      <div class="weather-box">
        <!-- 左侧大图标 -->
        <div class="weather-icon-large">
          {{ weatherData.icon }}
        </div>

        <!-- 实时天气 -->
        <div class="weather-item">
          <div class="label">天气</div>
          <div class="value">{{ weatherData.weather }}</div>
        </div>
        <div class="weather-item">
          <div class="label">
            <span class="item-icon">🌡️</span>温度
          </div>
          <div class="value">{{ weatherData.temperature }}</div>
        </div>
        <div class="weather-item">
          <div class="label">
            <span class="item-icon">💧</span>湿度
          </div>
          <div class="value">{{ weatherData.humidity }}</div>
        </div>
        <div class="weather-item">
          <div class="label">
            <span class="item-icon">🌬️</span>风向
          </div>
          <div class="value">{{ weatherData.wind }}</div>
        </div>

        <!-- 简易预报展示 (hover显示或一直显示，这里做成小字展示) -->
        <div class="forecast-box" v-if="weatherData.forecasts.length > 0">
          <div v-for="(item, index) in weatherData.forecasts" :key="index" class="forecast-item">
            <span>{{ item.week }}</span>
            <span>{{ item.icon }}</span>
            <span>{{ item.dayTemp }}/{{ item.nightTemp }}℃</span>
          </div>
        </div>
      </div>
      <!-- 地区和时间显示 -->
      <div class="location-time-box">
        <span class="location">{{ weatherData.city }}</span>
        <span class="datetime">
          <span class="date">{{ currentDate }}</span>
          <span class="time">{{ currentTime }}</span>
        </span>
      </div>
    </div>
    <div class="right-bg" v-show="false">
      <div class="info"></div>
      <div class="tool">
        <div @click="UIClick">图标1</div>
        <div @click="UIClick">图标2</div>
        <div @click="UIClick">图标3</div>
      </div>
      <div class="time">
        <span>2023.11.11</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, onMounted, onUnmounted, watch } from 'vue';
import RegionCascader from "@/components/RegionCascader/index.vue";
import { getWeatherByCity, getWeatherByAdcode, formatWind, PROVINCE_CAPITALS, getWeather } from '@/api/weather';

const UIClick = () => {};

// 行政区选择器初始值：湖南省 -> 郴州市（进入后直接下钻区县/乡镇）
const initialRegion = {
  province: { code: '430000', name: '湖南省' },
  city: { code: '431000', name: '郴州市' },
};

// 当前日期时间
const currentDate = ref('');
const currentTime = ref('');
let timeInterval = null;

// 更新时间
const updateDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  currentDate.value = `${year}-${month}-${day}`;
  currentTime.value = `${hours}:${minutes}`;
};

// 天气图标映射
const getWeatherIcon = (weather) => {
  if (!weather) return '⛅';
  if (weather.includes('晴')) return '☀️';
  if (weather.includes('多云')) return '⛅';
  if (weather.includes('阴')) return '☁️';
  if (weather.includes('雨')) return '🌧️';
  if (weather.includes('雪')) return '❄️';
  if (weather.includes('雾') || weather.includes('霾')) return '🌫️';
  if (weather.includes('风')) return '🌬️';
  if (weather.includes('雷')) return '⚡';
  return '⛅';
};

// 天气数据
const weatherData = ref({
  temperature: '--',
  humidity: '--',
  wind: '--',
  weather: '--',
  icon: '⛅',
  city: '郴州',
  reporttime: '',
  loading: false,
  forecasts: [] // 未来天气预报
});


// 从父组件注入地图操作方法
const highlightProvinceOnMap = inject('highlightProvinceOnMap', null);
const clearProvinceHighlight = inject('clearProvinceHighlight', null);
const loadCityBoundaryOnMap = inject('loadCityBoundaryOnMap', null);
const highlightCityOnMap = inject('highlightCityOnMap', null);
const loadCountyBoundaryOnMap = inject('loadCountyBoundaryOnMap', null);
const highlightCountyOnMap = inject('highlightCountyOnMap', null);
const highlightTownOnMap = inject('highlightTownOnMap', null);
const highlightVillageOnMap = inject('highlightVillageOnMap', null);

// 从父组件注入行政区联动到栅格分析面板的方法
const onHeaderRegionChange = inject('onHeaderRegionChange', null);

// 当前选中的行政区数据
const currentRegion = ref({
  province: null,
  city: null,
  county: null,
  town: null,
  village: null,
  fullPath: ''
});
// 首次初始化（默认行政区回填）时不触发地图行政区联动
const skipInitialRegionLinkage = ref(true);

// 行政区选择变化处理
const handleRegionChange = (selection) => {
  console.log("🗺️ 行政区选择变化:", selection);
  
  // 更新当前选中数据
  currentRegion.value = {
    ...selection,
    fullPath: [
      selection.province?.name,
      selection.city?.name,
      selection.county?.name,
      selection.town?.name,
      selection.village?.name
    ].filter(Boolean).join(' > ')
  };

  // 初始化阶段仅回填选择器，不联动地图与统计面板
  if (skipInitialRegionLinkage.value) {
    skipInitialRegionLinkage.value = false;
    console.log('⏭️ 初始化行政区回填，跳过首次联动');
    return;
  }
  
  // 🎯 地图联动逻辑
  if (selection.province) {
    // 1. 高亮省份
    if (highlightProvinceOnMap) {
      highlightProvinceOnMap(selection.province.code);
      console.log(`✨ 地图高亮省份: ${selection.province.name}`);
    }
    
    // 2. 加载该省份的市级边界
    if (loadCityBoundaryOnMap) {
      loadCityBoundaryOnMap(selection.province.code);
      console.log(`🏙️ 加载省份 ${selection.province.name} 的市级边界`);
    }
    
    // 3. 如果选择了城市，高亮城市并加载区县边界
    if (selection.city) {
      if (highlightCityOnMap) {
        // 延迟一下，确保市级边界已加载
        setTimeout(() => {
          highlightCityOnMap(selection.city.code);
          console.log(`✨ 地图高亮城市: ${selection.city.name}`);
        }, 500);
      }
      
      // 加载该城市的区县边界
      if (loadCountyBoundaryOnMap) {
        setTimeout(() => {
          loadCountyBoundaryOnMap(selection.city.code);
          console.log(`🏢 加载城市 ${selection.city.name} 的区县边界`);
        }, 800);
      }
      
      // 4. 如果选择了区县，高亮区县
      if (selection.county && highlightCountyOnMap) {
        // 延迟一下，确保区县边界已加载
        setTimeout(() => {
          // 如果选中了乡镇，则不飞向区县
          const shouldFlyToCounty = !selection.town;
          highlightCountyOnMap(selection.county.code, shouldFlyToCounty);
          console.log(`✨ 地图高亮区县: ${selection.county.name} (是否缩放: ${shouldFlyToCounty})`);
        }, 1200);
      }

      // 5. 如果选择了乡镇，定位到乡镇
      if (selection.town && highlightTownOnMap) {
        // 延迟一下，确保乡镇数据已加载（highlightCountyOnMap 会触发加载）
        setTimeout(() => {
          highlightTownOnMap(selection.town); // 传递完整乡镇对象，以便使用名称匹配或坐标
          console.log(`✨ 地图定位乡镇: ${selection.town.name}`);
        }, 2000);
      }

      // 6. 如果选择了村，定位到村
      if (selection.village && highlightVillageOnMap) {
        // 延迟一下
        setTimeout(() => {
          highlightVillageOnMap(selection.village);
          console.log(`✨ 地图定位村: ${selection.village.name}`);
        }, 2500);
      }
    }
  } else {
    // 如果重置了选择，清除所有高亮
    if (clearProvinceHighlight) {
      clearProvinceHighlight();
      console.log('🔄 清除地图高亮');
    }
  }
  
  // 这里可以根据选择的行政区进行其他业务处理
  // 例如：
  // 1. 加载该区域的监测数据
  // 2. 更新统计图表
  // 3. 过滤数据列表
  // 4. 触发数据重新加载

  // 通知父组件（大屏主页面）进行栅格风险分析联动
  if (onHeaderRegionChange) {
    onHeaderRegionChange(selection);
  }
};

// 行政区选择完成处理（选择到最后一级）
const handleRegionComplete = (selection) => {
  console.log("✅ 行政区选择完成:", selection);
  console.log("📍 完整路径:", selection.path.join(" > "));
  console.log("📊 选择数据:", {
    省份: selection.province?.name,
    省份代码: selection.province?.code,
    城市: selection.city?.name,
    城市代码: selection.city?.code,
    区县: selection.county?.name,
    区县代码: selection.county?.code,
    乡镇: selection.town?.name,
    乡镇代码: selection.town?.code,
    村: selection.village?.name,
    村代码: selection.village?.code,
  });
  
  // 更新当前选中数据
  currentRegion.value = {
    ...selection,
    fullPath: selection.path.join(' > ')
  };
  
  // 这里可以触发更复杂的业务逻辑
  // 例如：
  // 1. 加载该区域的详细监测数据
  // 2. 地图定位到该区域
  // 3. 更新统计图表
  // 4. 发送请求到后端获取该区域数据
  // 5. 更新 Vuex/Pinia store
  
  // 示例：调用业务方法
  // loadRegionData(selection);
  // flyToRegion(selection);
  // updateDashboard(selection);
};

/**
 * 加载天气数据
 * @param {string} cityName - 城市名称
 * @param {string} adcode - 行政区代码（可选）
 */
const loadWeather = async (cityName = '郴州', adcode = null) => {
  weatherData.value.loading = true;
  
  try {
    console.log('🌤️ 获取天气数据:', cityName, adcode);
    
    // 优先使用adcode查询，更精准
    const result = adcode 
      ? await getWeatherByAdcode(adcode) 
      : await getWeatherByCity(cityName);
    
    if (result.success) {
      weatherData.value = {
        temperature: `${result.temperature}℃`,
        humidity: `${result.humidity}%`,
        wind: formatWind(result.winddirection, result.windpower),
        weather: result.weather,
        icon: getWeatherIcon(result.weather),
        city: result.city,
        reporttime: result.reporttime,
        loading: false,
        forecasts: weatherData.value.forecasts
      };
      
      // 加载天气预报
      loadForecast(cityName, adcode);
      
      console.log('✅ 天气数据更新成功:', weatherData.value);
    } else {
      console.error('❌ 天气查询失败:', result.error);
      // 保持当前数据或显示默认值
      weatherData.value.loading = false;
    }
  } catch (error) {
    console.error('❌ 天气加载异常:', error);
    weatherData.value.loading = false;
  }
};

/**
 * 加载天气预报
 */
const loadForecast = async (cityName, adcode) => {
  const result = await getWeather(adcode || cityName, 'all');
  if (result.success && result.casts) {
    // 取未来3天预报（今天、明天、后天）
    weatherData.value.forecasts = result.casts.slice(0, 3).map(item => ({
      date: item.date,
      week: ['日','一','二','三','四','五','六'][item.week],
      dayWeather: item.dayweather,
      nightWeather: item.nightweather,
      dayTemp: item.daytemp,
      nightTemp: item.nighttemp,
      icon: getWeatherIcon(item.dayweather)
    }));
  }
};

// 组件挂载时加载默认天气（湖南省郴州市）
onMounted(async () => {
  console.log('🌍 加载默认天气: 湖南省郴州市');
  await loadWeather('郴州', '431000');
  
  // 初始化时间并设置定时更新
  updateDateTime();
  timeInterval = setInterval(updateDateTime, 1000);
});

// 组件卸载时清除定时器
onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
});

// 监听行政区选择变化，更新天气
watch(currentRegion, (newRegion) => {
  if (newRegion.city) {
    // 选择了城市，加载该城市天气
    const cityName = newRegion.city.name;
    const cityAdcode = newRegion.city.code.substring(0, 6); // 取前6位作为城市代码
    
    console.log('🗺️ 行政区变化，更新天气:', cityName, cityAdcode);
    loadWeather(cityName, cityAdcode);
  } else if (newRegion.province) {
    // 只选择了省份，尝试加载省会城市天气
    const provinceName = newRegion.province.name;
    console.log('🗺️ 省份变化，加载省会天气:', provinceName);
    
    const capitalCity = PROVINCE_CAPITALS[provinceName] || provinceName.replace('省', '').replace('市', '');
    loadWeather(capitalCity);
  }
}, { deep: true });

// 可选：导出当前选中的行政区数据，供其他组件使用
defineExpose({
  currentRegion,
  weatherData,
  loadWeather
});
</script>
<style lang="scss" scoped>
.header {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  @include wHeight(105);
  // background: rgba(0, 0, 0, 0.301);
  background: url("~@/assets/bigScreen/基础/header/top_middle_bg@2x.png")
    no-repeat;
  background-size: 100% 100%;
  justify-content: center;
  top: 0;
  @include FontSize(12);
  z-index: 10;

  .logo {
    @include Width(400);
    @include wHeight(46);
    @include LineHeight(46);
    text-align: center;
    // background-size: 100% 100%;
    position: absolute;
    // @include Left(350);
    @include Left(0);
    right: 0;
    top: 0;
    // background: #000;
    margin: auto;
    display: flex;
    flex-direction: column;
    // align-items: center;
    justify-content: center;
    // @include PaddingTop(12);
    cursor: pointer;
    z-index: 100;

    .tit {
      @include FontSize(24);
      @include LetterSpacing(3);
      @include wHeight(40);
      //       font-family: Oppo, serif;

      @include MarginBottom(5);
      font-weight: 600;
      //text-shadow: 0 0 5px #98deff;
    }

    .titeng {
      @include FontSize(14);
    }
  }

  .rightbg {
    position: absolute;
    right: 0;
    @include Width(400);
    height: 100%;
    background: linear-gradient(
      to left,
      #000000d8 0%,
      #000000b6 20%,
      #00000098 40%,
      #00000077 60%,
      #00000054 80%,
      #00000000 100%
    );
  }

  .title {
    cursor: pointer;
    // @include FontSize(36);
    @include FontSize(26);
    color: #ffffff;
    position: absolute;
    @include Top(20);
    @include LetterSpacing(4.91);
    text-align: center;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    //@include tex
  }

  .region-selector-wrapper {
    position: absolute;
    right: 40px;
    top: 50%;
    transform: translateY(-50%);
    max-width: 40%;
    z-index: 200;
    
    @media (max-width: 1400px) {
      max-width: 45%;
      right: 30px;
    }
    
    @media (max-width: 1200px) {
      max-width: 50%;
      right: 20px;
    }
  }
}

.left-bg,
.right-bg {
  @include Width(756);
  @include wHeight(77);
  position: absolute;
  @include Top(-10);
  z-index: 20;
  @include PaddingRight(60);
}

.left-bg {
  left: 0;
  background: url("~@/assets/bigScreen/基础/top_left_bg@2x.png") no-repeat;
  background-size: 100% 100%;
  display: flex;
  //justify-content: center;
  align-items: center;

  .weather-box {
    @include PaddingLeft(63);
    display: flex;
    @include PaddingTop(20);
    align-items: center;

    // 左侧大图标样式
    .weather-icon-large {
      @include FontSize(36);
      @include MarginRight(15);
      // 稍微调整位置以垂直居中
      position: relative;
      top: -2px;
    }

    .weather-item {
      @include Padding(0, 8, 0, 8); // 进一步减小间距
      border-left: 1.5px solid rgba(255, 255, 255, 0.4);
      @include wHeight(31);
      color: #fff;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;

      .label {
        @include FontSize(14); // 字体缩小
        color: rgba(255, 255, 255, 0.8); // 颜色稍微淡一点区分
        position: relative;
        @include Top(-2); // 调整位置
        display: flex;
        align-items: center;
        
        .item-icon {
          margin-right: 1px;
          font-size: 10px;
        }
      }

      .value {
        @include FontSize(14); // 字体缩小
        font-weight: bold;
        position: relative;
        @include Bottom(-2); // 调整位置，减小行间距
        white-space: nowrap;
      }
    }
    
    // 预报样式
    .forecast-box {
      display: flex;
      margin-left: 20px;
      font-size: 12px;
      color: rgba(255,255,255,0.8);
      
      .forecast-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-right: 10px;
        
        span {
          line-height: 1.2;
        }
      }
    }
  }
  
  // 地区和时间显示
  .location-time-box {
    position: absolute;
    @include Left(63);
    @include Top(75);
    display: flex;
    align-items: baseline;
    color: #fff;
    
    .location {
      @include FontSize(18);
      font-weight: bold;
      color: #7afafe;
      @include MarginRight(15);
    }
    
    .datetime {
      display: flex;
      align-items: baseline;
      
      .date {
        @include FontSize(18);
        font-weight: 500;
        @include MarginRight(8);
      }
      
      .time {
        @include FontSize(16);
        color: rgba(255, 255, 255, 0.85);
      }
    }
  }
}

.right-bg {
  right: 0;
  // background: url('~@/assets/images/基础/top_right_bg@2x.png') no-repeat;
  background-size: 100% 100%;

  .tool {
    color: #ffffff;

    position: absolute;
    @include wHeight(75);
    top: 0;
    z-index: 10;
    @include Right(200);
    @include Width(130);
    // @include Top(10);
    //     font-family: SJyunhei, serif;
    display: flex;
    justify-content: space-around;
    align-items: center;
    @include FontSize(20);
    cursor: pointer;

    img {
      @include Width(30);
      transition: transform 0.3s;

      &:hover {
        transform: scale(1.2);
      }
    }
  }

  .info {
    @include FontSize(14);
    // @include wHeight(40);
    //height: 100%;
    @include Width(333);
    @include wHeight(56);
    position: absolute;
    z-index: 10;
    @include Left(24);
    @include Top(15);
    z-index: 100;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    //// background: url('~@/assets/images/one/top_logo@2x.png') no-repeat;
    background-size: 100% 100%;

    .weahter {
      // @include Width(380);
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      height: 100%;
      color: #ffffff;

      > .weahtermon {
        cursor: pointer;
        position: relative;
        height: 100%;
        // padding-right: 15px;
        // @include PaddingRight(15);
        @include MarginRight(15);

        font-weight: 800;

        > span {
          display: inline-block;
          @include MarginLeft(5);
        }

        &::after {
          content: "";
          position: absolute;
          @include Width(2);
          @include wHeight(15);

          background: rgba(190, 190, 190, 0.856);
          @include Right(-10);
          top: 0;
          bottom: 0;
          margin: auto;
        }
      }

      .aqi {
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .textDat {
        display: flex;
        justify-content: center;
        align-items: center;
        @include MarginLeft(4);

        i:nth-of-type(1) {
          @include FontSize(20);
          display: inline-block;
          @include MarginRight(5);
        }
      }

      .temp {
        display: flex;
        justify-content: center;
        align-items: center;
        @include MarginLeft(-8);
      }

      .humidity {
        display: flex;
        justify-content: center;
        @include MarginLeft(-4);
        align-items: center;
      }

      .windDir {
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .pm25 {
        display: flex;
        justify-content: space-around;
        align-items: center;
        cursor: pointer;
        @include MarginRight(15);
        @include MarginLeft(3);
        font-weight: 800;

        > span {
          display: inline-block;
          @include MarginRight(3);
        }
      }
    }
  }

  .link {
    position: absolute;
    @include wHeight(75);
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    @include Right(20);
    z-index: 100;
    top: 0;

    img {
      @include Width(54);
      transition: transform 0.3s;

      &:hover {
        transform: scale(2.5);
        transform-origin: 100% 0;
      }

      // margin-right: 3px;
      @include MarginRight(3);
    }
  }

  .time {
    color: #fff;
    position: absolute;
    @include wHeight(75);

    @include Top(0);

    @include Right(80);
    @include FontSize(16);
    //   font-family: SJyunhei;
    display: flex;
    justify-content: center;
    align-items: center;

    span:nth-of-type(1) {
      display: inline-block;
      @include MarginRight(10);
    }
  }
}

.choose {
  display: flex;
  width: 230px;
  height: 60px;
  margin: auto;
  border-bottom: 1px solid rgba(237, 249, 255, 0.2);
  justify-content: space-around;

  .el-button {
    margin-top: 10px;
    @include Width(40);
    @include wHeight(30);
    @include LineHeight(30);
    @include Padding(5, 0, 0, 0);
    text-align: center;
    background-color: transparent;

    .svg-icon {
      @include Width(25);
      @include wHeight(25);
      vertical-align: center;
      fill: currentColor;
      overflow: hidden;
      color: #fff;
      // cursor: pointer;
    }
  }

  .active {
    .svg-icon {
      color: #7afafe;
    }
  }
}

.content {
  width: 230px;
  height: 120px;
  margin: auto;
  border-bottom: 1px solid rgba(237, 249, 255, 0.2);
  overflow: auto;
}

.clear {
  width: 100%;
  height: 40px;
  font-size: 14px;
  // font-family: PingFangSC-Regular, PingFang SC;
  font-weight: 400;
  color: #7afafe;
  line-height: 40px;
  text-align: center;
  cursor: pointer;
}
</style>
