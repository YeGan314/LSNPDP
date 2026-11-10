/**
 * 使用高德地图 API 导入行政区空间信息到 PostgreSQL
 * @author YG
 * @date 2025-12-05
 */

const axios = require('axios');
const { Client } = require('pg');

// 高德地图 API Key
const AMAP_KEY = '5dc9139439c4a7ff7347a215a785010b';

// PostgreSQL 数据库配置
const dbConfig = {
  host: '8.146.208.20',
  port: 5432,
  database: 'postgres', // 修改为你的数据库名
  user: 'postgres',
  password: '1qaz@WSX' // 修改为你的数据库密码
};

// 创建数据库连接
const client = new Client(dbConfig);

/**
 * 从高德地图获取行政区边界数据
 * @param {string} adcode - 行政区代码
 * @param {string} name - 行政区名称
 * @returns {Promise<string|null>} WKT 格式的几何数据
 */
async function getDistrictBoundary(adcode, name) {
  try {
    console.log(`🔍 正在获取 ${name} (${adcode}) 的边界数据...`);
    
    const response = await axios.get('https://restapi.amap.com/v3/config/district', {
      params: {
        key: AMAP_KEY,
        keywords: adcode,
        subdistrict: 0,
        extensions: 'all'
      },
      timeout: 10000
    });
    
    if (response.data.status !== '1') {
      console.warn(`⚠️  ${name} API 返回错误: ${response.data.info}`);
      return null;
    }
    
    const districts = response.data.districts;
    if (!districts || districts.length === 0) {
      console.warn(`⚠️  ${name} 未找到行政区数据`);
      return null;
    }
    
    const district = districts[0];
    
    // 检查是否有边界数据
    if (!district.polyline || district.polyline === '') {
      console.warn(`⚠️  ${name} 无边界数据（可能是直辖市或特殊行政区）`);
      return null;
    }
    
    // 解析边界数据（可能有多个多边形，用 | 分隔）
    const polygons = district.polyline.split('|');
    
    if (polygons.length === 1) {
      // 单个多边形
      const coordinates = polygons[0];
      const points = coordinates.split(';').map(p => p.split(',').join(' ')).join(',');
      return `POLYGON((${points}))`;
    } else {
      // 多个多边形（MultiPolygon）
      const multiPolygonParts = polygons.map(polygon => {
        const points = polygon.split(';').map(p => p.split(',').join(' ')).join(',');
        return `((${points}))`;
      }).join(',');
      return `MULTIPOLYGON(${multiPolygonParts})`;
    }
    
  } catch (error) {
    console.error(`❌ ${name} 获取边界失败:`, error.message);
    return null;
  }
}

/**
 * 更新数据库中的几何字段
 * @param {string} adcode - 行政区代码
 * @param {string} name - 行政区名称
 * @param {string} wkt - WKT 格式的几何数据
 */
async function updateGeometry(adcode, name, wkt) {
  try {
    const result = await client.query(
      `UPDATE base_xzq_data 
       SET the_geom = ST_GeomFromText($1, 4326),
           updated_at = NOW()
       WHERE xzq_code = $2`,
      [wkt, adcode]
    );
    
    if (result.rowCount > 0) {
      console.log(`✅ ${name} (${adcode}) 几何数据更新成功`);
      return true;
    } else {
      console.warn(`⚠️  ${name} (${adcode}) 未找到对应记录`);
      return false;
    }
  } catch (error) {
    console.error(`❌ ${name} 数据库更新失败:`, error.message);
    return false;
  }
}

/**
 * 批量导入行政区几何数据
 * @param {string} level - 行政区级别：'province', 'city', 'county', 或 'all'
 */
async function importDistrictGeometry(level = 'all') {
  try {
    await client.connect();
    console.log('✅ 数据库连接成功\n');
    
    // 构建查询条件
    let whereClause = '';
    if (level === 'province') {
      whereClause = "WHERE xzq_level = '省'";
    } else if (level === 'city') {
      whereClause = "WHERE xzq_level = '市'";
    } else if (level === 'county') {
      whereClause = "WHERE xzq_level = '区' OR xzq_level = '县'";
    }
    
    // 查询所有需要导入的行政区
    const query = `
      SELECT xzq_code, xzq_name, xzq_level 
      FROM base_xzq_data 
      ${whereClause}
      ORDER BY xzq_level, xzq_code
    `;
    
    console.log(`📊 查询行政区数据: ${level === 'all' ? '全部' : level}\n`);
    const result = await client.query(query);
    
    console.log(`📋 共找到 ${result.rows.length} 条记录\n`);
    console.log('=' .repeat(60));
    
    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;
    
    // 遍历每个行政区
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows[i];
      const { xzq_code, xzq_name, xzq_level } = row;
      
      console.log(`\n[${i + 1}/${result.rows.length}] ${xzq_name} (${xzq_code}) - ${xzq_level}`);
      
      // 获取边界数据
      const wkt = await getDistrictBoundary(xzq_code, xzq_name);
      
      if (wkt) {
        // 更新数据库
        const success = await updateGeometry(xzq_code, xzq_name, wkt);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      } else {
        skipCount++;
      }
      
      // 避免请求频率过高（高德API限制：每秒最多30次）
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('\n📊 导入统计:');
    console.log(`   ✅ 成功: ${successCount}`);
    console.log(`   ❌ 失败: ${failCount}`);
    console.log(`   ⏭️  跳过: ${skipCount}`);
    console.log(`   📝 总计: ${result.rows.length}`);
    console.log('\n✨ 导入完成！');
    
  } catch (error) {
    console.error('❌ 导入过程出错:', error);
  } finally {
    await client.end();
    console.log('\n🔌 数据库连接已关闭');
  }
}

/**
 * 创建空间索引
 */
async function createSpatialIndex() {
  const indexClient = new Client(dbConfig);
  try {
    await indexClient.connect();
    console.log('📐 正在创建空间索引...');
    
    await indexClient.query(`
      CREATE INDEX IF NOT EXISTS idx_base_xzq_data_geom 
      ON base_xzq_data 
      USING GIST(the_geom);
    `);
    
    console.log('✅ 空间索引创建成功');
    await indexClient.end();
  } catch (error) {
    console.error('❌ 创建索引失败:', error.message);
    try {
      await indexClient.end();
    } catch (e) {
      // 忽略关闭连接时的错误
    }
  }
}

// 主函数
async function main() {
  console.log('\n🚀 开始导入行政区空间数据\n');
  console.log('配置信息:');
  console.log(`  📍 数据库: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
  console.log(`  🔑 API Key: ${AMAP_KEY.substring(0, 10)}...`);
  console.log('\n');
  
  // 获取命令行参数
  const args = process.argv.slice(2);
  const level = args[0] || 'all'; // 默认导入全部
  
  if (!['all', 'province', 'city', 'county'].includes(level)) {
    console.error('❌ 参数错误！');
    console.log('\n使用方法:');
    console.log('  node import-district-geometry.js [level]');
    console.log('\n参数说明:');
    console.log('  level: all | province | city | county');
    console.log('  - all: 导入全部行政区（默认）');
    console.log('  - province: 只导入省级');
    console.log('  - city: 只导入市级');
    console.log('  - county: 只导入区县级');
    console.log('\n示例:');
    console.log('  node import-district-geometry.js all');
    console.log('  node import-district-geometry.js province');
    return;
  }
  
  // 执行导入
  await importDistrictGeometry(level);
  
  // 创建空间索引
  console.log('\n');
  await createSpatialIndex();
}

// 运行主函数
main().catch(console.error);
