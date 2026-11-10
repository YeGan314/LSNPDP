<template>
  <div class="left-container">
    <lease-title :rightbox="false">
      综合统计概览
      <template v-slot:slot-bottom>Personnel accounted</template>
    </lease-title>

    <div class="row-content">
      <div class="traffic-data">
        <div class="row">
          <div class="traffic-item">
            <icon-box height="34" width="34">
              <img src="@/assets/bigScreen/home/icon_things@2x.png" />
            </icon-box>
            <div class="traffic-content">
              <div class="label">指标总数</div>
              <div class="value">{{ indicatorTotal }}<div class="suffix">个</div></div>
            </div>
          </div>
          <div class="traffic-item">
            <icon-box height="41" width="41">
              <img src="@/assets/bigScreen/home/icon_health@2x.png" />
            </icon-box>
            <div class="traffic-content">
              <div class="label">周边企业</div>
              <div class="value">{{ enterpriseTotal }}<div class="suffix">个</div></div>
            </div>
          </div>
          <div class="traffic-item">
            <icon-box height="34" width="34">
              <img src="@/assets/bigScreen/home/icon_alarm@2x.png" />
            </icon-box>
            <div class="traffic-content">
              <div class="label">监测断面</div>
              <div class="value">{{ sectionTotal }}<div class="suffix">个</div></div>
            </div>
          </div>
          <div class="traffic-item">
            <icon-box height="34" width="34">
              <img src="@/assets/bigScreen/home/icon_accident@2x.png" />
            </icon-box>
            <div class="traffic-content">
              <div class="label">异常指标</div>
              <div class="value">{{ abnormalTotal }}<div class="suffix">个</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row-content overview-chart-row">
      <box height="220" width="330">
        <sub-title title-text="异常指标占比"></sub-title>
        <v3-echarts :options="abnormalRatioOption" :height="180" />
      </box>
      <box height="220" width="400">
        <sub-title title-text="超标监测"></sub-title>
        <v3-echarts :options="abnormalTrendOption" :height="180" />
      </box>
    </div>

    <lease-title class="lease-title" :rightbox="false">监测数据统计</lease-title>
    <div class="row-content">
      <box height="230" width="730">
        <v3-echarts :options="monitoringBarOption" :height="180" />
      </box>
    </div>

    <lease-title icon="nenghaoqushi" :rightbox="false">异常指标概览</lease-title>
    <box width="730" height="360">
      <div class="table-box">
        <div class="table-head">
          <div class="head-item col-site">监测断面</div>
          <div class="head-item col-date">监测日期</div>
          <div class="head-item col-type">指标类型</div>
          <div class="head-item col-value">检测值</div>
        </div>
        <div class="table-body" ref="tableBodyRef" @mouseenter="handleTableMouseEnter" @mouseleave="handleTableMouseLeave">
          <div class="table-body-warp1">
            <div class="row" v-for="(item, index) in tableList" :key="`${item.id}-${index}`">
              <div class="col col-site" :title="item.name">{{ item.name }}</div>
              <div class="col col-date">{{ item.local }}</div>
              <div class="col col-type" :title="item.time">{{ item.time }}</div>
              <div class="col col-value value-col" :class="valueClass(item.value)">{{ item.value }}</div>
            </div>
          </div>
        </div>
      </div>
    </box>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import LeaseTitle from '@/components/bigScreen/Lease_title/index-page.vue';
import V3Echarts from '@/components/bigScreen/V3Echarts/index-page.vue';
import {
  option6,
  option1,
  option,
  option3,
  option4,
  option9,
  option10,
  option12,
  option13,
} from './chartOpt/index.js';
import IconBox from '@/components/bigScreen/IconBox/index-page.vue';
import { getGeoServerLayers } from '@/utils/geoserver-helper';
import { GEOSERVER_CONFIG } from '@/config/geoserver.config';
import Box from '@/components/bigScreen/Box/index-page.vue';
import SubTitle from '@/components/bigScreen/SubTitle/SubTitle.vue';

