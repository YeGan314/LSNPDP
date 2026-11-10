<template>
  <div class="district-selector">
    <el-select
      v-model="selectedDistrictId"
      placeholder="选择行政区"
      size="small"
      @change="handleDistrictChange"
      clearable
    >
      <el-option
        v-for="district in districts"
        :key="district.id"
        :label="district.name"
        :value="district.id"
      >
        <span style="float: left">{{ district.name }}</span>
        <span style="float: right; color: #8492a6; font-size: 12px">
          {{ district.type === 'polygon' ? '多边形' : '矩形' }}
        </span>
      </el-option>
    </el-select>
  </div>
</template>

<script>
import districtDataService from '@/services/districtDataService';

export default {
  name: 'DistrictSelector',
  props: {
    value: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      selectedDistrictId: this.value,
      districts: []
    };
  },
  watch: {
    value(newVal) {
      this.selectedDistrictId = newVal;
    }
  },
  created() {
    this.loadDistricts();
  },
  methods: {
    loadDistricts() {
      this.districts = districtDataService.getAllDistricts();
    },
    handleDistrictChange(districtId) {
      const district = districtDataService.getDistrictById(districtId);
      this.$emit('input', districtId);
      this.$emit('change', district);
    }
  }
};
</script>

<style scoped lang="scss">
.district-selector {
  :deep(.el-select) {
    width: 200px;
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
</style>
