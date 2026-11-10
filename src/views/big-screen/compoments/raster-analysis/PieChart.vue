<template>
  <div ref="chartRef" class="pie-chart" style="width: 100%; height: 280px;"></div>
</template>

<script>
import * as echarts from 'echarts';

export default {
  name: 'PieChart',
  props: {
    data: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      chart: null
    };
  },
  watch: {
    data: {
      handler() {
        this.updateChart();
      },
      deep: true
    }
  },
  mounted() {
    this.initChart();
  },
  beforeUnmount() {
    if (this.chart) {
      this.chart.dispose();
    }
  },
  methods: {
    initChart() {
      if (!this.$refs.chartRef) return;
      
      this.chart = echarts.init(this.$refs.chartRef);
      this.updateChart();
      
      // 响应式
      window.addEventListener('resize', () => {
        if (this.chart) {
          this.chart.resize();
        }
      });
    },
    updateChart() {
      if (!this.chart || !this.data || this.data.length === 0) return;
      
      const option = {
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(13, 40, 71, 0.9)',
          borderColor: 'rgba(64, 158, 255, 0.5)',
          borderWidth: 1,
          textStyle: {
            color: '#fff'
          },
          formatter: (params) => {
            return `${params.name}<br/>面积: ${params.value} km²<br/>占比: ${params.data.percentage}%`;
          }
        },
        legend: {
          orient: 'vertical',
          right: '5%',
          top: 'center',
          textStyle: {
            color: '#909399',
            fontSize: 11
          },
          formatter: (name) => {
            const item = this.data.find(d => d.name === name);
            return `${name}  ${item ? item.percentage : 0}%`;
          }
        },
        series: [
          {
            type: 'pie',
            radius: ['40%', '65%'],
            center: ['35%', '50%'],
            avoidLabelOverlap: true,
            itemStyle: {
              borderRadius: 8,
              borderColor: 'rgba(13, 40, 71, 0.8)',
              borderWidth: 2
            },
            label: {
              show: true,
              position: 'outside',
              color: '#fff',
              fontSize: 11,
              formatter: '{b}\n{d}%'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 13,
                fontWeight: 'bold'
              },
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(64, 158, 255, 0.5)'
              }
            },
            labelLine: {
              show: true,
              lineStyle: {
                color: 'rgba(144, 147, 153, 0.5)'
              }
            },
            data: this.data.map(item => ({
              name: item.name,
              value: item.value,
              percentage: item.percentage,
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: item.color },
                  { offset: 1, color: this.adjustColor(item.color, -30) }
                ])
              }
            }))
          }
        ],
        animation: true,
        animationDuration: 1000,
        animationEasing: 'cubicOut'
      };
      
      this.chart.setOption(option);
    },
    adjustColor(color, amount) {
      // 调整颜色亮度
      const num = parseInt(color.replace('#', ''), 16);
      const r = Math.max(0, Math.min(255, (num >> 16) + amount));
      const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
      const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
      return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }
  }
};
</script>

<style scoped>
.pie-chart {
  width: 100%;
  height: 100%;
}
</style>