const POLLUTANT_FIELD_NAME_MAP = {
  sdz: '磺胺嘧啶', stz: '磺胺噻唑', spd: '磺胺吡啶', smd: '磺胺甲嘧啶', sdd: '磺胺二甲嘧啶',
  smm: '磺胺甲噁唑', smtz: '磺胺二甲氧嘧啶', smp: '磺胺甲氧嘧啶', scp: '磺胺氯哒嗪', smx: '磺胺甲噁唑',
  enr: '恩诺沙星', nor: '诺氟沙星', cip: '环丙沙星', ofl: '氧氟沙星', sar: '沙拉沙星',
  eno: '依诺沙星', lom: '洛美沙星', nal: '萘啶酸', flm: '氟甲喹', cin: '西诺沙星', spa: '司帕沙星',
  otc: '土霉素', tet: '四环素', ctc: '金霉素', rox: '罗红霉素', ery: '红霉素',
  lin: '林可霉素', cli: '克林霉素', cla: '克拉霉素', azi: '阿奇霉素', ctx: '头孢噻肟', cap: '氯霉素', ff: '氟苯尼考',
  bisphenolA: '双酚A',
  tbutylph: '叔丁基苯酚',
  butylph: '丁基苯酚',
  pentylph: '戊基苯酚',
  hexylph: '己基苯酚',
  toctylph: '叔辛基苯酚',
  heptylph: '庚基苯酚',
  bnonylph: '支链壬基苯酚',
  octylph: '辛基苯酚',
  nonylph: '壬基苯酚',
};

const MON_DATE_LABEL_MAP = {
  '2025-09-01': '9月',
  '2025-10-01': '10月',
  '2025-11-10': '11月上旬',
  '2025-11-20': '11月下旬',
  '2025-12-10': '12月上旬',
  '2025-12-20': '12月下旬',
};

const COMPOSITE_POLLUTANT_CODE = '__composite__';

const formatMonDateNodeLabel = (monDate) => {
  const text = String(monDate || '');
  if (MON_DATE_LABEL_MAP[text]) return MON_DATE_LABEL_MAP[text];
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return text;
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (day === 1) return `${month}月`;
  if (day === 10) return `${month}月上旬`;
  if (day === 20) return `${month}月下旬`;
  return `${month}月${day}日`;
};

