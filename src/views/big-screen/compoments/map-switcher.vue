<!--
 * @Author: YG 
 * @Date: 2025-11-27
 * @Description: 地图图层切换组件
-->
<template>
  <div 
    class="map-switcher"
    @mouseenter="isExpanded = true"
    @mouseleave="isExpanded = false"
  >
    <!-- 展开时显示所有选项 -->
    <transition-group name="slide">
      <div 
        v-for="item in visibleMapTypes" 
        :key="item.id"
        :class="['map-item', { active: currentMap === item.id }]"
        @click="switchMap(item.id)"
      >
        <div class="map-preview">
          <img :src="item.preview" :alt="item.name" />
          <div class="map-icon">{{ item.icon }}</div>
        </div>
        <div class="map-name">{{ item.name }}</div>
      </div>
    </transition-group>
    <!-- 展开指示器 -->
    <div class="expand-hint" v-if="!isExpanded">
      <span>◀</span>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, onMounted, computed } from 'vue';

// 注入地图切换方法
const initGaoGeWX = inject('initGaoGeWX', null);
const initGaoGeJJ = inject('initGaoGeJJ', null);

// 展开状态
const isExpanded = ref(false);

// 地图类型配置
const mapTypes = [
  {
    id: 'satellite',
    name: '影像',
    icon: '🛰️',
    preview: 'data:image/svg+xml,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="80" height="60" viewBox="0 0 80 60">
        <defs>
          <linearGradient id="sat" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#2d5a27"/>
            <stop offset="30%" style="stop-color:#4a7c43"/>
            <stop offset="60%" style="stop-color:#8b7355"/>
            <stop offset="100%" style="stop-color:#3d6b35"/>
          </linearGradient>
        </defs>
        <rect fill="url(#sat)" width="80" height="60"/>
        <path d="M0,30 Q20,25 40,35 T80,30" stroke="#6b8e5e" stroke-width="3" fill="none"/>
        <circle cx="60" cy="20" r="8" fill="#5a8a52"/>
        <rect x="15" y="40" width="20" height="15" fill="#4a6a42"/>
      </svg>
    `)
  },
  {
    id: 'terrain',
    name: '地形',
    icon: '🌍',
    preview: 'data:image/svg+xml,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="80" height="60" viewBox="0 0 80 60">
        <defs>
          <radialGradient id="earth" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style="stop-color:#4a90d9"/>
            <stop offset="70%" style="stop-color:#2d5aa0"/>
            <stop offset="100%" style="stop-color:#1a3a6e"/>
          </radialGradient>
        </defs>
        <rect fill="#0a1628" width="80" height="60"/>
        <ellipse cx="40" cy="30" rx="28" ry="28" fill="url(#earth)"/>
        <ellipse cx="35" cy="25" rx="12" ry="8" fill="#3d8b40" transform="rotate(-15 35 25)"/>
        <ellipse cx="48" cy="35" rx="8" ry="6" fill="#3d8b40"/>
      </svg>
    `)
  },
  {
    id: 'vector',
    name: '矢量',
    icon: '🗺️',
    preview: 'data:image/svg+xml,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="80" height="60" viewBox="0 0 80 60">
        <rect fill="#f5f3f0" width="80" height="60"/>
        <rect x="0" y="25" width="80" height="8" fill="#ffeaa7"/>
        <rect x="35" y="0" width="6" height="60" fill="#ffeaa7"/>
        <rect x="10" y="10" width="15" height="12" fill="#dfe6e9" stroke="#b2bec3" stroke-width="0.5"/>
        <rect x="55" y="38" width="18" height="15" fill="#dfe6e9" stroke="#b2bec3" stroke-width="0.5"/>
        <rect x="5" y="40" width="20" height="10" fill="#81ecec" opacity="0.5"/>
        <circle cx="65" cy="15" r="6" fill="#a8e6cf"/>
      </svg>
    `)
  }
];

// 当前选中的地图（默认地形图）
const currentMap = ref('terrain');

// 计算可见的地图类型
const visibleMapTypes = computed(() => {
  if (isExpanded.value) {
    return mapTypes;
  }
  // 收起时只显示当前选中的地图
  return mapTypes.filter(item => item.id === currentMap.value);
});

// 切换地图
const switchMap = (mapId) => {
  if (currentMap.value === mapId) return;
  
  const previousMap = currentMap.value;
  currentMap.value = mapId;
  
  console.log(`🗺️ 切换地图: ${previousMap} -> ${mapId}`);
  
  // 先关闭所有图层
  if (initGaoGeWX) initGaoGeWX(false);
  if (initGaoGeJJ) initGaoGeJJ(false);
  
  // 根据选择开启对应图层
  switch (mapId) {
    case 'satellite':
      // 影像图 - 高德卫星
      if (initGaoGeWX) initGaoGeWX(true);
      break;
    case 'terrain':
      // 地形图 - 使用 Cesium 默认地形，不加载额外图层
      break;
    case 'vector':
      // 矢量图 - 高德街景
      if (initGaoGeJJ) initGaoGeJJ(true);
      break;
  }
};

// 组件挂载时检查当前状态
onMounted(() => {
  // 默认设置为地形图模式（Cesium默认地形，无需额外图层）
  console.log('🗺️ 地图切换器已就绪，当前模式: 地形');
});
</script>

<style lang="scss" scoped>
.map-switcher {
  position: fixed;
  @include Right(20);
  @include Bottom(30);
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 100;
  padding: 8px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(5px);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.4);
  }
  
  .map-item {
    cursor: pointer;
    transition: all 0.3s ease;
    
    .map-preview {
      position: relative;
      @include Width(80);
      @include wHeight(55);
      border-radius: 6px;
      overflow: hidden;
      border: 2px solid rgba(255, 255, 255, 0.3);
      background: rgba(0, 0, 0, 0.3);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .map-icon {
        position: absolute;
        top: 4px;
        left: 4px;
        @include FontSize(14);
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
      }
    }
    
    .map-name {
      text-align: center;
      color: #fff;
      @include FontSize(12);
      @include MarginTop(4);
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
      font-weight: 500;
    }
    
    &:hover {
      transform: translateY(-2px);
      
      .map-preview {
        border-color: rgba(255, 255, 255, 0.6);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      }
    }
    
    &.active {
      .map-preview {
        border-color: #7afafe;
        box-shadow: 0 0 12px rgba(122, 250, 254, 0.5);
      }
      
      .map-name {
        color: #7afafe;
      }
    }
  }
  
  .expand-hint {
    color: rgba(255, 255, 255, 0.6);
    @include FontSize(12);
    margin-left: 5px;
    animation: pulse-arrow 1.5s ease-in-out infinite;
    
    span {
      display: inline-block;
    }
  }
}

// 滑动过渡动画
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

@keyframes pulse-arrow {
  0%, 100% {
    opacity: 0.6;
    transform: translateX(0);
  }
  50% {
    opacity: 1;
    transform: translateX(-3px);
  }
}
</style>
