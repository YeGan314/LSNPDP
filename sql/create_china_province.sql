-- 1. 启用 PostGIS 扩展
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. 删除旧表
DROP TABLE IF EXISTS china_province;

-- 3. 创建表 (最简模式，不带索引，不带默认值)
CREATE TABLE china_province (
    id SERIAL PRIMARY KEY,
    adcode INTEGER NOT NULL,
    name VARCHAR(100),
    
    -- 使用 public.geometry 明确指定类型，且不带任何约束
    center public.geometry,
    centroid public.geometry,
    
    children_num INTEGER,
    "level" VARCHAR(20),
    parent_adcode INTEGER,
    sub_feature_index INTEGER,
    acroutes INTEGER[],
    
    geom public.geometry,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 注意：这里暂时注释掉了索引创建语句
-- 建议您先运行上面的建表语句。
-- 如果建表成功，再单独运行下面的索引语句。

-- CREATE INDEX idx_china_province_geom ON china_province USING GIST (geom);
-- CREATE INDEX idx_china_province_adcode ON china_province (adcode);
