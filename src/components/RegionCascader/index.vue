<!--
 * @Description: 行政区级联选择组件
 * @Date: 2025-11-18
-->
<template>
  <div class="region-cascader-container">
    <!-- 面包屑导航 -->
    <div class="breadcrumb" v-if="selectedPath.length > 0">
      <span v-for="(item, index) in selectedPath" :key="index">
        {{ item }}
        <span v-if="index < selectedPath.length - 1" class="separator"> > </span>
      </span>
    </div>

    <!-- 选择器容器 -->
    <div class="cascader-wrapper">
      <!-- 重置按钮 -->
      <button class="reset-btn" @click="handleReset" title="重置选择">
        <svg viewBox="0 0 1024 1024" width="14" height="14">
          <path
            d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m165.4 618.2l-66-0.3L512 563.4l-99.3 118.4-66.1 0.3c-4.4 0-8-3.5-8-8 0-1.9 0.7-3.7 1.9-5.2l130.1-155L340.5 359c-1.2-1.5-1.9-3.3-1.9-5.2 0-4.4 3.6-8 8-8l66.1 0.3L512 464.6l99.3-118.4 66-0.3c4.4 0 8 3.5 8 8 0 1.9-0.7 3.7-1.9 5.2L553.5 514l130 155c1.2 1.5 1.9 3.3 1.9 5.2 0 4.4-3.6 8-8 8z"
            fill="currentColor"
          ></path>
        </svg>
      </button>

      <!-- 级联选择框 -->
      <div class="select-group">
        <!-- 省级选择 -->
        <div class="select-item" v-if="currentLevel >= 1">
          <div class="select-wrapper" :class="{ active: activeSelect === 1 }" @click="toggleDropdown(1)">
            <input
              type="text"
              :value="provinceSearchText"
              :placeholder="provinceSearchText"
              class="select-input"
              readonly
            />
            <span class="arrow">▼</span>
            
            <!-- 下拉列表 -->
            <transition name="dropdown">
              <div class="dropdown" v-show="showDropdown === 1" @click.stop>
                <!-- 搜索框 -->
                <div class="search-box">
                  <input
                    type="text"
                    placeholder="搜索省份..."
                    v-model="searchKeywords.province"
                    @click.stop
                  />
                </div>
                <!-- 选项列表 -->
                <div class="options-list">
                  <div
                    v-for="item in filteredProvinces"
                    :key="item.code"
                    class="option-item"
                    :class="{ selected: selection.province?.code === item.code }"
                    @click.stop="selectProvince(item)"
                  >
                    {{ item.name }}
                  </div>
                  <div v-if="filteredProvinces.length === 0" class="empty-text">
                    暂无数据
                  </div>
                  <div v-if="loading.province" class="loading-text">
                    <span class="loading-spinner"></span>
                    加载中...
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </div>

        <!-- 市级选择 -->
        <div class="select-item" v-if="currentLevel >= 2">
          <div class="select-wrapper" :class="{ active: activeSelect === 2 }" @click="toggleDropdown(2)">
            <input
              type="text"
              :value="citySearchText"
              :placeholder="citySearchText"
              class="select-input"
              readonly
            />
            <span class="arrow">▼</span>
            
            <transition name="dropdown">
              <div class="dropdown" v-show="showDropdown === 2" @click.stop>
                <div class="search-box">
                  <input
                    type="text"
                    placeholder="搜索城市..."
                    v-model="searchKeywords.city"
                    @click.stop
                  />
                </div>
                <div class="options-list">
                  <div
                    v-for="item in filteredCities"
                    :key="item.code"
                    class="option-item"
                    :class="{ selected: selection.city?.code === item.code }"
                    @click="selectCity(item)"
                  >
                    {{ item.name }}
                  </div>
                  <div v-if="filteredCities.length === 0" class="empty-text">
                    暂无数据
                  </div>
                  <div v-if="loading.city" class="loading-text">
                    <span class="loading-spinner"></span>
                    加载中...
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </div>

        <!-- 县级选择 -->
        <div class="select-item" v-if="currentLevel >= 3">
          <div class="select-wrapper" :class="{ active: activeSelect === 3 }" @click="toggleDropdown(3)">
            <input
              type="text"
              :value="countySearchText"
              :placeholder="countySearchText"
              class="select-input"
              readonly
            />
            <span class="arrow">▼</span>
            
            <transition name="dropdown">
              <div class="dropdown" v-show="showDropdown === 3" @click.stop>
                <div class="search-box">
                  <input
                    type="text"
                    placeholder="搜索区县..."
                    v-model="searchKeywords.county"
                    @click.stop
                  />
                </div>
                <div class="options-list">
                  <div
                    v-for="item in filteredCounties"
                    :key="item.code"
                    class="option-item"
                    :class="{ selected: selection.county?.code === item.code }"
                    @click="selectCounty(item)"
                  >
                    {{ item.name }}
                  </div>
                  <div v-if="filteredCounties.length === 0" class="empty-text">
                    暂无数据
                  </div>
                  <div v-if="loading.county" class="loading-text">
                    <span class="loading-spinner"></span>
                    加载中...
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </div>

        <!-- 乡镇选择 -->
        <div class="select-item" v-if="currentLevel >= 4">
          <div class="select-wrapper" :class="{ active: activeSelect === 4 }" @click="toggleDropdown(4)">
            <input
              type="text"
              :value="townSearchText"
              :placeholder="townSearchText"
              class="select-input"
              readonly
            />
            <span class="arrow">▼</span>
            
            <transition name="dropdown">
              <div class="dropdown" v-show="showDropdown === 4" @click.stop>
                <div class="search-box">
                  <input
                    type="text"
                    placeholder="搜索乡镇..."
                    v-model="searchKeywords.town"
                    @click.stop
                  />
                </div>
                <div class="options-list">
                  <div
                    v-for="item in filteredTowns"
                    :key="item.code"
                    class="option-item"
                    :class="{ selected: selection.town?.code === item.code }"
                    @click="selectTown(item)"
                  >
                    {{ item.name }}
                  </div>
                  <div v-if="filteredTowns.length === 0" class="empty-text">
                    暂无数据
                  </div>
                  <div v-if="loading.town" class="loading-text">
                    <span class="loading-spinner"></span>
                    加载中...
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </div>

        <!-- 村级选择 -->
        <div class="select-item" v-if="currentLevel >= 5">
          <div class="select-wrapper" :class="{ active: activeSelect === 5 }" @click="toggleDropdown(5)">
            <input
              type="text"
              :value="villageSearchText"
              :placeholder="villageSearchText"
              class="select-input"
              readonly
            />
            <span class="arrow">▼</span>
            
            <transition name="dropdown">
              <div class="dropdown" v-show="showDropdown === 5" @click.stop>
                <div class="search-box">
                  <input
                    type="text"
                    placeholder="搜索村..."
                    v-model="searchKeywords.village"
                    @click.stop
                  />
                </div>
                <div class="options-list">
                  <div
                    v-for="item in filteredVillages"
                    :key="item.code"
                    class="option-item"
                    :class="{ selected: selection.village?.code === item.code }"
                    @click="selectVillage(item)"
                  >
                    {{ item.name }}
                  </div>
                  <div v-if="filteredVillages.length === 0" class="empty-text">
                    暂无数据
                  </div>
                  <div v-if="loading.village" class="loading-text">
                    <span class="loading-spinner"></span>
                    加载中...
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, inject } from 'vue';
import { 
  getProvinces, 
  getCities, 
  getCounties, 
  getTowns, 
  getVillages 
} from '@/api/region';

