<!--
 * @Author: YG 
 * @Date: 2025-11-27
 * @Description: 图层管理面板组件
-->
<template>
  <div class="layer-panel-wrapper">
    <!-- 触发按钮 -->
    <div class="layer-trigger" @click="togglePanel" :class="{ active: isPanelOpen }">
      <svg class="icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M12,2L2,7L12,12L22,7L12,2Z M2,17L12,22L22,17L22,13L12,18L2,13L2,17Z M2,11L12,16L22,11L22,7L12,12L2,7L2,11Z" opacity="0.9"/>
      </svg>
      <span class="label">图层控制</span>
    </div>
    
    <!-- 图层面板 -->
    <transition name="slide-panel">
      <div class="layer-panel" v-show="isPanelOpen">
        <div class="panel-header">
          <span class="title">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style="margin-right: 6px;">
              <path d="M21,16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V7.5C3,7.12 3.21,6.79 3.53,6.62L11.43,2.18C11.59,2.06 11.79,2 12,2C12.21,2 12.41,2.06 12.57,2.18L20.47,6.62C20.79,6.79 21,7.12 21,7.5V16.5Z" fill="none" stroke="currentColor" stroke-width="2"/>
              <circle cx="12" cy="12" r="4" opacity="0.8"/>
            </svg>
            图层管理
          </span>
          <span class="close-btn" @click="isPanelOpen = false">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" stroke-linecap="square"/>
            </svg>
          </span>
        </div>
        
        <!-- 加载状态 -->
        <div class="loading-state" v-if="isLoading">
          <div class="spinner"></div>
          <span>系统初始化...</span>
        </div>
        
        <!-- 图层分组列表 -->
        <div class="panel-content" v-else>
          <!-- 按工作空间分组 -->
          <div 
            class="layer-group" 
            v-for="(group, groupIndex) in displayGroups" 
            :key="group.workspace"
          >
            <div class="group-header" @click="toggleGroup(group.workspace)">
              <span class="group-icon">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" :style="{ transform: expandedGroups.includes(group.workspace) ? 'rotate(90deg)' : 'rotate(0)' }">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </span>
              <span class="group-name">{{ getWorkspaceLabel(group.workspace) }}</span>
              <span class="layer-count">{{ group.layers.length }}</span>
            </div>
            
            <transition name="expand">
              <div class="group-layers" v-show="expandedGroups.includes(group.workspace)">
                <div 
                  class="layer-item"
                  v-for="(layer, layerIndex) in group.layers"
                  :key="layer.name"
                  draggable="true"
                  @dragstart="handleDragStart($event, groupIndex, layerIndex, layer)"
                  @dragover="handleDragOver($event)"
                  @drop="handleDrop($event, groupIndex, layerIndex)"
                >
                  <div class="drag-handle" title="拖拽排序">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M7,19V5H9V19H7M11,19V5H13V19H11M15,19V5H17V19H15Z" />
                    </svg>
                  </div>
                  <label class="layer-checkbox">
                    <input 
                      type="checkbox" 
                      :checked="activeLayers.includes(layer.name)"
                      @change="toggleLayer(layer)"
                    />
                    <span class="checkmark"></span>
                  </label>
                  <div class="layer-info" @click="toggleLayer(layer)" :title="layer.title || layer.name">
                    <div class="layer-title">{{ layer.title || layer.name }}</div>
                    <div class="layer-name">{{ layer.name }}</div>
                  </div>
                  <div class="layer-actions">
                    <!-- 透明度调节器 -->
                    <div 
                      class="opacity-popover" 
                      v-if="activeSettingLayerName === layer.name" 
                      @click.stop
                      @mousedown.stop
                      draggable="true"
                      @dragstart.stop.prevent
                    >
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        :value="getLayerOpacity(layer.name)"
                        @input="setLayerOpacity(layer.name, $event.target.value)"
                      />
                      <span class="opacity-value">{{ getLayerOpacity(layer.name) }}%</span>
                    </div>

                    <span 
                      class="action-btn" 
                      title="精准定位"
                      @click.stop="flyToLayer(layer)"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="9" opacity="0.5"/>
                        <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke-width="2"/>
                        <circle cx="12" cy="12" r="2" fill="currentColor"/>
                        <path d="M7 7l2 2M17 17l-2-2M17 7l-2 2M7 17l2-2" opacity="0.5"/>
                      </svg>
                    </span>
                    <span 
                      class="action-btn" 
                      title="图层参数"
                      @click.stop="toggleLayerSettings(layer.name)"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke-linejoin="round"/>
                      </svg>
                    </span>
                    <!-- 栅格风险分析按钮：仅对指定风险栅格图层显示 -->
                    <span
                      v-if="isRiskRasterLayer(layer)"
                      class="action-btn"
                      title="风险等级分析"
                      @click.stop="analyzeRasterLayer(layer)"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M4 20h16M6 16v-6M10 16V4M14 16v-4M18 16v-8" stroke-linecap="round"/>
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </transition>
          </div>
          
          <!-- 空状态 -->
          <div class="empty-state" v-if="displayGroups.length === 0">
            <span>暂无可用图层</span>
            <button @click="refreshLayers">刷新</button>
          </div>
        </div>
        
        <!-- 底部操作栏 -->
        <div class="panel-footer">
          <button class="footer-btn" @click="clearAllLayers">
            <span>清除全部</span>
          </button>
          <button class="footer-btn primary" @click="refreshLayers">
            <span>🔄 刷新</span>
          </button>
        </div>
      </div>
    </transition>
    
    <!-- 图层设置弹窗 (已移除，改为行内调节) -->
  </div>
</template>

<script setup>
import { ref, inject, onMounted, onUnmounted } from 'vue';
import { getGeoServerLayers } from '@/utils/geoserver-helper';
import { GEOSERVER_CONFIG } from '@/config/geoserver.config';
import {
  WATER_QUALITY_FILTER_EVENT,
  WATER_QUALITY_LAYER_KEY,
  WATER_QUALITY_SELECTED_EVENT,
  WATER_GRADE_META,
  fetchWaterQualityFeatures,
  filterWaterQualityRows,
  selectLatestWaterQualityRowsBySite,
} from './yewu3/water-quality-data';

// 事件
const emit = defineEmits(['analyze-layer']);

// 注入地图相关方法
const flyToCesium = inject('flyToCesium', null);

// 状态
const isPanelOpen = ref(false);
const isLoading = ref(false);
const layers = ref([]);
const activeLayers = ref([]);
const expandedGroups = ref([GEOSERVER_CONFIG.workspace, 'ne', 'default', 'xwrw']); // 默认展开的工作空间
const activeSettingLayerName = ref(null); // 当前正在调节透明度的图层
const layerOpacities = ref({}); // 存储图层透明度
const loadedWmsLayers = new Map(); // 存储已加载的 WMS 图层对象 (不使用 ref，避免 Cesium 对象被代理)
const loadedCustomLayers = new Map(); // 存储自定义实体图层（如新污染物点位）
const suppressedDefaultLayerKeys = new Set();
const displayGroups = ref([]); // 用于显示的分组列表（可排序）
const draggingLayer = ref(null); // 当前拖拽的图层
const hasInitializedDefaultLayers = ref(false);
const DEFAULT_ACTIVE_LAYER_KEYS = ['cz_xwrw_data', 'zysy'];
const POLLUTANT_LAYER_KEY = 'cz_xwrw_data';
const POLLUTANT_ENTITY_ID_PREFIX = 'pollutant-marker:';
const WATER_QUALITY_ENTITY_ID_PREFIX = 'water-quality-marker:';
const pollutantIconCache = new Map();
const waterQualityIconCache = new Map();
const pollutantStyleState = ref({
  valueMode: 'field',
  valueFieldCandidates: ['sdz', 'SDZ'],
  monDate: '',
  siteName: '',
  siteFocused: false,
});
const waterQualityStyleState = ref({
  grade: '',
  monitorDate: '',
  monitorMonth: '',
  monitorStartMonth: '',
  monitorEndMonth: '',
  pollutantCode: '',
  pollutantName: '',
  status: '',
  siteName: '',
  selectedId: '',
});
const WATER_QUALITY_STYLE_KEYS = [
  'grade',
  'monitorDate',
  'monitorMonth',
  'monitorStartMonth',
  'monitorEndMonth',
  'pollutantCode',
  'pollutantName',
  'status',
  'siteName',
  'selectedId',
];
const CAMERA_ALL_SITES_HEIGHT = 20000;
let cameraMoveEndListener = null;
let cameraMoveEndViewer = null;
let pollutantRenderVersion = 0;
let waterQualityRenderVersion = 0;
let waterQualityRowsCache = null;
const lastWideViewState = ref(null);

