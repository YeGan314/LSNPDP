/**
 * 抽稀 geo.js 中的 ListGuanQu 坐标
 * 每隔 step 个点保留 1 个，并强制保留首尾点
 * 使用方法：node tools/simplify_list_guan_qu.js
 */

const fs = require('fs');
const path = require('path');

const GEO_FILE = path.resolve(__dirname, '../src/views/big-screen/js/geo.js');
const STEP = 3; // 抽稀步长，数值越大保留的点越少

function simplifyCoords(coords, step) {
  if (coords.length <= 4) return coords;
  const result = [];
  const n = coords.length / 2; // lon,lat 成对

  for (let i = 0; i < n; i++) {
    const keep = i === 0 || i === n - 1 || i % step === 0;
    if (keep) {
      result.push(coords[2 * i], coords[2 * i + 1]);
    }
  }
  return result;
}

function formatArray(coords) {
  const lines = [];
  const indent = '  ';
  const perLinePairs = 4; // 每行 4 对坐标

  for (let i = 0; i < coords.length; i += perLinePairs * 2) {
    const slice = coords.slice(i, i + perLinePairs * 2);
    lines.push(
      indent +
        slice
          .map((v, idx) => {
            const num = Number.isInteger(v) ? v.toString() : v.toFixed(12).replace(/0+$/,'').replace(/\.$/,'');
            return num;
          })
          .join(', ') +
        ','
    );
  }

  return ' const ListGuanQu = [\n' + lines.join('\n') + '\n];';
}

function main() {
  console.log('📄 读取文件:', GEO_FILE);
  let content = fs.readFileSync(GEO_FILE, 'utf8');

  const regex = /const ListGuanQu = \[([\s\S]*?)\];/m;
  const match = content.match(regex);
  if (!match) {
    console.error('❌ 未找到 ListGuanQu 定义');
    process.exit(1);
  }

  const arrayBody = match[1];
  // 提取所有数字
  const numberStrings = arrayBody
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const numbers = numberStrings.map((s) => Number(s)).filter((v) => !Number.isNaN(v));

  if (numbers.length % 2 !== 0) {
    console.warn('⚠️ 坐标数量不是偶数，可能存在问题，总数:', numbers.length);
  }

  console.log('👉 原始坐标点数(经纬度对):', numbers.length / 2);

  const simplified = simplifyCoords(numbers, STEP);

  console.log('✅ 抽稀后坐标点数(经纬度对):', simplified.length / 2);

  const newArrayText = formatArray(simplified);

  // 生成新的内容
  const newContent = content.replace(regex, newArrayText);

  // 备份原文件
  const backup = GEO_FILE + '.bak_listGuanQu';
  fs.writeFileSync(backup, content, 'utf8');
  console.log('💾 已备份原文件到:', backup);

  fs.writeFileSync(GEO_FILE, newContent, 'utf8');
  console.log('🎉 已更新 geo.js 中的 ListGuanQu 坐标');
}

main();
