<!--
 * @Description: 行政区级联选择器测试页面
 * @Date: 2025-11-19
-->
<template>
  <div class="region-test-page">
    <div class="test-container">
      <h1 class="title">行政区级联选择器测试</h1>
      
      <div class="control-section">
        <h2>行政区选择器</h2>
        <RegionCascader @change="handleChange" @complete="handleComplete" />
      </div>
      
      <div class="result-section">
        <h2>选择结果</h2>
        <div class="result-box">
          <div class="result-item" v-if="selection.province">
            <strong>省份：</strong>
            <span>{{ selection.province.name }} ({{ selection.province.code }})</span>
          </div>
          <div class="result-item" v-if="selection.city">
            <strong>城市：</strong>
            <span>{{ selection.city.name }} ({{ selection.city.code }})</span>
          </div>
          <div class="result-item" v-if="selection.county">
            <strong>区县：</strong>
            <span>{{ selection.county.name }} ({{ selection.county.code }})</span>
          </div>
          <div class="result-item" v-if="selection.town">
            <strong>乡镇：</strong>
            <span>{{ selection.town.name }} ({{ selection.town.code }})</span>
          </div>
          <div class="result-item" v-if="selection.village">
            <strong>村：</strong>
            <span>{{ selection.village.name }} ({{ selection.village.code }})</span>
          </div>
          <div class="result-item" v-if="!selection.province">
            <span style="color: #999;">请选择行政区...</span>
          </div>
        </div>
      </div>

      <div class="complete-section" v-if="completePath.length > 0">
        <h2>完整路径</h2>
        <div class="path-box">
          {{ completePath.join(' > ') }}
        </div>
      </div>

      <div class="json-section">
        <h2>完整数据（JSON）</h2>
        <pre class="json-box">{{ JSON.stringify(selection, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import RegionCascader from '@/components/RegionCascader/index.vue';

// 选择结果
const selection = ref({
  province: null,
  city: null,
  county: null,
  town: null,
  village: null,
});

// 完整路径
const completePath = ref([]);

// 处理选择变化
const handleChange = (data) => {
  console.log('选择变化:', data);
  selection.value = data;
};

// 处理选择完成
const handleComplete = (data) => {
  console.log('选择完成:', data);
  selection.value = {
    province: data.province,
    city: data.city,
    county: data.county,
    town: data.town,
    village: data.village,
  };
  completePath.value = data.path || [];
};
</script>

<style scoped lang="less">
.region-test-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a1628 0%, #1a2744 100%);
  padding: 40px 20px;
}

.test-container {
  max-width: 1200px;
  margin: 0 auto;
}

.title {
  text-align: center;
  color: #00d4ff;
  font-size: 32px;
  margin-bottom: 40px;
  text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
}

h2 {
  color: #00d4ff;
  font-size: 18px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid rgba(0, 120, 255, 0.3);
}

.control-section,
.result-section,
.complete-section,
.json-section {
  background: rgba(0, 30, 60, 0.6);
  border: 1px solid rgba(0, 120, 255, 0.3);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  backdrop-filter: blur(10px);
}

.result-box {
  background: rgba(0, 20, 40, 0.5);
  border: 1px solid rgba(0, 120, 255, 0.2);
  border-radius: 4px;
  padding: 15px;
}

.result-item {
  padding: 8px 0;
  color: #fff;
  font-size: 14px;
  border-bottom: 1px solid rgba(0, 120, 255, 0.1);

  &:last-child {
    border-bottom: none;
  }

  strong {
    color: #00d4ff;
    margin-right: 10px;
    min-width: 60px;
    display: inline-block;
  }
}

.path-box {
  background: rgba(0, 20, 40, 0.5);
  border: 1px solid rgba(0, 120, 255, 0.2);
  border-radius: 4px;
  padding: 15px;
  color: #00d4ff;
  font-size: 16px;
  font-weight: bold;
}

.json-box {
  background: rgba(0, 20, 40, 0.8);
  border: 1px solid rgba(0, 120, 255, 0.2);
  border-radius: 4px;
  padding: 15px;
  color: #0f0;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
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
</style>

