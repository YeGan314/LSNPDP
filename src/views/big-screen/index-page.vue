<!--
 * @Author: YG 
 * @Date: 2025-11-11 14:30:54
 * @LastEditTime: 2025-11-11 14:30:54
 * @Description: cesiumJS
 * @FastButton: ctrl+win+i, ctrl+win+t
-->
<template>
  <Hearder></Hearder>
  <div class="container-integrate">
    <YeWu1 v-if="yeWuKey == 1"></YeWu1>
    <YeWu2 v-if="yeWuKey == 2"></YeWu2>
    <YeWu3 v-if="yeWuKey == 3"></YeWu3>
    <BottomBtn @btnClick="BottomBtnbtnClick" :yeWuKey="yeWuKey"></BottomBtn>
    <MapSwitcher></MapSwitcher>
    <LayerPanel ref="layerPanelRef" @analyze-layer="handleRasterAnalyze"></LayerPanel>
    <WmsLegend ref="wmsLegendRef"></WmsLegend>

    <!-- 行政区级联选择器 -->
    <div class="district-cascade-wrapper">
      <el-cascader
        v-model="selectedDistrictPath"
        :options="districtOptions"
        :props="cascaderProps"
        placeholder="请选择省市区"
        @change="handleDistrictCascadeChange"
        clearable
        size="large"
      />
    </div>
    
    <!-- 栅格分析面板 -->
    <RasterAnalysisPanel
      :visible="rasterAnalysisVisible"
      :loading="rasterAnalysisLoading"
      :analysis-data="rasterAnalysisData"
      :region-name="rasterAnalysisRegion"
      @update:visible="rasterAnalysisVisible = $event"
      @close="handleCloseAnalysisPanel"
    />
    
    <div id="cesiumContainer"></div>

    <div
      v-if="pollutantPopup.visible"
      class="pollutant-detail-popup"
      :style="{ left: `${pollutantPopup.left}px`, top: `${pollutantPopup.top}px` }"
      @click.stop
    >
      <div class="pollutant-popup-header" @mousedown="startPollutantPopupDrag">
        <div>
          <div class="pollutant-popup-title">{{ pollutantPopup.siteName || "监测断面" }}</div>
          <div class="pollutant-popup-subtitle">污染物数值详情</div>
        </div>
        <button class="pollutant-popup-close" type="button" @mousedown.stop @click="closePollutantPopup">×</button>
      </div>
      <div class="pollutant-popup-tabs">
        <button
          v-for="group in pollutantPopupGroups"
          :key="group.value"
          type="button"
          class="pollutant-popup-tab"
          :class="{ active: pollutantPopup.activeGroup === group.value }"
          @click="selectPollutantPopupGroup(group.value)"
        >
          {{ group.text }}
        </button>
      </div>
      <div class="pollutant-popup-body">
        <div v-if="pollutantPopupRows.length === 0" class="pollutant-popup-empty">暂无数据</div>
        <div v-for="row in pollutantPopupRows" :key="row.date" class="pollutant-time-block">
          <div class="pollutant-time-title">{{ row.label }}</div>
          <div class="pollutant-metric-grid">
            <div v-for="metric in row.metrics" :key="`${row.date}-${metric.field}`" class="pollutant-metric">
              <span class="metric-name" :title="metric.name">{{ metric.name }}</span>
              <span class="metric-value" :class="metric.level">{{ metric.text }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="pollutant-popup-legend">
        <span>正常</span>
        <span class="warning">略微超标</span>
        <span class="danger">严重超标</span>
      </div>
    </div>

    <div id="video" v-if="videShow">
      <div class="result-header">
        <div class="result-header-title">全景观测</div>
        <div
          class="result-header-close"
          @click="
            () => {
              videShow = false;
            }
          "
        >
          x
        </div>
      </div>
      <div id="viewer2" style="width: 80vw; height: 80vh"></div>
      <!-- <video src="@/assets/car.mp4" muted autoplay loop></video> -->
    </div>
    <div id="result">
      <div class="result-header">
        <div class="result-header-title">{{ infoData.name || "title" }}</div>
        <div class="result-header-close" @click="hideLayerCesium()">x</div>
      </div>

      <div class="result-content">
        <div class="result-content-item">
          <div class="result-content-item-lable">状态</div>
          <div class="result-content-item-value">
            {{ infoData.state ? "正常" : "离线" }}
          </div>
        </div>
      </div>

      <div class="result-jiantou"></div>
    </div>
    <div id="rightMenu">
      <div>
        <div
          :class="{ list: true, listhover: rightMenuKey === 1 }"
          @click="rightMenuKeyChange(1)"
        >
          查看当前坐标
        </div>
        <div
          :class="{ list: true, listhover: rightMenuKey === 2 }"
          @click="rightMenuKeyChange(2)"
        >
          查看当前视角
        </div>
        <div
          :class="{ list: true, listhover: rightMenuKey === 3 }"
          @click="rightMenuKeyChange(3)"
        >
          图上量算
        </div>
        <div
          :class="{ list: true, listhover: rightMenuKey === 4 }"
          @click="rightMenuKeyChange(4)"
        >
          天气模拟
        </div>
        <div
          class="list"
          @click="
            () => {
              hideLayerCesium();
              rightMenuKeyChange(0);
            }
          "
        >
          关闭菜单
        </div>
      </div>
      <div class="listContent" v-if="rightMenuKey">
        <div v-if="rightMenuKey == 1">
          <div class="list">经度：{{ positionsClick.longitude }}</div>
          <div class="list">纬度：{{ positionsClick.latitude }}</div>
        </div>
        <div v-if="rightMenuKey == 2">
          <div class="list">经度：{{ cameraData.longitude }}</div>
          <div class="list">纬度：{{ cameraData.latitude }}</div>
          <div class="list">高度:{{ cameraData.height }}</div>
          <div class="list">航向角：{{ cameraData.heading }}</div>
          <div class="list">俯仰角：{{ cameraData.pitch }}</div>
          <div class="list">翻滚角：{{ cameraData.roll }}</div>
        </div>
        <div v-if="rightMenuKey == 3">
          <div
            class="list"
            @click="
              draw.addEntity('point');
              hideLayerCesium();
            "
          >
            标点
          </div>
          <div
            class="list"
            @click="
              draw.addEntity('line');
              hideLayerCesium();
            "
          >
            画线
          </div>
          <div
            class="list"
            @click="
              draw.addEntity('polygon');
              hideLayerCesium();
            "
          >
            多边形
          </div>
          <div
            class="list"
            @click="
              draw.addEntity('circle');
              hideLayerCesium();
            "
          >
            圆形
          </div>
          <div
            class="list"
            @click="
              draw.addEntity('rectangle');
              hideLayerCesium();
            "
          >
            矩形
          </div>
          <div
            class="list"
            @click="
              draw.addEntity('range');
              hideLayerCesium();
            "
          >
            测距
          </div>
          <div
            class="list"
            @click="
              draw.addEntity('area');
              hideLayerCesium();
            "
          >
            测面积
          </div>
          <div
            class="list"
            @click="
              draw.exportEntities();
              hideLayerCesium();
            "
          >
            数据导出
          </div>
          <div class="list" @click="draw.removeAll()">清空测量</div>
          <div class="listTile">点击滚轮结束</div>
        </div>
        <div v-if="rightMenuKey == 4">
          <div
            class="list"
            @click="
              getRainCesium(1);
              hideLayerCesium();
            "
          >
            小雨
          </div>
          <div
            class="list"
            @click="
              getRainCesium(2);
              hideLayerCesium();
            "
          >
            中雨
          </div>
          <div
            class="list"
            @click="
              getRainCesium(3);
              hideLayerCesium();
            "
          >
            大雨
          </div>
          <div
            class="list"
            @click="
              getRainCesium(4);
              hideLayerCesium();
            "
          >
            特大暴雨
          </div>
          <div
            class="list"
            @click="
              getSnowCesium();
              hideLayerCesium();
            "
          >
            降雪
          </div>
          <div class="list" @click="animationRainSnowHide(['Rain', 'Snow'])">
            清空模拟
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>

import { onMounted, onUnmounted, reactive, ref, provide, watch } from "vue";
import Hearder from "./compoments/heard-page.vue";
import * as Cesium from "cesium";

import YeWu1 from "./compoments/yewu1/yewu1-page.vue";
import YeWu2 from "./compoments/yewu2/yewu1-page.vue";
import YeWu3 from "./compoments/yewu3/yewu1-page.vue";
import BottomBtn from "./compoments/bottom-btn.vue";
import MapSwitcher from "./compoments/map-switcher.vue";
import LayerPanel from "./compoments/layer-panel.vue";
import WmsLegend from "./compoments/wms-legend.vue";
import { GEOSERVER_CONFIG } from "@/config/geoserver.config";
import { RasterAnalysisPanel } from "./compoments/raster-analysis";
import rasterStatsApi from "@/services/rasterStatsApiService";
import districtDataService from "@/services/districtDataService";

import {
  initCesium,
  initThree,
  initBigMap,
  getViewer,
  initGaoGeJJ,
  initGaoGeWX,
  initWMSService,
  flyToCesium,
  viewerCesium,
  eventCesiumThree,
  eventCesiumEntity,
  showLayerCesium,
  hideLayerCesium,
  getSnowCesium,
  createShuiCesium,
  loop,
  getLineCesium,
  getPolygonHolesCesium,
  getPolygonCesium,
  getWallLightCesium,
  getPointCesium,
  getRainCesium,
  hideEntities,
  showEntities,
  removeEntities,
  eventCesiumRight,
  animationRainSnowHide,
  getDBModelThree,
  destroyCesiumScene,
} from "./js/threeCesium";
import * as geoData from "./js/geo";
import { LYBJBoundary } from "./js/lybjBoundary";
import Draw from "./js/drawCesium.js";
const ListWater = geoData.ListWater || [];

import { Math as CesiumMath } from "cesium";

import vrImg from "@/assets/bigScreen/zhaVR.jpg";
import { Viewer } from "photo-sphere-viewer";
import "photo-sphere-viewer/dist/photo-sphere-viewer.css";

const POLLUTANT_ENTITY_ID_PREFIX = "pollutant-marker:";
const COMPOSITE_POLLUTANT_CODE = "__composite__";
const COMPOSITE_FIELD_NAME_MAP = {
  yczb: "综合指数",
};
const ANTIBIOTIC_FIELD_NAME_MAP = {
  sdz: "磺胺嘧啶",
  stz: "磺胺噻唑",
  spd: "磺胺吡啶",
  smd: "磺胺甲嘧啶",
  sdd: "磺胺二甲嘧啶",
  smm: "磺胺甲噁唑",
  smtz: "磺胺二甲氧嘧啶",
  smp: "磺胺甲氧嘧啶",
  scp: "磺胺氯哒嗪",
  smx: "磺胺甲噁唑",
  enr: "恩诺沙星",
  nor: "诺氟沙星",
  cip: "环丙沙星",
  ofl: "氧氟沙星",
  sar: "沙拉沙星",
  eno: "依诺沙星",
  lom: "洛美沙星",
  nal: "萘啶酸",
  flm: "氟甲喹",
  cin: "西诺沙星",
  spa: "司帕沙星",
  otc: "土霉素",
  tet: "四环素",
  ctc: "金霉素",
  rox: "罗红霉素",
  ery: "红霉素",
  lin: "林可霉素",
  cli: "克林霉素",
  cla: "克拉霉素",
  azi: "阿奇霉素",
  ctx: "头孢噻肟",
  cap: "氯霉素",
  ff: "氟苯尼考",
};
const PHENOL_FIELD_NAME_MAP = {
  bisphenolA: "双酚A",
  tbutylph: "叔丁基苯酚",
  butylph: "丁基苯酚",
  pentylph: "戊基苯酚",
  hexylph: "己基苯酚",
  toctylph: "叔辛基苯酚",
  heptylph: "庚基苯酚",
  bnonylph: "支链壬基苯酚",
  octylph: "辛基苯酚",
  nonylph: "壬基苯酚",
};
const pollutantPopupGroups = [
  { value: "composite", text: "综合指数", fieldMap: COMPOSITE_FIELD_NAME_MAP },
  { value: "antibiotics", text: "抗生素", fieldMap: ANTIBIOTIC_FIELD_NAME_MAP },
  { value: "phenols", text: "双酚A及烷基苯酚", fieldMap: PHENOL_FIELD_NAME_MAP },
];

// 导入省级边界加载模块
import { 
  loadProvinceBoundary, 
  highlightProvince,
  flyToProvince,
  clearHighlight 
} from "./js/loadProvinceBoundary.js";

// 导入市级边界加载模块
import {
  loadCityBoundary,
  highlightCity,
  flyToCity,
  clearCityHighlight,
  removeCityBoundary
} from "./js/loadCityBoundary.js";

// 导入区县级边界加载模块
import {
  loadCountyBoundary,
  highlightCounty,
  flyToCounty,
  clearCountyHighlight,
  removeCountyBoundary
} from "./js/loadCountyBoundary.js";

// 导入乡镇级边界加载模块
import {
  loadTownBoundary,
  removeTownBoundary,
  clearAllTownBoundaries
} from "./js/loadTownBoundary.js";


const loadMap = ref(false);
let viewer = null;
let provinceBoundaryDataSource = null; // 省级边界数据源
let currentCityBoundaryDataSource = null; // 当前加载的市级边界数据源
let currentCityCode = null; // 当前加载市级边界的城市代码
let currentCountyBoundaryDataSource = null; // 当前加载的区县级边界数据源
let currentCountyCityCode = null; // 当前加载区县边界的城市代码
let currentTownEntityIds = []; // 当前加载的乡镇级实体ID列表
let currentTownCountyCode = null; // 当前加载乡镇边界的区县代码
let draw = null;
// GeoServer WMS 图层
let wmsLayer = null;
// 灌区镂空遮罩实体
let guanQuHoleMaskEntity = null;
// 台风相关变量

// 右键菜单事件
const rightMenuKey = ref(0);
// 当前场景经纬度
let cameraData = {
  longitude: null,
  latitude: null,
  height: null,
  heading: null,
  pitch: null,
  roll: null,
};
// 点击时获取的经纬度
let positionsClick = {
  longitude: null,
  latitude: null,
};

// 业务切换key
const yeWuKey = ref(2);
const layerPanelRef = ref(null);
// 是否显示视频弹窗
const videShow = ref(false);

// 栅格分析相关状态
const rasterAnalysisVisible = ref(false);  // 分析面板显示状态
const rasterAnalysisLoading = ref(false);  // 分析加载状态
const rasterAnalysisData = ref(null);      // 分析结果数据
const rasterAnalysisRegion = ref('全图');  // 当前分析区域名称
const currentDistrictEntity = ref(null);   // 当前高亮的行政区实体
const pollutantPopup = reactive({
  visible: false,
  left: 0,
  top: 0,
  siteName: "",
  activeGroup: "composite",
  features: [],
});
const pollutantPopupRows = ref([]);
let pollutantClickHandler = null;
let pollutantPopupDragState = null;
let mapEntityHandler = null;
let mapRightClickHandler = null;
let modelClickHandler = null;
let modelLoadTimer = null;
let modelLoadIdleCallback = null;
let hasLoadedInitialModels = false;

// 行政区选择相关状态
const selectedDistrictPath = ref([]);      // 级联选择器的值 [省code, 市code, 区code]
const selectedDistrict = ref(null);        // 当前选中的行政区
const selectedDistrictLevel = ref('');     // 行政区级别 (province/city/county)
const selectedDistrictCode = ref('');      // 行政区代码
const districtBoundary = ref(null);        // 区域边界坐标

// 级联选择器配置
const cascaderProps = {
  value: 'code',
  label: 'name',
  children: 'children',
  expandTrigger: 'hover',
  checkStrictly: false  // 只能选择最后一级
};

// 行政区数据（示例数据，实际应从后端获取）
const districtOptions = ref([
  {
    code: '430000',
    name: '湖南省',
    // 省级范围（示例值，与栅格全图范围一致）
    bounds: {
      minLon: 110.94,
      maxLon: 114.32,
      minLat: 24.61,
      maxLat: 29.01
    },
    children: [
      {
        code: '430700',
        name: '衡阳市',
        children: [
          {
            code: '430702',
            name: '雁峰区',
            bounds: {
              minLon: 112.57,
              maxLon: 112.65,
              minLat: 26.88,
              maxLat: 26.93
            }
          },
          {
            code: '430703',
            name: '石鼓区',
            bounds: {
              minLon: 112.60,
              maxLon: 112.68,
              minLat: 26.90,
              maxLat: 26.95
            }
          },
          {
            code: '430704',
            name: '蒸湘区',
            bounds: {
              minLon: 112.55,
              maxLon: 112.63,
              minLat: 26.85,
              maxLat: 26.90
            }
          }
        ]
      },
      {
        code: '430900',
        name: '益阳市',
        children: [
          {
            code: '430902',
            name: '资阳区',
            bounds: {
              minLon: 112.30,
              maxLon: 112.40,
              minLat: 28.55,
              maxLat: 28.65
            }
          },
          {
            code: '430903',
            name: '赫山区',
            bounds: {
              minLon: 112.35,
              maxLon: 112.45,
              minLat: 28.58,
              maxLat: 28.68
            }
          }
        ]
      }
    ]
  }
]);

// 表单显示数据
const infoData = reactive({
  name: "",
  state: null,
});

/**
 * 底部按钮点击事件 - 切换业务场景
 * @param {number} key - 业务场景编号 (1/2/3)
 * @description 切换不同的业务模块显示，并重置地图视角到默认位置
 */
const BottomBtnbtnClick = async (key) => {
  if (key === 3) {
    if (layerPanelRef.value?.clearPollutantLayer) {
      layerPanelRef.value.clearPollutantLayer();
    }
  }

  yeWuKey.value = key;

  if (key === 3) {
    if (layerPanelRef.value?.setLayerCheckedByKey) {
      await layerPanelRef.value.setLayerCheckedByKey('cz_szjc_data', true);
    }
  }

  hideLayerCesium();
  flyToCesium(
  113.75300914535553,
  24.68481663753728,
  64578.45508858897,
  343.56621396448907,
  -28.920626021072486,
  1.2677244429007686
  );
};


/**
 * 根据行政区代码路径查找行政区信息
 * @param {Array} path - 行政区代码路径 [省code, 市code, 区code]
 * @returns {Object|null} 行政区信息
 */
const findDistrictByPath = (path) => {
  if (!path || path.length === 0) return null;
  
  let current = districtOptions.value;
  let district = null;
  let fullName = '';
  
  for (let i = 0; i < path.length; i++) {
    const code = path[i];
    const found = current.find(item => item.code === code);
    
    if (!found) return null;
    
    fullName += (fullName ? ' ' : '') + found.name;
    district = found;
    current = found.children || [];
  }
  
  return {
    ...district,
    fullName,
    level: path.length === 1 ? 'province' : path.length === 2 ? 'city' : 'county'
  };
};

/**
 * 根据名称路径查找行政区信息
 * @param {Array<string>} names - 行政区名称路径，例如 ['湖南省']、['湖南省','湘潭市']
 * @returns {Object|null} 行政区信息对象，包含 fullName 和 level 属性
 * @description 通过行政区名称数组逐级查找，返回完整的行政区信息
 */
const findDistrictByNames = (names) => {
  if (!names || names.length === 0) return null;

  let current = districtOptions.value;
  let district = null;
  let fullName = '';

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const found = current.find(item => item.name === name);

    if (!found) return null;

    fullName += (fullName ? ' ' : '') + found.name;
    district = found;
    current = found.children || [];
  }

  return {
    ...district,
    fullName,
    level: names.length === 1 ? 'province' : names.length === 2 ? 'city' : 'county'
  };
};