// 从父组件注入基于地址的定位方法（高德API联动）
const locateByAddress = inject('locateByAddress', null);

// 定义组件选项
defineOptions({
  name: 'RegionCascader'
});

// Props
const props = defineProps({
  initialValue: {
    type: Object,
    default: () => null,
  },
});

// Emits
const emit = defineEmits(['change', 'complete']);

// 状态管理
const currentLevel = ref(1); // 当前显示到第几级
const activeSelect = ref(null); // 当前激活的选择框
const showDropdown = ref(null); // 显示哪个下拉框

// 选中的数据
const selection = reactive({
  province: null,
  city: null,
  county: null,
  town: null,
  village: null,
});

// 各级数据
const provinces = ref([]);
const cities = ref([]);
const counties = ref([]);
const towns = ref([]);
const villages = ref([]);

// 搜索关键词
const searchKeywords = reactive({
  province: '',
  city: '',
  county: '',
  town: '',
  village: '',
});

// 加载状态
const loading = reactive({
  province: false,
  city: false,
  county: false,
  town: false,
  village: false,
});

// 数据缓存
const dataCache = new Map();

// 组件挂载状态
const isMounted = ref(false);

// 显示文本
const provinceSearchText = computed(() => selection.province?.name || '请选择省份');
const citySearchText = computed(() => selection.city?.name || '请选择城市');
const countySearchText = computed(() => selection.county?.name || '请选择区县');
const townSearchText = computed(() => selection.town?.name || '请选择乡镇');
const villageSearchText = computed(() => selection.village?.name || '请选择村');

