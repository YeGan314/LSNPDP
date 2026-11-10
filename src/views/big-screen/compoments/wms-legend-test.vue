<!--
 * @Author: YG 
 * @Date: 2025-12-04
 * @Description: WMS图例功能测试组件
-->
<template>
  <div class="legend-test-panel">
    <div class="test-header">
      <h3>WMS图例测试工具</h3>
      <button @click="closePanel">关闭</button>
    </div>
    
    <div class="test-content">
      <!-- 操作按钮 -->
      <div class="test-section">
        <h4>操作</h4>
        <div class="button-group">
          <button @click="getTopLayer" class="btn-primary">获取最上层图层</button>
          <button @click="getAllLayers" class="btn-secondary">获取所有图层</button>
          <button @click="debugLayers" class="btn-info">调试信息</button>
          <button @click="clearResults" class="btn-danger">清除结果</button>
        </div>
      </div>
      
      <!-- 最上层图层信息 -->
      <div class="test-section" v-if="topLayerInfo">
        <h4>最上层WMS图层</h4>
        <div class="info-card">
          <div class="info-item">
            <span class="label">图层名称:</span>
            <span class="value">{{ topLayerInfo.layerName }}</span>
          </div>
          <div class="info-item">
            <span class="label">图层索引:</span>
            <span class="value">{{ topLayerInfo.index }}</span>
          </div>
          <div class="info-item">
            <span class="label">图例URL:</span>
            <span class="value url">{{ topLayerInfo.legendUrl }}</span>
          </div>
          <div class="legend-preview">
            <img :src="topLayerInfo.legendUrl" alt="图例预览" @error="handleImageError" />
          </div>
        </div>
      </div>
      
      <!-- 所有图层列表 -->
      <div class="test-section" v-if="allLayersInfo.length > 0">
        <h4>所有WMS图层 ({{ allLayersInfo.length }})</h4>
        <div class="layers-list">
          <div 
            class="layer-card" 
            v-for="(layer, index) in allLayersInfo" 
            :key="index"
          >
            <div class="layer-header">
              <span class="layer-index">#{{ layer.index }}</span>
              <span class="layer-name">{{ layer.layerName }}</span>
            </div>
            <div class="layer-legend">
              <img :src="layer.legendUrl" :alt="`${layer.layerName} 图例`" />
            </div>
          </div>
        </div>
      </div>
      
      <!-- 错误信息 -->
      <div class="test-section error-section" v-if="errorMessage">
        <h4>错误</h4>
        <div class="error-message">{{ errorMessage }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { 
  getTopWmsLayerLegend, 
  getAllWmsLayerLegends,
  debugWmsLayers 
} from '@/utils/wms-legend-helper';

const emit = defineEmits(['close']);

// 状态
const topLayerInfo = ref(null);
const allLayersInfo = ref([]);
const errorMessage = ref('');

/**
 * 获取最上层图层
 */
const getTopLayer = () => {
  try {
    errorMessage.value = '';
    const viewer = window.viewer;
    
    if (!viewer) {
      errorMessage.value = 'Cesium viewer 未初始化';
      return;
    }
    
    const result = getTopWmsLayerLegend(viewer);
    
    if (result) {
      topLayerInfo.value = result;
      console.log('✅ 获取最上层图层成功:', result);
    } else {
      errorMessage.value = '未找到WMS图层';
    }
  } catch (error) {
    errorMessage.value = `获取失败: ${error.message}`;
    console.error('❌ 获取最上层图层失败:', error);
  }
};

/**
 * 获取所有图层
 */
const getAllLayers = () => {
  try {
    errorMessage.value = '';
    const viewer = window.viewer;
    
    if (!viewer) {
      errorMessage.value = 'Cesium viewer 未初始化';
      return;
    }
    
    const results = getAllWmsLayerLegends(viewer);
    
    if (results.length > 0) {
      allLayersInfo.value = results;
      console.log('✅ 获取所有图层成功:', results);
    } else {
      errorMessage.value = '未找到WMS图层';
    }
  } catch (error) {
    errorMessage.value = `获取失败: ${error.message}`;
    console.error('❌ 获取所有图层失败:', error);
  }
};

/**
 * 调试图层信息
 */
const debugLayers = () => {
  try {
    errorMessage.value = '';
    const viewer = window.viewer;
    
    if (!viewer) {
      errorMessage.value = 'Cesium viewer 未初始化';
      return;
    }
    
    debugWmsLayers(viewer);
    console.log('✅ 调试信息已输出到控制台');
  } catch (error) {
    errorMessage.value = `调试失败: ${error.message}`;
    console.error('❌ 调试失败:', error);
  }
};

/**
 * 清除结果
 */
const clearResults = () => {
  topLayerInfo.value = null;
  allLayersInfo.value = [];
  errorMessage.value = '';
};

/**
 * 关闭面板
 */
const closePanel = () => {
  emit('close');
};

/**
 * 图片加载错误处理
 */
const handleImageError = (event) => {
  console.error('图例图片加载失败:', event.target.src);
  event.target.style.display = 'none';
};
</script>

<style lang="scss" scoped>
$tech-cyan: #00f2ff;
$tech-border: rgba(0, 242, 255, 0.3);

.legend-test-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 800px;
  max-height: 80vh;
  background: linear-gradient(180deg, rgba(8, 20, 35, 0.98) 0%, rgba(4, 10, 20, 0.98) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid $tech-border;
  border-radius: 8px;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.9), 0 0 20px rgba(0, 242, 255, 0.2);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.test-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(90deg, rgba(0, 242, 255, 0.15) 0%, transparent 100%);
  border-bottom: 1px solid $tech-border;
  
  h3 {
    margin: 0;
    color: #ffffff;
    font-size: 20px;
    font-weight: 600;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  }
  
  button {
    padding: 8px 16px;
    background: rgba(255, 77, 79, 0.2);
    border: 1px solid #ff4d4f;
    border-radius: 4px;
    color: #ff4d4f;
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
      background: rgba(255, 77, 79, 0.3);
      box-shadow: 0 0 10px rgba(255, 77, 79, 0.3);
    }
  }
}