/**
 * 处理级联选择器变化
 * @param {Array} value - 选中的值 [省code, 市code, 区code]
 */
const handleDistrictCascadeChange = (value) => {
  console.log('📍 级联选择器变化:', value);
  
  if (!value || value.length === 0) {
    selectedDistrict.value = null;
    return;
  }
  
  const district = findDistrictByPath(value);
  if (district) {
    console.log('📍 选中行政区:', district.fullName);
    selectedDistrict.value = district;
  }
};

/**
 * 监听行政区选择变化，自动更新分析数据
 */
watch(selectedDistrict, async (newDistrict) => {
  if (!newDistrict) {
    // 清除选择
    selectedDistrictCode.value = '';
    selectedDistrictLevel.value = '';
    districtBoundary.value = null;
    
    // 移除高亮
    if (currentDistrictEntity.value) {
      districtDataService.removeHighlight(viewer);
      currentDistrictEntity.value = null;
    }
    return;
  }
  
  console.log('📍 行政区选择变化:', newDistrict.fullName || newDistrict.name);
  
  // 更新行政区信息
  selectedDistrictCode.value = newDistrict.code;
  selectedDistrictLevel.value = newDistrict.level || 'district';
  
  // 保存边界框
  if (newDistrict.bounds) {
    districtBoundary.value = newDistrict.bounds;
  }
  
  // 移除之前的高亮实体（如果存在）
  if (currentDistrictEntity.value) {
    viewer.entities.remove(currentDistrictEntity.value);
    currentDistrictEntity.value = null;
  }
  
  // 飞到该区域（不绘制矩形框）
  if (newDistrict.bounds) {
    const { minLon, maxLon, minLat, maxLat } = newDistrict.bounds;
    
    // 计算区域中心点
    const centerLon = (minLon + maxLon) / 2;
    const centerLat = (minLat + maxLat) / 2;
    
    // 根据边界框大小和行政区级别计算合适的视角高度
    const lonRange = maxLon - minLon;
    const latRange = maxLat - minLat;
    const maxRange = Math.max(lonRange, latRange);
    
    // 根据行政区级别调整高度系数和俯仰角
    let heightMultiplier = 100000; // 默认高度系数
    let pitch = -45; // 默认俯仰角
    
    if (newDistrict.level === 'province') {
      // 省级：更高的视角，接近垂直俯视
      heightMultiplier = 150000; // 增加高度以显示完整省份
      pitch = -90; // 垂直俯视
    } else if (newDistrict.level === 'city') {
      // 市级：中等视角
      heightMultiplier = 80000;
      pitch = -60;
    } else {
      // 区县级：较低视角
      heightMultiplier = 50000;
      pitch = -45;
    }
    
    const height = maxRange * heightMultiplier;
    
    // 飞到该区域
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, height),
      duration: 1.5,
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(pitch),
        roll: 0.0
      }
    });
  }
  
  // 如果分析面板已打开，自动更新统计数据
  if (rasterAnalysisVisible.value) {
    console.log('🔄 自动更新分析数据...');
    // 获取当前图层信息（从 LayerPanel 或默认值）
    const currentLayer = {
      id: 'risk_shange_2000',
      name: '风险等级图层 (2000)',
      tifPath: '/Users/mac/Documents/cursor-gqwr/GQWR/geodata/risk_shange_2000.tif',
      workspace: 'veg'
    };
    await handleRasterAnalyze({ layer: currentLayer, district: newDistrict });
  }
});

