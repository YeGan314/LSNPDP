const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const indexSource = fs.readFileSync(
  path.join(projectRoot, 'src/views/big-screen/index-page.vue'),
  'utf8'
);
const leftSource = fs.readFileSync(
  path.join(projectRoot, 'src/views/big-screen/compoments/yewu3/Left/left-page.vue'),
  'utf8'
);
const layerPanelSource = fs.readFileSync(
  path.join(projectRoot, 'src/views/big-screen/compoments/layer-panel.vue'),
  'utf8'
);

const closePollutantCall = 'layerPanelRef.value.clearPollutantLayer()';
const openWaterQualityCall = "await layerPanelRef.value.setLayerCheckedByKey('CZ_WQMD_DATA', true)";
const closeIndex = indexSource.indexOf(closePollutantCall);
const openIndex = indexSource.indexOf(openWaterQualityCall);

assert.ok(closeIndex >= 0, '进入监测预警时应关闭新污染物图层');
assert.ok(openIndex >= 0, '进入监测预警时应开启水质监测图层');
assert.ok(closeIndex < openIndex, '必须先关闭新污染物图层，再开启水质监测图层');

assert.equal(leftSource.includes('监测点位明细'), false, '左侧不应显示监测点位明细');
assert.equal(leftSource.includes('tableRows'), false, '左侧不应继续计算点位表格数据');
assert.ok(
  layerPanelSource.match(/monitorStartMonth/g)?.length >= 2,
  '地图图层状态和白名单都应包含起始年月'
);
assert.ok(
  layerPanelSource.match(/monitorEndMonth/g)?.length >= 2,
  '地图图层状态和白名单都应包含结束年月'
);

console.log('yewu3 interface tests passed');
