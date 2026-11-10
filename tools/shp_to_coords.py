#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SHP 文件转换为坐标点数组工具
将 Shapefile 格式的地理数据转换为 JavaScript 坐标数组格式

使用方法:
    python shp_to_coords.py input.shp output.js [--name ListName] [--type Polygon|LineString|Point]

依赖安装:
    pip install geopandas shapely
"""

import geopandas as gpd
import json
import sys
import argparse
import os
from pathlib import Path

# 修复 Windows 控制台编码问题
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')


def shp_to_coords_array(shp_path, output_path=None, var_name="ListGuanQu", geometry_type="auto"):
    """
    将 SHP 文件转换为坐标点数组
    
    Args:
        shp_path: SHP 文件路径
        output_path: 输出文件路径（可选，默认输出到控制台）
        var_name: JavaScript 变量名
        geometry_type: 几何类型 ('Polygon', 'LineString', 'Point', 'auto')
    """
    # 读取 SHP 文件
    print(f"正在读取 SHP 文件: {shp_path}")
    gdf = gpd.read_file(shp_path)
    
    # 确保坐标系为 WGS84 (EPSG:4326)
    if gdf.crs is None:
        print("警告: 未检测到坐标系，假设为 WGS84")
        gdf.set_crs('EPSG:4326', inplace=True)
    elif gdf.crs.to_string() != 'EPSG:4326':
        print(f"正在转换坐标系: {gdf.crs} -> EPSG:4326")
        gdf = gdf.to_crs('EPSG:4326')
    
    print(f"找到 {len(gdf)} 个要素")
    
    # 自动检测几何类型
    if geometry_type == "auto":
        geom_type = gdf.geometry.iloc[0].geom_type
        print(f"检测到几何类型: {geom_type}")
    else:
        geom_type = geometry_type
    
    results = []
    
    # 处理每个要素
    for idx, row in gdf.iterrows():
        geom = row.geometry
        
        if geom.is_empty:
            continue
        
        # 根据几何类型处理
        if geom_type == "Polygon" or geom.geom_type == "Polygon":
            # 多边形：提取外环坐标
            coords = list(geom.exterior.coords)
            # 转换为 [lon, lat, lon, lat, ...] 格式
            coord_array = []
            for lon, lat in coords:
                coord_array.extend([lon, lat])
            results.append(coord_array)
            
        elif geom_type == "LineString" or geom.geom_type == "LineString":
            # 线要素：提取坐标
            coords = list(geom.coords)
            coord_array = []
            for lon, lat in coords:
                coord_array.extend([lon, lat])
            results.append(coord_array)
            
        elif geom_type == "Point" or geom.geom_type == "Point":
            # 点要素：提取坐标
            lon, lat = geom.x, geom.y
            results.append([lon, lat])
            
        elif geom.geom_type == "MultiPolygon":
            # 多多边形：取第一个多边形
            first_poly = geom.geoms[0]
            coords = list(first_poly.exterior.coords)
            coord_array = []
            for lon, lat in coords:
                coord_array.extend([lon, lat])
            results.append(coord_array)
            
        elif geom.geom_type == "MultiLineString":
            # 多线：取第一条线
            first_line = geom.geoms[0]
            coords = list(first_line.coords)
            coord_array = []
            for lon, lat in coords:
                coord_array.extend([lon, lat])
            results.append(coord_array)
    
    # 生成 JavaScript 代码
    if len(results) == 1:
        # 单个要素，直接输出数组
        coord_str = format_coords_array(results[0])
        js_code = f"const {var_name} = [\n{coord_str}\n];"
    else:
        # 多个要素，输出对象数组格式
        js_code = f"const {var_name} = [\n"
        for i, coords in enumerate(results):
            coord_str = format_coords_array(coords, indent=2)
            # 尝试获取名称属性
            name = row.get('name', f'item{i+1}') if i < len(gdf) else f'item{i+1}'
            js_code += f"  {{\n    name: \"{name}\",\n    positions: [\n{coord_str}\n    ],\n  }},\n"
        js_code += "];"
    
    # 输出结果
    if output_path:
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(js_code)
        print(f"\n✓ 转换完成！输出文件: {output_path}")
    else:
        print("\n" + "="*60)
        print(js_code)
        print("="*60)
    
    return js_code


def format_coords_array(coords, line_length=6, indent=0):
    """格式化坐标数组，每行显示指定数量的坐标对"""
    indent_str = " " * indent
    lines = []
    current_line = []
    
    for i in range(0, len(coords), 2):
        if i + 1 < len(coords):
            lon = coords[i]
            lat = coords[i + 1]
            current_line.append(f"{lon}, {lat}")
            
            if len(current_line) >= line_length:
                lines.append(indent_str + "  " + ", ".join(current_line) + ",")
                current_line = []
    
    # 添加剩余坐标
    if current_line:
        lines.append(indent_str + "  " + ", ".join(current_line) + ",")
    
    return "\n".join(lines).rstrip(",")  # 移除最后一行的逗号


def main():
    parser = argparse.ArgumentParser(description='将 SHP 文件转换为 JavaScript 坐标数组')
    parser.add_argument('input', help='输入的 SHP 文件路径')
    parser.add_argument('-o', '--output', help='输出文件路径（可选）')
    parser.add_argument('-n', '--name', default='ListGuanQu', help='JavaScript 变量名（默认: ListGuanQu）')
    parser.add_argument('-t', '--type', default='auto', 
                       choices=['auto', 'Polygon', 'LineString', 'Point'],
                       help='几何类型（默认: auto 自动检测）')
    
    args = parser.parse_args()
    
    if not Path(args.input).exists():
        print(f"错误: 文件不存在: {args.input}")
        sys.exit(1)
    
    try:
        shp_to_coords_array(args.input, args.output, args.name, args.type)
    except Exception as e:
        print(f"错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