// 工作空间标签映射
const workspaceLabels = {
  'veg': '🌿 植被数据 (veg)',
  'YG': '🌿 业务数据 (YG)',
  'ne': '🌍 自然地球',
  'topp': '🗺️ 示例数据',
  'tiger': '🏙️ 纽约市',
  'sf': '🏔️ Spearfish',
  'nurc': '🖼️ 栅格样例',
  'cite': '📋 Cite',
  'it.geosolutions': '🔧 GeoSolutions',
  'sde': '💾 SDE',
  'default': '📁 默认分组',
  'xwrw': '📁 新污染物'
};

// 切换面板
const togglePanel = () => {
  isPanelOpen.value = !isPanelOpen.value;
  if (isPanelOpen.value && layers.value.length === 0) {
    refreshLayers();
  }
};

// 切换分组展开状态
const toggleGroup = (workspace) => {
  const index = expandedGroups.value.indexOf(workspace);
  if (index > -1) {
    expandedGroups.value.splice(index, 1);
  } else {
    expandedGroups.value.push(workspace);
  }
};

// 获取工作空间标签
const getWorkspaceLabel = (workspace) => {
  return workspaceLabels[workspace] || `📁 ${workspace}`;
};

// 刷新图层列表
const refreshLayers = async () => {
  isLoading.value = true;
  try {
    const result = await getGeoServerLayers();
    layers.value = result;
    
    // 构建 displayGroups
    const groups = {};
    const priority = ['xwrw', 'ne', 'topp', 'default'];
    
    result.forEach(layer => {
      const ws = layer.workspace || 'default';
      if (!groups[ws]) {
        groups[ws] = {
          workspace: ws,
          layers: []
        };
      }
      groups[ws].layers.push(layer);
    });
    
    // 按优先级排序并赋值给 displayGroups
    displayGroups.value = Object.values(groups).sort((a, b) => {
      const aIndex = priority.indexOf(a.workspace);
      const bIndex = priority.indexOf(b.workspace);
      // 如果都在优先级列表中，按列表顺序
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      // 如果有一个在，在的排前面
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      // 都不在，按字母顺序
      return a.workspace.localeCompare(b.workspace);
    });
    
    // 统计各工作空间图层数量
    const workspaceCounts = {};
    result.forEach(l => {
      workspaceCounts[l.workspace] = (workspaceCounts[l.workspace] || 0) + 1;
    });
    
    console.log('✅ 已加载', result.length, '个图层');
    console.log('📁 工作空间统计:', workspaceCounts);
    await ensureDefaultActiveLayers();
    
  } catch (error) {
    console.error('❌ 加载图层失败:', error);
  } finally {
    isLoading.value = false;
  }
};

const getLayerKey = (layerName = '') => {
  return String(layerName).includes(':')
    ? String(layerName).split(':').pop()
    : String(layerName);
};

const isPollutantLayer = (layer) => {
  const layerKey = getLayerKey(layer?.name || '');
  return layerKey.toLowerCase() === POLLUTANT_LAYER_KEY;
};

const isWaterQualityLayer = (layer) => {
  const layerKey = getLayerKey(layer?.name || '');
  return layerKey === WATER_QUALITY_LAYER_KEY;
};

const findLayerByKey = (layerKey) => {
  if (!layerKey) return null;
  return layers.value.find((layer) => {
    const name = layer?.name || '';
    const key = getLayerKey(name);
    return name === layerKey || key === layerKey;
  }) || null;
};

const ensureDefaultActiveLayers = async () => {
  if (hasInitializedDefaultLayers.value) return;
  for (const layerKey of DEFAULT_ACTIVE_LAYER_KEYS) {
    if (suppressedDefaultLayerKeys.has(layerKey)) continue;
    const layer = findLayerByKey(layerKey);
    if (!layer) continue;
    if (!activeLayers.value.includes(layer.name)) {
      await toggleLayer(layer);
    }
  }
  hasInitializedDefaultLayers.value = true;
};

const clamp01 = (value) => Math.max(0, Math.min(1, value));

const interpolateColor = (Cesium, start, end, t) => {
  const ratio = clamp01(t);
  return Cesium.Color.fromBytes(
    Math.round(start[0] + (end[0] - start[0]) * ratio),
    Math.round(start[1] + (end[1] - start[1]) * ratio),
    Math.round(start[2] + (end[2] - start[2]) * ratio),
    255
  );
};

const getGreenYellowRedColor = (Cesium, ratio) => {
  const t = clamp01(ratio);
  const green = [34, 197, 94];
  const yellow = [250, 204, 21];
  const red = [239, 68, 68];
  if (t <= 0.5) return interpolateColor(Cesium, green, yellow, t / 0.5);
  return interpolateColor(Cesium, yellow, red, (t - 0.5) / 0.5);
};

const getPollutantMarkerRatio = (value, minVal, maxVal) => {
  if (!Number.isFinite(value)) return 0;
  if (!Number.isFinite(minVal) || !Number.isFinite(maxVal) || maxVal <= minVal) return 0;
  const rawRatio = (value - minVal) / (maxVal - minVal);
  // 提前拉开中高值的色差，避免最高断面在卫星底图上仍然不醒目。
  return Math.pow(clamp01(rawRatio), 0.72);
};

const colorToCss = (Cesium, color) => {
  const css = color?.toCssColorString?.();
  if (css) return css;
  const c = color || Cesium.Color.WHITE;
  const r = Math.round((c.red || 1) * 255);
  const g = Math.round((c.green || 1) * 255);
  const b = Math.round((c.blue || 1) * 255);
  const a = Number.isFinite(c.alpha) ? c.alpha : 1;
  return `rgba(${r},${g},${b},${a})`;
};

const colorToBytes = (Cesium, color) => {
  const c = color || Cesium.Color.WHITE;
  return [
    Math.round(clamp01(c.red ?? 1) * 255),
    Math.round(clamp01(c.green ?? 1) * 255),
    Math.round(clamp01(c.blue ?? 1) * 255),
  ];
};

const rgbCss = ([r, g, b], alpha = 1) => `rgba(${r},${g},${b},${alpha})`;

const mixRgb = (rgb, target, ratio) => {
  const t = clamp01(ratio);
  return rgb.map((value, index) => Math.round(value + (target[index] - value) * t));
};