/**
 * 头部行政区选择联动处理函数
 * @param {Object} selection - 选择的行政区信息
 * @param {Object} selection.province - 省级信息
 * @param {Object} selection.city - 市级信息（可选）
 * @param {Object} selection.county - 区县信息（可选）
 * @description 处理头部区域级联选择器的变化，更新选中的行政区并触发栅格分析
 */
const handleHeaderRegionChange = async (selection) => {
  if (!selection || !selection.province) {
    return;
  }

  const names = [
    selection.province?.name,
    selection.city?.name,
    selection.county?.name
  ].filter(Boolean);

  const district = findDistrictByNames(names);
  if (!district) {
    console.warn('未在 districtOptions 中找到匹配的行政区:', names.join(' '));
    return;
  }

  selectedDistrict.value = district;

  if (rasterAnalysisVisible.value) {
    const currentLayer = {
      id: 'risk_shange_2000',
      name: '风险等级图层 (2000)',
      tifPath: '/Users/mac/Documents/cursor-gqwr/GQWR/geodata/risk_shange_2000.tif',
      workspace: 'veg'
    };
    await handleRasterAnalyze({ layer: currentLayer, district });
  }
};

// 向子组件（头部）提供行政区联动方法
provide('onHeaderRegionChange', handleHeaderRegionChange);

/**
 * 处理栅格分析
 * @param {Object} params - 分析参数
 * @param {Object} params.layer - 图层信息
 * @param {Object} params.district - 行政区信息（可选，默认使用当前选中的行政区）
 */
const handleRasterAnalyze = async ({ layer, district = null }) => {
  try {
    rasterAnalysisLoading.value = true;
    rasterAnalysisVisible.value = true;
    
    // 使用传入的行政区或当前选中的行政区
    const targetDistrict = district || selectedDistrict.value;
    
    console.log('🔍 开始栅格分析:', { 
      layer: layer?.name, 
      传入的district: district?.name || 'null',
      当前选中的district: selectedDistrict.value?.name || 'null',
      最终使用的district: targetDistrict?.name || '全图',
      useSelectedDistrict: !district && !!selectedDistrict.value
    });
    
    // 移除之前的高亮（仅当传入了新的district时）
    if (district && currentDistrictEntity.value) {
      districtDataService.removeHighlight(viewer);
      currentDistrictEntity.value = null;
    }
    
    let result;
    
    if (targetDistrict) {
      // 行政区分析
      rasterAnalysisRegion.value = targetDistrict.fullName || targetDistrict.name;
      
      // 更新选中状态（如果是通过参数传入的）
      if (district && district !== selectedDistrict.value) {
        selectedDistrict.value = district;
      }
      
      // 使用边界框进行分析
      if (targetDistrict.bounds) {
        console.log('📦 使用边界框分析:', targetDistrict.bounds);
        result = await rasterStatsApi.analyzeByBounds(
          targetDistrict.bounds,
          layer.tifPath,
          100  // 格网大小100米
        );
      } else {
        throw new Error('行政区缺少边界框信息');
      }
    } else {
      // 全图分析
      rasterAnalysisRegion.value = '全图';
      
      // 使用完整TIF文件路径
      const fullBounds = {
        minLon: 110.94,
        maxLon: 114.32,
        minLat: 24.61,
        maxLat: 29.01
      };
      
      result = await rasterStatsApi.analyzeByBounds(
        fullBounds,
        layer.tifPath,
        100
      );
    }
    
    if (result.success) {
      rasterAnalysisData.value = result.data;
      console.log('分析成功:', result.data);
    } else {
      throw new Error(result.error || '分析失败');
    }
    
  } catch (error) {
    console.error('栅格分析失败:', error);
    alert(`分析失败: ${error.message}`);
    rasterAnalysisVisible.value = false;
  } finally {
    rasterAnalysisLoading.value = false;
  }
};

