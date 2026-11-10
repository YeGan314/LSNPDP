const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// ==========================================
// 数据库配置 (与省级保持一致)
// ==========================================
const dbConfig = {
  user: 'postgres',
  host: '8.146.208.20',     // 远程数据库 IP
  database: 'postgres',     // 您的数据库名称
  password: '1qaz@WSX',     // 远程数据库密码
  port: 5432,
};

// 市级 GeoJSON 文件路径（请确认文件存在）
const geojsonPath = path.join(__dirname, '../geodata/china_city.geojson');

async function importCityData() {
  const client = new Client(dbConfig);

  try {
    await client.connect();
    console.log('✅ 已连接到数据库 (city)');

    // 读取 GeoJSON 文件
    const rawData = fs.readFileSync(geojsonPath, 'utf8');
    const geojson = JSON.parse(rawData);
    console.log(`📂 读取市级 GeoJSON 成功，共找到 ${geojson.features.length} 个要素`);

    // 插入到 china_city 表
    const insertQuery = `
      INSERT INTO china_city (
        adcode, name, center, centroid, children_num, level,
        parent_adcode, sub_feature_index, acroutes, geom
      ) VALUES (
        $1, $2,
        ST_SetSRID(ST_MakePoint($3, $4), 4326),
        ST_SetSRID(ST_MakePoint($5, $6), 4326),
        $7, $8, $9, $10, $11,
        ST_SetSRID(ST_GeomFromGeoJSON($12), 4326)
      )
    `;

    let successCount = 0;

    for (const feature of geojson.features) {
      const p = feature.properties || {};

      // adcode 统一转成整数，非整数（如 100000_JD）直接跳过
      const adcodeInt = parseInt(p.adcode, 10);
      if (Number.isNaN(adcodeInt)) {
        console.warn(`跳过非整数 adcode 记录:`, p.adcode);
        continue;
      }

      // 处理可能为空的字段
      const center = p.center || [0, 0];
      const centroid = p.centroid || [0, 0];
      const parentAdcode = p.parent ? p.parent.adcode : null;

      const values = [
        adcodeInt,
        p.name,
        center[0], center[1],           // center point
        centroid[0], centroid[1],       // centroid point
        p.childrenNum,
        p.level,
        parentAdcode,
        p.subFeatureIndex,
        p.acroutes,
        JSON.stringify(feature.geometry) // geometry as GeoJSON string
      ];

      try {
        await client.query(insertQuery, values);
        successCount++;
        process.stdout.write(`\r🚀 正在导入市级数据: ${p.name} (${successCount}/${geojson.features.length})`);
      } catch (err) {
        console.error(`\n❌ 导入失败 [${p.name}]:`, err.message);
      }
    }

    console.log(`\n\n✨ 市级导入完成！成功导入 ${successCount} 条记录。`);
  } catch (error) {
    console.error('❌ 市级导入发生错误:', error);
  } finally {
    await client.end();
  }
}

importCityData();
