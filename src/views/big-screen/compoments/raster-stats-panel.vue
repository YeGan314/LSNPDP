<!--
 * 栅格数据统计面板
 * 用于统计WMS栅格图层中各级别值的占比
 * @author YG
 * @date 2025-12-03
-->
<template>
  <div class="raster-stats-panel" v-show="visible">
    <div class="panel-header">
      <div class="panel-title">栅格数据统计</div>
      <div class="panel-close" @click="closePanel">×</div>
    </div>

    <div class="panel-content">
      <!-- 配置区 -->
      <div class="config-section">
        <div class="form-item">
          <label>图层名称:</label>
          <input 
            v-model="layerName" 
            type="text" 
            placeholder="例如: risk_2000"
            class="input-field"
          />
        </div>

        <div class="form-item">
          <label>统计方法:</label>
          <select v-model="method" class="select-field">
            <option value="sample">WMS采样统计</option>
            <option value="rest">REST API统计</option>
          </select>
        </div>

        <div class="form-item" v-if="method === 'sample'">
          <label>采样密度:</label>
          <select v-model="sampleSize" class="select-field">
            <option :value="20">低 (20x20 = 400点)</option>
            <option :value="50">中 (50x50 = 2500点)</option>
            <option :value="100">高 (100x100 = 10000点)</option>
          </select>
        </div>

        <div class="form-item" v-if="method === 'sample'">
          <label>统计范围:</label>
          <select v-model="boundsType" class="select-field">
            <option value="current">当前视野</option>
            <option value="custom">自定义</option>
          </select>
        </div>

        <div class="custom-bounds" v-if="method === 'sample' && boundsType === 'custom'">
          <div class="bounds-row">
            <input v-model.number="customBounds.west" type="number" step="0.001" placeholder="西经度" />
            <input v-model.number="customBounds.east" type="number" step="0.001" placeholder="东经度" />
          </div>
          <div class="bounds-row">
            <input v-model.number="customBounds.south" type="number" step="0.001" placeholder="南纬度" />
            <input v-model.number="customBounds.north" type="number" step="0.001" placeholder="北纬度" />
          </div>
        </div>

        <button 
          @click="startStatistics" 
          :disabled="loading"
          class="btn-primary"
        >
          {{ loading ? '统计中...' : '开始统计' }}
        </button>
      </div>

      <!-- 进度显示 -->
      <div class="progress-section" v-if="loading">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
        <div class="progress-text">{{ progressText }}</div>
      </div>

      <!-- 结果显示 -->
      <div class="result-section" v-if="statistics.length > 0">
        <div class="result-header">
          <h3>统计结果</h3>
          <div class="result-actions">
            <button @click="exportCSV" class="btn-small">导出CSV</button>
            <button @click="showChart" class="btn-small">查看图表</button>
          </div>
        </div>

        <div class="result-summary">
          <div class="summary-item">
            <span class="label">总样本数:</span>
            <span class="value">{{ totalSamples }}</span>
          </div>
          <div class="summary-item">
            <span class="label">有效样本:</span>
            <span class="value">{{ successSamples }}</span>
          </div>
          <div class="summary-item">
            <span class="label">级别种类:</span>
            <span class="value">{{ statistics.length }}</span>
          </div>
        </div>

        <div class="result-table">
          <table>
            <thead>
              <tr>
                <th>级别值</th>
                <th>数量</th>
                <th>占比</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in statistics" :key="item.value">
                <td>{{ item.value }}</td>
                <td>{{ item.count }}</td>
                <td>
                  <div class="percentage-bar">
                    <div 
                      class="percentage-fill" 
                      :style="{ width: item.percentage + '%' }"
                    ></div>
                    <span class="percentage-text">{{ item.percentageText }}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 错误信息 -->
      <div class="error-section" v-if="error">
        <div class="error-message">{{ error }}</div>
      </div>
    </div>

    <!-- 图表弹窗 -->
    <div class="chart-modal" v-if="showChartModal" @click="showChartModal = false">
      <div class="chart-container" @click.stop>
        <div class="chart-header">
          <h3>级别分布图表</h3>
          <button @click="showChartModal = false" class="btn-close">×</button>
        </div>
        <div ref="chartRef" class="chart-content"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, nextTick } from 'vue';
import { rasterStatsService } from '@/services/rasterStatsService';
import * as Cesium from 'cesium';

// 注入Cesium viewer获取方法
const getViewer = inject('getViewer', null);

// 面板显示状态
const visible = ref(false);

