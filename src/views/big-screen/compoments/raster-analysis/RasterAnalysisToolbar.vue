<template>
  <div class="raster-analysis-toolbar">
    <div class="toolbar-left">
      <div class="toolbar-item">
        <label>栅格图层:</label>
        <el-select
          v-model="selectedLayer"
          placeholder="选择图层"
          size="small"
          @change="handleLayerChange"
        >
          <el-option
            v-for="layer in rasterLayers"
            :key="layer.id"
            :label="layer.name"
            :value="layer.id"
          />
        </el-select>
      </div>
      
      <div class="toolbar-item">
        <label>分析范围:</label>
        <DistrictSelector
          v-model="selectedDistrict"
          @change="handleDistrictChange"
        />
      </div>
    </div>
    
    <div class="toolbar-right">
      <el-button
        type="primary"
        size="small"
        :loading="analyzing"
        :disabled="!selectedLayer"
        @click="handleAnalyze"
      >
        <i class="el-icon-data-analysis"></i>
        {{ analyzing ? '分析中...' : '开始分析' }}
      </el-button>
    </div>
  </div>
</template>

<script>
import DistrictSelector from './DistrictSelector.vue';

export default {
  name: 'RasterAnalysisToolbar',
  components: {
    DistrictSelector
  },
  props: {
    analyzing: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      selectedLayer: 'risk_shange_2000',
      selectedDistrict: null,
      currentDistrict: null,
      rasterLayers: [
        {
          id: 'risk_shange_2000',
          name: '风险等级图层 (2000)',
          // 使用后端默认路径对应的相对路径（基于项目根目录 geodata）
          tifPath: '/Users/mac/Documents/cursor-gqwr/GQWR/geodata/risk_shange_2000.tif',
          workspace: 'veg'
        }
        // 可以添加更多图层
      ]
    };
  },
  methods: {
    handleLayerChange(layerId) {
      console.log('图层变化:', layerId);
      const layer = this.rasterLayers.find(l => l.id === layerId);
      this.$emit('layer-change', layer);
    },
    handleDistrictChange(district) {
      console.log('行政区变化:', district);
      this.currentDistrict = district;
      this.$emit('district-change', district);
    },
    handleAnalyze() {
      console.log('点击分析按钮');
      const layer = this.rasterLayers.find(l => l.id === this.selectedLayer);
      console.log('当前图层:', layer);
      console.log('当前行政区:', this.currentDistrict);
      
      this.$emit('analyze', {
        layer: layer,
        district: this.currentDistrict
      });
    }
  }
};
</script>

<style scoped lang="scss">
.raster-analysis-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: linear-gradient(90deg, rgba(13, 40, 71, 0.9) 0%, rgba(26, 58, 92, 0.9) 100%);
  border-radius: 8px;
  border: 1px solid rgba(64, 158, 255, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 2000;
  
  .toolbar-left {
    display: flex;
    gap: 20px;
    align-items: center;
    
    .toolbar-item {
      display: flex;
      align-items: center;
      gap: 10px;
      
      label {
        color: #909399;
        font-size: 13px;
        white-space: nowrap;
      }
      
      :deep(.el-select) {
        width: 180px;
      }
      
      :deep(.el-input__inner) {
        background: rgba(13, 40, 71, 0.6);
        border-color: rgba(64, 158, 255, 0.3);
        color: #fff;
        
        &::placeholder {
          color: #909399;
        }
        
        &:hover {
          border-color: rgba(64, 158, 255, 0.6);
        }
        
        &:focus {
          border-color: #409EFF;
        }
      }
      
      :deep(.el-select__caret) {
        color: #909399;
      }
    }
  }
  
  .toolbar-right {
    :deep(.el-button) {
      background: linear-gradient(135deg, #409EFF 0%, #66B1FF 100%);
      border: none;
      box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
      
      &:hover {
        background: linear-gradient(135deg, #66B1FF 0%, #409EFF 100%);
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.5);
      }
      
      &:active {
        box-shadow: 0 1px 4px rgba(64, 158, 255, 0.3);
      }
      
      &.is-disabled {
        background: rgba(64, 158, 255, 0.3);
        box-shadow: none;
      }
    }
  }
}
</style>
