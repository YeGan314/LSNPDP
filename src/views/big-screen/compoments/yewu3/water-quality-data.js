import { GEOSERVER_CONFIG } from '@/config/geoserver.config';
import { getGeoServerLayers } from '@/utils/geoserver-helper';

export const WATER_QUALITY_LAYER_KEY = 'cz_szjc_data';
export const WATER_QUALITY_FILTER_EVENT = 'yewu3-water-quality-filter-change';
export const WATER_QUALITY_SELECTED_EVENT = 'yewu3-water-quality-selected';

export const ALL_VALUE = '';

export const WATER_GRADE_ORDER = ['I', 'II', 'III', 'IV', 'V', '劣V', '无数据'];

export const WATER_GRADE_META = {
  I: { label: 'I类', color: '#2f80ff', rank: 1, status: 'normal' },
  II: { label: 'II类', color: '#00d5ff', rank: 2, status: 'normal' },
  III: { label: 'III类', color: '#31d17c', rank: 3, status: 'normal' },
  IV: { label: 'IV类', color: '#f4d44d', rank: 4, status: 'warning' },
  V: { label: 'V类', color: '#ff9f2f', rank: 5, status: 'warning' },
  劣V: { label: '劣V类', color: '#ff4b5c', rank: 6, status: 'alarm' },
  无数据: { label: '无数据', color: '#9aa8b8', rank: 99, status: 'offline' },
};

export const POLLUTANT_TYPE_CANDIDATES = [
  { code: 'cwqi', label: 'CWQI', fields: ['cwqi', 'CWQI'] },
  { code: 'ph', label: 'pH', fields: ['ph', 'PH'] },
  { code: 'do_mgl', label: '溶解氧', fields: ['do_mgl', 'DO_MGL', 'do_val', 'DO_VAL', 'do', 'DO', 'dissolved_oxygen'] },
  { code: 'perm_idx', label: '高锰酸盐指数', fields: ['perm_idx', 'PERM_IDX', 'codmn', 'CODMN'] },
  { code: 'cod', label: '化学需氧量', fields: ['cod', 'COD', 'codcr', 'CODCR'] },
  { code: 'bod5', label: '五日生化需氧量', fields: ['bod5', 'BOD5'] },
  { code: 'nh3_n', label: '氨氮', fields: ['nh3_n', 'NH3_N', 'nh3n', 'NH3N', 'ad', 'AD', 'ammonia_nitrogen'] },
  { code: 'tp', label: '总磷', fields: ['tp', 'TP', 'total_p', 'zonglin'] },
  { code: 'fluoride', label: '氟化物', fields: ['fluoride', 'FLUORIDE'] },
  { code: 'cyanide', label: '氰化物', fields: ['cyanide', 'CYANIDE'] },
  { code: 'v_phenol', label: '挥发酚', fields: ['v_phenol', 'V_PHENOL'] },
  { code: 'petroleum', label: '石油类', fields: ['petroleum', 'PETROLEUM'] },
  { code: 'an_surf', label: '阴离子表面活性剂', fields: ['an_surf', 'AN_SURF'] },
  { code: 'sulfide', label: '硫化物', fields: ['sulfide', 'SULFIDE'] },
  { code: 'cr6', label: '六价铬', fields: ['cr6', 'CR6'] },
  { code: 'mercury', label: '汞', fields: ['mercury', 'MERCURY'] },
  { code: 'arsenic', label: '砷', fields: ['arsenic', 'ARSENIC'] },
  { code: 'selenium', label: '硒', fields: ['selenium', 'SELENIUM'] },
  { code: 'copper', label: '铜', fields: ['copper', 'COPPER'] },
  { code: 'lead', label: '铅', fields: ['lead', 'LEAD'] },
  { code: 'zinc', label: '锌', fields: ['zinc', 'ZINC'] },
  { code: 'cadmium', label: '镉', fields: ['cadmium', 'CADMIUM'] },
];

