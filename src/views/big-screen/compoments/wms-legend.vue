<!--
 * @Author: YG 
 * @Date: 2025-12-04
 * @Description: WMS图层图例显示组件 - 简洁版
-->
<template>
  <div class="wms-legend-wrapper" v-if="shouldShowLegend">
    <div 
      class="legend-container"
      @mouseenter="showCloseBtn = true"
      @mouseleave="showCloseBtn = false"
    >
      <img 
        :src="displayedLegendUrl" 
        :alt="currentLayerName"
        class="legend-image"
      />
      
      <!-- 关闭按钮 - 鼠标悬停时显示 -->
      <transition name="fade">
        <div 
          v-if="showCloseBtn" 
          class="close-btn"
          @click="closeLegend"
          title="关闭图例"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/>
          </svg>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { getTopWmsLayerLegend } from '@/utils/wms-legend-helper';

// 状态
const legendUrl = ref('');
const displayedLegendUrl = ref('');
const currentLayerName = ref('');
const imageError = ref(false);
const isLoading = ref(false);
const imageLoaded = ref(false);
const showCloseBtn = ref(false); // 控制关闭按钮显示

const shouldShowLegend = computed(() => {
  return Boolean(displayedLegendUrl.value) && imageLoaded.value && !imageError.value;
});

const clearLegendState = () => {
  legendUrl.value = '';
  displayedLegendUrl.value = '';
  currentLayerName.value = '';
  imageError.value = false;
  imageLoaded.value = false;
  isLoading.value = false;
};

const preloadLegendImage = (url) => {
  isLoading.value = true;
  imageError.value = false;
  imageLoaded.value = false;
  displayedLegendUrl.value = '';

  const img = new Image();
  img.onload = () => {
    displayedLegendUrl.value = url;
    imageError.value = false;
    imageLoaded.value = true;
    isLoading.value = false;
    console.log('✅ 图例图片加载成功');
  };
  img.onerror = () => {
    imageError.value = true;
    imageLoaded.value = false;
    isLoading.value = false;
    displayedLegendUrl.value = '';
    legendUrl.value = '';
    currentLayerName.value = '';
    console.error('❌ 图例图片加载失败');
  };
  img.src = url;
};

/**
 * 更新图例显示
 */
const updateLegend = () => {
  const viewer = window.viewer;
  const topLayer = getTopWmsLayerLegend(viewer);
  
  if (topLayer) {
    legendUrl.value = topLayer.legendUrl;
    currentLayerName.value = topLayer.layerName;
    preloadLegendImage(topLayer.legendUrl);
    
    console.log('📊 当前最上层WMS图层:', topLayer.layerName);
    console.log('🔗 图例URL:', topLayer.legendUrl);
  } else {
    clearLegendState();
  }
};

/**
 * 关闭图例
 */
const closeLegend = () => {
  clearLegendState();
  showCloseBtn.value = false;
  console.log('🗑️ 图例已关闭');
};

// 监听图层变化（通过自定义事件）
let layerChangeHandler = null;

onMounted(() => {
  // 初始化时更新图例
  setTimeout(() => {
    updateLegend();
  }, 1000);
  
  // 监听图层变化事件
  layerChangeHandler = () => {
    updateLegend();
  };
  
  window.addEventListener('wms-layer-changed', layerChangeHandler);
});

onBeforeUnmount(() => {
  if (layerChangeHandler) {
    window.removeEventListener('wms-layer-changed', layerChangeHandler);
  }
});

// 暴露方法供外部调用
defineExpose({
  updateLegend,
  getTopWmsLayerLegend
});
</script>

<style lang="scss" scoped>
.wms-legend-wrapper {
  position: fixed;
  @include Left(510);
  @include Bottom(40);
  z-index: 99;
  user-select: none;
  pointer-events: none; // 允许鼠标穿透，不影响地图操作
}

.legend-container {
  position: relative;
  display: inline-block;
  pointer-events: auto; // 图例容器可以交互
}

.legend-image {
  display: block;
  max-width: 100%;
  height: auto;
  // 添加轻微阴影，让图例更清晰可见
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.6));
}

// 关闭按钮
.close-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  background: rgba(255, 77, 79, 0.9);
  border: 2px solid rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  z-index: 10;
  
  svg {
    color: #ffffff;
  }
  
  &:hover {
    background: rgba(255, 77, 79, 1);
    transform: scale(1.1) rotate(90deg);
    box-shadow: 0 4px 12px rgba(255, 77, 79, 0.6);
  }
  
  &:active {
    transform: scale(0.95) rotate(90deg);
  }
}

// 淡入淡出动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.error-message {
  color: #ff4d4f;
  @include FontSize(14);
  text-align: center;
  background: rgba(0, 0, 0, 0.8);
  padding: 8px 12px;
  border-radius: 4px;
}

.loading-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  
  .spinner {
    width: 30px;
    height: 30px;
    border: 2px solid rgba(0, 242, 255, 0.2);
    border-top-color: #00f2ff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