/**
 * 关闭分析面板
 */
const handleCloseAnalysisPanel = () => {
  rasterAnalysisVisible.value = false;
  
  // 移除高亮
  if (currentDistrictEntity.value) {
    districtDataService.removeHighlight(viewer);
    currentDistrictEntity.value = null;
  }
};

const normalizeMonDate = (value) => {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = `${value.getMonth() + 1}`.padStart(2, "0");
    const d = `${value.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const text = String(value).trim();
  const match = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (!match) {
    const cnMatch = text.match(/^(\d{4})年\s*(\d{1,2})月\s*(上旬|下旬)?/);
    if (!cnMatch) return "";
    const year = Number(cnMatch[1]);
    const month = Number(cnMatch[2]);
    const day = cnMatch[3] === "上旬" ? 10 : cnMatch[3] === "下旬" ? 20 : 1;
    if (!Number.isFinite(year) || month < 1 || month > 12) return "";
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return "";
  if (month < 1 || month > 12 || day < 1 || day > 31) return "";
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

const formatMonDateNodeLabel = (monDate) => {
  const normalized = normalizeMonDate(monDate);
  if (!normalized) return String(monDate || "");
  const [year, monthText, dayText] = normalized.split("-");
  const month = Number(monthText);
  const day = Number(dayText);
  if (day === 1) return `${year}年${month}月`;
  if (day === 10) return `${year}年${month}月上旬`;
  if (day === 20) return `${year}年${month}月下旬`;
  return `${year}年${month}月${day}日`;
};

const getPropertyValue = (properties = {}, field = "") => {
  if (!field) return undefined;
  const candidates = [field, String(field).toUpperCase(), String(field).toLowerCase()];
  for (const candidate of candidates) {
    if (Object.prototype.hasOwnProperty.call(properties, candidate)) return properties[candidate];
  }
  const matchedKey = Object.keys(properties).find((key) => key.toLowerCase() === String(field).toLowerCase());
  return matchedKey ? properties[matchedKey] : undefined;
};

const toFiniteNumber = (value) => {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const getPollutantLevel = (value) => {
  const num = toFiniteNumber(value);
  if (!Number.isFinite(num)) return "normal";
  if (num > 2) return "danger";
  if (num > 1) return "warning";
  return "normal";
};

const getPopupGroupByField = (field = "", valueMode = "") => {
  if (valueMode === "composite" || field === COMPOSITE_POLLUTANT_CODE || String(field).toLowerCase() === "yczb") return "composite";
  const normalizedField = String(field || "").toLowerCase();
  if (Object.keys(PHENOL_FIELD_NAME_MAP).some((key) => key.toLowerCase() === normalizedField)) return "phenols";
  return "antibiotics";
};

const getPollutantPopupFieldMap = () => {
  return pollutantPopupGroups.find((group) => group.value === pollutantPopup.activeGroup)?.fieldMap || COMPOSITE_FIELD_NAME_MAP;
};

const rebuildPollutantPopupRows = () => {
  const fieldMap = getPollutantPopupFieldMap();
  const rowsByDate = new Map();
  pollutantPopup.features.forEach((feature, index) => {
    const props = feature?.properties || {};
    const normalizedDate = normalizeMonDate(props.mon_date || props.monitor_date || props.date || "");
    if (!normalizedDate) return;
    rowsByDate.set(normalizedDate, { props, index });
  });

  pollutantPopupRows.value = Array.from(rowsByDate.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, row]) => {
      const metrics = Object.entries(fieldMap).map(([field, name]) => {
        const rawValue = getPropertyValue(row.props, field);
        const num = toFiniteNumber(rawValue);
        return {
          field,
          name,
          text: Number.isFinite(num) ? num : "--",
          level: getPollutantLevel(rawValue),
        };
      });
      return {
        date,
        label: formatMonDateNodeLabel(date),
        metrics,
      };
    });
};

const selectPollutantPopupGroup = (groupValue) => {
  if (!pollutantPopupGroups.some((group) => group.value === groupValue)) return;
  pollutantPopup.activeGroup = groupValue;
  rebuildPollutantPopupRows();
};

const closePollutantPopup = () => {
  pollutantPopup.visible = false;
};

const clampPopupCoordinates = (left, top) => {
  const width = 420;
  const height = 520;
  const padding = 16;
  const viewportWidth = window.innerWidth || 0;
  const viewportHeight = window.innerHeight || 0;
  return {
    left: Math.max(padding, Math.min(left, viewportWidth - width - padding)),
    top: Math.max(padding, Math.min(top, viewportHeight - height - padding)),
  };
};

const clampPopupPosition = (position) => {
  const rawLeft = Number(position?.x ?? position?.endPosition?.x ?? 0) + 18;
  const rawTop = Number(position?.y ?? position?.endPosition?.y ?? 0) - 40;
  return clampPopupCoordinates(rawLeft, rawTop);
};

const handlePollutantPopupDragMove = (event) => {
  if (!pollutantPopupDragState) return;
  const next = clampPopupCoordinates(
    pollutantPopupDragState.startLeft + event.clientX - pollutantPopupDragState.startX,
    pollutantPopupDragState.startTop + event.clientY - pollutantPopupDragState.startY
  );
  pollutantPopup.left = next.left;
  pollutantPopup.top = next.top;
};

const stopPollutantPopupDrag = () => {
  pollutantPopupDragState = null;
  document.body.classList.remove("pollutant-popup-dragging");
  window.removeEventListener("mousemove", handlePollutantPopupDragMove);
  window.removeEventListener("mouseup", stopPollutantPopupDrag);
};

const startPollutantPopupDrag = (event) => {
  if (event.button !== 0) return;
  pollutantPopupDragState = {
    startX: event.clientX,
    startY: event.clientY,
    startLeft: pollutantPopup.left,
    startTop: pollutantPopup.top,
  };
  document.body.classList.add("pollutant-popup-dragging");
  window.addEventListener("mousemove", handlePollutantPopupDragMove);
  window.addEventListener("mouseup", stopPollutantPopupDrag);
};

const openPollutantPopup = (data, screenPosition) => {
  const popupPosition = clampPopupPosition(screenPosition);
  pollutantPopup.siteName = data?.siteName || data?.name || "监测断面";
  pollutantPopup.left = popupPosition.left;
  pollutantPopup.top = popupPosition.top;
  pollutantPopup.features = Array.isArray(data?.features) ? data.features : [];
  pollutantPopup.activeGroup = getPopupGroupByField(data?.activeField, data?.valueMode);
  pollutantPopup.visible = true;
  rebuildPollutantPopupRows();
};

const isPollutantMarkerEntity = (entity) => {
  const id = String(entity?.id || "");
  return id.startsWith(POLLUTANT_ENTITY_ID_PREFIX) || entity?.data?.type === "新污染物监测点";
};

const installPollutantMarkerClick = () => {
  const cesiumViewer = getViewer();
  if (!cesiumViewer?.scene?.canvas || pollutantClickHandler) return;
  pollutantClickHandler = new Cesium.ScreenSpaceEventHandler(cesiumViewer.scene.canvas);
  pollutantClickHandler.setInputAction((event) => {
    const picked = cesiumViewer.scene.pick(event.position);
    const entity = picked?.id;
    if (entity && isPollutantMarkerEntity(entity)) {
      openPollutantPopup(entity.data || {}, event.position);
      return;
    }
    closePollutantPopup();
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
};

const destroyPollutantMarkerClick = () => {
  stopPollutantPopupDrag();
  if (pollutantClickHandler) {
    pollutantClickHandler.destroy();
    pollutantClickHandler = null;
  }
};

/**
 * 地图实体点击事件回调函数
 * @param {Object} data - 点击的实体数据
 * @param {string} data.type - 实体类型（站点/水库/闸坝等）
 * @param {string} data.name - 实体名称
 * @param {Array} data.positions - 实体位置坐标 [经度, 纬度]
 * @description 处理地图上实体的点击事件，显示信息弹窗
 */
const eventMapEnty = (data) => {
  hideLayerCesium();
  if (data?.type == "站点" || data?.type == "水库" || data?.type == "闸坝") {
    infoData.name = data.name;
    infoData.state = "在线";
    showLayerCesium(data.positions, 10, [130, -50], "result");
  }
  // if (data?.type == "地块") {
  //   infoData.name = data.name;
  //   infoData.state = "用水量：18";
  //   showLayerCesium(data.positions, 10, [130, -50], "result");
  // }
};

/**
 * 地图右键点击事件回调函数
 * @param {Object} data - 右键点击的数据
 * @param {number} data.longitude - 点击位置的经度
 * @param {number} data.latitude - 点击位置的纬度
 * @param {Object} data.cameraData - 相机视角数据
 * @description 处理地图右键点击事件，显示右键菜单并记录点击位置和相机信息
 */
const eventRight = (data) => {
  if (data.longitude || data.latitude) {
    Object.assign(cameraData, data.cameraData);
    Object.assign(positionsClick, data);
    showLayerCesium([data.longitude, data.latitude], 10, [62, 0], "rightMenu");
  }
};

/**
 * 右键菜单选项切换
 * @param {number} key - 菜单选项编号（0-关闭，1-查看坐标，2-查看视角，3-图上量算，4-天气模拟）
 * @description 切换右键菜单的子菜单显示状态
 */
const rightMenuKeyChange = (key) => {
  rightMenuKey.value = key;
};

/**
 * 批量初始化3D模型
 * @description 加载并添加多个3D模型到地图场景中，包括视频监控设备、桥梁等
 */
const waitForModelLoadSlot = () => new Promise((resolve) => {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(resolve, { timeout: 1000 });
    return;
  }
  window.setTimeout(resolve, 200);
});

const initDBModel = async () => {
  const listYiQi = [
    {
      url: "modal/yiqi.glb",
      set: { x: 200, y: 200, z: 200 },
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: CesiumMath.PI / 2, y: 0, z: 0 },
      data: {
        name: "视频监控",
        state: "正常",
        type: "视频站",
      },
      minWGS: [112.95123186506785, 28.98848086349826],
      maxWGS: [112.95123540595782, 28.988503121499466],
    },
    {
      url: "modal/yiqi.glb",
      set: { x: 200, y: 200, z: 200 },
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: CesiumMath.PI / 2, y: 0, z: 0 },
      data: {
        name: "视频监控1",
        state: "正常",
        type: "视频站",
      },
      minWGS: [112.95195842846871, 28.988827335813323],
      maxWGS: [112.95196514951824, 28.98883991622853],
    },

    {
      url: "modal/yiqi.glb",
      set: { x: 200, y: 200, z: 200 },
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: CesiumMath.PI / 2, y: 0, z: 0 },
      data: {
        name: "视频监控2",
        state: "正常",
        type: "视频站",
      },
      minWGS: [112.95276932961808, 28.989197344269456],
      maxWGS: [112.95278105674319, 28.9892087862839],
    },
    {
      url: "modal/qiao.glb",
      set: { x: 50, y: 50, z: 50 },
      position: { x: 0, y: 0, z: -5 },
      rotation: { x: CesiumMath.PI / 2, y: 0, z: 0 },
      data: {
        name: "黄金河大桥",
        state: "正常",
        type: "桥梁",
      },
      minWGS: [113.04289748963981, 28.84920790902357],
      maxWGS: [113.04275341079331, 28.85081093560235],
    },
  ];
  for (const item of listYiQi) {
    if (!getViewer()) return;
    const { url, set, position, rotation, data, minWGS, maxWGS } = item;
    await getDBModelThree(url, set, position, rotation, data, minWGS, maxWGS);
    await waitForModelLoadSlot();
  }
};

const loadInitialModels = () => {
  if (hasLoadedInitialModels || !getViewer()) return;
  hasLoadedInitialModels = true;
  initDBModel();
};

const scheduleInitialModels = () => {
  if (hasLoadedInitialModels || modelLoadTimer || modelLoadIdleCallback) return;

  if (typeof window.requestIdleCallback === "function") {
    modelLoadIdleCallback = window.requestIdleCallback(() => {
      modelLoadIdleCallback = null;
      loadInitialModels();
    }, { timeout: 5000 });
    return;
  }

  modelLoadTimer = window.setTimeout(() => {
    modelLoadTimer = null;
    loadInitialModels();
  }, 2500);
};

const cancelInitialModelSchedule = () => {
  if (modelLoadTimer) {
    window.clearTimeout(modelLoadTimer);
    modelLoadTimer = null;
  }
  if (
    modelLoadIdleCallback &&
    typeof window.cancelIdleCallback === "function"
  ) {
    window.cancelIdleCallback(modelLoadIdleCallback);
    modelLoadIdleCallback = null;
  }
};

const destroyCesiumHandler = (handler) => {
  if (handler && !handler.isDestroyed()) {
    handler.destroy();
  }
};

/**
 * 3D模型点击事件回调函数
 * @param {Object} DBData - 模型数据
 * @param {Object} DBData.threeData - Three.js 模型数据
 * @param {Object} DBData.threeData.data - 模型附加数据
 * @param {string} DBData.threeData.data.type - 模型类型
 * @description 处理3D模型点击事件，视频站类型会打开全景视频查看器
 */
const eventThree = (DBData) => {
  if (DBData?.threeData?.data?.type == "视频站") {
    hideLayerCesium();
    videShow.value = true;
    setTimeout(() => {
      new Viewer({
        container: document.querySelector("#viewer2"),
        panorama: vrImg, //初始化客厅
        fisheye: 1,
      });
    }, 500);
  }
};

// 地图组件是否加载完毕
provide("loadMap", loadMap);
// 视角飞跃
provide("flyToCesium", flyToCesium);
// 隐藏
provide("hideEntities", hideEntities);
// 删除
provide("removeEntities", removeEntities);
// 显示
provide("showEntities", showEntities);
// 增加 点位
provide("getPointCesium", getPointCesium);
// 线
provide("getLineCesium", getLineCesium);
// 多边形
provide("getPolygonCesium", getPolygonCesium);
// 切换地图
provide("initBigMap", initBigMap);
provide("initGaoGeJJ", initGaoGeJJ);
provide("initGaoGeWX", initGaoGeWX);

// 提供省级边界操作方法
provide("highlightProvinceOnMap", async (provinceCode) => {
  if (!provinceCode) return;

  // 懒加载：首次需要高亮省份时再加载全国省级边界
  if (!provinceBoundaryDataSource) {
    await loadProvinceBoundaries();
  }
  if (!provinceBoundaryDataSource) return;

  const cesiumViewer = getViewer();
  if (!cesiumViewer) {
    console.warn('⚠️ Cesium viewer 未初始化');
    return;
  }

  // 移除灌区镂空遮罩，避免与行政区遮罩冲突
  if (guanQuHoleMaskEntity) {
    cesiumViewer.entities.remove(guanQuHoleMaskEntity);
    guanQuHoleMaskEntity = null;
    console.log('🗑️ 已移除灌区镂空遮罩');
  }

  // 根据省份代码高亮（需要转换为6位代码）
  const shortCode = String(provinceCode).substring(0, 6);
  const adcode = parseInt(shortCode);
  highlightProvince(cesiumViewer, provinceBoundaryDataSource, adcode);

  // 同时飞行到该省份
  flyToProvince(cesiumViewer, provinceBoundaryDataSource, adcode, 1.5);
});

provide("clearProvinceHighlight", () => {
  const cesiumViewer = getViewer();
  if (!cesiumViewer) {
    console.warn('⚠️ Cesium viewer 未初始化');
    return;
  }
  
  if (provinceBoundaryDataSource) {
    clearHighlight(cesiumViewer, provinceBoundaryDataSource);
  }
  // 清除市级边界
  if (currentCityBoundaryDataSource && currentCityCode) {
    clearCityHighlight(cesiumViewer, currentCityBoundaryDataSource);
    removeCityBoundary(cesiumViewer, currentCityCode);
    currentCityBoundaryDataSource = null;
    currentCityCode = null;
  }
  // 清除区县边界
  if (currentCountyBoundaryDataSource && currentCountyCityCode) {
    clearCountyHighlight(cesiumViewer, currentCountyBoundaryDataSource);
    removeCountyBoundary(cesiumViewer, currentCountyCityCode);
    currentCountyBoundaryDataSource = null;
    currentCountyCityCode = null;
  }
  
  // 清除乡镇边界
  if (currentTownEntityIds.length > 0 || currentTownCountyCode) {
    clearAllTownBoundaries(cesiumViewer);
    currentTownEntityIds = [];
    currentTownCountyCode = null;
  }
  
  // 恢复灌区镂空遮罩
  if (!guanQuHoleMaskEntity) {
    guanQuHoleMaskEntity = getPolygonHolesCesium(LYBJBoundary);
    console.log('✅ 已恢复灌区镂空遮罩');
  }
});

// 提供市级边界操作方法
provide("loadCityBoundaryOnMap", async (provinceCode) => {
  if (!provinceCode) {
    console.warn('⚠️ 省份代码为空，无法加载市级边界');
    return;
  }

  try {
    const cesiumViewer = getViewer();
    if (!cesiumViewer) {
      console.warn('⚠️ Cesium viewer 未初始化');
      return;
    }

    // 先清除之前的市级边界
    if (currentCityBoundaryDataSource && currentCityCode) {
      clearCityHighlight(cesiumViewer, currentCityBoundaryDataSource);
      removeCityBoundary(cesiumViewer, currentCityCode);
      currentCityBoundaryDataSource = null;
      currentCityCode = null;
    }

    // 加载新省份的市级边界
    console.log(`🏙️ 加载省份 ${provinceCode} 的市级边界...`);
    currentCityBoundaryDataSource = await loadCityBoundary(cesiumViewer, provinceCode, {
      stroke: Cesium.Color.fromCssColorString('#00ff88'), // 绿色边界
      fill: Cesium.Color.TRANSPARENT, // 透明填充
      strokeWidth: 1.5,
      clampToGround: true
    });
    currentCityCode = provinceCode; // 保存当前城市代码
    
    console.log('✅ 市级边界加载完成');
  } catch (error) {
    console.error('❌ 加载市级边界失败:', error);
  }
});

provide("highlightCityOnMap", (cityCode) => {
  if (currentCityBoundaryDataSource && cityCode) {
    const cesiumViewer = getViewer();
    if (!cesiumViewer) {
      console.warn('⚠️ Cesium viewer 未初始化');
      return;
    }
    
    // 移除灌区镂空遮罩
    if (guanQuHoleMaskEntity) {
      cesiumViewer.entities.remove(guanQuHoleMaskEntity);
      guanQuHoleMaskEntity = null;
      console.log('🗑️ 已移除灌区镂空遮罩');
    }
    
    highlightCity(cesiumViewer, currentCityBoundaryDataSource, cityCode);
    
    // 同时飞行到该城市
    flyToCity(cesiumViewer, currentCityBoundaryDataSource, cityCode, 1.5);
  } else {
    console.warn('⚠️ 市级边界未加载或城市代码为空');
  }
});

// 提供区县级边界操作方法
provide("loadCountyBoundaryOnMap", async (cityCode) => {
  if (!cityCode) {
    console.warn('⚠️ 城市代码为空，无法加载区县边界');
    return;
  }

  try {
    const cesiumViewer = getViewer();
    if (!cesiumViewer) {
      console.warn('⚠️ Cesium viewer 未初始化');
      return;
    }

    // 先清除之前的区县边界
    if (currentCountyBoundaryDataSource && currentCountyCityCode) {
      clearCountyHighlight(cesiumViewer, currentCountyBoundaryDataSource);
      removeCountyBoundary(cesiumViewer, currentCountyCityCode);
      currentCountyBoundaryDataSource = null;
      currentCountyCityCode = null;
    }

    // 加载新城市的区县边界
    console.log(`🏢 加载城市 ${cityCode} 的区县边界...`);
    currentCountyBoundaryDataSource = await loadCountyBoundary(cesiumViewer, cityCode, {
      stroke: Cesium.Color.fromCssColorString('#ffaa00'), // 橙色边界
      fill: Cesium.Color.TRANSPARENT, // 透明填充
      strokeWidth: 1,
      clampToGround: true
    });
    currentCountyCityCode = cityCode; // 保存当前城市代码
    
    console.log('✅ 区县边界加载完成');
  } catch (error) {
    console.error('❌ 加载区县边界失败:', error);
  }
});

provide("highlightCountyOnMap", (countyCode, autoFly = true) => {
  if (currentCountyBoundaryDataSource && countyCode) {
    const cesiumViewer = getViewer();
    if (!cesiumViewer) {
      console.warn('⚠️ Cesium viewer 未初始化');
      return;
    }
    
    // 移除灌区镂空遮罩
    if (guanQuHoleMaskEntity) {
      cesiumViewer.entities.remove(guanQuHoleMaskEntity);
      guanQuHoleMaskEntity = null;
      console.log('🗑️ 已移除灌区镂空遮罩');
    }
    
    highlightCounty(cesiumViewer, currentCountyBoundaryDataSource, countyCode);
    
    // 同时飞行到该区县 (如果允许)
    if (autoFly) {
      flyToCounty(cesiumViewer, currentCountyBoundaryDataSource, countyCode, 1.5);
    }

    const entities = currentCountyBoundaryDataSource.entities.values;
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

    let countyName = '';
    if (targetEntity && targetEntity.properties) {
      countyName = targetEntity.properties.name ? targetEntity.properties.name.getValue() : '';
    }

    // 加载该区县的乡镇数据
    if (countyCode !== currentTownCountyCode) {
      // 先移除之前的乡镇数据
      if (currentTownCountyCode) {
        removeTownBoundary(cesiumViewer, currentTownCountyCode);
      }
      
      console.log(`🏘️ 加载区县 ${countyCode} 的乡镇数据...`);
      loadTownBoundary(cesiumViewer, countyCode, countyName).then(entityIds => {
        if (entityIds && entityIds.length > 0) {
          currentTownEntityIds = entityIds;
          currentTownCountyCode = countyCode;
        }
      });
    }

  } else {
    console.warn('⚠️ 区县边界未加载或区县代码为空');
  }
});

import amapGeocoder from "@/utils/amapGeocoder";

provide("highlightTownOnMap", async (townInfo) => {
  if (townInfo) {
    const cesiumViewer = getViewer();
    if (!cesiumViewer) return;

    let targetPosition = null;
    let townName = typeof townInfo === 'object' ? townInfo.name : '';
    let townCode = typeof townInfo === 'object' ? townInfo.code : townInfo;

    // 1. 尝试从已加载的实体中查找
    if (currentTownEntityIds.length > 0 && townCode) {
      const townAdcode = parseInt(townCode);
      const entity = currentTownEntityIds
        .map(id => cesiumViewer.entities.getById(id))
        .find(e => e && e.properties && e.properties.adcode && e.properties.adcode.getValue() === townAdcode);
      
      if (entity) {
        console.log(`🎯 找到乡镇实体: ${entity.name}`);
        targetPosition = entity.position.getValue(Cesium.JulianDate.now());
      }
    }

    // 2. 如果没找到实体，尝试使用 high-德 API 获取坐标
    if (!targetPosition && townName) {
      console.log(`🔄 尝试通过高德API获取坐标: ${townName}`);
      // 构造查询名称，加上区县名提高准确度
      if (currentCountyBoundaryDataSource) {
         // 这里简化处理，如果有区县信息可以拼上
      }
      
      // 如果 townInfo 包含 center 信息（假设从后端或上级组件传来）
      if (townInfo.center && Array.isArray(townInfo.center)) {
         // 注意：这里假设 center 可能是 GCJ02，需要转换
         const [lng, lat] = townInfo.center;
         const wgs84 = amapGeocoder.gcj02ToWgs84(lng, lat);
         targetPosition = Cesium.Cartesian3.fromDegrees(wgs84.lng, wgs84.lat);
      } else {
         // 使用地理编码查询
         const result = await amapGeocoder.getDistrict(townName, 0);
         if (result.success && result.center) {
             const wgs84 = amapGeocoder.gcj02ToWgs84(result.center.lng, result.center.lat);
             targetPosition = Cesium.Cartesian3.fromDegrees(wgs84.lng, wgs84.lat);
             console.log(`✅ API查询成功: ${townName} -> ${wgs84.lng}, ${wgs84.lat}`);
         }
      }
    }

    if (targetPosition) {
      console.log(`🎯 定位到乡镇: ${townName || townCode}`);
      
      // 统一使用 camera.flyTo with location
      // 先转回经纬度
      const cartographic = Cesium.Cartographic.fromCartesian(targetPosition);
      const lng = Cesium.Math.toDegrees(cartographic.longitude);
      const lat = Cesium.Math.toDegrees(cartographic.latitude);
      
      cesiumViewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lng, lat - 0.01, 1500), // 纬度减一点，制造俯视效果
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-60),
          roll: 0.0
        },
        duration: 1.5
      });
      
    } else {
      console.warn(`⚠️ 无法定位乡镇: ${townName || townCode}`);
    }
  }
});

provide("highlightVillageOnMap", async (villageInfo) => {
  if (villageInfo) {
    const cesiumViewer = getViewer();
    if (!cesiumViewer) return;

    let targetPosition = null;
    let villageName = typeof villageInfo === 'object' ? villageInfo.name : '';
    
    // 如果 villageInfo 包含 center 信息
    if (villageInfo.center && Array.isArray(villageInfo.center)) {
        const [lng, lat] = villageInfo.center;
        const wgs84 = amapGeocoder.gcj02ToWgs84(lng, lat);
        targetPosition = Cesium.Cartesian3.fromDegrees(wgs84.lng, wgs84.lat);
    } else if (villageName) {
        console.log(`🔄 尝试通过高德API获取村级坐标: ${villageName}`);
        // 使用地理编码查询，对于村级，最好带上乡镇名
        // 这里假设 villageName 已经包含了必要信息，或者我们直接搜名字
        // 如果有父级信息更好
        
        const result = await amapGeocoder.geocode(villageName); // 使用 geocode 而不是 getDistrict，村级通常用 POI 或 geocode
        if (result.success) {
            const wgs84 = amapGeocoder.gcj02ToWgs84(result.longitude, result.latitude);
            targetPosition = Cesium.Cartesian3.fromDegrees(wgs84.lng, wgs84.lat);
            console.log(`✅ API查询村级成功: ${villageName} -> ${wgs84.lng}, ${wgs84.lat}`);
        }
    }

    if (targetPosition) {
      console.log(`🎯 定位到村: ${villageName}`);
      const cartographic = Cesium.Cartographic.fromCartesian(targetPosition);
      const lng = Cesium.Math.toDegrees(cartographic.longitude);
      const lat = Cesium.Math.toDegrees(cartographic.latitude);
      
      cesiumViewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lng, lat - 0.005, 800), // 更近的距离 800米
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-60),
          roll: 0.0
        },
        duration: 1.5
      });
    } else {
      console.warn(`⚠️ 无法定位村: ${villageName}`);
    }
  }
});

onMounted(() => {
  // 初始化地图
  initCesium("cesiumContainer");
  
  // 将 viewer 和 Cesium 挂载到 window，供图层管理面板使用
  window.viewer = getViewer();
  window.Cesium = Cesium;

  // 标绘对象
  // 视角
  viewerCesium(
    113.75300914535553,
    24.68481663753728,
    64578.45508858897,
    343.56621396448907,
    -28.920626021072486,
    1.2677244429007686
  );

  // 加载 GeoServer WMS 服务
  // 使用代理地址避免跨域问题
  const geoserverUrl = `${GEOSERVER_CONFIG.baseUrl}/${GEOSERVER_CONFIG.workspace}/wms`;
  const geoserverLayer = `${GEOSERVER_CONFIG.workspace}:lybj`;
  
  console.log("========== GeoServer WMS 加载开始 ==========");
  console.log("📍 GeoServer URL:", geoserverUrl);
  console.log("🗺️ 图层名称:", geoserverLayer);
  
  // 先测试 GetCapabilities 请求
  fetch(geoserverUrl + "?service=WMS&version=1.1.0&request=GetCapabilities")
    .then(response => {
      console.log("📡 GetCapabilities 响应状态:", response.status, response.statusText);
      if (response.ok) {
        console.log("✅ GeoServer 服务可访问");
        return response.text();
      } else {
        console.error("❌ GeoServer 服务响应异常:", response.status);
      }
    })
    .then(text => {
      if (text && text.includes("lybj")) {
        console.log("✅ 找到目标图层: lybj");
      } else if (text) {
        console.warn("⚠️ 未找到目标图层，请检查图层名称");
        console.log("可用图层列表:", text.match(/<Name>.*?<\/Name>/g));
      }
    })
    .catch(error => {
      console.error("❌ GeoServer 连接失败:", error.message);
      console.error("可能原因: 1.代理配置错误 2.服务器不可达 3.跨域问题");
    });
  
  // 加载 WMS 图层
  wmsLayer = initWMSService({
    url: geoserverUrl,
    layers: geoserverLayer,
    parameters: {
      transparent: true,
      format: "image/png",
      version: "1.1.0",
      styles: "",
    },
    alpha: 0.9,
    brightness: 1.2,
    contrast: 1.2,
    credit: "GeoServer YG Data",
  });

  // 加载风险等级栅格图层 (risk_shange_2000.tif)
  console.log("========== 加载风险等级栅格图层 ==========");
  /* initWMSService({
    url: `${GEOSERVER_CONFIG.baseUrl}/${GEOSERVER_CONFIG.workspace}/wms`,
    layers: "veg:risk_shange_2000",
    parameters: {
      transparent: true,
      format: "image/png",
      version: "1.1.0",
      // 使用 SLD 自定义样式：1-5级分别对应 绿->红
      // 注意：type="intervals" 表示区间，quantity 是上界
      // 0.5以下透明，0.5-1.5为1级(绿)，1.5-2.5为2级(浅绿)，以此类推
      sld_body: `<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <NamedLayer>
    <Name>veg:risk_shange_2000</Name>
    <UserStyle>
      <Name>risk_style</Name>
      <Title>Risk Style</Title>
      <FeatureTypeStyle>
        <Rule>
          <RasterSymbolizer>
            <ColorMap type="intervals">
              <ColorMapEntry color="#FFFFFF" opacity="0" quantity="0.1"/>
              <ColorMapEntry color="#2db757" quantity="1.1" label="等级1"/>
              <ColorMapEntry color="#96d067" quantity="2.1" label="等级2"/>
              <ColorMapEntry color="#ffffbf" quantity="3.1" label="等级3"/>
              <ColorMapEntry color="#fbad65" quantity="4.1" label="等级4"/>
              <ColorMapEntry color="#e82729" quantity="5.1" label="等级5"/>
            </ColorMap>
          </RasterSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>`
    },
    alpha: 0.8,
    credit: "Risk Analysis Data",
  }); */
  
  if (wmsLayer) {
    console.log("✅ WMS 图层对象创建成功");
    console.log("📊 图层信息:");
    console.log("  - show:", wmsLayer.show);
    console.log("  - alpha:", wmsLayer.alpha);
    console.log("  - brightness:", wmsLayer.brightness);
    console.log("  - contrast:", wmsLayer.contrast);
    console.log("  - imageryProvider:", wmsLayer.imageryProvider);
    
    // 监听图层加载状态
    setTimeout(() => {
      console.log("🔍 3秒后检查图层状态:");
      console.log("  - 图层显示:", wmsLayer.show);
      console.log("  - 图层 alpha:", wmsLayer.alpha);
      
      // 测试生成的 URL
      const testUrl = geoserverUrl + 
        "?SERVICE=WMS&VERSION=1.1.0&REQUEST=GetMap" +
        `&LAYERS=${encodeURIComponent(geoserverLayer)}` +
        "&BBOX=112.60473851374479,28.497291740158655,112.6169023176589,28.504644274803756" +
        "&WIDTH=768&HEIGHT=464&SRS=EPSG:4326&FORMAT=image/png&TRANSPARENT=true";
      console.log("🔗 测试 URL:", testUrl);
    }, 3000);
  } else {
    console.error("❌ WMS 图层对象创建失败");
  }
  console.log("========== GeoServer WMS 加载结束 ==========");
  // 标绘对象
  // 视角 - 设置地图初始视角位置和角度
/*   viewerCesium(
    112.61579259357863,      // 经度 (Longitude) - 地图中心点的经度坐标
    28.492323979857254,      // 纬度 (Latitude) - 地图中心点的纬度坐标
    356.110204269617,        // 高度 (Height) - 相机离地高度，单位：米
    338.3796946203612,       // 航向角 (Heading) - 相机朝向角度，0-360度（东向为正）
    -19.737908439579186,     // 俯仰角 (Pitch) - 相机俯仰角度，负数表示向下看
    0.00025456765749831136   // 翻滚角 (Roll) - 相机翻滚角度，通常接近0
  ); */
  // 加载实体
  createShuiCesium(ListWater); //水流材质
  getWallLightCesium(LYBJBoundary); // 流域描边发光边界
  guanQuHoleMaskEntity = getPolygonHolesCesium(LYBJBoundary); // 流域显示，周边黑色镂空多边形

  // 点击实体事件
  mapEntityHandler = eventCesiumEntity(eventMapEnty);
  // 右击事件
  mapRightClickHandler = eventCesiumRight(eventRight);
  installPollutantMarkerClick();

  initThree();

  // 点击模型事件
  modelClickHandler = eventCesiumThree(eventThree);
  // 渲染
  viewer = loop();
  draw = new Draw(viewer);

  // 已禁用启动时自动加载全国省级行政区划边界
  // loadProvinceBoundaries();

  loadMap.value = true;
  scheduleInitialModels();
});

onUnmounted(() => {
  cancelInitialModelSchedule();
  destroyPollutantMarkerClick();
  destroyCesiumHandler(mapEntityHandler);
  destroyCesiumHandler(mapRightClickHandler);
  destroyCesiumHandler(modelClickHandler);
  mapEntityHandler = null;
  mapRightClickHandler = null;
  modelClickHandler = null;
  draw = null;
  wmsLayer = null;
  guanQuHoleMaskEntity = null;
  hasLoadedInitialModels = false;
  delete window.viewer;
  delete window.Cesium;
  destroyCesiumScene();
});

/**
 * 加载省级行政区划边界
 * @async
 * @description 异步加载中国省级行政区划边界数据（GeoJSON格式），并添加到地图中
 * @throws {Error} 加载失败时抛出错误
 */
const loadProvinceBoundaries = async () => {
  try {
    console.log('🗺️ 开始加载省级行政区划边界...');

    // 获取 viewer 实例
    const cesiumViewer = getViewer();

    if (!cesiumViewer) {
      console.warn('⚠️ Cesium viewer 未初始化，等待...');
      setTimeout(loadProvinceBoundaries, 1000);
      return;
    }

    // 加载省级边界，使用科技感的蓝色
    provinceBoundaryDataSource = await loadProvinceBoundary(cesiumViewer, {
      url: '/geodata/china_province.geojson',
      stroke: Cesium.Color.fromCssColorString('#00d4ff'), // 青色边界
      fill: Cesium.Color.TRANSPARENT, // 透明填充
      strokeWidth: 2,
      clampToGround: true
    });

    console.log('✅ 省级行政区划边界加载完成！');

  } catch (error) {
    console.error('❌ 加载省级边界失败:', error);
  }
};
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
}

/* 栅格分析工具栏容器 */
.raster-analysis-toolbar-container {
  position: absolute;
  bottom: 30px;
  left: 180px;
  z-index: 2000;
}

.raster-analysis-toolbar-container > * {
  pointer-events: auto;
}

/* Element UI 下拉菜单样式 */
:deep(.el-select-dropdown) {
  z-index: 3000 !important;
  background: rgba(13, 40, 71, 0.95) !important;
  border: 1px solid rgba(64, 158, 255, 0.3) !important;
}

:deep(.el-select-dropdown__item) {
  color: #fff !important;
  
  &:hover {
    background: rgba(64, 158, 255, 0.2) !important;
  }
  
  &.selected {
    color: #409EFF !important;
    background: rgba(64, 158, 255, 0.1) !important;
  }
}

#heatmap {
  width: 500px;
  height: 450px;
}

#cesiumContainer,
.container-integrate {
  position: fixed;
  top: 0px;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

#cesiumContainer > canvas {
  position: absolute;
  top: 0;
  left: 0;
  /* 设置鼠标事件穿透 */
  pointer-events: none;
}

.side {
  position: absolute;
  top: 0px;
  left: 0px;
  background: #1847698c;
  padding: 20px;
  line-height: 40px;
  height: 300px;
}

#infoBox {
  position: fixed;
  width: 150px;
  height: 80px;
  background-color: rgba(0, 0, 0, 0.226);
  border: 1px solid rgb(90, 90, 90);
}

#title {
  font-weight: 800;
}

.btnBox {
  position: fixed;
  top: 0px;
}
#result {
  width: 200px;
  background-color: #000e359c;
  border: none;
  border-bottom: 1px solid rgb(0, 225, 255);
}

.pollutant-detail-popup {
  position: fixed;
  z-index: 12000;
  width: 420px;
  max-height: 520px;
  color: #eaf7ff;
  background: linear-gradient(180deg, rgba(4, 20, 42, 0.68), rgba(4, 18, 34, 0.56));
  border: 1px solid rgba(100, 196, 255, 0.58);
  box-shadow: 0 0 18px rgba(32, 160, 255, 0.24), inset 0 0 24px rgba(0, 120, 255, 0.1);
  border-radius: 16px;
  pointer-events: auto;
  overflow: hidden;
  backdrop-filter: blur(3px);
}

.pollutant-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px 8px;
  border-bottom: 1px solid rgba(91, 190, 255, 0.24);
  background: rgba(18, 71, 128, 0.24);
  cursor: move;
  user-select: none;
}

.pollutant-popup-title {
  max-width: 330px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 16px;
  font-weight: 700;
}

.pollutant-popup-subtitle {
  margin-top: 3px;
  font-size: 11px;
  color: rgba(202, 230, 255, 0.72);
}

.pollutant-popup-close {
  width: 26px;
  height: 26px;
  color: #dff5ff;
  border: 1px solid rgba(105, 190, 255, 0.45);
  border-radius: 8px;
  background: rgba(12, 45, 86, 0.52);
  cursor: pointer;
  font-size: 18px;
  line-height: 22px;
}

.pollutant-popup-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr 1.35fr;
  gap: 6px;
  padding: 10px 12px 8px;
}

.pollutant-popup-tab {
  min-width: 0;
  height: 28px;
  padding: 0 8px;
  color: #d8eeff;
  background: rgba(18, 67, 122, 0.32);
  border: 1px solid rgba(85, 168, 255, 0.42);
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pollutant-popup-tab.active {
  color: #ffffff;
  border-color: rgba(112, 204, 255, 0.82);
  background: rgba(32, 114, 207, 0.48);
  box-shadow: inset 0 0 14px rgba(80, 172, 255, 0.24), 0 0 10px rgba(62, 160, 255, 0.18);
}

.pollutant-popup-body {
  max-height: 372px;
  padding: 0 12px 10px;
  overflow-y: auto;
  scrollbar-width: none;
}

.pollutant-popup-body::-webkit-scrollbar {
  display: none;
}

.pollutant-popup-empty {
  padding: 24px 0;
  text-align: center;
  color: rgba(221, 239, 255, 0.72);
  font-size: 13px;
}

.pollutant-time-block {
  margin-bottom: 9px;
  background: rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(80, 158, 230, 0.18);
  border-radius: 10px;
  overflow: hidden;
}

.pollutant-time-title {
  padding: 6px 8px;
  color: #9ee3ff;
  background: rgba(175, 185, 198, 0.18);
  border-bottom: 1px solid rgba(80, 158, 230, 0.14);
  font-size: 13px;
  font-weight: 700;
}

.pollutant-metric-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px 8px;
  padding: 7px 8px 8px;
}

.pollutant-metric {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  height: 24px;
  font-size: 12px;
}

.metric-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgba(230, 244, 255, 0.86);
}

.metric-value {
  margin-left: 8px;
  color: #eef8ff;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.metric-value.warning,
.pollutant-popup-legend .warning {
  color: #ffd45a;
}

.metric-value.danger,
.pollutant-popup-legend .danger {
  color: #ff6f7c;
}

.pollutant-popup-legend {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 7px 12px 10px;
  border-top: 1px solid rgba(91, 190, 255, 0.22);
  color: rgba(230, 244, 255, 0.72);
  font-size: 11px;
}

:global(.pollutant-popup-dragging) {
  cursor: move;
  user-select: none;
}

#video {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background-color: #000e359c;
  z-index: 999;
}

.result-header {
  background-color: #00284e;
  display: flex;
  justify-content: space-between;
  padding: 4px 6px;
}

.result-header-title,
.result-header-close {
  color: #fff;
  cursor: pointer;
}

.result-content {
  padding: 6px 8px;
  margin-bottom: 20px;
}

.result-content-item {
  display: flex;
  justify-content: space-between;
  background: rgba(0, 0, 0, 0.397);
  padding: 10px;
  font-size: 14px;
  margin-bottom: 8px;
  color: #fff;
}

.result-jiantou {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: -11px;
  width: 0;
  height: 0;
  border-top: 10px solid transparent;
  border-bottom: 10px solid transparent;
  border-right: 10px solid blue;
}

/* 行政区级联选择器样式 */
.district-cascade-wrapper {
  position: fixed;
  top: 15px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  pointer-events: auto;
  display: flex;
  gap: 10px;
  align-items: center;
  
  /* 级联选择器样式 */
  :deep(.el-cascader) {
    width: auto;
  }
  
  :deep(.el-input__wrapper) {
    background: rgba(8, 24, 48, 0.7);
    border: 1px solid rgba(0, 242, 255, 0.3);
    box-shadow: 0 0 10px rgba(0, 242, 255, 0.2);
    padding: 0 12px;
    
    &:hover {
      border-color: rgba(0, 242, 255, 0.5);
      box-shadow: 0 0 15px rgba(0, 242, 255, 0.3);
    }
  }
  
  :deep(.el-input__inner) {
    background: transparent;
    color: #fff;
    font-size: 14px;
    min-width: 180px;
    
    &::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }
  }
  
  :deep(.el-input__suffix) {
    .el-icon {
      color: #00f2ff;
    }
  }
  
  :deep(.el-cascader__tags) {
    flex-wrap: nowrap;
  }
}

#rightMenu {
  background: #2e2e2e;
}

.list {
  min-width: 100px;
  max-width: 100%;
  cursor: pointer;
  background: #272727;
  color: #fff;
  padding: 6px 12px;
  margin: 1px;
}

.list:hover {
  background: #474747;
}

.listhover {
  background: #474747;
}

.listContent {
  background: #272727;
  position: absolute;
  top: 0px;
  left: 130px;
  min-width: 100px;
  max-width: 300px;
  height: 300px;
  color: #fff;
}

.listTile {
  padding: 6px 12px;
}
</style>
