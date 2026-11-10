<!--
 * GeoServer 图层控制组件
 * 用于控制地图上的 GeoServer 图层显示/隐藏和样式
 * @author YG
 * @date 2025-11-13
-->
<template>
  <div class="geoserver-control">
    <div class="control-header">
      <span class="title">📊 地理数据</span>
      <span class="close-btn" @click="$emit('close')">×</span>
    </div>
    
    <div class="control-content">
      <!-- 图层列表 -->
      <div class="layer-list">
        <div 
          v-for="layer in layerList" 
          :key="layer.id" 
          class="layer-item"
          :class="{ active: layer.visible }"
        >
          <div class="layer-header">
            <label class="layer-checkbox">
              <input 
                type="checkbox" 
                :checked="layer.visible"
                @change="toggleLayer(layer.id)"
              />
              <span class="layer-name" :title="layer.title">{{ layer.title }}</span>
            </label>
          </div>
          
          <!-- 图层控制选项（仅在显示时展开） -->
          <div v-if="layer.visible" class="layer-controls">
            <!-- 透明度控制 -->
            <div class="control-item">
              <label>透明度</label>
              <div class="slider-wrapper">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  :value="layer.alpha * 100"
                  @input="e => updateAlpha(layer.id, e.target.value / 100)"
                  class="slider"
                />
                <span class="value">{{ Math.round(layer.alpha * 100) }}%</span>
              </div>
            </div>
            
            <!-- 亮度控制 -->
            <div class="control-item">
              <label>亮度</label>
              <div class="slider-wrapper">
                <input 
                  type="range" 
                  min="0" 
                  max="200" 
                  :value="layer.brightness * 100"
                  @input="e => updateBrightness(layer.id, e.target.value / 100)"
                  class="slider"
                />
                <span class="value">{{ Math.round(layer.brightness * 100) }}%</span>
              </div>
            </div>
            
            <!-- 对比度控制 -->
            <div class="control-item">
              <label>对比度</label>
              <div class="slider-wrapper">
                <input 
                  type="range" 
                  min="0" 
                  max="200" 
                  :value="layer.contrast * 100"
                  @input="e => updateContrast(layer.id, e.target.value / 100)"
                  class="slider"
                />
                <span class="value">{{ Math.round(layer.contrast * 100) }}%</span>
              </div>
            </div>
            
            <!-- 图层操作 -->
            <div class="layer-actions">
              <button @click="moveToTop(layer.id)" class="action-btn">
                ⬆️ 移至顶层
              </button>
              <button @click="resetLayer(layer.id)" class="action-btn">
                🔄 重置
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 快捷操作 -->
      <div class="quick-actions">
        <button @click="showAllLayers" class="quick-btn">显示全部</button>
        <button @click="hideAllLayers" class="quick-btn">隐藏全部</button>
        <button @click="refreshLayers" class="quick-btn">刷新</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { geoServerService } from '@/services/geoserverService';
import { GEOSERVER_CONFIG } from '@/config/geoserver.config';
import { getViewer } from '../js/threeCesium';

const emit = defineEmits(['close']);

const layerList = ref([]);

// 初始化图层列表
onMounted(() => {
  loadLayerList();
});

// 加载图层列表
function loadLayerList() {
  const allLayers = geoServerService.getAllLayers();
  
  layerList.value = allLayers.map(layer => ({
    id: layer.id,
    title: layer.title,
    name: layer.name,
    type: layer.type,
    visible: layer.layer.show,
    alpha: layer.layer.alpha,
    brightness: layer.layer.brightness,
    contrast: layer.layer.contrast,
  }));
}

// 切换图层显示/隐藏
function toggleLayer(layerId) {
  const layer = layerList.value.find(l => l.id === layerId);
  if (layer) {
    const newVisible = !layer.visible;
    geoServerService.setLayerVisible(layerId, newVisible);
    layer.visible = newVisible;
  }
}

// 更新透明度
function updateAlpha(layerId, alpha) {
  geoServerService.setLayerAlpha(layerId, alpha);
  const layer = layerList.value.find(l => l.id === layerId);
  if (layer) layer.alpha = alpha;
}

// 更新亮度
function updateBrightness(layerId, brightness) {
  geoServerService.setLayerBrightness(layerId, brightness);
  const layer = layerList.value.find(l => l.id === layerId);
  if (layer) layer.brightness = brightness;
}