.test-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 242, 255, 0.3);
    border-radius: 3px;
    
    &:hover {
      background: $tech-cyan;
    }
  }
}

.test-section {
  margin-bottom: 24px;
  
  h4 {
    margin: 0 0 12px 0;
    color: $tech-cyan;
    font-size: 16px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
}

.button-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  
  button {
    padding: 10px 20px;
    border: 1px solid;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
    font-size: 14px;
    font-weight: 500;
    
    &.btn-primary {
      background: rgba(0, 242, 255, 0.15);
      border-color: $tech-cyan;
      color: $tech-cyan;
      
      &:hover {
        background: rgba(0, 242, 255, 0.25);
        box-shadow: 0 0 15px rgba(0, 242, 255, 0.3);
      }
    }
    
    &.btn-secondary {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.3);
      color: rgba(255, 255, 255, 0.8);
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.5);
      }
    }
    
    &.btn-info {
      background: rgba(24, 144, 255, 0.15);
      border-color: #1890ff;
      color: #1890ff;
      
      &:hover {
        background: rgba(24, 144, 255, 0.25);
        box-shadow: 0 0 15px rgba(24, 144, 255, 0.3);
      }
    }
    
    &.btn-danger {
      background: rgba(255, 77, 79, 0.15);
      border-color: #ff4d4f;
      color: #ff4d4f;
      
      &:hover {
        background: rgba(255, 77, 79, 0.25);
        box-shadow: 0 0 15px rgba(255, 77, 79, 0.3);
      }
    }
  }
}

.info-card {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 242, 255, 0.2);
  border-radius: 4px;
  padding: 16px;
}

.info-item {
  display: flex;
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .label {
    min-width: 100px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
  }
  
  .value {
    flex: 1;
    color: #ffffff;
    font-size: 14px;
    word-break: break-all;
    
    &.url {
      font-family: 'Consolas', monospace;
      font-size: 12px;
      color: $tech-cyan;
    }
  }
}

.legend-preview {
  margin-top: 16px;
  padding: 12px;
  background: rgba(26, 26, 26, 0.8);
  border-radius: 4px;
  text-align: center;
  
  img {
    max-width: 100%;
    height: auto;
    border-radius: 2px;
  }
}

.layers-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.layer-card {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 242, 255, 0.2);
  border-radius: 4px;
  padding: 12px;
  transition: all 0.3s;
  
  &:hover {
    border-color: $tech-cyan;
    box-shadow: 0 0 15px rgba(0, 242, 255, 0.2);
  }
}

.layer-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  
  .layer-index {
    background: rgba(0, 242, 255, 0.2);
    color: $tech-cyan;
    padding: 2px 8px;
    border-radius: 2px;
    font-size: 12px;
    font-weight: 600;
  }
  
  .layer-name {
    flex: 1;
    color: #ffffff;
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.layer-legend {
  background: rgba(26, 26, 26, 0.8);
  padding: 8px;
  border-radius: 4px;
  text-align: center;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  img {
    max-width: 100%;
    height: auto;
  }
}

.error-section {
  .error-message {
    background: rgba(255, 77, 79, 0.1);
    border: 1px solid rgba(255, 77, 79, 0.3);
    border-radius: 4px;
    padding: 12px;
    color: #ff4d4f;
    font-size: 14px;
  }
}
</style>