// 面包屑路径
const selectedPath = computed(() => {
  const path = [];
  if (selection.province) path.push(selection.province.name);
  if (selection.city) path.push(selection.city.name);
  if (selection.county) path.push(selection.county.name);
  if (selection.town) path.push(selection.town.name);
  if (selection.village) path.push(selection.village.name);
  return path;
});

// 过滤后的数据
const filteredProvinces = computed(() => {
  if (!searchKeywords.province) return provinces.value;
  return provinces.value.filter((item) =>
    item.name.toLowerCase().includes(searchKeywords.province.toLowerCase())
  );
});

const filteredCities = computed(() => {
  if (!searchKeywords.city) return cities.value;
  return cities.value.filter((item) =>
    item.name.toLowerCase().includes(searchKeywords.city.toLowerCase())
  );
});

const filteredCounties = computed(() => {
  if (!searchKeywords.county) return counties.value;
  return counties.value.filter((item) =>
    item.name.toLowerCase().includes(searchKeywords.county.toLowerCase())
  );
});

const filteredTowns = computed(() => {
  if (!searchKeywords.town) return towns.value;
  return towns.value.filter((item) =>
    item.name.toLowerCase().includes(searchKeywords.town.toLowerCase())
  );
});

const filteredVillages = computed(() => {
  if (!searchKeywords.village) return villages.value;
  return villages.value.filter((item) =>
    item.name.toLowerCase().includes(searchKeywords.village.toLowerCase())
  );
});

// 加载省级数据
const loadProvinces = async () => {
  // 检查缓存
  if (dataCache.has('provinces')) {
    provinces.value = dataCache.get('provinces');
    return;
  }

  loading.province = true;
  try {
    const data = await getProvinces();
    if (isMounted.value) {
      provinces.value = data;
      dataCache.set('provinces', data);
    }
  } catch (error) {
    console.error('加载省份数据失败:', error);
  } finally {
    if (isMounted.value) {
      loading.province = false;
    }
  }
};

// 加载市级数据
const loadCities = async (provinceCode) => {
  const cacheKey = `cities_${provinceCode}`;
  if (dataCache.has(cacheKey)) {
    cities.value = dataCache.get(cacheKey);
    return;
  }

  loading.city = true;
  try {
    const data = await getCities(provinceCode);
    if (isMounted.value) {
      cities.value = data;
      dataCache.set(cacheKey, data);
    }
  } catch (error) {
    console.error('加载城市数据失败:', error);
  } finally {
    if (isMounted.value) {
      loading.city = false;
    }
  }
};

// 加载县级数据
const loadCounties = async (cityCode) => {
  const cacheKey = `counties_${cityCode}`;
  if (dataCache.has(cacheKey)) {
    counties.value = dataCache.get(cacheKey);
    return;
  }

  loading.county = true;
  try {
    const data = await getCounties(cityCode);
    if (isMounted.value) {
      counties.value = data;
      dataCache.set(cacheKey, data);
    }
  } catch (error) {
    console.error('加载区县数据失败:', error);
  } finally {
    if (isMounted.value) {
      loading.county = false;
    }
  }
};

// 加载乡镇数据
const loadTowns = async (countyCode) => {
  const cacheKey = `towns_${countyCode}`;
  if (dataCache.has(cacheKey)) {
    towns.value = dataCache.get(cacheKey);
    return;
  }

  loading.town = true;
  try {
    const data = await getTowns(countyCode);
    if (isMounted.value) {
      towns.value = data;
      dataCache.set(cacheKey, data);
    }
  } catch (error) {
    console.error('加载乡镇数据失败:', error);
  } finally {
    if (isMounted.value) {
      loading.town = false;
    }
  }
};

// 加载村级数据
const loadVillages = async (townCode) => {
  const cacheKey = `villages_${townCode}`;
  if (dataCache.has(cacheKey)) {
    villages.value = dataCache.get(cacheKey);
    return;
  }

  loading.village = true;
  try {
    const data = await getVillages(townCode);
    if (isMounted.value) {
      villages.value = data;
      dataCache.set(cacheKey, data);
    }
  } catch (error) {
    console.error('加载村数据失败:', error);
  } finally {
    if (isMounted.value) {
      loading.village = false;
    }
  }
};

