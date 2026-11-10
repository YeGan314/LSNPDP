<template>
  <div class="right-container">
    <lease-title icon="tingchechang" :rightbox="false">水质监测筛选</lease-title>

    <div class="row-content">
      <box width="700" height="180">
        <div class="filter-section">
          <div class="month-range-row">
            <label class="month-select">
              <span>起始年月</span>
              <select
                :value="filter.monitorStartMonth"
                @change="updateMonitorRange('monitorStartMonth', $event.target.value)"
              >
                <option value="">全部</option>
                <option v-for="month in monitorMonthOptions" :key="`start-${month}`" :value="month">
                  {{ formatMonitorMonth(month) }}
                </option>
              </select>
            </label>
            <span class="range-separator">至</span>
            <label class="month-select">
              <span>结束年月</span>
              <select
                :value="filter.monitorEndMonth"
                @change="updateMonitorRange('monitorEndMonth', $event.target.value)"
              >
                <option value="">全部</option>
                <option v-for="month in monitorMonthOptions" :key="`end-${month}`" :value="month">
                  {{ formatMonitorMonth(month) }}
                </option>
              </select>
            </label>
          </div>
          <div class="section-title">水质级别</div>
          <div class="chip-row compact-row">
            <button
              type="button"
              class="chip"
              :class="{ active: filter.grade === '' }"
              @click="selectGrade('')"
            >
              全部
            </button>
            <button
              v-for="item in gradeOptions"
              :key="item.grade"
              type="button"
              class="chip"
              :class="{ active: filter.grade === item.grade }"
              :style="{ '--chip-color': item.color }"
              @click="selectGrade(item.grade)"
            >
              {{ item.label }}
            </button>
          </div>
        </div>
      </box>
    </div>

    <lease-title :rightbox="false">污染类型</lease-title>
    <div class="row-content">
      <box width="700" height="320">
        <div class="chip-row pollutant-row">
          <button
            type="button"
            class="chip"
            :class="{ active: filter.pollutantCode === '' }"
            @click="selectPollutant('', '')"
          >
            全部
          </button>
          <button
            v-for="item in pollutantOptions"
            :key="item.code"
            type="button"
            class="chip"
            :class="{ active: filter.pollutantCode === item.code }"
            @click="selectPollutant(item.code, item.label)"
          >
            {{ item.label }}
          </button>
          <div v-if="!loading && pollutantOptions.length === 0" class="empty-text">暂无污染类型</div>
        </div>
      </box>
    </div>

    <lease-title :rightbox="false">监测点位</lease-title>
    <div class="row-content">
      <box width="700" height="360">
        <div class="site-list">
          <div class="site-item" :class="{ active: filter.siteName === '' }" @click="selectSite('')">
            <span>全部点位</span>
            <b>{{ allRows.length }}</b>
          </div>
          <div
            v-for="item in siteOptions"
            :key="item.name"
            class="site-item"
            :class="{ active: filter.siteName === item.name }"
            @click="selectSite(item.name)"
          >
            <span :title="item.name">{{ item.name }}</span>
            <em :style="{ color: item.gradeColor }">{{ item.gradeLabel }}</em>
          </div>
          <div v-if="!loading && siteOptions.length === 0" class="empty-text list-empty">暂无监测点位</div>
          <div v-if="loading" class="empty-text list-empty">数据加载中...</div>
        </div>
      </box>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed, onMounted, onUnmounted, reactive, ref, shallowRef } from 'vue';
import LeaseTitle from '@/components/bigScreen/Lease_title/index-page.vue';
import Box from '@/components/bigScreen/Box/index-page.vue';
import {
  ALL_VALUE,
  POLLUTANT_TYPE_CANDIDATES,
  WATER_GRADE_META,
  WATER_GRADE_ORDER,
  WATER_QUALITY_FILTER_EVENT,
  WATER_QUALITY_LAYER_KEY,
  WATER_QUALITY_SELECTED_EVENT,
  createDefaultWaterQualityFilter,
  fetchWaterQualityFeatures,
  filterWaterQualityRows,
  normalizeWaterQualityMonthRange,
} from '../water-quality-data';

