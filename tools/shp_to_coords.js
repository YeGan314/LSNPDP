/**
 * SHP 文件转换为坐标点数组工具 (Node.js 版本)
 * 将 Shapefile 格式的地理数据转换为 JavaScript 坐标数组格式
 * 
 * 使用方法:
 *     node shp_to_coords.js input.shp output.js [--name ListName]
 * 
 * 依赖安装:
 *     npm install shapefile
 */

const shapefile = require('shapefile');
const fs = require('fs');
const path = require('path');

/**
 * 格式化坐标数组
 */
function formatCoordsArray(coords, lineLength = 6, indent = 0) {
  const indentStr = ' '.repeat(indent);
  const lines = [];
  let currentLine = [];
  
  for (let i = 0; i < coords.length; i += 2) {
    if (i + 1 < coords.length) {
      const lon = coords[i];
      const lat = coords[i + 1];
      currentLine.push(`${lon}, ${lat}`);
      
      if (currentLine.length >= lineLength) {
        lines.push(indentStr + '  ' + currentLine.join(', ') + ',');
        currentLine = [];
      }
    }
  }
  
  if (currentLine.length > 0) {
    lines.push(indentStr + '  ' + currentLine.join(', ') + ',');
  }
  
  return lines.join('\n').replace(/,$/, ''); // 移除最后一行的逗号
}

/**
 * 提取几何坐标
 */
function extractCoordinates(geometry) {
  const coords = [];
  
  if (geometry.type === 'Polygon') {
    // 多边形：取外环坐标
    const ring = geometry.coordinates[0];
    for (const [lon, lat] of ring) {
      coords.push(lon, lat);
    }
  } else if (geometry.type === 'LineString') {
    // 线要素
    for (const [lon, lat] of geometry.coordinates) {
      coords.push(lon, lat);
    }
  } else if (geometry.type === 'Point') {
    // 点要素
    coords.push(geometry.coordinates[0], geometry.coordinates[1]);
  } else if (geometry.type === 'MultiPolygon') {
    // 多多边形：取第一个多边形
    const ring = geometry.coordinates[0][0];
    for (const [lon, lat] of ring) {
      coords.push(lon, lat);
    }
  } else if (geometry.type === 'MultiLineString') {
    // 多线：取第一条线
    for (const [lon, lat] of geometry.coordinates[0]) {
      coords.push(lon, lat);
    }
  }
  
  return coords;
}

/**
 * 转换 SHP 文件
 */
async function shpToCoordsArray(shpPath, outputPath, varName = 'ListGuanQu') {
  try {
    console.log(`正在读取 SHP 文件: ${shpPath}`);
    
    // 读取 SHP 文件
    const source = await shapefile.open(shpPath);
    const features = [];
    
    let result = await source.read();
    while (!result.done) {
      features.push(result.value);
      result = await source.read();
    }
    
    console.log(`找到 ${features.length} 个要素`);
    
    if (features.length === 0) {
      console.error('错误: 未找到任何要素');
      return;
    }
    
    // 处理要素
    const results = [];
    for (const feature of features) {
      const coords = extractCoordinates(feature.geometry);
      if (coords.length > 0) {
        results.push({
          coords,
          properties: feature.properties || {}
        });
      }
    }
    
    // 生成 JavaScript 代码
    let jsCode;
    if (results.length === 1) {
      // 单个要素
      const coordStr = formatCoordsArray(results[0].coords);
      jsCode = `const ${varName} = [\n${coordStr}\n];`;
    } else {
      // 多个要素
      jsCode = `const ${varName} = [\n`;
      results.forEach((item, i) => {
        const coordStr = formatCoordsArray(item.coords, 6, 2);
        const name = item.properties.name || item.properties.NAME || `item${i + 1}`;
        jsCode += `  {\n    name: "${name}",\n    positions: [\n${coordStr}\n    ],\n  },\n`;
      });
      jsCode += '];';
    }
    
    // 输出结果
    if (outputPath) {
      fs.writeFileSync(outputPath, jsCode, 'utf8');
      console.log(`\n✓ 转换完成！输出文件: ${outputPath}`);
    } else {
      console.log('\n' + '='.repeat(60));
      console.log(jsCode);
      console.log('='.repeat(60));
    }
    
  } catch (error) {
    console.error('错误:', error.message);
    process.exit(1);
  }
}

// 命令行参数处理
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log(`
使用方法:
  node shp_to_coords.js <input.shp> [output.js] [--name ListName]

示例:
  node shp_to_coords.js guanqu.shp output.js --name ListGuanQu
  `);
  process.exit(1);
}

const inputPath = args[0];
const outputIndex = args.findIndex(arg => !arg.startsWith('--'));
const outputPath = outputIndex > 0 && args[outputIndex] !== inputPath ? args[outputIndex] : null;
const nameIndex = args.findIndex(arg => arg === '--name');
const varName = nameIndex >= 0 && args[nameIndex + 1] ? args[nameIndex + 1] : 'ListGuanQu';

if (!fs.existsSync(inputPath)) {
  console.error(`错误: 文件不存在: ${inputPath}`);
  process.exit(1);
}

shpToCoordsArray(inputPath, outputPath, varName);