// 选择省份
const selectProvince = async (province) => {
  selection.province = province;
  selection.city = null;
  selection.county = null;
  selection.town = null;
  selection.village = null;
  
  currentLevel.value = 2;
  showDropdown.value = null;
  searchKeywords.province = '';
  
  // 清空后续级别数据
  cities.value = [];
  counties.value = [];
  towns.value = [];
  villages.value = [];
  
  // 加载市级数据
  await loadCities(province.code);
  
  emitChange();
};

// 选择城市
const selectCity = async (city) => {
  selection.city = city;
  selection.county = null;
  selection.town = null;
  selection.village = null;
  
  currentLevel.value = 3;
  showDropdown.value = null;
  searchKeywords.city = '';
  
  counties.value = [];
  towns.value = [];
  villages.value = [];
  
  await loadCounties(city.code);
  
  emitChange();
};

// 选择区县
const selectCounty = async (county) => {
  selection.county = county;
  selection.town = null;
  selection.village = null;
  
  currentLevel.value = 4;
  showDropdown.value = null;
  searchKeywords.county = '';
  
  towns.value = [];
  villages.value = [];
  
  await loadTowns(county.code);
  
  emitChange();
};

// 选择乡镇
const selectTown = async (town) => {
  selection.town = town;
  selection.village = null;
  
  currentLevel.value = 5;
  showDropdown.value = null;
  searchKeywords.town = '';
  
  villages.value = [];
  
  await loadVillages(town.code);
  
  emitChange();

  // 方案C：通过高德API按地址定位到乡镇中心（不画范围，只飞过去）
  if (locateByAddress) {
    const parts = [];
    if (selection.province?.name) parts.push(selection.province.name);
    if (selection.city?.name) parts.push(selection.city.name);
    if (selection.county?.name) parts.push(selection.county.name);
    if (selection.town?.name) parts.push(selection.town.name);

    const fullAddress = parts.join('');
    console.log('🎯 定位到乡镇:', fullAddress);
    await locateByAddress(fullAddress);
  }
};

// 选择村
const selectVillage = async (village) => {
  selection.village = village;
  showDropdown.value = null;
  searchKeywords.village = '';
  
  emitChange();
  emitComplete();

  // 方案C：通过高德API按地址定位到村中心
  if (locateByAddress) {
    const parts = [];
    if (selection.province?.name) parts.push(selection.province.name);
    if (selection.city?.name) parts.push(selection.city.name);
    if (selection.county?.name) parts.push(selection.county.name);
    if (selection.town?.name) parts.push(selection.town.name);
    if (selection.village?.name) parts.push(selection.village.name);

    const fullAddress = parts.join('');
    console.log('🎯 定位到村:', fullAddress);
    await locateByAddress(fullAddress);
  }
};

// 重置
const handleReset = () => {
  selection.province = null;
  selection.city = null;
  selection.county = null;
  selection.town = null;
  selection.village = null;
  
  currentLevel.value = 1;
  showDropdown.value = null;
  
  cities.value = [];
  counties.value = [];
  towns.value = [];
  villages.value = [];
  
  Object.keys(searchKeywords).forEach((key) => {
    searchKeywords[key] = '';
  });
  
  emitChange();
};

// 切换下拉框
const toggleDropdown = (level) => {
  if (showDropdown.value === level) {
    showDropdown.value = null;
  } else {
    showDropdown.value = level;
  }
};

// 发射变化事件
const emitChange = () => {
  emit('change', {
    province: selection.province,
    city: selection.city,
    county: selection.county,
    town: selection.town,
    village: selection.village,
  });
};

// 发射完成事件
const emitComplete = () => {
  emit('complete', {
    province: selection.province,
    city: selection.city,
    county: selection.county,
    town: selection.town,
    village: selection.village,
    path: selectedPath.value,
  });
};

// 点击外部关闭下拉框
const handleClickOutside = (event) => {
  const container = event.target.closest('.region-cascader-container');
  if (!container) {
    showDropdown.value = null;
  }
};

// 生命周期
onMounted(() => {
  isMounted.value = true;
  loadProvinces().then(() => {
    applyInitialSelection();
  });
  document.addEventListener('click', handleClickOutside);
});

// 清理
onUnmounted(() => {
  isMounted.value = false;
  document.removeEventListener('click', handleClickOutside);
});