export default defineComponent({
  components: { LeaseTitle, V3Echarts, IconBox, Box, SubTitle },
  setup() {
    const tableList = ref([]);
    const indicatorTotal = ref(0);
    const enterpriseTotal = ref(0);
    const sectionTotal = ref(0);
    const abnormalTotal = ref(0);
    const monitoringBarOption = ref({});
    const abnormalTrendData = ref({ dates: [], counts: [] });
    const tableBodyRef = ref(null);
    const allFeatures = ref([]);
    const tableHovering = ref(false);
    const selectedFilter = ref({
      pollutantCode: '',
      pollutantName: '',
      monDate: '',
      monMonth: '',
      siteName: '',
      siteFocused: false,
    });
    let autoScrollTimer = null;

    const normalizeMonDate = (value) => {
      if (!value) return '';
      const text = String(value).trim();
      const match = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
      if (!match) {
        const cnMatch = text.match(/^(\d{4})年\s*(\d{1,2})月\s*(上旬|下旬)?/);
        if (!cnMatch) return text;
        const day = cnMatch[3] === '上旬' ? 10 : cnMatch[3] === '下旬' ? 20 : 1;
        return `${cnMatch[1]}-${String(Number(cnMatch[2])).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
      return `${match[1]}-${String(Number(match[2])).padStart(2, '0')}-${String(Number(match[3])).padStart(2, '0')}`;
    };

    const toSiteName = (properties = {}) =>
      properties.site_name || properties.siteName || properties.station_name || properties.station || properties.name || '-';

    const toNumber = (value) => {
      if (value === null || value === undefined || String(value).trim() === '') return null;
      const num = Number(value);
      return Number.isFinite(num) ? num : null;
    };

    const getPropertyValue = (properties = {}, field = '') => {
      if (!field) return undefined;
      const candidates = [field, String(field).toUpperCase(), String(field).toLowerCase()];
      for (const candidate of candidates) {
        if (Object.prototype.hasOwnProperty.call(properties, candidate)) return properties[candidate];
      }
      const matchedKey = Object.keys(properties).find((key) => key.toLowerCase() === String(field).toLowerCase());
      return matchedKey ? properties[matchedKey] : undefined;
    };

    const clamp01 = (value) => Math.max(0, Math.min(1, value));

    const interpolateHexColor = (start, end, ratio) => {
      const t = clamp01(ratio);
      const rgb = start.map((value, index) => Math.round(value + (end[index] - value) * t));
      return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    };

    const getBarRiskColor = (value, minValue, maxValue) => {
      const num = Number(value);
      if (!Number.isFinite(num) || maxValue <= minValue) return '#22c55e';
      const ratio = Math.pow(clamp01((num - minValue) / (maxValue - minValue)), 0.72);
      if (ratio <= 0.5) return interpolateHexColor([34, 197, 94], [250, 204, 21], ratio / 0.5);
      return interpolateHexColor([250, 204, 21], [239, 68, 68], (ratio - 0.5) / 0.5);
    };

    const countMonitorSections = (features = []) => {
      const sectionNames = new Set();
      features.forEach((feature) => {
        const siteName = String(toSiteName(feature?.properties || {}) || '').trim();
        if (!siteName || siteName === '-' || siteName.startsWith('平行-')) return;
        sectionNames.add(siteName);
      });
      return sectionNames.size;
    };

    const buildIndicatorRows = (features = [], targetMonth = '', pollutantField = '') => {
      const rows = [];
      features.forEach((feature, featureIndex) => {
        const props = feature?.properties || {};
        const monitorDate = normalizeMonDate(props.mon_date || props.monitor_date || props.date || '');
        if (targetMonth && (!monitorDate || !monitorDate.startsWith(targetMonth))) return;
        const siteName = toSiteName(props);

        Object.entries(POLLUTANT_FIELD_NAME_MAP).forEach(([field, label]) => {
          if (pollutantField && field !== pollutantField) return;
          const numericValue = toNumber(getPropertyValue(props, field));
          if (numericValue === null) return;
          rows.push({
            id: `${featureIndex}-${field}`,
            featureIndex,
            field,
            numericValue,
            name: siteName,
            local: monitorDate,
            time: label,
            value: `${numericValue}`,
          });
        });
      });
      return rows;
    };

    const filterFeaturesBySite = (features = []) => {
      const targetSiteName = String(selectedFilter.value?.siteName || '').trim();
      const siteFocused = Boolean(selectedFilter.value?.siteFocused && targetSiteName);

      return features.filter((feature) => {
        const props = feature?.properties || {};
        if (siteFocused && toSiteName(props) !== targetSiteName) return false;
        return true;
      });
    };

    const filterFeaturesByMonDate = (features = []) => {
      const targetMonDate = normalizeMonDate(selectedFilter.value?.monDate || '');
      if (!targetMonDate) return features;

      return features.filter((feature) => {
        const props = feature?.properties || {};
        const monitorDate = normalizeMonDate(props.mon_date || props.monitor_date || props.date || '');
        return monitorDate === targetMonDate;
      });
    };

    const buildYczbStats = (features = [], targetMonth = '') => {
      const dateCountMap = new Map();
      const total = features.reduce((sum, feature) => {
        const props = feature?.properties || {};
        const monitorDate = normalizeMonDate(props.mon_date || props.monitor_date || props.date || '');
        if (targetMonth && (!monitorDate || !monitorDate.startsWith(targetMonth))) return sum;
        const yczb = toNumber(props.yczb ?? props.YCZB) || 0;
        if (monitorDate && yczb > 0) dateCountMap.set(monitorDate, (dateCountMap.get(monitorDate) || 0) + yczb);
        return sum + yczb;
      }, 0);
      const dates = Array.from(dateCountMap.keys()).sort();
      return {
        total,
        dates,
        counts: dates.map((date) => dateCountMap.get(date) || 0),
      };
    };

    const buildYczbRowsBySite = (features = []) => {
      const siteValueMap = new Map();
      features.forEach((feature) => {
        const props = feature?.properties || {};
        const siteName = toSiteName(props);
        const yczb = toNumber(props.yczb ?? props.YCZB) || 0;
        siteValueMap.set(siteName, (siteValueMap.get(siteName) || 0) + yczb);
      });
      return Array.from(siteValueMap.entries())
        .filter(([siteName]) => siteName && siteName !== '-')
        .map(([siteName, value]) => ({ siteName, value }));
    };

    const buildYczbRowsByDate = (features = []) => {
      const dateValueMap = new Map();
      features.forEach((feature) => {
        const props = feature?.properties || {};
        const monitorDate = normalizeMonDate(props.mon_date || props.monitor_date || props.date || '');
        if (!monitorDate) return;
        const yczb = toNumber(props.yczb ?? props.YCZB) || 0;
        dateValueMap.set(monitorDate, (dateValueMap.get(monitorDate) || 0) + yczb);
      });
      return Array.from(dateValueMap.entries())
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .map(([date, value]) => ({ date, value }));
    };

    const findLayer = (layers = [], layerName = '') => layers.find((item) => {
      const name = item?.name || '';
      return name === layerName || name.endsWith(`:${layerName}`);
    });

    const fetchLayerFeatures = async (layer, defaultWorkspace = GEOSERVER_CONFIG.workspace) => {
      if (!layer) return [];
      const fullName = layer.name.includes(':') ? layer.name : `${layer.workspace || defaultWorkspace}:${layer.name}`;
      const workspace = fullName.split(':')[0];
      const requestUrl =
        `${GEOSERVER_CONFIG.baseUrl}/${workspace}/ows?service=WFS&version=1.0.0&request=GetFeature` +
        `&typeName=${encodeURIComponent(fullName)}` +
        `&outputFormat=${encodeURIComponent('application/json')}` +
        `&srsName=EPSG:4326`;

      const response = await fetch(requestUrl);
      if (!response.ok) throw new Error(`WFS request failed: ${response.status}`);

      const geojson = await response.json();
      return Array.isArray(geojson?.features) ? geojson.features : [];
    };

    const abnormalRatioOption = computed(() => {
      const ratio = indicatorTotal.value > 0 ? (abnormalTotal.value / indicatorTotal.value) * 100 : 0;
      const abnormalPercent = Number(ratio.toFixed(1));
      const normalPercent = Number(Math.max(0, 100 - abnormalPercent).toFixed(1));

      return {
        title: [
          {
            text: '异常',
            x: '13%',
            top: '50%',
            textStyle: {
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: '100',
            },
          },
          {
            text: `${abnormalPercent}%`,
            x: '11%',
            y: '35%',
            textStyle: {
              fontSize: '18',
              color: '#FFFFFF',
              fontFamily: 'DINAlternate-Bold, DINAlternate',
              fontWeight: '600',
            },
          },
        ],
        tooltip: {
          trigger: 'item',
          formatter: ({ seriesName, value }) => `${seriesName}: ${value}%`,
        },
        polar: {
          radius: ['42%', '52%'],
          center: ['23%', '50%'],
        },
        angleAxis: {
          max: 100,
          show: false,
        },
        radiusAxis: {
          type: 'category',
          show: true,
          axisLabel: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
        },
        legend: {
          data: ['正常', '异常'],
          right: '5%',
          top: 'center',
          textStyle: { color: '#ccc' },
          orient: 'vertical',
          selectedMode: false,
          itemGap: 30,
        },
        series: [
          {
            name: '正常',
            type: 'bar',
            roundCap: true,
            barWidth: 30,
            showBackground: true,
            backgroundStyle: { color: 'rgba(66, 66, 66, .3)' },
            data: [normalPercent],
            coordinateSystem: 'polar',
            itemStyle: {
              color: 'rgba(66, 66, 66, .8)',
            },
          },
          {
            name: '异常',
            type: 'bar',
            roundCap: true,
            barWidth: 30,
            showBackground: true,
            backgroundStyle: { color: 'rgba(66, 66, 66, .3)' },
            data: [abnormalPercent],
            coordinateSystem: 'polar',
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 1,
                x2: 0,
                y2: 0,
                colorStops: [
                  { offset: 0, color: '#16CEB9' },
                  { offset: 1, color: '#6648FF' },
                ],
              },
            },
          },
          {
            name: '',
            type: 'pie',
            startAngle: 80,
            radius: ['56%'],
            hoverAnimation: false,
            center: ['23%', '50%'],
            itemStyle: {
              color: 'rgba(66, 66, 66, .1)',
              borderWidth: 1,
              borderColor: '#5269EE',
            },
            data: [30],
          },
          {
            name: '',
            type: 'pie',
            startAngle: 80,
            radius: ['38%'],
            hoverAnimation: false,
            center: ['23%', '50%'],
            itemStyle: {
              color: 'rgba(66, 66, 66, .1)',
              borderWidth: 1,
              borderColor: '#5269EE',
            },
            data: [100],
          },
        ],
      };
    });

    const abnormalTrendOption = computed(() => ({
      grid: {
        left: '6%',
        right: '3%',
        top: '6%',
        bottom: '18%',
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line',
          lineStyle: { color: 'rgba(50, 216, 205, 1)' },
        },
        formatter: (params = []) => {
          const item = params[0] || {};
          return `${item.axisValue || ''}<br/>异常指标数：${item.value || 0}`;
        },
      },
      xAxis: [
        {
          type: 'category',
          boundaryGap: true,
          axisLine: { show: false },
          axisLabel: {
            color: '#A1A7B3',
            fontSize: 10,
            interval: 0,
            rotate: 90,
            margin: 12,
            formatter: (value) => {
              const text = String(value || '');
              return formatMonDateNodeLabel(text);
            },
          },
          splitLine: { show: false },
          axisTick: { show: false },
          data: abnormalTrendData.value.dates,
        },
      ],
      yAxis: [
        {
          type: 'value',
          name: '',
          minInterval: 1,
          splitLine: {
            show: false,
            lineStyle: {
              color: 'rgba(70, 171, 208, 0.4)',
              type: 'dashed',
            },
          },
          axisLine: { show: false },
          splitArea: {
            show: true,
            areaStyle: {
              color: ['rgba(250,250,250,0.0)', 'rgba(250,250,250,0.1)'].reverse(),
            },
          },
          axisLabel: {
            show: true,
            margin: 10,
            color: '#A1A7B3',
          },
          axisTick: { show: false },
        },
      ],
      series: [
        {
          name: '异常指标数',
          type: 'line',
          symbolSize: 7,
          smooth: false,
          itemStyle: {
            color: 'rgba(10, 135, 243, 1)',
          },
          lineStyle: {
            color: 'rgba(10, 135, 243, 1)',
            width: 3,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(10, 135, 243, 0.4)' },
                { offset: 1, color: 'rgba(23, 66, 122, 0.1)' },
              ],
            },
          },
          data: abnormalTrendData.value.counts,
        },
      ],
    }));

    const buildBarOption = (xData = [], yData = [], pollutantLabel = '') => {
      const numericValues = yData.map((item) => Number(item)).filter((item) => Number.isFinite(item));
      const minValue = numericValues.length ? Math.min(...numericValues) : 0;
      const maxValue = numericValues.length ? Math.max(...numericValues) : 1;

      return {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
        },
        grid: {
          top: '10%',
          left: '8%',
          right: '5%',
          bottom: '16%',
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          data: xData,
          axisLabel: {
            color: '#d7e8ff',
            interval: 0,
            rotate: 20,
            fontSize: 11,
            formatter: (value) => {
              const text = String(value || '');
              return text.length > 5 ? `${text.slice(0, 5)}…` : text;
            },
          },
          axisLine: { lineStyle: { color: 'rgba(170, 205, 235, 0.5)' } },
          axisTick: { show: false },
        },
        yAxis: {
          type: 'value',
          name: pollutantLabel ? `${pollutantLabel}(监测值)` : '监测值',
          nameTextStyle: { color: '#d7e8ff', fontSize: 11, padding: [0, 0, 0, -10] },
          axisLabel: { color: '#d7e8ff', fontSize: 11 },
          splitLine: { lineStyle: { color: 'rgba(170, 205, 235, 0.18)' } },
        },
        series: [
          {
            type: 'bar',
            data: yData.map((value) => ({
              value,
              itemStyle: {
                color: getBarRiskColor(value, minValue, maxValue),
              },
            })),
            barWidth: 12,
            label: {
              show: true,
              position: 'top',
              color: '#e8f5ff',
              fontSize: 10,
            },
          },
        ],
      };
    };

    const stopAutoScroll = () => {
      if (autoScrollTimer) {
        clearInterval(autoScrollTimer);
        autoScrollTimer = null;
      }
    };

    const startAutoScroll = async () => {
      stopAutoScroll();
      await nextTick();
      if (tableHovering.value) return;
      const body = tableBodyRef.value;
      if (!body || body.scrollHeight <= body.clientHeight) return;
      autoScrollTimer = setInterval(() => {
        const el = tableBodyRef.value;
        if (!el) return;
        const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
        el.scrollTop = atBottom ? 0 : el.scrollTop + 0.5;
      }, 120);
    };

    const handleTableMouseEnter = () => {
      tableHovering.value = true;
      stopAutoScroll();
    };

    const handleTableMouseLeave = () => {
      tableHovering.value = false;
      startAutoScroll();
    };

    const rebuildTableByFilter = async () => {
      const features = allFeatures.value || [];
      const pollutantCode = String(selectedFilter.value?.pollutantCode || '').trim().toLowerCase();
      const isCompositePollutant = pollutantCode === COMPOSITE_POLLUTANT_CODE;
      const pollutantField = isCompositePollutant ? '' : pollutantCode || '';
      const pollutantLabel = POLLUTANT_FIELD_NAME_MAP[pollutantField] || selectedFilter.value?.pollutantName || '';
      const siteFilteredFeatures = filterFeaturesBySite(features);
      const overviewFeatures = filterFeaturesByMonDate(siteFilteredFeatures);
      const overviewIndicatorRows = buildIndicatorRows(overviewFeatures);
      const displayAllIndicatorRows = buildIndicatorRows(overviewFeatures);
      const displayIndicatorRows = pollutantField ? buildIndicatorRows(overviewFeatures, '', pollutantField) : displayAllIndicatorRows;
      const chartFeatures = pollutantField && !selectedFilter.value?.siteFocused
        ? filterFeaturesByMonDate(overviewFeatures)
        : overviewFeatures;
      const chartIndicatorRows = pollutantField ? buildIndicatorRows(chartFeatures, '', pollutantField) : [];
      const yczbStats = buildYczbStats(overviewFeatures);
      const trendYczbStats = buildYczbStats(siteFilteredFeatures);
      indicatorTotal.value = overviewIndicatorRows.length;
      sectionTotal.value = countMonitorSections(overviewFeatures);
      abnormalTotal.value = yczbStats.total;
      abnormalTrendData.value = {
        dates: trendYczbStats.dates,
        counts: trendYczbStats.counts,
      };

      tableList.value = displayIndicatorRows;
      if (isCompositePollutant) {
        if (selectedFilter.value?.siteFocused) {
          const yczbRows = buildYczbRowsByDate(overviewFeatures);
          monitoringBarOption.value = buildBarOption(
            yczbRows.map((row) => formatMonDateNodeLabel(row.date)),
            yczbRows.map((row) => Number(row.value.toFixed(2))),
            selectedFilter.value?.pollutantName || '综合指数'
          );
        } else {
          const yczbRows = buildYczbRowsBySite(filterFeaturesByMonDate(overviewFeatures));
          monitoringBarOption.value = buildBarOption(
            yczbRows.map((row) => row.siteName),
            yczbRows.map((row) => Number(row.value.toFixed(2))),
            selectedFilter.value?.pollutantName || '综合指数'
          );
        }
      } else if (pollutantField) {
        const xData = [];
        const yData = [];

        if (selectedFilter.value?.siteFocused) {
          const dateValueMap = new Map();
          chartIndicatorRows.forEach((row) => {
            if (!row.local) return;
            dateValueMap.set(row.local, row.numericValue);
          });
          Array.from(dateValueMap.keys()).sort().forEach((date) => {
            xData.push(formatMonDateNodeLabel(date));
            yData.push(dateValueMap.get(date));
          });
        } else {
          const siteValueMap = new Map();
          chartIndicatorRows.forEach((row) => {
            siteValueMap.set(row.name, row.numericValue);
          });
          xData.push(...Array.from(siteValueMap.keys()));
          yData.push(...xData.map((site) => siteValueMap.get(site)));
        }

        monitoringBarOption.value = buildBarOption(xData, yData, pollutantLabel);
      } else {
        monitoringBarOption.value = buildBarOption([], [], '');
      }
      await startAutoScroll();
    };

    const loadData = async () => {
      try {
        const layers = await getGeoServerLayers();
        const monitorLayer = findLayer(layers, 'cz_xwrw_data');
        if (!monitorLayer) {
          tableList.value = [];
          indicatorTotal.value = 0;
          sectionTotal.value = 0;
          abnormalTotal.value = 0;
          abnormalTrendData.value = { dates: [], counts: [] };
        } else {
          allFeatures.value = await fetchLayerFeatures(monitorLayer);
          sectionTotal.value = countMonitorSections(allFeatures.value);
          await rebuildTableByFilter();
        }

        const enterpriseLayer = findLayer(layers, 'zbqy');
        enterpriseTotal.value = enterpriseLayer ? (await fetchLayerFeatures(enterpriseLayer)).length : 0;
      } catch (error) {
        console.error('load overview data error:', error);
        tableList.value = [];
        indicatorTotal.value = 0;
        sectionTotal.value = 0;
        abnormalTotal.value = 0;
        abnormalTrendData.value = { dates: [], counts: [] };
        enterpriseTotal.value = 0;
      }
    };

    const handleHeadBarClick = (item) => { item; };
    const handleClose = () => {};
    const valueClass = (value) => {
      const num = Number(value);
      if (!Number.isFinite(num)) return 'value-cyan';
      if (num >= 2) return 'value-red';
      if (num >= 1) return 'value-yellow';
      return 'value-cyan';
    };

    const handleFilterChange = async (event) => {
      const detail = event?.detail || {};
      selectedFilter.value = {
        pollutantCode: String(detail.pollutantCode || ''),
        pollutantName: String(detail.pollutantName || ''),
        monDate: String(detail.monDate || ''),
        monMonth: String(detail.monMonth || ''),
        siteName: String(detail.siteName || ''),
        siteFocused: Boolean(detail.siteFocused),
      };
      await rebuildTableByFilter();
    };

    onMounted(() => {
      window.addEventListener('yewu2-filter-change', handleFilterChange);
      loadData();
    });
    onUnmounted(() => {
      window.removeEventListener('yewu2-filter-change', handleFilterChange);
      stopAutoScroll();
    });

    return {
      option6, option1, option, option3, option4, option9, option10, option12, option13,
      indicatorTotal, enterpriseTotal, sectionTotal, abnormalTotal, abnormalRatioOption, abnormalTrendOption, monitoringBarOption,
      handleHeadBarClick, handleClose, handleTableMouseEnter, handleTableMouseLeave, tableList, tableBodyRef, valueClass,
    };
  },
});
</script>

<style lang="scss" scoped>
.left-container {
  .row-content {
    display: flex;

    .traffic-data {
      @include Padding(16, 0, 0, 0);
      width: 100%;

      .row {
        display: flex;

        .traffic-item {
          display: flex;
          @include MarginRight(29);
          flex: 1;

          &:last-child { margin-right: 0; }

          .traffic-content {
            display: flex;
            flex-direction: column;
            @include MarginLeft(11);

            .label { @include FontSize(14); color: #ffffff; @include MarginBottom(5); }

            .value {
              @include FontSize(26);
              color: #ffce7f;
              display: flex;
              font-family: Tencent, serif;

              .suffix {
                @include FontSize(16);
                align-self: flex-end;
                color: #93c0ec;
                @include MarginLeft(12.7);
                font-family: Oppo, serif;
              }
            }
          }
        }
      }
    }

  }

  .lease-title { @include MarginTop(20); }

  .overview-chart-row {
    justify-content: space-between;
  }

  .table-box {
    width: 100%;
    @include wHeight(300);
    display: flex;
    flex-direction: column;
    @include FontSize(14);
    box-sizing: border-box;
    @include Padding(12, 28, 0, 28);
    background: rgba(0, 0, 0, 0.08);

    .table-head {
      @include wHeight(36);
      display: grid;
      grid-template-columns: 30% 20% 30% 20%;
      background: rgba(175, 185, 198, 0.24);
      @include LineHeight(36);

      .head-item {
        text-align: center;
        color: rgba(236, 243, 251, 1);
        @include FontSize(14);
        font-weight: 700;
        letter-spacing: 0.2px;
      }
    }

    .table-body {
      flex: 1;
      overflow-y: auto;
      @include FontSize(13);
      scrollbar-width: none;
      -ms-overflow-style: none;

      &::-webkit-scrollbar { width: 0; height: 0; }

      &:hover {
        scrollbar-width: thin;
        scrollbar-color: rgba(126, 200, 255, 0.7) rgba(20, 50, 78, 0.35);
        -ms-overflow-style: auto;
      }

      &:hover::-webkit-scrollbar {
        width: 6px;
      }

      &:hover::-webkit-scrollbar-track {
        background: rgba(20, 50, 78, 0.35);
        border-radius: 4px;
      }

      &:hover::-webkit-scrollbar-thumb {
        background: rgba(126, 200, 255, 0.7);
        border-radius: 4px;
      }

      .row {
        display: grid;
        grid-template-columns: 30% 20% 30% 20%;
        width: 100%;
        @include Padding(10, 0, 10, 0);
        box-sizing: border-box;
        color: rgba(231, 239, 248, 1);
        @include FontSize(13);
        line-height: 1.5;

        .col {
          text-align: center;
          @include FontSize(13);
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          @include Padding(0, 6, 0, 6);
          box-sizing: border-box;
        }

        .col-site {
          white-space: nowrap;
          text-align: center;
          @include Padding(0, 6, 0, 6);
        }

        .value-col {
          font-weight: 700;
          opacity: 1;
        }

        &:nth-child(odd) {
          background: rgba(170, 180, 194, 0.16);
        }

        &:nth-child(even) {
          background: rgba(120, 136, 158, 0.12);
        }
      }

      .value-yellow {
        color: #ffcc6f;
        opacity: 1;
      }

      .value-cyan {
        color: #63d1d8;
        opacity: 1;
      }

      .value-red {
        color: #ff8a95;
        opacity: 1;
      }
    }
  }
}
</style>
