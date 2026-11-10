<template>
  <div class="left-container">
    <lease-title :rightbox="false">
      水质监测总览
      <template v-slot:slot-bottom>Water quality overview</template>
    </lease-title>

    <div class="row-content">
      <div class="traffic-data">
        <div class="row">
          <div
            v-for="item in kpiCards"
            :key="item.label"
            class="traffic-item"
          >
            <icon-box :height="item.iconSize" :width="item.iconSize">
              <img :src="item.icon" />
            </icon-box>
            <div class="traffic-content" :height="300">
              <div class="label">{{ item.label }}</div>
              <div class="value" :style="{ color: item.color }">
                {{ item.value }}
                <div class="suffix">个</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <lease-title class="lease-title" :rightbox="false">水质等级分布</lease-title>
    <div class="row-content chart-row">
      <box height="310" width="730">
        <v3-echarts :options="gradeChartOption" :height="320" />
      </box>
    </div>

    <lease-title class="lease-title" :rightbox="false">水质变化趋势</lease-title>
    <div class="row-content chart-row">
      <box height="300" width="730">
        <v3-echarts :options="trendChartOption" :height="320" />
      </box>
    </div>
  </div>
</template>

<script>
import { computed, defineComponent, onMounted, onUnmounted, shallowRef } from 'vue';
import LeaseTitle from '@/components/bigScreen/Lease_title/index-page.vue';
import V3Echarts from '@/components/bigScreen/V3Echarts/index-page.vue';
import IconBox from '@/components/bigScreen/IconBox/index-page.vue';
import Box from '@/components/bigScreen/Box/index-page.vue';
import thingsIcon from '@/assets/bigScreen/home/icon_things@2x.png';
import healthIcon from '@/assets/bigScreen/home/icon_health@2x.png';
import alarmIcon from '@/assets/bigScreen/home/icon_alarm@2x.png';
import accidentIcon from '@/assets/bigScreen/home/icon_accident@2x.png';
import {
  WATER_QUALITY_FILTER_EVENT,
  buildWaterQualityStats,
  fetchWaterQualityFeatures,
  filterWaterQualityRows,
} from '../water-quality-data';

export default defineComponent({
  components: {
    LeaseTitle,
    V3Echarts,
    IconBox,
    Box,
  },
  setup() {
    const allRows = shallowRef([]);
    const filteredRows = shallowRef([]);
    const stats = computed(() => buildWaterQualityStats(filteredRows.value));

    const kpiCards = computed(() => [
      {
        label: '监测点总数',
        value: stats.value.total,
        color: '#ffce7f',
        icon: thingsIcon,
        iconSize: 34,
      },
      {
        label: '达标点位',
        value: stats.value.normalTotal,
        color: '#31d17c',
        icon: healthIcon,
        iconSize: 41,
      },
      {
        label: '超标点位',
        value: stats.value.abnormalTotal,
        color: '#ff9f2f',
        icon: alarmIcon,
        iconSize: 34,
      },
      {
        label: '预警数量',
        value: stats.value.alarmTotal,
        color: '#ff4b5c',
        icon: accidentIcon,
        iconSize: 34,
      },
    ]);

    const gradeChartOption = computed(() => ({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, textStyle: { color: '#d9edff' } },
      series: [{
        type: 'pie',
        radius: ['48%', '70%'],
        center: ['50%', '45%'],
        data: stats.value.gradeCounts.map((item) => ({
          name: item.label,
          value: item.count,
          itemStyle: { color: item.color },
        })),
      }],
    }));

    const trendChartOption = computed(() => ({
      grid: { left: '8%', right: '5%', top: '10%', bottom: '18%', containLabel: true },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: stats.value.trendRows.map((item) => item.label),
        axisLabel: { color: '#d9edff' },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { color: '#d9edff' },
        splitLine: { lineStyle: { color: 'rgba(170, 205, 235, 0.18)' } },
      },
      series: [{
        name: '平均水质等级',
        type: 'line',
        smooth: true,
        symbolSize: 7,
        lineStyle: { color: '#00d5ff', width: 3 },
        itemStyle: { color: '#00d5ff' },
        data: stats.value.trendRows.map((item) => item.avgGradeRank),
      }],
    }));

    const handleFilterChange = (event) => {
      const detail = event?.detail || {};
      allRows.value = Array.isArray(detail.allRows) ? detail.allRows : allRows.value;
      filteredRows.value = Array.isArray(detail.rows)
        ? detail.rows
        : filterWaterQualityRows(allRows.value, detail);
    };

    const loadInitialData = async () => {
      if (allRows.value.length > 0 || filteredRows.value.length > 0) return;
      try {
        const result = await fetchWaterQualityFeatures();
        allRows.value = result.rows;
        filteredRows.value = result.rows;
      } catch (error) {
        console.error('加载水质监测统计数据失败:', error);
        allRows.value = [];
        filteredRows.value = [];
      }
    };

    onMounted(() => {
      window.addEventListener(WATER_QUALITY_FILTER_EVENT, handleFilterChange);
      loadInitialData();
    });

    onUnmounted(() => {
      window.removeEventListener(WATER_QUALITY_FILTER_EVENT, handleFilterChange);
    });

    return {
      kpiCards,
      stats,
      gradeChartOption,
      trendChartOption,
    };
  },
});
</script>

<style lang="scss" scoped>
.left-container {
  color: #d9edff;

  .row-content {
    display: flex;
  }

  .traffic-data {
    @include Padding(16, 0, 0, 0);
    width: 100%;

    .row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      row-gap: 18px;
      column-gap: 20px;
    }

    .traffic-item {
      display: flex;
      align-items: center;
      min-width: 0;
    }

    .traffic-content {
      display: flex;
      flex-direction: column;
      min-width: 0;
      @include MarginLeft(11);
    }

    .label {
      @include FontSize(14);
      color: #ffffff;
      @include MarginBottom(5);
      white-space: nowrap;
    }

    .value {
      @include FontSize(26);
      display: flex;
      align-items: flex-end;
      font-family: Tencent, serif;
      line-height: 1;
    }

    .suffix {
      @include FontSize(16);
      color: #93c0ec;
      @include MarginLeft(10);
      font-family: Oppo, serif;
      line-height: 1;
    }
  }

  .lease-title {
    @include MarginTop(16);
  }

  .chart-row {
    width: 100%;
  }
}
</style>
