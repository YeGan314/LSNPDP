const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// ==========================================
// 数据库配置 (请根据您的实际情况修改)
// ==========================================
const dbConfig = {
  user: 'postgres',
  host: '8.146.208.20',     // 远程数据库 IP
  database: 'postgres',  // 您的数据库名称
  password: '1qaz@WSX',      // 远程数据库密码
  port: 5432,
};

// GeoJSON 文件路径
const geojsonPath = path.join(__dirname, '../geodata/china_province.geojson');

async function importData() {
  const client = new Client(dbConfig);

  try {
    await client.connect();
    console.log('✅ 已连接到数据库');

    // 读取 GeoJSON 文件
    const rawData = fs.readFileSync(geojsonPath, 'utf8');
    const geojson = JSON.parse(rawData);
    
    console.log(`📂 读取 GeoJSON 成功，共找到 ${geojson.features.length} 个要素`);

    // 准备插入语句
    const insertQuery = `
      INSERT INTO china_province (
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
      const p = feature.properties;
      
      // 处理可能为空的字段
      const center = p.center || [0, 0];
      const centroid = p.centroid || [0, 0];
      const parentAdcode = p.parent ? p.parent.adcode : null;
      
      // 准备参数数组
      const values = [
        p.adcode,
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
        process.stdout.write(`\r🚀 正在导入: ${p.name} (${successCount}/${geojson.features.length})`);
      } catch (err) {
        console.error(`\n❌ 导入失败 [${p.name}]:`, err.message);
      }
    }

    console.log(`\n\n✨ 导入完成！成功导入 ${successCount} 条记录。`);

  } catch (error) {
    console.error('❌ 发生错误:', error);
  } finally {
    await client.end();
  }
}

importData();