const FIELD_CANDIDATES = {
  id: ['id', 'ID', 'fid', 'FID', 'objectid', 'OBJECTID'],
  name: ['site_name', 'siteName', 'station_name', 'station', 'point_name', 'POINT_NAME', 'sec_name', 'SEC_NAME', 'dmmc', 'DMMC', 'qxmc', 'QXMC', 'name', 'NAME', 'dm_name'],
  monitorTime: ['mon_time', 'MON_TIME', 'monitor_time', 'MONITOR_TIME', 'mon_date', 'MON_DATE', 'samp_date', 'SAMP_DATE', 'time', 'TIME', 'date', 'DATE'],
  grade: ['water_grade', 'WATER_GRADE', 'wq_grade', 'WQ_GRADE', 'wq_class', 'WQ_CLASS', 'wqclass', 'WQCLASS', 'quality_grade', 'QUALITY_GRADE', 'szlb', 'SZLB', 'waterlevel'],
  mainPollutant: ['main_pollutant', 'MAIN_POLLUTANT', 'pollutant', 'POLLUTANT', 'pollution_type', 'POLLUTION_TYPE', 'zywrw'],
  status: ['status', 'STATUS', 'state', 'STATE', 'warning_status', 'WARNING_STATUS'],
  district: ['district', 'DISTRICT', 'county', 'COUNTY', 'county_nm', 'COUNTY_NM', 'area', 'AREA', 'xzq', 'XZQ'],
  river: ['river', 'RIVER', 'river_name', 'RIVER_NAME', 'major_bsn', 'MAJOR_BSN', 'basin', 'BASIN', 'dly', 'DLY', 'ly', 'LY', 'hlmc', 'HLMC'],
  section: ['section', 'SECTION', 'section_name', 'SECTION_NAME', 'sec_name', 'SEC_NAME', 'dmmc', 'DMMC', 'dm_name', 'DM_NAME'],
};

export const getLayerKey = (layerName = '') => (
  String(layerName).includes(':') ? String(layerName).split(':').pop() : String(layerName)
);

export const getPropertyValue = (properties = {}, candidates = []) => {
  const keys = Object.keys(properties || {});
  for (const candidate of candidates) {
    if (Object.prototype.hasOwnProperty.call(properties, candidate)) return properties[candidate];
    const matched = keys.find((key) => key.toLowerCase() === String(candidate).toLowerCase());
    if (matched) return properties[matched];
  }
  return undefined;
};