export default defineComponent({
  components: { LeaseTitle, Box },
  setup() {
    const allRows = shallowRef([]);
    const filter = reactive(createDefaultWaterQualityFilter());
    const loading = ref(false);

    const gradeOptions = WATER_GRADE_ORDER.filter((grade) => grade !== '无数据').map((grade) => ({
      grade,
      label: WATER_GRADE_META[grade].label,
      color: WATER_GRADE_META[grade].color,
    }));

    const monitorMonthOptions = computed(() => Array.from(new Set(
      allRows.value
        .map((row) => String(row.monitorMonth || row.monitorTime || '').slice(0, 7))
        .filter((month) => /^\d{4}-\d{2}$/.test(month))
    )).sort());

    const formatMonitorMonth = (month) => `${month.slice(0, 4)}年${Number(month.slice(5, 7))}月`;

    const pollutantOptions = computed(() => POLLUTANT_TYPE_CANDIDATES.filter((item) => (
      allRows.value.some((row) => {
        const pollutantValues = row.pollutantValues || {};
        return Object.prototype.hasOwnProperty.call(pollutantValues, item.code);
      })
    )));

    const siteOptions = computed(() => {
      const filtered = filterWaterQualityRows(allRows.value, { ...filter, siteName: ALL_VALUE });
      const map = new Map();
      filtered.forEach((row) => {
        if (!map.has(row.name)) map.set(row.name, row);
      });
      return Array.from(map.values()).sort((a, b) => a.gradeRank - b.gradeRank);
    });

    const getFilteredRows = () => filterWaterQualityRows(allRows.value, filter);

    const emitFilter = () => {
      window.dispatchEvent(new CustomEvent(WATER_QUALITY_FILTER_EVENT, {
        detail: {
          ...filter,
          rows: getFilteredRows(),
          allRows: allRows.value,
        },
      }));

      const api = window.__layerPanelApi;
      if (api?.updateWaterQualityStyle) api.updateWaterQualityStyle({ ...filter });
      if (api?.refreshWaterQualityLayer) api.refreshWaterQualityLayer();
    };

    const selectGrade = (grade) => {
      filter.grade = grade;
      emitFilter();
    };

    const updateMonitorRange = (field, value) => {
      filter.monitorDate = ALL_VALUE;
      filter.monitorYear = ALL_VALUE;
      filter.monitorMonth = ALL_VALUE;
      filter[field] = value;

      const normalizedRange = normalizeWaterQualityMonthRange(
        filter.monitorStartMonth,
        filter.monitorEndMonth
      );
      filter.monitorStartMonth = normalizedRange.monitorStartMonth;
      filter.monitorEndMonth = normalizedRange.monitorEndMonth;
      emitFilter();
    };

    const selectPollutant = (code, label) => {
      filter.pollutantCode = code;
      filter.pollutantName = label;
      emitFilter();
    };

    const selectSite = (siteName) => {
      filter.siteName = siteName;
      emitFilter();
    };

    const ensureWaterQualityLayer = async () => {
      const api = window.__layerPanelApi;
      if (!api?.setLayerCheckedByKey) return;
      await api.setLayerCheckedByKey(WATER_QUALITY_LAYER_KEY, true);
    };

    const loadData = async () => {
      loading.value = true;
      try {
        const result = await fetchWaterQualityFeatures();
        allRows.value = result.rows;
        emitFilter();
        await ensureWaterQualityLayer();
      } catch (error) {
        console.error('加载水质监测数据失败:', error);
        allRows.value = [];
        emitFilter();
      } finally {
        loading.value = false;
      }
    };

    const handleSelected = (event) => {
      const name = event?.detail?.name || '';
      if (!name) return;
      filter.siteName = name;
      emitFilter();
    };

    onMounted(() => {
      window.addEventListener(WATER_QUALITY_SELECTED_EVENT, handleSelected);
      loadData();
    });

    onUnmounted(() => {
      window.removeEventListener(WATER_QUALITY_SELECTED_EVENT, handleSelected);
    });

    return {
      allRows,
      filter,
      loading,
      gradeOptions,
      monitorMonthOptions,
      pollutantOptions,
      siteOptions,
      formatMonitorMonth,
      selectGrade,
      updateMonitorRange,
      selectPollutant,
      selectSite,
    };
  },
});
</script>