const buildInvertedDropIcon = (Cesium, color, ratio = 0) => {
  const colorCss = colorToCss(Cesium, color);
  const visualRatio = clamp01(ratio);
  const key = `${colorCss}:${visualRatio.toFixed(2)}`;
  if (pollutantIconCache.has(key)) return pollutantIconCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const cx = 48;
  const topY = 20;
  const radius = 24;
  const tipY = 86;
  const rgb = colorToBytes(Cesium, color);
  const lightRgb = mixRgb(rgb, [255, 255, 255], 0.3);
  const darkRgb = mixRgb(rgb, [35, 20, 18], 0.42);

  if (visualRatio >= 0.78) {
    ctx.beginPath();
    ctx.arc(cx, topY + radius + 7, 34 + visualRatio * 7, 0, Math.PI * 2);
    ctx.fillStyle = rgbCss(rgb, 0.18 + visualRatio * 0.16);
    ctx.shadowColor = rgbCss(rgb, 0.9);
    ctx.shadowBlur = 24;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // 倒立水滴轮廓（尖端朝下）
  ctx.beginPath();
  ctx.arc(cx, topY + radius, radius, Math.PI, 0, false);
  ctx.quadraticCurveTo(cx + 28, topY + radius + 18, cx, tipY);
  ctx.quadraticCurveTo(cx - 28, topY + radius + 18, cx - radius, topY + radius);
  ctx.closePath();

  const grad = ctx.createLinearGradient(0, topY, 0, tipY);
  grad.addColorStop(0, rgbCss(lightRgb, 0.98));
  grad.addColorStop(0.32, colorCss);
  grad.addColorStop(0.72, rgbCss(rgb, 0.95));
  grad.addColorStop(1, rgbCss(darkRgb, 0.98));
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.lineWidth = visualRatio >= 0.78 ? 5 : 3;
  ctx.strokeStyle = visualRatio >= 0.78 ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.82)';
  ctx.shadowColor = visualRatio >= 0.78 ? rgbCss(rgb, 0.95) : 'transparent';
  ctx.shadowBlur = visualRatio >= 0.78 ? 14 : 0;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 高光
  ctx.beginPath();
  ctx.ellipse(cx - 8, topY + radius - 3, 8, 12, -0.35, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.48)';
  ctx.fill();

  const dataUrl = canvas.toDataURL('image/png');
  pollutantIconCache.set(key, dataUrl);
  return dataUrl;
};

const parseLayerNameAndWorkspace = (layer) => {
  let layerName = layer.name;
  let workspace = layer.workspace;
  if (!layerName.includes(':')) {
    if (layer.workspace && layer.workspace !== 'default') {
      layerName = `${layer.workspace}:${layerName}`;
    } else {
      workspace = GEOSERVER_CONFIG.workspace;
      layerName = `${GEOSERVER_CONFIG.workspace}:${layerName}`;
    }
  } else {
    workspace = layerName.split(':')[0];
  }
  if (workspace === 'YG') {
    workspace = GEOSERVER_CONFIG.workspace;
    if (layerName.startsWith('YG:')) layerName = layerName.replace('YG:', `${GEOSERVER_CONFIG.workspace}:`);
  }
  return { layerName, workspace };
};

const pickPollutantValueField = (properties = {}) => {
  if (pollutantStyleState.value?.valueMode === 'composite') return '__composite_value';
  const keys = Object.keys(properties || {});
  const candidates = pollutantStyleState.value?.valueFieldCandidates || [];
  for (const field of candidates) {
    const hit = keys.find((key) => key === field || key.toLowerCase() === String(field).toLowerCase());
    if (hit) return hit;
  }
  return null;
};