export const normalizeMonitorDate = (value) => {
  if (!value) return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = `${value.getMonth() + 1}`.padStart(2, '0');
    const d = `${value.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const text = String(value).trim();
  const match = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (match) {
    return `${match[1]}-${String(Number(match[2])).padStart(2, '0')}-${String(Number(match[3])).padStart(2, '0')}`;
  }

  const cnMatch = text.match(/^(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})?/);
  if (cnMatch) {
    const day = cnMatch[3] ? Number(cnMatch[3]) : 1;
    return `${cnMatch[1]}-${String(Number(cnMatch[2])).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  return text;
};

export const formatDateLabel = (dateValue) => {
  const normalized = normalizeMonitorDate(dateValue);
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return normalized || '未知时间';
  return `${Number(match[2])}月${Number(match[3])}日`;
};

export const getFeaturePoint = (feature) => {
  const geometry = feature?.geometry;
  if (!geometry?.type || !geometry?.coordinates) return null;
  if (geometry.type === 'Point') return geometry.coordinates;
  if (geometry.type === 'MultiPoint' && Array.isArray(geometry.coordinates) && geometry.coordinates.length > 0) {
    return geometry.coordinates[0];
  }
  return null;
};

const normalizeGradeText = (value) => {
  const text = String(value || '').trim().replace(/\s+/g, '');
  if (!text) return '无数据';
  if (/劣|差/.test(text) && /v|ⅴ|五|5/i.test(text)) return '劣V';
  if (/^1$|Ⅰ|I类?$/i.test(text)) return 'I';
  if (/^2$|Ⅱ|II类?$/i.test(text)) return 'II';
  if (/^3$|Ⅲ|III类?$/i.test(text)) return 'III';
  if (/^4$|Ⅳ|IV类?$/i.test(text)) return 'IV';
  if (/^5$|Ⅴ|V类?$/i.test(text)) return 'V';
  if (['I', 'II', 'III', 'IV', 'V', '劣V'].includes(text)) return text;
  return '无数据';
};

const toNumber = (value) => {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

export const normalizeWaterQualityFeature = (feature, index = 0) => {
  const props = feature?.properties || {};
  const coord = getFeaturePoint(feature);
  const lon = Number(coord?.[0]);
  const lat = Number(coord?.[1]);
  const monitorTime = normalizeMonitorDate(getPropertyValue(props, FIELD_CANDIDATES.monitorTime));
  const grade = normalizeGradeText(getPropertyValue(props, FIELD_CANDIDATES.grade));
  const gradeMeta = WATER_GRADE_META[grade] || WATER_GRADE_META['无数据'];
  const mainPollutant = String(getPropertyValue(props, FIELD_CANDIDATES.mainPollutant) || '').trim();
  const statusRaw = String(getPropertyValue(props, FIELD_CANDIDATES.status) || '').trim();
  const status = statusRaw || gradeMeta.status;
  const pollutantValues = POLLUTANT_TYPE_CANDIDATES.reduce((values, item) => {
    const rawValue = getPropertyValue(props, item.fields);
    const value = toNumber(rawValue);
    if (value !== null) values[item.code] = value;
    return values;
  }, {});

  return {
    id: String(getPropertyValue(props, FIELD_CANDIDATES.id) || `${getPropertyValue(props, FIELD_CANDIDATES.name) || 'point'}-${index}`),
    name: String(getPropertyValue(props, FIELD_CANDIDATES.name) || `监测点${index + 1}`),
    lon,
    lat,
    hasPoint: Number.isFinite(lon) && Number.isFinite(lat),
    monitorTime,
    monitorMonth: monitorTime ? monitorTime.slice(0, 7) : '',
    grade,
    gradeLabel: gradeMeta.label,
    gradeColor: gradeMeta.color,
    gradeRank: gradeMeta.rank,
    mainPollutant: mainPollutant || '未识别',
    status,
    district: String(getPropertyValue(props, FIELD_CANDIDATES.district) || ''),
    river: String(getPropertyValue(props, FIELD_CANDIDATES.river) || ''),
    section: String(getPropertyValue(props, FIELD_CANDIDATES.section) || ''),
    pollutantValues,
  };
};

export const selectLatestWaterQualityRowsBySite = (rows = []) => {
  const latestBySite = new Map();
  rows.forEach((row) => {
    const key = row.name || `${row.lon},${row.lat}`;
    const current = latestBySite.get(key);
    if (!current || String(row.monitorTime || '').localeCompare(String(current.monitorTime || '')) > 0) {
      latestBySite.set(key, row);
    }
  });
  return Array.from(latestBySite.values());
};

export const findWaterQualityLayer = (layers = []) => layers.find((layer) => {
  const name = layer?.name || '';
  return name === WATER_QUALITY_LAYER_KEY || getLayerKey(name) === WATER_QUALITY_LAYER_KEY;
}) || null;

export const buildWfsUrl = (layer, defaultWorkspace = 'LSNPDP') => {
  if (!layer) return '';
  const fullName = String(layer.name || '').includes(':')
    ? layer.name
    : `${layer.workspace || defaultWorkspace}:${layer.name}`;
  const workspace = fullName.split(':')[0];
  return `${GEOSERVER_CONFIG.baseUrl}/${workspace}/ows?service=WFS&version=1.0.0&request=GetFeature` +
    `&typeName=${encodeURIComponent(fullName)}` +
    `&outputFormat=${encodeURIComponent('application/json')}` +
    `&srsName=EPSG:4326`;
};

let waterQualityFetchPromise = null;
let waterQualityFetchCache = null;

export const fetchWaterQualityFeatures = async () => {
  if (waterQualityFetchCache) return waterQualityFetchCache;
  if (waterQualityFetchPromise) return waterQualityFetchPromise;

  waterQualityFetchPromise = (async () => {
    const layers = await getGeoServerLayers();
    const layer = findWaterQualityLayer(layers);
    if (!layer) return { layer: null, rows: [] };

    const response = await fetch(buildWfsUrl(layer));
    if (!response.ok) throw new Error(`水质监测 WFS 请求失败: ${response.status}`);
    const geojson = await response.json();
    const features = Array.isArray(geojson?.features) ? geojson.features : [];
    const result = {
      layer,
      rows: features.map(normalizeWaterQualityFeature),
    };
    waterQualityFetchCache = result;
    return result;
  })();

  try {
    return await waterQualityFetchPromise;
  } finally {
    waterQualityFetchPromise = null;
  }
};

export const createDefaultWaterQualityFilter = () => ({
  grade: ALL_VALUE,
  monitorDate: ALL_VALUE,
  monitorYear: ALL_VALUE,
  monitorMonth: ALL_VALUE,
  monitorStartMonth: ALL_VALUE,
  monitorEndMonth: ALL_VALUE,
  pollutantCode: ALL_VALUE,
  pollutantName: '',
  status: ALL_VALUE,
  siteName: ALL_VALUE,
  selectedId: ALL_VALUE,
});

export const normalizeWaterQualityMonthRange = (monitorStartMonth = '', monitorEndMonth = '') => {
  if (monitorStartMonth && monitorEndMonth && monitorStartMonth > monitorEndMonth) {
    return {
      monitorStartMonth: monitorEndMonth,
      monitorEndMonth: monitorStartMonth,
    };
  }
  return { monitorStartMonth, monitorEndMonth };
};

export const filterWaterQualityRows = (rows = [], filter = createDefaultWaterQualityFilter()) => rows.filter((row) => {
  if (filter.grade && row.grade !== filter.grade) return false;
  if (filter.monitorDate && row.monitorTime !== filter.monitorDate) return false;
  if (filter.monitorYear && !String(row.monitorTime || '').startsWith(`${filter.monitorYear}-`)) return false;
  if (filter.monitorMonth && !String(row.monitorTime || '').startsWith(filter.monitorMonth)) return false;
  const rowMonitorMonth = String(row.monitorMonth || row.monitorTime || '').slice(0, 7);
  if (filter.monitorStartMonth && rowMonitorMonth < filter.monitorStartMonth) return false;
  if (filter.monitorEndMonth && rowMonitorMonth > filter.monitorEndMonth) return false;
  if (filter.status && row.status !== filter.status) return false;
  if (filter.siteName && row.name !== filter.siteName) return false;
  if (filter.pollutantCode) {
    const pollutantValues = row.pollutantValues || {};
    const hasPollutant = Object.prototype.hasOwnProperty.call(pollutantValues, filter.pollutantCode);
    const mainMatched = row.mainPollutant === filter.pollutantName || row.mainPollutant === filter.pollutantCode;
    if (!hasPollutant && !mainMatched) return false;
  }
  return true;
});

export const buildWaterQualityStats = (rows = []) => {
  const gradeCounts = WATER_GRADE_ORDER.map((grade) => ({
    grade,
    label: WATER_GRADE_META[grade].label,
    color: WATER_GRADE_META[grade].color,
    count: rows.filter((row) => row.grade === grade).length,
  }));
  const abnormalRows = rows.filter((row) => row.gradeRank >= 4 && row.gradeRank < 99);
  const alarmRows = rows.filter((row) => row.grade === '劣V' || /预警|报警|alarm/i.test(row.status));

  const pollutantMap = new Map();
  rows.forEach((row) => {
    if (row.mainPollutant && row.mainPollutant !== '未识别') {
      pollutantMap.set(row.mainPollutant, (pollutantMap.get(row.mainPollutant) || 0) + 1);
    }
    const pollutantValues = row.pollutantValues || {};
    POLLUTANT_TYPE_CANDIDATES.forEach((item) => {
      if (!Object.prototype.hasOwnProperty.call(pollutantValues, item.code)) return;
      pollutantMap.set(item.label, (pollutantMap.get(item.label) || 0) + 1);
    });
  });

  const timeMap = new Map();
  rows.forEach((row) => {
    if (!row.monitorTime) return;
    const current = timeMap.get(row.monitorTime) || { date: row.monitorTime, count: 0, validGradeCount: 0, gradeTotal: 0 };
    current.count += 1;
    if (row.gradeRank < 99) {
      current.validGradeCount += 1;
      current.gradeTotal += row.gradeRank;
    }
    timeMap.set(row.monitorTime, current);
  });

  return {
    total: rows.length,
    normalTotal: rows.filter((row) => row.gradeRank <= 3).length,
    abnormalTotal: abnormalRows.length,
    alarmTotal: alarmRows.length,
    gradeCounts,
    pollutantCounts: Array.from(pollutantMap.entries()).map(([name, count]) => ({ name, count })),
    trendRows: Array.from(timeMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => ({
        date: item.date,
        label: formatDateLabel(item.date),
        avgGradeRank: item.validGradeCount ? Number((item.gradeTotal / item.validGradeCount).toFixed(2)) : 0,
        count: item.count,
      })),
  };
};
