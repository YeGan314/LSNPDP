const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const rightPageSource = fs.readFileSync(
  path.join(projectRoot, 'src/views/big-screen/compoments/yewu3/Right/right-page.vue'),
  'utf8'
);

assert.match(
  rightPageSource,
  /--filter-control-font-size:\s*11px/,
  '筛选标签应使用统一紧凑字号'
);
assert.equal(
  rightPageSource.includes('<lease-title :rightbox="false">监测时间</lease-title>'),
  false,
  '不应保留独立监测时间模块'
);
assert.equal(rightPageSource.includes('class="year-tabs"'), false, '不应保留年份选项卡');
assert.equal(rightPageSource.includes('class="month-grid"'), false, '不应保留月份按钮网格');
assert.match(
  rightPageSource,
  /<box width="700" height="150">[\s\S]*?class="month-range-row"/,
  '顶部筛选模块应缩小高度并包含年月范围控件'
);
assert.match(
  rightPageSource,
  /<select[\s\S]*?:value="filter\.monitorStartMonth"/,
  '顶部应包含起始年月下拉框'
);
assert.match(
  rightPageSource,
  /<select[\s\S]*?:value="filter\.monitorEndMonth"/,
  '顶部应包含结束年月下拉框'
);
assert.match(
  rightPageSource,
  /\.chip\s*\{[\s\S]*?font-size:\s*var\(--filter-control-font-size\)/,
  '水质级别和污染类型标签应使用统一紧凑字号'
);
assert.match(
  rightPageSource,
  /\.site-item\s*\{[\s\S]*?font-size:\s*var\(--filter-control-font-size\)/,
  '监测点位标签应使用统一紧凑字号'
);
assert.match(
  rightPageSource,
  /\.pollutant-row,[\s\S]*?\.site-list\s*\{[\s\S]*?scrollbar-width:\s*none/,
  '局部滚动区域应隐藏 Firefox 滚动条'
);
assert.match(
  rightPageSource,
  /\.pollutant-row::-webkit-scrollbar,[\s\S]*?\.site-list::-webkit-scrollbar\s*\{[\s\S]*?display:\s*none/,
  '局部滚动区域应隐藏 WebKit 滚动条'
);

console.log('yewu3 right layout tests passed');