// 更新对比度
function updateContrast(layerId, contrast) {
  geoServerService.setLayerContrast(layerId, contrast);
  const layer = layerList.value.find(l => l.id === layerId);
  if (layer) layer.contrast = contrast;
}

// 移动到顶层
function moveToTop(layerId) {
  const viewer = getViewer();
  if (viewer) {
    geoServerService.raiseLayerToTop(viewer, layerId);
  }
}

// 重置图层样式
function resetLayer(layerId) {
  updateAlpha(layerId, 0.8);
  updateBrightness(layerId, 1.0);
  updateContrast(layerId, 1.0);
}

// 显示全部图层
function showAllLayers() {
  layerList.value.forEach(layer => {
    if (!layer.visible) {
      toggleLayer(layer.id);
    }
  });
}

// 隐藏全部图层
function hideAllLayers() {
  layerList.value.forEach(layer => {
    if (layer.visible) {
      toggleLayer(layer.id);
    }
  });
}

// 刷新图层列表
function refreshLayers() {
  loadLayerList();
}
</script>

<style scoped lang="scss">
.geoserver-control {
  position: fixed;
  top: 100px;
  right: 20px;
  width: 420px;
  background: rgba(15, 23, 42, 0.95);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(59, 130, 246, 0.3);
  z-index: 1000;
  color: #fff;
  font-family: 'Microsoft YaHei', sans-serif;
}

.control-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
  
  .title {
    font-size: 16px;
    font-weight: 600;
    color: #3b82f6;
  }
  
  .close-btn {
    font-size: 24px;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
      color: #ef4444;
      transform: rotate(90deg);
    }
  }
}

.control-content {
  padding: 15px;
  max-height: 600px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(59, 130, 246, 0.3);
    border-radius: 3px;
  }
}

.layer-list {
  .layer-item {
    margin-bottom: 15px;
    padding: 12px;
    background: rgba(30, 41, 59, 0.5);
    border-radius: 8px;
    border: 1px solid transparent;
    transition: all 0.3s;
    
    &.active {
      border-color: rgba(59, 130, 246, 0.5);
      background: rgba(30, 41, 59, 0.8);
    }
    
    &:hover {
      background: rgba(30, 41, 59, 0.7);
    }
  }
  
  .layer-header {
    .layer-checkbox {
      display: flex;
      align-items: center;
      cursor: pointer;
      user-select: none;
      
      input[type="checkbox"] {
        width: 16px;
        height: 16px;
        margin-right: 10px;
        cursor: pointer;
        accent-color: #3b82f6;
      }
      
      .layer-name {
        font-size: 20px;
        color: #e2e8f0;
        flex: 1;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
  
  .layer-controls {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(59, 130, 246, 0.1);
    
    .control-item {
      margin-bottom: 12px;
      
      label {
        display: block;
        font-size: 18px;
        color: #94a3b8;
        margin-bottom: 6px;
      }
      
      .slider-wrapper {
        display: flex;
        align-items: center;
        gap: 10px;
        
        .slider {
          flex: 1;
          height: 4px;
          -webkit-appearance: none;
          appearance: none;
          background: rgba(59, 130, 246, 0.2);
          border-radius: 2px;
          outline: none;
          cursor: pointer;
          
          &::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 14px;
            height: 14px;
            background: #3b82f6;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.2s;
            
            &:hover {
              transform: scale(1.2);
              box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
            }
          }
        }
        
        .value {
          min-width: 40px;
          text-align: right;
          font-size: 14px;
          color: #3b82f6;
          font-weight: 500;
        }
      }
    }
    
    .layer-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      
      .action-btn {
        flex: 1;
        padding: 6px 12px;
        font-size: 14px;
        background: rgba(59, 130, 246, 0.2);
        border: 1px solid rgba(59, 130, 246, 0.3);
        border-radius: 6px;
        color: #3b82f6;
        cursor: pointer;
        transition: all 0.3s;
        
        &:hover {
          background: rgba(59, 130, 246, 0.3);
          border-color: #3b82f6;
          transform: translateY(-1px);
        }
        
        &:active {
          transform: translateY(0);
        }
      }
    }
  }
}

.quick-actions {
  display: flex;
  gap: 8px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(59, 130, 246, 0.2);
  
  .quick-btn {
    flex: 1;
    padding: 8px 12px;
    font-size: 15px;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2));
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 6px;
    color: #e2e8f0;
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(99, 102, 241, 0.4));
      border-color: #3b82f6;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
    
    &:active {
      transform: translateY(0);
    }
  }
}
</style>

