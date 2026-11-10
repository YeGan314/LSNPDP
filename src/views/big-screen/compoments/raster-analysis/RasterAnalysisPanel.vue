<template>
  <transition name="slide-fade">
    <div class="raster-analysis-panel" v-show="visible">
      <div class="panel-content">
      <!-- 面板头部 -->
      <div class="panel-header">
        <div class="header-left">
          <i class="el-icon-data-analysis"></i>
          <span class="title">风险等级分析报告</span>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <i class="el-icon-loading"></i>
        <p>正在分析数据...</p>
      </div>

      <!-- 分析结果 -->
      <div v-else-if="analysisData" class="panel-body">
        <!-- 总面积卡片 -->
        <div class="stat-card total-area-card">
          <div class="card-icon">
            <i class="el-icon-s-data"></i>
          </div>
          <div class="card-content">
            <div class="card-label">总面积</div>
            <div class="card-value">{{ analysisData.total_area_km2 }} <span class="unit">km²</span></div>
            <div class="card-sub">{{ analysisData.total_area_hectare }} 公顷</div>
          </div>
        </div>

        <!-- 柱状图 -->
        <div class="chart-section">
          <div class="section-title">
            <i class="el-icon-s-marketing"></i>
            各风险等级面积分布
          </div>
          <div class="chart-container">
            <BarChart :data="barChartData" />
          </div>
        </div>

        <!-- 饼图 -->
        <div class="chart-section">
          <div class="section-title">
            <i class="el-icon-pie-chart"></i>
            风险等级占比
          </div>
          <div class="chart-container">
            <PieChart :data="pieChartData" />
          </div>
        </div>

        <!-- 详细数据表格 -->
        <div class="data-table-section">
          <div class="section-title">
            <i class="el-icon-document"></i>
            详细数据
          </div>
          <div class="table-box">
            <div class="table-head">
              <div class="head-item">风险等级</div>
              <div class="head-item">面积(km²)</div>
              <div class="head-item">占比(%)</div>
            </div>
            <div class="table-body">
              <div class="table-body-warp">
                <div 
                  class="row" 
                  v-for="(item, index) in analysisData.risk_levels" 
                  :key="index"
                >
                  <div class="col">
                    <span class="level-badge" :style="{ backgroundColor: getLevelColor(item.level) }">
                      等级 {{ item.level }}
                    </span>
                  </div>
                  <div class="col">{{ item.area_km2 }}</div>
                  <div class="col">{{ item.percentage }}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="panel-footer">
          <div class="export-btn" @click="exportReport">
            <span>导出报告</span>
          </div>
          <div class="close-btn" @click="closePanel">
            <span>关闭</span>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <i class="el-icon-warning-outline"></i>
        <p>暂无分析数据</p>
      </div>
      </div>
    </div>
  </transition>
</template>

<script>
import BarChart from './BarChart.vue';
import PieChart from './PieChart.vue';
import { getRiskLevelColor } from './riskLevelColors';

export default {
  name: 'RasterAnalysisPanel',
  components: {
    BarChart,
    PieChart
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    analysisData: {
      type: Object,
      default: null
    },
    regionName: {
      type: String,
      default: '全图'
    }
  },
  computed: {
    barChartData() {
      if (!this.analysisData || !this.analysisData.risk_levels) return null;
      
      return {
        categories: this.analysisData.risk_levels.map(item => `等级${item.level}`),
        values: this.analysisData.risk_levels.map(item => item.area_km2),
        colors: this.analysisData.risk_levels.map(item => this.getLevelColor(item.level))
      };
    },
    pieChartData() {
      if (!this.analysisData || !this.analysisData.risk_levels) return null;
      
      return this.analysisData.risk_levels.map(item => ({
        name: `等级${item.level}`,
        value: item.area_km2,
        percentage: item.percentage,
        color: this.getLevelColor(item.level)
      }));
    }
  },
  methods: {
    closePanel() {
      this.$emit('update:visible', false);
      this.$emit('close');
    },
    getLevelColor(level) {
      // 使用统一的配色方案
      return getRiskLevelColor(level);
    },
    exportReport() {
      // 导出报告功能
      if (!this.analysisData || !this.analysisData.risk_levels ||
          typeof this.analysisData.total_area_km2 === 'undefined') {
        console.warn('暂无可导出的分析结果');
        alert('暂无可导出的分析结果');
        return;
      }
      
      try {
        const reportData = {
          regionName: this.regionName,
          analysisTime: new Date().toLocaleString('zh-CN'),
          totalArea: this.analysisData.total_area_km2,
          riskLevels: this.analysisData.risk_levels
        };
        
        // 生成CSV
        let csv = '风险等级分析报告\n\n';
        csv += `分析区域,${this.regionName}\n`;
        csv += `分析时间,${reportData.analysisTime}\n`;
        csv += `总面积,${reportData.totalArea} km²\n\n`;
        csv += '风险等级,面积(km²),面积(公顷),占比(%)\n';
        
        this.analysisData.risk_levels.forEach(item => {
          csv += `等级${item.level},${item.area_km2},${item.area_hectare || 0},${item.percentage}\n`;
        });
        
        // 下载
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `风险等级分析报告_${this.regionName}_${Date.now()}.csv`;
        link.click();
        
        console.log('✅ 报告导出成功');
        
        // 安全地调用消息提示
        if (this.$message && typeof this.$message.success === 'function') {
          this.$message.success('报告导出成功');
        }
      } catch (error) {
        console.error('❌ 导出报告失败:', error);
        alert('导出报告失败: ' + error.message);
      }
    }
  }
};
</script>