const toFiniteNumber = (value) => {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const getFeaturePoint = (feature) => {
  const geometry = feature?.geometry;
  if (!geometry?.type || !geometry?.coordinates) return null;
  if (geometry.type === 'Point') return geometry.coordinates;
  if (geometry.type === 'MultiPoint' && geometry.coordinates.length > 0) return geometry.coordinates[0];
  return null;
};

const getPollutantSiteName = (properties = {}) => {
  return properties.site_name || properties.siteName || properties.station_name || properties.station || properties.name || '';
};

const getFeatureUniqueKey = (feature, index = 0) => {
  const props = feature?.properties || {};
  const siteName = getPollutantSiteName(props);
  const coord = getFeaturePoint(feature);
  const lon = Number(coord?.[0]);
  const lat = Number(coord?.[1]);
  const coordKey = Number.isFinite(lon) && Number.isFinite(lat) ? `${lon.toFixed(6)},${lat.toFixed(6)}` : `idx:${index}`;
  return `${siteName || 'unknown'}|${coordKey}`;
};

const isWideViewMode = () => {
  const viewer = window.viewer;
  const height = viewer?.camera?.positionCartographic?.height;
  return Number.isFinite(height) ? height > CAMERA_ALL_SITES_HEIGHT : false;
};

const normalizeMonDate = (value) => {
  if (!value) return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = `${value.getMonth() + 1}`.padStart(2, '0');
    const d = `${value.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const text = String(value).trim();
  const match = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (!match) {
    const cnMatch = text.match(/^(\d{4})年\s*(\d{1,2})月\s*(上旬|下旬)?/);
    if (!cnMatch) return '';
    const year = Number(cnMatch[1]);
    const month = Number(cnMatch[2]);
    const day = cnMatch[3] === '上旬' ? 10 : cnMatch[3] === '下旬' ? 20 : 1;
    if (!Number.isFinite(year) || month < 1 || month > 12) return '';
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return '';
  if (month < 1 || month > 12 || day < 1 || day > 31) return '';
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const cloneFeatureForPopup = (feature) => ({
  type: feature?.type || 'Feature',
  geometry: feature?.geometry || null,
  properties: { ...(feature?.properties || {}) },
});

const removePollutantLayerEntities = () => {
  const viewer = window.viewer;
  if (!viewer) return;
  const entities = loadedCustomLayers.get(POLLUTANT_LAYER_KEY) || [];
  entities.forEach((entity) => viewer.entities.remove(entity));

  // 兜底清理：快速切换时旧异步请求可能绕过 Map 记录，按 id 前缀全量移除残留点位。
  const entityValues = viewer.entities?.values || [];
  entityValues
    .filter((entity) => String(entity?.id || '').startsWith(POLLUTANT_ENTITY_ID_PREFIX))
    .forEach((entity) => viewer.entities.remove(entity));

  loadedCustomLayers.delete(POLLUTANT_LAYER_KEY);
};

const clearPollutantLayer = () => {
  suppressedDefaultLayerKeys.add(POLLUTANT_LAYER_KEY);
  pollutantRenderVersion += 1;
  removePollutantLayerEntities();
  activeLayers.value = activeLayers.value.filter(
    (layerName) => getLayerKey(layerName) !== POLLUTANT_LAYER_KEY
  );
  window.dispatchEvent(new CustomEvent('wms-layer-changed', {
    detail: {
      activeLayers: [...activeLayers.value],
      activeLayerKeys: activeLayers.value.map(getLayerKey),
    },
  }));
};

const addPollutantLayerEntities = async (layer, renderVersion = pollutantRenderVersion) => {
  const viewer = window.viewer;
  const Cesium = window.Cesium;
  if (!viewer || !Cesium) return;

  const { layerName, workspace } = parseLayerNameAndWorkspace(layer);
  const requestUrl =
    `${GEOSERVER_CONFIG.baseUrl}/${workspace}/ows?service=WFS&version=1.0.0&request=GetFeature` +
    `&typeName=${encodeURIComponent(layerName)}` +
    `&outputFormat=${encodeURIComponent('application/json')}` +
    `&srsName=EPSG:4326`;

  const response = await fetch(requestUrl);
  if (!response.ok) throw new Error(`新污染物WFS请求失败: ${response.status}`);
  const geojson = await response.json();
  if (renderVersion !== pollutantRenderVersion) return;

  const allFeatures = Array.isArray(geojson?.features) ? geojson.features : [];
  const allFeaturesBySite = new Map();
  allFeatures.forEach((feature, index) => {
    const siteName = getPollutantSiteName(feature?.properties || {});
    const key = siteName || getFeatureUniqueKey(feature, index);
    if (!allFeaturesBySite.has(key)) allFeaturesBySite.set(key, []);
    allFeaturesBySite.get(key).push(cloneFeatureForPopup(feature));
  });
  const targetMonDate = normalizeMonDate(pollutantStyleState.value?.monDate);
  const targetSiteName = String(pollutantStyleState.value?.siteName || '').trim();
  const isSiteFocused = Boolean(pollutantStyleState.value?.siteFocused);
  const isCompositeMode = pollutantStyleState.value?.valueMode === 'composite';
  const useSingleSiteFilter = isSiteFocused && !isWideViewMode();
  const monDateFiltered = !isCompositeMode && targetMonDate
    ? allFeatures.filter((feature) => normalizeMonDate(feature?.properties?.mon_date) === targetMonDate)
    : allFeatures;
  const features = useSingleSiteFilter && targetSiteName
    ? monDateFiltered.filter((feature) => getPollutantSiteName(feature?.properties || {}) === targetSiteName)
    : monDateFiltered;
  const uniqueFeatureMap = new Map();

  if (isCompositeMode) {
    features.forEach((feature, index) => {
      const props = feature?.properties || {};
      const siteName = getPollutantSiteName(props);
      const key = siteName || getFeatureUniqueKey(feature, index);
      const current = uniqueFeatureMap.get(key);
      const currentValue = current?.properties?.__composite_value || 0;
      const nextValue = toFiniteNumber(props.yczb ?? props.YCZB) || 0;
      if (current) {
        current.properties.__composite_value = currentValue + nextValue;
      } else {
        uniqueFeatureMap.set(key, {
          ...feature,
          properties: {
            ...props,
            __composite_value: nextValue,
          },
        });
      }
    });
  } else {
    features.forEach((feature, index) => {
      const siteName = getPollutantSiteName(feature?.properties || {});
      // 时间节点内按断面名唯一化，确保每个断面只显示一条记录；
      // 若缺失断面名，则回退到坐标键避免误合并。
      const key = siteName || getFeatureUniqueKey(feature, index);
      if (!uniqueFeatureMap.has(key)) uniqueFeatureMap.set(key, feature);
    });
  }

  const uniqueFeatures = Array.from(uniqueFeatureMap.values());
  if (!uniqueFeatures.length) {
    loadedCustomLayers.set(POLLUTANT_LAYER_KEY, []);
    return;
  }

  const values = uniqueFeatures
    .map((feature) => {
      const props = feature?.properties || {};
      const valueField = pickPollutantValueField(props);
      const val = toFiniteNumber(valueField ? props[valueField] : NaN);
      return Number.isFinite(val) ? val : null;
    })
    .filter((val) => Number.isFinite(val));

  const minVal = values.length ? Math.min(...values) : 0;
  const maxVal = values.length ? Math.max(...values) : 1;
  const createdEntities = [];
  let markerSequence = 0;

  uniqueFeatures.forEach((feature, index) => {
    const coord = getFeaturePoint(feature);
    if (!coord || coord.length < 2) return;
    const lon = Number(coord[0]);
    const lat = Number(coord[1]);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return;

    const props = feature?.properties || {};
    const valueField = pickPollutantValueField(props);
    const value = toFiniteNumber(valueField ? props[valueField] : NaN);
    const ratio = getPollutantMarkerRatio(value, minVal, maxVal);
    const color = getGreenYellowRedColor(Cesium, ratio);
    const radius = 26 + Math.round(ratio * 7);
    const name = getPollutantSiteName(props) || `监测点${index + 1}`;
    const siteKey = getPollutantSiteName(props) || getFeatureUniqueKey(feature, index);
    const icon = buildInvertedDropIcon(Cesium, color, ratio) || '';
    const markerId = `${POLLUTANT_ENTITY_ID_PREFIX}${renderVersion}:${markerSequence++}`;
    viewer.entities.removeById?.(markerId);
    const marker = viewer.entities.add({
      id: markerId,
      name: `${name}-污染点`,
      position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
      billboard: {
        image: icon,
        width: radius * 1.55,
        height: radius * 1.8,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance: undefined,
        translucencyByDistance: undefined,
      },
      label: {
        show: true,
        text: name,
        font: '600 20px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -62),
        heightReference: Cesium.HeightReference.NONE,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        showBackground: true,
        backgroundColor: ratio >= 0.78 ? Cesium.Color.fromBytes(130, 24, 24, 170) : Cesium.Color.fromBytes(20, 64, 120, 120),
        backgroundPadding: new Cesium.Cartesian2(12, 8),
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 3000000),
      },
    });
    marker.data = {
      type: '新污染物监测点',
      layerKey: POLLUTANT_LAYER_KEY,
      siteName: name,
      positions: [lon, lat],
      activeField: valueField || '',
      valueMode: pollutantStyleState.value?.valueMode || 'field',
      features: allFeaturesBySite.get(siteKey) || [cloneFeatureForPopup(feature)],
    };

    createdEntities.push(marker);
  });

  if (renderVersion !== pollutantRenderVersion) {
    createdEntities.forEach((entity) => viewer.entities.remove(entity));
    return;
  }

  loadedCustomLayers.set(POLLUTANT_LAYER_KEY, createdEntities);
};

const buildWaterQualityDropIcon = (Cesium, grade = '无数据', selected = false) => {
  const color = WATER_GRADE_META[grade]?.color || WATER_GRADE_META['无数据'].color;
  const key = `${grade}:${selected}`;
  if (waterQualityIconCache.has(key)) return waterQualityIconCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const colorBytes = colorToBytes(Cesium, Cesium.Color.fromCssColorString(color));
  const cx = 48;
  const topY = 18;
  const radius = selected ? 29 : 24;
  const tipY = 86;

  if (selected) {
    ctx.beginPath();
    ctx.arc(cx, 46, 39, 0, Math.PI * 2);
    ctx.fillStyle = rgbCss(colorBytes, 0.2);
    ctx.shadowColor = rgbCss(colorBytes, 0.95);
    ctx.shadowBlur = 22;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  ctx.beginPath();
  ctx.arc(cx, topY + radius, radius, Math.PI, 0, false);
  ctx.quadraticCurveTo(cx + 30, topY + radius + 19, cx, tipY);
  ctx.quadraticCurveTo(cx - 30, topY + radius + 19, cx - radius, topY + radius);
  ctx.closePath();

  const grad = ctx.createLinearGradient(0, topY, 0, tipY);
  grad.addColorStop(0, 'rgba(255,255,255,0.94)');
  grad.addColorStop(0.28, color);
  grad.addColorStop(1, color);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.lineWidth = selected ? 5 : 3;
  ctx.strokeStyle = selected ? '#ffffff' : 'rgba(255,255,255,0.82)';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx - 8, topY + radius - 4, 8, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.46)';
  ctx.fill();

  const dataUrl = canvas.toDataURL('image/png');
  waterQualityIconCache.set(key, dataUrl);
  return dataUrl;
};

const removeWaterQualityLayerEntities = () => {
  const viewer = window.viewer;
  if (!viewer) return;
  const entities = loadedCustomLayers.get(WATER_QUALITY_LAYER_KEY) || [];
  entities.forEach((entity) => viewer.entities.remove(entity));

  const entityValues = viewer.entities?.values || [];
  entityValues
    .filter((entity) => String(entity?.id || '').startsWith(WATER_QUALITY_ENTITY_ID_PREFIX))
    .forEach((entity) => viewer.entities.remove(entity));

  loadedCustomLayers.delete(WATER_QUALITY_LAYER_KEY);
};

const addWaterQualityLayerEntities = async (renderVersion = waterQualityRenderVersion) => {
  const viewer = window.viewer;
  const Cesium = window.Cesium;
  if (!viewer || !Cesium) return;

  const rows = Array.isArray(waterQualityRowsCache)
    ? waterQualityRowsCache
    : (await fetchWaterQualityFeatures()).rows;
  if (renderVersion !== waterQualityRenderVersion) return;

  const filteredRows = selectLatestWaterQualityRowsBySite(
    filterWaterQualityRows(rows, waterQualityStyleState.value).filter((row) => row.hasPoint)
  );
  const createdEntities = [];

  filteredRows.forEach((row, index) => {
    const selected = row.id === waterQualityStyleState.value.selectedId || row.name === waterQualityStyleState.value.siteName;
    const markerId = `${WATER_QUALITY_ENTITY_ID_PREFIX}${renderVersion}:${index}`;
    const marker = viewer.entities.add({
      id: markerId,
      name: `${row.name}-水质监测点`,
      position: Cesium.Cartesian3.fromDegrees(row.lon, row.lat, 0),
      billboard: {
        image: buildWaterQualityDropIcon(Cesium, row.grade, selected),
        width: selected ? 72 : 58,
        height: selected ? 82 : 68,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        show: true,
        text: row.name,
        font: '600 18px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -58),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        showBackground: true,
        backgroundColor: selected ? Cesium.Color.fromBytes(0, 156, 220, 178) : Cesium.Color.fromBytes(20, 64, 120, 118),
        backgroundPadding: new Cesium.Cartesian2(10, 7),
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, selected ? 3000000 : 120000),
      },
    });
    marker.data = {
      type: '水质监测点',
      layerKey: WATER_QUALITY_LAYER_KEY,
      siteName: row.name,
      positions: [row.lon, row.lat],
      grade: row.gradeLabel,
      mainPollutant: row.mainPollutant,
      monitorTime: row.monitorTime,
      status: row.status,
      features: [{
        properties: {
          sec_name: row.name,
          samp_date: row.monitorTime,
          wq_class: row.gradeLabel,
          main_pollutant: row.mainPollutant,
          status: row.status,
          ...row.pollutantValues,
        },
      }],
    };

    createdEntities.push(marker);
  });

  if (renderVersion !== waterQualityRenderVersion) {
    createdEntities.forEach((entity) => viewer.entities.remove(entity));
    return;
  }

  loadedCustomLayers.set(WATER_QUALITY_LAYER_KEY, createdEntities);
};

// 拖拽开始
const handleDragStart = (event, groupIndex, layerIndex, layer) => {
  draggingLayer.value = { groupIndex, layerIndex, layer };
  event.dataTransfer.effectAllowed = 'move';
  // 可以设置自定义拖拽图像
  // event.dataTransfer.setDragImage(img, 0, 0);
};

// 拖拽经过
const handleDragOver = (event) => {
  // 必须阻止默认行为才能触发 drop
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
};

// 放置
const handleDrop = (event, targetGroupIndex, targetLayerIndex) => {
  event.preventDefault();
  
  if (!draggingLayer.value) return;
  
  // 限制只能在同一分组内拖拽
  if (draggingLayer.value.groupIndex !== targetGroupIndex) {
    console.warn('⚠️ 暂不支持跨分组拖拽');
    return;
  }
  
  const fromIndex = draggingLayer.value.layerIndex;
  const toIndex = targetLayerIndex;
  
  if (fromIndex === toIndex) return;
  
  // 移动数组元素
  const group = displayGroups.value[targetGroupIndex];
  const movedItem = group.layers.splice(fromIndex, 1)[0];
  group.layers.splice(toIndex, 0, movedItem);
  
  // 重置拖拽状态
  draggingLayer.value = null;
  
  // 同步地图图层顺序
  updateCesiumLayerOrder();
};

// 更新 Cesium 图层顺序
const updateCesiumLayerOrder = () => {
  const viewer = window.viewer;
  if (!viewer) return;
  
  // 获取所有图层按 UI 顺序的扁平列表（从上到下）
  const flatLayers = [];
  displayGroups.value.forEach(group => {
    group.layers.forEach(layer => {
      flatLayers.push(layer);
    });
  });
  
  // Cesium 渲染规则：后添加的（或索引大的）在上面
  // UI 规则：列表上面的图层在地图上面
  // 策略：倒序遍历 UI 列表，依次 raiseToTop
  // 这样列表最底部的最先被 raise，列表最顶部的最后被 raise（成为最顶层）
  
  console.log('🔄 正在同步图层顺序...');
  
  for (let i = flatLayers.length - 1; i >= 0; i--) {
    const layer = flatLayers[i];
    const imageryLayer = loadedWmsLayers.get(layer.name);
    
    // 只有已加载到地图的图层才需要调整
    if (imageryLayer) {
      viewer.imageryLayers.raiseToTop(imageryLayer);
    }
  }
  
  // 触发图层变化事件，通知图例组件更新
  window.dispatchEvent(new CustomEvent('wms-layer-changed', {
    detail: {
      activeLayers: [...activeLayers.value],
      activeLayerKeys: activeLayers.value.map(getLayerKey),
    }
  }));
};

// 切换图层显示
const toggleLayer = async (layer) => {
  const index = activeLayers.value.indexOf(layer.name);
  
  if (index > -1) {
    // 移除图层
    activeLayers.value.splice(index, 1);
    removeWmsLayer(layer.name);
    console.log('🗑️ 移除图层:', layer.name);
  } else {
    // 添加图层
    suppressedDefaultLayerKeys.delete(getLayerKey(layer.name));
    activeLayers.value.push(layer.name);
    await addWmsLayer(layer);
    console.log('✅ 添加图层:', layer.name);
  }
  
  // 触发图层变化事件，通知图例组件更新
  window.dispatchEvent(new CustomEvent('wms-layer-changed', {
    detail: {
      activeLayers: [...activeLayers.value],
      activeLayerKeys: activeLayers.value.map(getLayerKey),
    }
  }));
};

const setLayerCheckedByKey = async (layerKey, checked) => {
  let layer = findLayerByKey(layerKey);
  if (!layer) {
    await refreshLayers();
    layer = findLayerByKey(layerKey);
  }
  if (!layer) {
    console.warn('⚠️ 未找到图层，无法切换:', layerKey);
    return;
  }

  const isActive = activeLayers.value.includes(layer.name);
  if ((checked && isActive) || (!checked && !isActive)) {
    return;
  }
  await toggleLayer(layer);
};

const isLayerActiveByKey = (layerKey) => {
  return activeLayers.value.some((name) => getLayerKey(name) === layerKey);
};

const getActiveLayerKeys = () => activeLayers.value.map(getLayerKey);

const handleExternalLayerToggle = async (event) => {
  const { layerKey, checked } = event?.detail || {};
  if (!layerKey || typeof checked !== 'boolean') return;
  await setLayerCheckedByKey(layerKey, checked);
};

// 添加 WMS 图层到地图
const addWmsLayer = async (layer) => {
  // 获取 Cesium viewer
  const viewer = window.viewer;
  if (!viewer) {
    console.error('Cesium viewer 未初始化');
    return;
  }
  
  const Cesium = window.Cesium;
  if (!Cesium) {
    console.error('Cesium 未加载');
    return;
  }

  if (isPollutantLayer(layer)) {
    try {
      const renderVersion = ++pollutantRenderVersion;
      removePollutantLayerEntities();
      await addPollutantLayerEntities(layer, renderVersion);
      console.log('✅ 已加载新污染物监测点位样式层:', layer.name);
    } catch (error) {
      console.error('❌ 加载新污染物监测点位失败:', error);
    }
    return;
  }

  if (isWaterQualityLayer(layer)) {
    try {
      const renderVersion = ++waterQualityRenderVersion;
      removeWaterQualityLayerEntities();
      await addWaterQualityLayerEntities(renderVersion);
      console.log('✅ 已加载水质监测点位样式层:', layer.name);
    } catch (error) {
      console.error('❌ 加载水质监测点位失败:', error);
    }
    return;
  }
  
  // 获取图层边界
  let rectangle = Cesium.Rectangle.MAX_VALUE;
  if (layer.boundingBox) {
    const { minx, miny, maxx, maxy } = layer.boundingBox;
    rectangle = Cesium.Rectangle.fromDegrees(minx, miny, maxx, maxy);
  }
  
  const { layerName, workspace } = parseLayerNameAndWorkspace(layer);
  
  // 构建 WMS URL - 使用工作空间特定的 URL
  // 例如：/geoserver/YG/wms
  const wmsUrl = `${GEOSERVER_CONFIG.baseUrl}/${workspace}/wms`;
  console.log('🌐 WMS URL:', wmsUrl);
  console.log('📍 请求图层:', layerName);
  
  // 创建 WMS 图层
  const wmsLayer = new Cesium.WebMapServiceImageryProvider({
    url: wmsUrl,
    layers: layerName,
    parameters: {
      transparent: true,
      format: 'image/png',
      version: '1.1.0',
      srs: 'EPSG:4326', // 显式指定 SRS，让 GeoServer 进行重投影
    },
    rectangle: rectangle,
  });
  
  // 添加到地图
  const imageryLayer = viewer.imageryLayers.addImageryProvider(wmsLayer);
  imageryLayer.alpha = (layerOpacities.value[layer.name] || 80) / 100;
  
  // 存储引用
  loadedWmsLayers.set(layer.name, imageryLayer);
  console.log('💾 已存储图层引用:', layer.name);
};

// 移除 WMS 图层
const removeWmsLayer = (layerName) => {
  if (getLayerKey(layerName) === POLLUTANT_LAYER_KEY) {
    pollutantRenderVersion += 1;
    removePollutantLayerEntities();
    console.log('🗑️ 已从地图移除新污染物监测点位层');
    return;
  }

  if (getLayerKey(layerName) === WATER_QUALITY_LAYER_KEY) {
    waterQualityRenderVersion += 1;
    removeWaterQualityLayerEntities();
    console.log('🗑️ 已从地图移除水质监测点位层');
    return;
  }

  const viewer = window.viewer;
  if (!viewer) return;
  
  const imageryLayer = loadedWmsLayers.get(layerName);
  if (imageryLayer) {
    viewer.imageryLayers.remove(imageryLayer);
    loadedWmsLayers.delete(layerName);
    console.log('🗑️ 已从地图移除图层:', layerName);
  } else {
    console.warn('⚠️ 未找到图层引用，无法移除:', layerName);
    console.log('当前已存储图层:', [...loadedWmsLayers.keys()]);
  }
};

// 清除所有图层
const clearAllLayers = () => {
  activeLayers.value.forEach(layerName => {
    removeWmsLayer(layerName);
  });
  activeLayers.value = [];
  console.log('🗑️ 已清除所有图层');
  
  // 触发图层变化事件，通知图例组件更新
  window.dispatchEvent(new CustomEvent('wms-layer-changed', {
    detail: {
      activeLayers: [...activeLayers.value],
      activeLayerKeys: [],
    }
  }));
};

// 定位到图层
const flyToLayer = (layer) => {
  const viewer = window.viewer;
  const Cesium = window.Cesium;
  
  if (layer.boundingBox && viewer && Cesium) {
    const { minx, miny, maxx, maxy } = layer.boundingBox;
    
    // 使用 Cesium.Rectangle 直接定位到四至
    const rectangle = Cesium.Rectangle.fromDegrees(minx, miny, maxx, maxy);
    
    viewer.camera.flyTo({
      destination: rectangle,
      orientation: {
        heading: Cesium.Math.toRadians(0), // 航向角 0 (360)
        pitch: Cesium.Math.toRadians(-90), // 俯仰角 -90
        roll: 0 // 翻滚角 0
      },
      duration: 2
    });
    console.log('📍 精准定位到图层:', layer.name);
  } else if (layer.boundingBox && flyToCesium) {
    // 降级方案：使用注入的 flyToCesium
    const { minx, miny, maxx, maxy } = layer.boundingBox;
    const centerLon = (minx + maxx) / 2;
    const centerLat = (miny + maxy) / 2;
    
    // 根据范围计算高度
    const range = Math.max(maxx - minx, maxy - miny);
    const height = range * 111000 * 2;
    
    flyToCesium(centerLon, centerLat, Math.min(height, 5000000), 0, -90, 0, 2);
    console.log('📍 定位到图层(Fallback):', layer.name);
  } else {
    console.warn('图层无边界信息或飞行功能不可用');
  }
};

// 切换图层透明度设置显示
const toggleLayerSettings = (layerName) => {
  if (activeSettingLayerName.value === layerName) {
    activeSettingLayerName.value = null;
  } else {
    activeSettingLayerName.value = layerName;
    if (!layerOpacities.value[layerName]) {
      layerOpacities.value[layerName] = 80;
    }
  }
};

// 获取图层透明度
const getLayerOpacity = (layerName) => {
  return layerOpacities.value[layerName] || 80;
};

// 设置图层透明度
const setLayerOpacity = (layerName, value) => {
  layerOpacities.value[layerName] = parseInt(value);
  
  // 实时更新图层透明度
  const imageryLayer = loadedWmsLayers.get(layerName);
  if (imageryLayer) {
    imageryLayer.alpha = value / 100;
  }
};

const updatePollutantStyle = (options = {}) => {
  pollutantStyleState.value = {
    ...pollutantStyleState.value,
    ...options,
  };
};

const refreshPollutantLayer = async () => {
  const layer = findLayerByKey(POLLUTANT_LAYER_KEY);
  if (!layer) return;
  const isActive = activeLayers.value.includes(layer.name);
  if (!isActive) return;
  const renderVersion = ++pollutantRenderVersion;
  removePollutantLayerEntities();
  await addPollutantLayerEntities(layer, renderVersion);
  window.dispatchEvent(new CustomEvent('wms-layer-changed', {
    detail: {
      activeLayers: [...activeLayers.value],
      activeLayerKeys: activeLayers.value.map(getLayerKey),
    }
  }));
};

const updateWaterQualityStyle = (options = {}) => {
  const styleOptions = WATER_QUALITY_STYLE_KEYS.reduce((result, key) => {
    if (Object.prototype.hasOwnProperty.call(options, key)) result[key] = options[key];
    return result;
  }, {});
  waterQualityStyleState.value = {
    ...waterQualityStyleState.value,
    ...styleOptions,
  };
};

const refreshWaterQualityLayer = async () => {
  const layer = findLayerByKey(WATER_QUALITY_LAYER_KEY);
  if (!layer) return;
  const isActive = activeLayers.value.includes(layer.name);
  if (!isActive) return;
  const renderVersion = ++waterQualityRenderVersion;
  removeWaterQualityLayerEntities();
  await addWaterQualityLayerEntities(renderVersion);
  window.dispatchEvent(new CustomEvent('wms-layer-changed', {
    detail: {
      activeLayers: [...activeLayers.value],
      activeLayerKeys: activeLayers.value.map(getLayerKey),
    }
  }));
};

const handleWaterQualityFilterChange = async (event) => {
  const detail = event?.detail || {};
  if (Array.isArray(detail.allRows)) {
    waterQualityRowsCache = detail.allRows;
  } else if (Array.isArray(detail.rows)) {
    waterQualityRowsCache = detail.rows;
  }
  updateWaterQualityStyle(detail);
};

const handleWaterQualitySelected = async (event) => {
  const detail = event?.detail || {};
  updateWaterQualityStyle({ selectedId: detail.id || '', siteName: detail.name || '' });

  const viewer = window.viewer;
  const Cesium = window.Cesium;
  const lon = Number(detail.lon);
  const lat = Number(detail.lat);
  if (viewer?.camera && Cesium?.Cartesian3 && Number.isFinite(lon) && Number.isFinite(lat)) {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, 5000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-35),
        roll: 0,
      },
      duration: 1.5,
    });
  }

  await refreshWaterQualityLayer();
};

const handleCameraMoveEnd = async () => {
  const wide = isWideViewMode();
  if (lastWideViewState.value === null) {
    lastWideViewState.value = wide;
    return;
  }
  if (lastWideViewState.value === wide) return;
  lastWideViewState.value = wide;
  const isActive = activeLayers.value.some((name) => getLayerKey(name) === POLLUTANT_LAYER_KEY);
  if (!isActive) return;
  await refreshPollutantLayer();
};

const bindCameraMoveEnd = () => {
  const viewer = window.viewer;
  const camera = viewer?.camera;
  if (!viewer || !camera || !camera.moveEnd || cameraMoveEndListener) return false;
  cameraMoveEndListener = () => {
    handleCameraMoveEnd();
  };
  cameraMoveEndViewer = viewer;
  camera.moveEnd.addEventListener(cameraMoveEndListener);
  return true;
};

const unbindCameraMoveEnd = () => {
  const camera = cameraMoveEndViewer?.camera;
  if (camera && camera.moveEnd && cameraMoveEndListener) {
    camera.moveEnd.removeEventListener(cameraMoveEndListener);
  }
  cameraMoveEndListener = null;
  cameraMoveEndViewer = null;
};

// 是否为风险等级栅格图层（只在该图层上显示“分析”按钮）
const isRiskRasterLayer = (layer) => {
  if (!layer) return false;
  const name = layer.name || '';
  const workspace = layer.workspace || '';
  return (
    name.includes('risk_shange_2000') ||
    name === 'veg:risk_shange_2000' ||
    (workspace === 'veg' && name === 'risk_shange_2000')
  );
};

// 触发栅格风险分析（仅针对指定栅格图层）
const analyzeRasterLayer = () => {
  // 构造与 RasterAnalysisToolbar 相同的 layer 结构
  const analysisLayer = {
    id: 'risk_shange_2000',
    name: '风险等级图层 (2000)',
    // 与后端默认路径对应的相对路径（基于项目根目录 geodata）
    tifPath: '/Users/mac/Documents/cursor-gqwr/GQWR/geodata/risk_shange_2000.tif',
    workspace: 'veg'
  };
  emit('analyze-layer', { layer: analysisLayer, district: null });
};

defineExpose({
  clearPollutantLayer,
  setLayerCheckedByKey,
});

// 组件挂载时预加载图层列表
onMounted(() => {
  window.__layerPanelApi = {
    setLayerCheckedByKey,
    clearPollutantLayer,
    isLayerActiveByKey,
    getActiveLayerKeys,
    refreshLayers,
    updatePollutantStyle,
    refreshPollutantLayer,
    updateWaterQualityStyle,
    refreshWaterQualityLayer,
  };
  window.addEventListener('external-layer-toggle', handleExternalLayerToggle);
  window.addEventListener(WATER_QUALITY_FILTER_EVENT, handleWaterQualityFilterChange);
  window.addEventListener(WATER_QUALITY_SELECTED_EVENT, handleWaterQualitySelected);
  bindCameraMoveEnd();
  const retryTimer = setInterval(() => {
    if (bindCameraMoveEnd()) clearInterval(retryTimer);
  }, 1000);
  setTimeout(() => clearInterval(retryTimer), 20000);
  // 延迟加载，避免阻塞页面
  setTimeout(() => {
    refreshLayers();
  }, 2000);
});

onUnmounted(() => {
  window.removeEventListener('external-layer-toggle', handleExternalLayerToggle);
  window.removeEventListener(WATER_QUALITY_FILTER_EVENT, handleWaterQualityFilterChange);
  window.removeEventListener(WATER_QUALITY_SELECTED_EVENT, handleWaterQualitySelected);
  unbindCameraMoveEnd();
  pollutantRenderVersion += 1;
  waterQualityRenderVersion += 1;
  removePollutantLayerEntities();
  removeWaterQualityLayerEntities();
  if (window.__layerPanelApi) {
    delete window.__layerPanelApi;
  }
});
</script>

<style lang="scss" scoped>
// 科技感配色变量
$tech-cyan: #00f2ff;
$tech-blue: #0078d7;
$tech-bg: rgba(2, 121, 241, 0.9);
$tech-bg-hover: rgba(0, 242, 255, 0.15);
$tech-border: rgba(0, 242, 255, 0.3);

.layer-panel-wrapper {
  position: fixed;
  @include Left(40);
  @include Bottom(40);
  z-index: 100;
  user-select: none;
}

// 触发按钮
.layer-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: linear-gradient(135deg, rgba(0, 40, 80, 0.8), rgba(0, 15, 30, 0.9));
  backdrop-filter: blur(10px);
  border: 1px solid $tech-border;
  border-radius: 4px;
  color: $tech-cyan;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 10px rgba(0, 242, 255, 0.1);
  
  .icon {
    @include FontSize(18);
    filter: drop-shadow(0 0 2px $tech-cyan);
  }
  
  .label {
    @include FontSize(20);
    font-weight: 600;
    letter-spacing: 1px;
  }
  
  &:hover, &.active {
    background: rgba(0, 60, 100, 0.9);
    border-color: $tech-cyan;
    box-shadow: 0 0 20px rgba(0, 242, 255, 0.3), inset 0 0 10px rgba(0, 242, 255, 0.1);
    transform: translateY(-2px);
  }
}

// 图层面板
.layer-panel {
  position: absolute;
  bottom: 60px;
  left: 0;
  @include Width(450);
  max-height: 600px;
  background: linear-gradient(180deg, rgba(8, 20, 35, 0.95) 0%, rgba(4, 10, 20, 0.98) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid $tech-border;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.8), 0 0 15px rgba(0, 242, 255, 0.1);
  display: flex;
  flex-direction: column;
  
  // 装饰角
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 10px;
    height: 10px;
    border-top: 2px solid $tech-cyan;
    border-left: 2px solid $tech-cyan;
    pointer-events: none;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    right: 0;
    width: 10px;
    height: 10px;
    border-bottom: 2px solid $tech-cyan;
    border-right: 2px solid $tech-cyan;
    pointer-events: none;
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: linear-gradient(90deg, rgba(0, 242, 255, 0.1) 0%, transparent 100%);
  border-bottom: 1px solid rgba(0, 242, 255, 0.2);
  position: relative;
  
  // 扫描线效果
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 1px;
    background: linear-gradient(90deg, transparent, $tech-cyan, transparent);
    opacity: 0.5;
  }
  
  .title {
    @include FontSize(22);
    font-weight: 700;
    color: #ffffff;
    letter-spacing: 1px;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
    display: flex;
    align-items: center;
    gap: 8px;
    
    &::before {
      content: '';
      display: block;
      width: 4px;
      height: 16px;
      background: #ffffff;
      box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
    }
  }
  
  .close-btn {
    @include FontSize(20);
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: all 0.3s;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      color: #ff4d4f;
      text-shadow: 0 0 10px #ff4d4f;
      transform: rotate(90deg);
    }
  }
}

.panel-content {
  max-height: 400px;
  overflow-y: auto;
  padding: 10px 0;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 242, 255, 0.3);
    border-radius: 2px;
    
    &:hover {
      background: $tech-cyan;
    }
  }
}

// 加载状态
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: $tech-cyan;
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 2px solid rgba(0, 242, 255, 0.2);
    border-top-color: $tech-cyan;
    border-bottom-color: $tech-cyan;
    border-radius: 50%;
    animation: spin 1.5s linear infinite;
    margin-bottom: 20px;
    box-shadow: 0 0 15px rgba(0, 242, 255, 0.2);
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// 图层分组
.layer-group {
  margin-bottom: 2px;
}

.group-header {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.3s;
  border-left: 2px solid transparent;
  
  &:hover {
    background: linear-gradient(90deg, rgba(0, 242, 255, 0.05) 0%, transparent 100%);
    border-left-color: rgba(0, 242, 255, 0.5);
    
    .group-name {
      color: $tech-cyan;
    }
  }
  
  .group-icon {
    @include FontSize(10);
    color: $tech-cyan;
    margin-right: 10px;
    transition: transform 0.3s;
    opacity: 0.8;
  }
  
  .group-name {
    flex: 1;
    @include FontSize(20);
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
    transition: color 0.3s;
  }
  
  .layer-count {
    @include FontSize(12);
    color: $tech-cyan;
    background: rgba(0, 242, 255, 0.1);
    padding: 2px 8px;
    border-radius: 2px;
    border: 1px solid rgba(0, 242, 255, 0.2);
  }
}

.group-layers {
  background: rgba(0, 0, 0, 0.2);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 26px;
    width: 1px;
    background: rgba(0, 242, 255, 0.1);
  }
}

// 图层项
.layer-item {
  display: flex;
  align-items: center;
  padding: 12px 20px 12px 10px;
  transition: all 0.3s;
  position: relative;
  border-bottom: 1px solid rgba(255, 255, 255, 0.02);
  margin-left: 10px; // 缩进
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 2px;
    background: $tech-cyan;
    opacity: 0;
    transition: opacity 0.3s;
    box-shadow: 2px 0 10px $tech-cyan;
  }
  
  &:hover {
    background: linear-gradient(90deg, rgba(0, 242, 255, 0.08) 0%, transparent 100%);
    
    &::before {
      opacity: 1;
    }
    
    .drag-handle {
      opacity: 0.8;
      color: $tech-cyan;
    }
    
    .layer-info .layer-name {
      color: rgba(0, 242, 255, 0.7);
    }
  }
  
  .drag-handle {
    cursor: grab;
    color: rgba(255, 255, 255, 0.2);
    margin-right: 12px;
    font-size: 14px;
    opacity: 0.3;
    transition: all 0.3s;
    width: 16px;
    text-align: center;
    
    &:active {
      cursor: grabbing;
      color: $tech-cyan;
      opacity: 1;
    }
  }
}

// 科技感复选框
.layer-checkbox {
  position: relative;
  display: flex;
  align-items: center;
  margin-right: 15px;
  cursor: pointer;
  
  input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
  }
  
  .checkmark {
    width: 18px;
    height: 18px;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 2px;
    transition: all 0.3s;
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      display: none;
      left: 5px;
      top: 1px;
      width: 6px;
      height: 12px;
      border: solid #000;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
      z-index: 2;
    }
  }
  
  input:checked ~ .checkmark {
    background: $tech-cyan;
    border-color: $tech-cyan;
    box-shadow: 0 0 10px rgba(0, 242, 255, 0.5);
    
    &::after {
      display: block;
    }
  }
  
  &:hover .checkmark {
    border-color: $tech-cyan;
    box-shadow: 0 0 5px rgba(0, 242, 255, 0.3);
  }
}

.layer-info {
  flex: 1;
  cursor: pointer;
  overflow: hidden;
  
  .layer-title {
    @include FontSize(18);
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 2px;
    width: 100%;
    font-weight: 500;
  }
  
  .layer-name {
    @include FontSize(12);
    color: rgba(255, 255, 255, 0.4);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsi;
    width: 100%s;
    font-family: Consolas, monospace; // 代码字体增加科技感
    transition: color 0.3s;
  }
}

.layer-actions {
  display: flex;
  gap: 8px;
  margin-left: 10px;
  
  .action-btn {
    @include FontSize(16);
    padding: 6px;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.5);
    transition: all 0.3s;
    border-radius: 4px;
    
    &:hover {
      color: $tech-cyan;
      background: rgba(0, 242, 255, 0.1);
      text-shadow: 0 0 8px $tech-cyan;
    }
  }
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  color: rgba(255, 255, 255, 0.4);
  
  button {
    margin-top: 20px;
    padding: 8px 24px;
    background: rgba(0, 242, 255, 0.1);
    border: 1px solid $tech-cyan;
    border-radius: 2px;
    color: $tech-cyan;
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
      background: rgba(0, 242, 255, 0.2);
      box-shadow: 0 0 15px rgba(0, 242, 255, 0.3);
    }
  }
}

// 底部操作栏
.panel-footer {
  display: flex;
  gap: 15px;
  padding: 15px 20px;
  background: rgba(0, 10, 20, 0.8);
  border-top: 1px solid rgba(0, 242, 255, 0.2);
  
  .footer-btn {
    flex: 1;
    padding: 10px;
    @include FontSize(18);
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 2px; // 硬朗边角
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    transition: all 0.3s;
    text-transform: uppercase;
    letter-spacing: 1px;
    
    &:hover {
      border-color: rgba(255, 255, 255, 0.6);
      background: rgba(255, 255, 255, 0.05);
    }
    
    &.primary {
      background: rgba(0, 242, 255, 0.15);
      border-color: $tech-cyan;
      color: $tech-cyan;
      box-shadow: 0 0 10px rgba(0, 242, 255, 0.1);
      
      &:hover {
        background: rgba(0, 242, 255, 0.25);
        box-shadow: 0 0 20px rgba(0, 242, 255, 0.3);
        text-shadow: 0 0 5px $tech-cyan;
      }
    }
  }
}

// 透明度调节器
.opacity-popover {
  position: absolute;
  right: 70px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 20, 40, 0.95);
  border: 1px solid $tech-cyan;
  padding: 4px 10px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 100;
  box-shadow: 0 0 15px rgba(0, 242, 255, 0.3);
  width: 160px;
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  
  &::after {
    content: '';
    position: absolute;
    right: -6px;
    top: 50%;
    margin-top: -4px;
    border-left: 6px solid $tech-cyan;
    border-top: 4px solid transparent;
    border-bottom: 4px solid transparent;
  }
  
  input[type="range"] {
    flex: 1;
    height: 4px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    appearance: none;
    outline: none;
    
    &::-webkit-slider-thumb {
      appearance: none;
      width: 14px;
      height: 14px;
      background: $tech-cyan;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 0 10px $tech-cyan;
      transition: transform 0.2s;
      
      &:hover {
        transform: scale(1.2);
      }
    }
  }
  
  .opacity-value {
    font-size: 12px;
    color: $tech-cyan;
    font-family: monospace;
    width: 32px;
    text-align: right;
    font-weight: bold;
  }
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: translateY(-50%) scale(0.8) translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateY(-50%) scale(1) translateX(0);
  }
}

// 动画
.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-panel-enter-from,
.slide-panel-leave-to {
  opacity: 0;
  transform: translateX(-20px) scale(0.95);
  filter: blur(10px);
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
