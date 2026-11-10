const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');

const sourcePath = path.resolve(
  __dirname,
  '../src/views/big-screen/compoments/yewu3/water-quality-data.js'
);
const source = fs.readFileSync(sourcePath, 'utf8');
const transformed = babel.transformSync(source, {
  filename: sourcePath,
  babelrc: false,
  configFile: false,
  plugins: ['@babel/plugin-transform-modules-commonjs'],
}).code;

const moduleUnderTest = { exports: {} };
const sandbox = {
  module: moduleUnderTest,
  exports: moduleUnderTest.exports,
  require(request) {
    if (request === '@/config/geoserver.config') {
      return { GEOSERVER_CONFIG: { baseUrl: '/geoserver' } };
    }
    if (request === '@/utils/geoserver-helper') {
      return { getGeoServerLayers: async () => [] };
    }
    throw new Error(`Unexpected dependency: ${request}`);
  },
  console,
  fetch,
};
vm.runInNewContext(transformed, sandbox, { filename: sourcePath });

const {
  POLLUTANT_TYPE_CANDIDATES,
  createDefaultWaterQualityFilter,
  filterWaterQualityRows,
  normalizeWaterQualityFeature,
  normalizeWaterQualityMonthRange,
  selectLatestWaterQualityRowsBySite,
} = moduleUnderTest.exports;

assert.equal(
  POLLUTANT_TYPE_CANDIDATES.length,
  22,
  '应完整配置服务中的 22 项水质指标'
);

const rows = [
  { id: 'a-old', name: '断面A', monitorTime: '2024-01-01', lon: 112, lat: 28 },
  { id: 'a-new', name: '断面A', monitorTime: '2024-02-01', lon: 112, lat: 28 },
  { id: 'b-only', name: '断面B', monitorTime: '2024-01-15', lon: 113, lat: 29 },
];
assert.deepEqual(
  Array.from(selectLatestWaterQualityRowsBySite(rows), (row) => row.id),
  ['a-new', 'b-only'],
  '地图应只保留每个断面的最新一条记录'
);

const indicatorProperties = Object.fromEntries(
  POLLUTANT_TYPE_CANDIDATES.map((item, index) => [item.fields[0], index + 1])
);
const normalizedRow = normalizeWaterQualityFeature({
  geometry: { type: 'Point', coordinates: [112, 28] },
  properties: {
    sec_name: '断面A',
    samp_date: '2024-01-01',
    ...indicatorProperties,
  },
});
assert.equal(Array.isArray(normalizedRow.pollutantValues), false, '污染物值不应为大量小对象数组');
assert.equal(
  Object.keys(normalizedRow.pollutantValues).length,
  22,
  '每条记录应使用紧凑字典保存 22 项指标'
);

assert.equal(
  createDefaultWaterQualityFilter().monitorYear,
  '',
  '默认筛选条件应包含空的监测年份'
);
assert.equal(
  createDefaultWaterQualityFilter().monitorStartMonth,
  '',
  '默认筛选条件应包含空的起始年月'
);
assert.equal(
  createDefaultWaterQualityFilter().monitorEndMonth,
  '',
  '默认筛选条件应包含空的结束年月'
);

const yearlyRows = [
  { id: '2024-12', monitorTime: '2024-12-31' },
  { id: '2025-01', monitorTime: '2025-01-31' },
  { id: '2025-06', monitorTime: '2025-06-30' },
];
assert.deepEqual(
  Array.from(
    filterWaterQualityRows(yearlyRows, {
      ...createDefaultWaterQualityFilter(),
      monitorYear: '2025',
    }),
    (row) => row.id
  ),
  ['2025-01', '2025-06'],
  '按年份筛选时应只返回对应年份的监测记录'
);

const rangeRows = [
  { id: 'before', monitorTime: '2023-12-31' },
  { id: 'start', monitorTime: '2024-01-01' },
  { id: 'middle', monitorTime: '2024-06-15' },
  { id: 'end', monitorTime: '2024-12-31' },
  { id: 'after', monitorTime: '2025-01-01' },
];
assert.deepEqual(
  Array.from(
    filterWaterQualityRows(rangeRows, {
      ...createDefaultWaterQualityFilter(),
      monitorStartMonth: '2024-01',
      monitorEndMonth: '2024-12',
    }),
    (row) => row.id
  ),
  ['start', 'middle', 'end'],
  '年月范围筛选应包含起始月和结束月'
);
assert.deepEqual(
  Array.from(
    filterWaterQualityRows(rangeRows, {
      ...createDefaultWaterQualityFilter(),
      monitorStartMonth: '2024-06',
    }),
    (row) => row.id
  ),
  ['middle', 'end', 'after'],
  '只选择起始年月时应保留该月及之后的数据'
);
assert.deepEqual(
  Array.from(
    filterWaterQualityRows(rangeRows, {
      ...createDefaultWaterQualityFilter(),
      monitorEndMonth: '2024-06',
    }),
    (row) => row.id
  ),
  ['before', 'start', 'middle'],
  '只选择结束年月时应保留该月及之前的数据'
);
assert.deepEqual(
  { ...normalizeWaterQualityMonthRange('2025-06', '2024-01') },
  { monitorStartMonth: '2024-01', monitorEndMonth: '2025-06' },
  '起始年月晚于结束年月时应自动交换'
);

console.log('water-quality-data tests passed');