// 配置参数
const layerName = ref('risk_2000');
const method = ref('sample'); // 'sample' 或 'rest'
const sampleSize = ref(50);
const boundsType = ref('current'); // 'current' 或 'custom'
const customBounds = ref({
  west: 112.87,
  south: 28.84,
  east: 113.02,
  north: 28.98
});

// 统计状态
const loading = ref(false);
const progress = ref(0);
const progressText = ref('');
const error = ref('');

// 统计结果
const statistics = ref([]);
const totalSamples = ref(0);
const successSamples = ref(0);

// 图表显示
const showChartModal = ref(false);
const chartRef = ref(null);

/**
 * 打开面板
 */
const openPanel = () => {
  visible.value = true;
};

/**
 * 关闭面板
 */
const closePanel = () => {
  visible.value = false;
};

/**
 * 开始统计
 */
const startStatistics = async () => {
  error.value = '';
  statistics.value = [];
  loading.value = true;
  progress.value = 0;

  try {
    if (method.value === 'rest') {
      // 方法1: 使用REST API
      progressText.value = '正在获取图层信息...';
      const result = await rasterStatsService.getRasterStatsFromGeoServer(layerName.value);
      
      if (result.success) {
        console.log('图层信息:', result.layerInfo);
        progressText.value = '图层信息获取成功';
        
        // 注意: REST API可能不直接返回像素值统计
        // 需要根据实际GeoServer配置调整
        error.value = 'REST API方法需要GeoServer支持统计功能，建议使用WMS采样统计';
      } else {
        throw new Error(result.error);
      }
    } else {
      // 方法2: 使用WMS采样
      const viewer = getViewer ? getViewer() : null;
      if (!viewer) {
        throw new Error('Cesium Viewer未初始化');
      }

      // 获取统计范围
      let bounds;
      if (boundsType.value === 'custom') {
        bounds = customBounds.value;
      } else {
        // 获取当前视野范围
        const rectangle = viewer.camera.computeViewRectangle();
        if (!rectangle) {
          throw new Error('无法获取当前视野范围，请使用自定义范围');
        }
        bounds = {
          west: Cesium.Math.toDegrees(rectangle.west),
          south: Cesium.Math.toDegrees(rectangle.south),
          east: Cesium.Math.toDegrees(rectangle.east),
          north: Cesium.Math.toDegrees(rectangle.north)
        };
      }

      progressText.value = `开始采样 (${sampleSize.value}x${sampleSize.value})...`;
      
      const result = await rasterStatsService.sampleRasterValues(
        viewer,
        layerName.value,
        bounds,
        sampleSize.value
      );

      if (result.success) {
        statistics.value = result.statistics;
        totalSamples.value = result.totalSamples;
        successSamples.value = result.successSamples;
        progressText.value = '统计完成';
        progress.value = 100;
        
        console.log('统计结果:', result);
      } else {
        throw new Error(result.error);
      }
    }
  } catch (err) {
    console.error('统计失败:', err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

/**
 * 导出CSV
 */
const exportCSV = () => {
  rasterStatsService.exportToCSV(
    statistics.value,
    `${layerName.value}_statistics_${Date.now()}.csv`
  );
};

/**
 * 显示图表
 */
const showChart = async () => {
  showChartModal.value = true;
  
  await nextTick();
  
  // 动态导入ECharts
  try {
    const echarts = await import('echarts');
    const chart = echarts.init(chartRef.value);
    const option = rasterStatsService.generateChartConfig(
      statistics.value,
      `${layerName.value} 级别分布`
    );
    chart.setOption(option);
    
    // 窗口大小改变时重绘
    window.addEventListener('resize', () => chart.resize());
  } catch (err) {
    console.error('加载图表失败:', err);
    error.value = '图表功能需要安装echarts: npm install echarts';
  }
};

// 暴露方法供父组件调用
defineExpose({
  openPanel,
  closePanel
});
</script>

<style scoped>
.raster-stats-panel {
  position: fixed;
  top: 100px;
  right: 20px;
  width: 450px;
  max-height: 80vh;
  background: rgba(0, 20, 40, 0.95);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 8px;
  overflow: hidden;
  z-index: 1000;
  box-shadow: 0 4px 20px rgba(0, 255, 255, 0.2);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: linear-gradient(90deg, rgba(0, 100, 200, 0.3), rgba(0, 150, 255, 0.3));
  border-bottom: 1px solid rgba(0, 255, 255, 0.3);
}

.panel-title {
  font-size: 16px;
  font-weight: bold;
  color: #00ffff;
}

.panel-close {
  font-size: 24px;
  color: #00ffff;
  cursor: pointer;
  line-height: 1;
  transition: color 0.3s;
}

.panel-close:hover {
  color: #ff4444;
}

.panel-content {
  padding: 20px;
  max-height: calc(80vh - 60px);
  overflow-y: auto;
}

.config-section {
  margin-bottom: 20px;
}

.form-item {
  margin-bottom: 15px;
}

.form-item label {
  display: block;
  margin-bottom: 5px;
  color: #00ccff;
  font-size: 14px;
}

.input-field,
.select-field {
  width: 100%;
  padding: 8px 12px;
  background: rgba(0, 50, 100, 0.5);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
}

.input-field:focus,
.select-field:focus {
  outline: none;
  border-color: #00ffff;
}

.custom-bounds {
  margin-top: 10px;
}

.bounds-row {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
}

.bounds-row input {
  flex: 1;
  padding: 8px;
  background: rgba(0, 50, 100, 0.5);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 4px;
  color: #fff;
  font-size: 13px;
}

.btn-primary {
  width: 100%;
  padding: 10px;
  background: linear-gradient(90deg, #0066cc, #0099ff);
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(90deg, #0077dd, #00aaff);
  box-shadow: 0 2px 10px rgba(0, 150, 255, 0.5);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.progress-section {
  margin: 20px 0;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background: rgba(0, 50, 100, 0.5);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ff88, #00ffff);
  transition: width 0.3s;
}

.progress-text {
  text-align: center;
  color: #00ffff;
  font-size: 13px;
}

.result-section {
  margin-top: 20px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.result-header h3 {
  color: #00ffff;
  font-size: 16px;
  margin: 0;
}

.result-actions {
  display: flex;
  gap: 8px;
}

.btn-small {
  padding: 5px 12px;
  background: rgba(0, 100, 200, 0.5);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 4px;
  color: #00ffff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-small:hover {
  background: rgba(0, 150, 255, 0.5);
  border-color: #00ffff;
}

.result-summary {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  padding: 12px;
  background: rgba(0, 50, 100, 0.3);
  border-radius: 4px;
}

.summary-item {
  flex: 1;
  text-align: center;
}

.summary-item .label {
  display: block;
  color: #00ccff;
  font-size: 12px;
  margin-bottom: 4px;
}

.summary-item .value {
  display: block;
  color: #00ffff;
  font-size: 18px;
  font-weight: bold;
}

.result-table {
  max-height: 300px;
  overflow-y: auto;
}

.result-table table {
  width: 100%;
  border-collapse: collapse;
}

.result-table th {
  background: rgba(0, 100, 200, 0.3);
  color: #00ffff;
  padding: 10px;
  text-align: left;
  font-size: 13px;
  position: sticky;
  top: 0;
  z-index: 1;
}

.result-table td {
  padding: 8px 10px;
  border-bottom: 1px solid rgba(0, 255, 255, 0.1);
  color: #fff;
  font-size: 13px;
}

.percentage-bar {
  position: relative;
  width: 100%;
  height: 24px;
  background: rgba(0, 50, 100, 0.3);
  border-radius: 4px;
  overflow: hidden;
}

.percentage-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, #0066cc, #00ffff);
  transition: width 0.3s;
}

.percentage-text {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-size: 12px;
  font-weight: bold;
  z-index: 1;
  text-shadow: 0 0 3px rgba(0, 0, 0, 0.8);
}

.error-section {
  margin-top: 15px;
  padding: 12px;
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 0, 0, 0.3);
  border-radius: 4px;
}

.error-message {
  color: #ff6666;
  font-size: 13px;
}

.chart-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.chart-container {
  width: 800px;
  height: 600px;
  background: rgba(0, 20, 40, 0.95);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 8px;
  overflow: hidden;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: rgba(0, 100, 200, 0.3);
  border-bottom: 1px solid rgba(0, 255, 255, 0.3);
}

.chart-header h3 {
  color: #00ffff;
  margin: 0;
  font-size: 16px;
}

.btn-close {
  background: none;
  border: none;
  color: #00ffff;
  font-size: 24px;
  cursor: pointer;
  line-height: 1;
}

.btn-close:hover {
  color: #ff4444;
}

.chart-content {
  width: 100%;
  height: calc(100% - 60px);
}

/* 滚动条样式 */
.panel-content::-webkit-scrollbar,
.result-table::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track,
.result-table::-webkit-scrollbar-track {
  background: rgba(0, 50, 100, 0.3);
}

.panel-content::-webkit-scrollbar-thumb,
.result-table::-webkit-scrollbar-thumb {
  background: rgba(0, 255, 255, 0.3);
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover,
.result-table::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 255, 255, 0.5);
}
</style>