// 应用初始值（如：默认到某个省市，直接下钻区县）
const applyInitialSelection = async () => {
  const initial = props.initialValue;
  if (!initial || !provinces.value.length) return;

  const provinceCode = initial.province?.code;
  const provinceName = initial.province?.name;
  const cityCode = initial.city?.code;
  const cityName = initial.city?.name;

  const province =
    provinces.value.find((item) => provinceCode && item.code === provinceCode) ||
    provinces.value.find((item) => provinceName && item.name === provinceName);
  if (!province) return;

  selection.province = province;
  currentLevel.value = 2;
  await loadCities(province.code);

  const city =
    cities.value.find((item) => cityCode && item.code === cityCode) ||
    cities.value.find((item) => cityName && item.name === cityName);
  if (!city) {
    emitChange();
    return;
  }

  selection.city = city;
  currentLevel.value = 3;
  await loadCounties(city.code);
  emitChange();
};
</script>

<style scoped lang="less">
.region-cascader-container {
  position: relative;
  user-select: none;
  z-index: 100;
}

.breadcrumb {
  margin-bottom: 8px;
  padding: 6px 12px;
  background: rgba(0, 120, 255, 0.1);
  border-radius: 4px;
  font-size: 13px;
  color: #00d4ff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  .separator {
    margin: 0 6px;
    color: rgba(255, 255, 255, 0.5);
  }
}

.cascader-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.reset-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 32px;
  background: rgba(200, 200, 200, 0.15);
  border: 1px solid rgba(200, 200, 200, 0.3);
  border-radius: 4px;
  color: #c8c8c8;
  cursor: pointer;
  transition: all 0.3s;
  flex-shrink: 0;

  &:hover {
    background: rgba(200, 200, 200, 0.25);
    border-color: rgba(200, 200, 200, 0.5);
  }

  svg {
    display: block;
  }
}

.select-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1;
}

.select-item {
  position: relative;
  min-width: 140px;
  flex: 1;
}

.select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(0, 30, 60, 0.6);
  border: 1px solid rgba(0, 120, 255, 0.3);
  border-radius: 4px;
  transition: all 0.3s;

  &:hover,
  &.active {
    border-color: #00d4ff;
    box-shadow: 0 0 8px rgba(0, 212, 255, 0.3);
    z-index: 10000;
  }
}

.select-input {
  flex: 1;
  height: 32px;
  padding: 0 30px 0 12px;
  background: transparent;
  border: none;
  outline: none;
  color: #fff;
  font-size: 13px;
  cursor: pointer;

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
}

.arrow {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.6);
  font-size: 10px;
  transition: transform 0.3s;
  pointer-events: none;
}

.dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 300px;
  background: rgba(0, 20, 40, 0.95);
  border: 1px solid rgba(0, 120, 255, 0.5);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  z-index: 10001;
  backdrop-filter: blur(10px);
}

.search-box {
  padding: 8px;
  border-bottom: 1px solid rgba(0, 120, 255, 0.2);

  input {
    width: 100%;
    height: 28px;
    padding: 0 8px;
    background: rgba(0, 30, 60, 0.6);
    border: 1px solid rgba(0, 120, 255, 0.3);
    border-radius: 4px;
    outline: none;
    color: #fff;
    font-size: 12px;

    &:focus {
      border-color: #00d4ff;
    }

    &::placeholder {
      color: rgba(255, 255, 255, 0.3);
    }
  }
}

.options-list {
  max-height: 250px;
  overflow-y: auto;
  padding: 4px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 30, 60, 0.3);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 120, 255, 0.5);
    border-radius: 3px;

    &:hover {
      background: rgba(0, 120, 255, 0.7);
    }
  }
}

.option-item {
  padding: 8px 12px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  cursor: pointer;
  border-radius: 3px;
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 120, 255, 0.2);
    color: #00d4ff;
  }

  &.selected {
    background: rgba(0, 120, 255, 0.3);
    color: #00d4ff;
    font-weight: bold;
  }
}

.empty-text {
  padding: 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
}

.loading-text {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #00d4ff;
  font-size: 13px;
  gap: 8px;
}

.loading-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(0, 212, 255, 0.3);
  border-top-color: #00d4ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 下拉动画
.dropdown-enter-active {
  animation: dropdownIn 0.3s ease-out;
}

.dropdown-leave-active {
  animation: dropdownOut 0.2s ease-in;
}

@keyframes dropdownIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes dropdownOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-10px);
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .select-item {
    min-width: 120px;
  }
  
  .select-input {
    font-size: 12px;
  }
}

@media (max-width: 768px) {
  .cascader-wrapper {
    flex-direction: column;
  }
  
  .select-group {
    width: 100%;
    flex-direction: column;
  }
  
  .select-item {
    width: 100%;
    min-width: auto;
  }
  
  .breadcrumb {
    font-size: 12px;
  }
}
</style>