<style scoped lang="scss">
.right-container {
  --filter-control-font-size: 11px;

  .row-content {
    display: flex;
  }

  .filter-section {
    padding: 4px 10px;
  }

  .month-range-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 18px minmax(0, 1fr);
    align-items: end;
    gap: 5px;
    margin-bottom: 7px;
  }

  .month-select {
    min-width: 0;
    color: rgba(217, 237, 255, 0.72);
    font-size: var(--filter-control-font-size);
  }

  .month-select span {
    display: block;
    margin-bottom: 3px;
    white-space: nowrap;
  }

  .month-select select {
    width: 100%;
    height: 24px;
    padding: 0 20px 0 6px;
    border: 1px solid rgba(93, 183, 255, 0.35);
    border-radius: 4px;
    outline: none;
    background: rgba(8, 50, 91, 0.72);
    color: #d9edff;
    cursor: pointer;
    font-size: var(--filter-control-font-size);
  }

  .range-separator {
    height: 24px;
    color: rgba(217, 237, 255, 0.62);
    font-size: var(--filter-control-font-size);
    line-height: 24px;
    text-align: center;
  }

  .section-title {
    color: #d9edff;
    font-size: 12px;
    margin-bottom: 5px;
  }

  .chip-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px 8px;
    padding: 8px 10px;
    box-sizing: border-box;
  }

  .compact-row {
    padding: 0;
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .pollutant-row {
    max-height: 270px;
    overflow-y: auto;
    align-content: flex-start;
  }

  .chip {
    min-width: 0;
    width: 100%;
    height: 26px;
    padding: 0 5px;
    border: 1px solid rgba(93, 183, 255, 0.35);
    background: rgba(8, 50, 91, 0.58);
    color: #d9edff;
    cursor: pointer;
    border-radius: 4px;
    font-size: var(--filter-control-font-size);
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chip.active {
    color: #fff;
    border-color: var(--chip-color, #00eaff);
    background: rgba(0, 132, 204, 0.42);
    box-shadow: inset 0 0 16px rgba(0, 234, 255, 0.2);
  }

  .site-list {
    height: 320px;
    overflow-y: auto;
    padding: 8px 10px;
    box-sizing: border-box;
  }

  .site-item {
    height: 28px;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 8px;
    padding: 0 8px;
    margin-bottom: 4px;
    background: rgba(14, 55, 91, 0.42);
    border: 1px solid rgba(88, 166, 220, 0.16);
    color: #e8f5ff;
    cursor: pointer;
    font-size: var(--filter-control-font-size);
    box-sizing: border-box;
  }

  .site-item.active {
    border-color: rgba(0, 234, 255, 0.72);
    background: rgba(0, 132, 204, 0.34);
  }

  .site-item span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .site-item b,
  .site-item em {
    font-style: normal;
    font-weight: 700;
    white-space: nowrap;
  }

  .empty-text {
    color: rgba(217, 237, 255, 0.66);
    font-size: var(--filter-control-font-size);
    line-height: 28px;
  }

  .list-empty {
    padding: 8px;
    text-align: center;
  }

  .pollutant-row,
  .site-list {
    scrollbar-width: none;
  }

  .pollutant-row::-webkit-scrollbar,
  .site-list::-webkit-scrollbar {
    display: none;
  }
}
</style>
