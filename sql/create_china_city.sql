-- 1. 启用 PostGIS 扩展
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. 删除旧表
DROP TABLE IF EXISTS china_city;

-- 3. 创建市级行政区表
CREATE TABLE china_city (
    id SERIAL PRIMARY KEY,
    adcode INTEGER NOT NULL,
    name VARCHAR(100),

    -- 空间属性字段
    center public.geometry,
    centroid public.geometry,

    -- 业务属性字段
    children_num INTEGER,
    "level" VARCHAR(20),
    parent_adcode INTEGER,
    sub_feature_index INTEGER,
    acroutes INTEGER[],

    -- 核心空间几何字段
    geom public.geometry,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