<style scoped lang="scss">
// 滑入动画
.slide-fade-enter-active {
  transition: all 1s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.5s ease-in;
}

.slide-fade-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.raster-analysis-panel {
  position: fixed;
  top: 60px;
  right: 20px;
  bottom: 60px;
  width: 480px;
  z-index: 9999;
  pointer-events: auto;
  
  .panel-content {
    position: relative;
    width: 100%;
    height: 100%;
    // 渐变透明背景：边缘较深，中间较透明
    background: radial-gradient(
      ellipse at center,
      rgba(8, 24, 48, 0.3) 0%,
      rgba(8, 24, 48, 0.6) 40%,
      rgba(8, 24, 48, 0.85) 100%
    );
    backdrop-filter: blur(12px);
    border-radius: 4px;
    border: 1px solid rgba(0, 242, 255, 0.25);
    box-shadow: 
      -4px 0 20px rgba(0, 0, 0, 0.6),
      inset 0 0 60px rgba(0, 242, 255, 0.03);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    
    // 边框装饰角
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 20px;
      height: 20px;
      border-top: 2px solid rgba(0, 242, 255, 0.6);
      border-left: 2px solid rgba(0, 242, 255, 0.6);
      pointer-events: none;
      z-index: 1;
    }
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      right: 0;
      width: 20px;
      height: 20px;
      border-bottom: 2px solid rgba(0, 242, 255, 0.6);
      border-right: 2px solid rgba(0, 242, 255, 0.6);
      pointer-events: none;
      z-index: 1;
    }
  }
  
  .panel-header {
    padding: 16px 20px;
    background: linear-gradient(90deg, rgba(0, 242, 255, 0.08) 0%, transparent 100%);
    border-bottom: 1px solid rgba(0, 242, 255, 0.2);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
    position: relative;
    z-index: 10;
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
      
      i {
        font-size: 20px;
        color: #00f2ff;
      }
      
      .title {
        font-size: 18px;
        font-weight: 600;
        color: #ffffff;
        text-shadow: 0 0 10px rgba(0, 242, 255, 0.3);
        letter-spacing: 0.5px;
      }
    }
  }
  
  .loading-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 20px;
    
    i {
      font-size: 48px;
      color: #409EFF;
    }
    
    p {
      color: #909399;
      font-size: 14px;
    }
  }
  
  .panel-body {
    flex: 1;
    overflow-y: auto;
    padding: 12px 15px;
    
    &::-webkit-scrollbar {
      width: 6px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: rgba(64, 158, 255, 0.3);
      border-radius: 3px;
    }
  }
  
  .stat-card {
    background: linear-gradient(135deg, rgba(0, 242, 255, 0.05) 0%, rgba(8, 24, 48, 0.3) 100%);
    border-radius: 4px;
    padding: 14px 16px;
    margin-bottom: 14px;
    border: 1px solid rgba(0, 242, 255, 0.2);
    display: flex;
    align-items: center;
    gap: 14px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
    transition: all 0.3s;
    
    &:hover {
      border-color: rgba(0, 242, 255, 0.4);
      box-shadow: 0 4px 16px rgba(0, 242, 255, 0.15);
    }
    
    .card-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, rgba(0, 242, 255, 0.3) 0%, rgba(0, 242, 255, 0.15) 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border: 1px solid rgba(0, 242, 255, 0.3);
      
      i {
        font-size: 22px;
        color: #00f2ff;
      }
    }
    
    .card-content {
      flex: 1;
      
      .card-label {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 5px;
      }
      
      .card-value {
        font-size: 24px;
        font-weight: 600;
        color: #00f2ff;
        line-height: 1;
        margin-bottom: 5px;
        text-shadow: 0 0 10px rgba(0, 242, 255, 0.3);
        
        .unit {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
          margin-left: 4px;
        }
      }
      
      .card-sub {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.5);
      }
    }
  }
  
  .chart-section {
    margin-bottom: 14px;
    
    .section-title {
      font-size: 14px;
      color: #ffffff;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      
      i {
        color: #00f2ff;
      }
    }
    
    .chart-container {
      background: rgba(0, 242, 255, 0.03);
      border-radius: 4px;
      padding: 12px;
      border: 1px solid rgba(0, 242, 255, 0.15);
    }
  }
  
  .data-table-section {
    margin-bottom: 14px;
    
    .section-title {
      font-size: 14px;
      color: #ffffff;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      
      i {
        color: #00f2ff;
        font-size: 14px;
      }
    }
    
    .table-box {
      background: rgba(0, 242, 255, 0.03);
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid rgba(0, 242, 255, 0.15);
      
      .table-head {
        display: flex;
        background: rgba(0, 242, 255, 0.08);
        border-bottom: 1px solid rgba(0, 242, 255, 0.2);
        
        .head-item {
          flex: 1;
          padding: 10px 12px;
          color: #00f2ff;
          font-size: 12px;
          font-weight: 600;
          text-align: center;
        }
      }
      
      .table-body {
        .table-body-warp {
          max-height: 180px;
          overflow-y: auto;
          
          &::-webkit-scrollbar {
            width: 4px;
          }
          
          &::-webkit-scrollbar-thumb {
            background: rgba(0, 242, 255, 0.3);
            border-radius: 2px;
          }
          
          .row {
            display: flex;
            border-bottom: 1px solid rgba(0, 242, 255, 0.08);
            transition: all 0.3s;
            
            &:hover {
              background: rgba(0, 242, 255, 0.1);
            }
            
            .col {
              flex: 1;
              padding: 8px 10px;
              color: rgba(255, 255, 255, 0.85);
              font-size: 12px;
              text-align: center;
              display: flex;
              align-items: center;
              justify-content: center;
              
              .level-badge {
                padding: 4px 12px;
                border-radius: 10px;
                color: #fff;
                font-size: 11px;
                font-weight: 600;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
              }
            }
          }
        }
      }
    }
  }
  
  .panel-footer {
    padding: 14px 20px;
    border-top: 1px solid rgba(0, 242, 255, 0.2);
    display: flex;
    gap: 12px;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(90deg, transparent 0%, rgba(0, 242, 255, 0.05) 100%);
    flex-shrink: 0;
    
    .export-btn {
      color: #00f2ff;
      font-size: 14px;
      font-weight: 600;
      padding: 8px 24px;
      background: rgba(0, 242, 255, 0.1);
      border-radius: 4px;
      border: 1px solid rgba(0, 242, 255, 0.3);
      box-shadow: 0 0 10px rgba(0, 242, 255, 0.1);
      cursor: pointer;
      transition: all 0.3s;
      
      span {
        display: inline-block;
      }
      
      &:hover {
        background: rgba(0, 242, 255, 0.2);
        border-color: rgba(0, 242, 255, 0.5);
        box-shadow: 0 0 15px rgba(0, 242, 255, 0.2);
        transform: translateY(-1px);
      }
      
      &:active {
        transform: translateY(0);
      }
    }
    
    .close-btn {
      color: #00f2ff;
      font-size: 14px;
      font-weight: 600;
      padding: 8px 24px;
      background: rgba(0, 242, 255, 0.1);
      border-radius: 4px;
      border: 1px solid rgba(0, 242, 255, 0.3);
      box-shadow: 0 0 10px rgba(0, 242, 255, 0.1);
      cursor: pointer;
      transition: all 0.3s;
      
      span {
        display: inline-block;
      }
      
      &:hover {
        background: rgba(0, 242, 255, 0.2);
        border-color: rgba(0, 242, 255, 0.5);
        box-shadow: 0 0 15px rgba(0, 242, 255, 0.2);
        transform: translateY(-1px);
      }
      
      &:active {
        transform: translateY(0);
      }
    }
  }
  
  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 15px;
    
    i {
      font-size: 64px;
      color: #909399;
    }
    
    p {
      color: #909399;
      font-size: 14px;
    }
  }
}
</style>
