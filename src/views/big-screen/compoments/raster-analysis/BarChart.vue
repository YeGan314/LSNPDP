<template>
  <div ref="chartRef" class="bar-chart" style="width: 100%; height: 250px;"></div>
</template>

<script>
import * as echarts from 'echarts';

export default {
  name: 'BarChart',
  props: {
    data: {
      type: Object,
      default: null
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
      if (!this.chart || !this.data) return;
      
      const option = {
        grid: {
          left: '15%',
          right: '5%',
          top: '15%',
          bottom: '15%'
        },
        xAxis: {
          type: 'category',
          data: this.data.categories,
          axisLine: {
            lineStyle: {
              color: 'rgba(64, 158, 255, 0.3)'
            }
          },
          axisLabel: {
            color: '#909399',
            fontSize: 11
          }
        },
        yAxis: {
          type: 'value',
          name: '面积 (km²)',
          nameTextStyle: {
            color: '#909399',
            fontSize: 11
          },
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(64, 158, 255, 0.1)',
              type: 'dashed'
            }
          },
          axisLabel: {
            color: '#909399',
            fontSize: 11
          }
        },
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(13, 40, 71, 0.9)',
          borderColor: 'rgba(64, 158, 255, 0.5)',
          borderWidth: 1,
          textStyle: {
            color: '#fff'
          },
          formatter: (params) => {
            const item = params[0];
            return `${item.name}<br/>面积: ${item.value} km²`;
          }
        },
        series: [
          {
            type: 'bar',
            data: this.data.values.map((value, index) => ({
              value: value,
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: this.data.colors[index] },
                  { offset: 1, color: this.adjustColor(this.data.colors[index], -30) }
                ]),
                borderRadius: [4, 4, 0, 0]
              }
            })),
            barWidth: '50%',
            label: {
              show: true,
              position: 'top',
              color: '#fff',
              fontSize: 10,
              formatter: '{c}'
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(64, 158, 255, 0.5)'
              }
            }
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
.bar-chart {
  width: 100%;
  height: 100%;
}
</style>
