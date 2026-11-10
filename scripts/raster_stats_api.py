#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
栅格统计分析 REST API 服务

安装依赖:
pip install flask flask-cors rasterio numpy shapely

启动服务:
python raster_stats_api.py

API端点:
- POST /api/stats/bounds - 矩形范围统计
- POST /api/stats/polygon - 多边形范围统计
- GET /api/health - 健康检查
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import rasterio
from rasterio.windows import from_bounds
from rasterio.mask import mask
import numpy as np
import os
from shapely.geometry import Polygon
import traceback
import geopandas as gpd
from shapely.geometry import shape, mapping

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 默认配置
DEFAULT_PIXEL_SIZE = 100  # 默认格网大小（米）

# 默认 TIF 文件路径（使用绝对路径）
DEFAULT_TIF_PATH = "/Users/mac/Documents/cursor-gqwr/GQWR/geodata/risk_shange_2000.tif"

def calculate_pixel_area(pixel_size_m):
    """根据格网大小计算像素面积"""
    return pixel_size_m * pixel_size_m

def analyze_bounds_data(tif_path, min_lon, max_lon, min_lat, max_lat, pixel_size_m=100):
    """
    分析矩形范围内的栅格数据
    
    Args:
        tif_path: TIF文件路径
        min_lon, max_lon, min_lat, max_lat: 范围边界
        pixel_size_m: 格网大小（米）
    
    Returns:
        dict: 统计结果
    """
    pixel_area_m2 = calculate_pixel_area(pixel_size_m)
    
    with rasterio.open(tif_path) as dataset:
        # 创建窗口
        window = from_bounds(min_lon, min_lat, max_lon, max_lat, dataset.transform)
        window = window.intersection(
            rasterio.windows.Window(0, 0, dataset.width, dataset.height)
        )
        
        # 读取数据
        data = dataset.read(1, window=window)
        valid_data = data[~np.isnan(data)]
        
        if len(valid_data) == 0:
            return {
                'success': False,
                'message': '该范围内没有有效数据'
            }
        
        # 统计各值的数量
        unique, counts = np.unique(valid_data, return_counts=True)
        value_counts = dict(zip(unique, counts))
        
        # 构建结果
        risk_levels = []
        total_area_m2 = 0
        total_pixels = 0
        
        for value in sorted(value_counts.keys()):
            if value in [1, 2, 3, 4, 5]:
                count = int(value_counts[value])
                area_m2 = count * pixel_area_m2
                area_km2 = area_m2 / 1_000_000
                area_hectare = area_m2 / 10_000
                percentage = (count / len(valid_data)) * 100
                
                risk_levels.append({
                    'level': int(value),
                    'pixel_count': count,
                    'area_m2': round(area_m2, 2),
                    'area_km2': round(area_km2, 4),
                    'area_hectare': round(area_hectare, 2),
                    'percentage': round(percentage, 2)
                })
                
                total_area_m2 += area_m2
                total_pixels += count
        
        return {
            'success': True,
            'data': {
                'bounds': {
                    'minLon': min_lon,
                    'maxLon': max_lon,
                    'minLat': min_lat,
                    'maxLat': max_lat
                },
                'pixel_size_m': pixel_size_m,
                'total_pixels': total_pixels,
                'valid_pixels': len(valid_data),
                'total_area_m2': round(total_area_m2, 2),
                'total_area_km2': round(total_area_m2 / 1_000_000, 4),
                'total_area_hectare': round(total_area_m2 / 10_000, 2),
                'risk_levels': risk_levels
            }
        }

def analyze_polygon_data(tif_path, coordinates, pixel_size_m=100):
    """
    分析多边形范围内的栅格数据
    
    Args:
        tif_path: TIF文件路径
        coordinates: 多边形坐标数组 [[lon, lat], ...]
        pixel_size_m: 格网大小（米）
    
    Returns:
        dict: 统计结果
    """
    pixel_area_m2 = calculate_pixel_area(pixel_size_m)
    
    # 创建多边形
    polygon = Polygon(coordinates)
    
    with rasterio.open(tif_path) as dataset:
        # 使用多边形裁剪栅格
        out_image, out_transform = mask(dataset, [polygon], crop=True, nodata=np.nan)
        
        # 获取数据
        data = out_image[0]
        valid_data = data[~np.isnan(data)]
        
        if len(valid_data) == 0:
            return {
                'success': False,
                'message': '多边形范围内没有有效数据'
            }
        
        # 统计各值的数量
        unique, counts = np.unique(valid_data, return_counts=True)
        value_counts = dict(zip(unique, counts))
        
        # 构建结果
        risk_levels = []
        total_area_m2 = 0
        total_pixels = 0
        
        for value in sorted(value_counts.keys()):
            if value in [1, 2, 3, 4, 5]:
                count = int(value_counts[value])
                area_m2 = count * pixel_area_m2
                area_km2 = area_m2 / 1_000_000
                area_hectare = area_m2 / 10_000
                percentage = (count / len(valid_data)) * 100
                
                risk_levels.append({
                    'level': int(value),
                    'pixel_count': count,
                    'area_m2': round(area_m2, 2),
                    'area_km2': round(area_km2, 4),
                    'area_hectare': round(area_hectare, 2),
                    'percentage': round(percentage, 2)
                })
                
                total_area_m2 += area_m2
                total_pixels += count
        
        return {
            'success': True,
            'data': {
                'polygon': {
                    'vertices': len(coordinates),
                    'bounds': list(polygon.bounds)
                },
                'pixel_size_m': pixel_size_m,
                'total_pixels': total_pixels,
                'valid_pixels': len(valid_data),
                'total_area_m2': round(total_area_m2, 2),
                'total_area_km2': round(total_area_m2 / 1_000_000, 4),
                'total_area_hectare': round(total_area_m2 / 10_000, 2),
                'risk_levels': risk_levels
            }
        }

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查"""
    return jsonify({
        'status': 'ok',
        'service': 'Raster Statistics API',
        'version': '1.0.0'
    })

@app.route('/api/stats/bounds', methods=['POST'])
def stats_by_bounds():
    """
    矩形范围统计
    
    请求体示例:
    {
        "tif_path": "f:/code/GQWR/geodata/risk_shange_2000.tif",  // 可选，默认使用配置的路径
        "bounds": {
            "minLon": 112.5,
            "maxLon": 113.0,
            "minLat": 28.5,
            "maxLat": 29.0
        },
        "pixel_size_m": 100  // 可选，默认100米
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': '请求体不能为空'
            }), 400
        
        # 获取参数
        tif_path = data.get('tif_path', DEFAULT_TIF_PATH)
        bounds = data.get('bounds')
        pixel_size_m = data.get('pixel_size_m', DEFAULT_PIXEL_SIZE)
        
        # 验证参数
        if not bounds:
            return jsonify({
                'success': False,
                'error': '缺少 bounds 参数'
            }), 400
        
        required_keys = ['minLon', 'maxLon', 'minLat', 'maxLat']
        if not all(key in bounds for key in required_keys):
            return jsonify({
                'success': False,
                'error': f'bounds 必须包含: {", ".join(required_keys)}'
            }), 400
        
        # 验证文件存在
        if not os.path.exists(tif_path):
            return jsonify({
                'success': False,
                'error': f'TIF文件不存在: {tif_path}'
            }), 404
        
        # 执行分析
        result = analyze_bounds_data(
            tif_path,
            bounds['minLon'],
            bounds['maxLon'],
            bounds['minLat'],
            bounds['maxLat'],
            pixel_size_m
        )
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

@app.route('/api/stats/polygon', methods=['POST'])
def stats_by_polygon():
    """
    多边形范围统计
    
    请求体示例:
    {
        "tif_path": "f:/code/GQWR/geodata/risk_shange_2000.tif",  // 可选
        "coordinates": [
            [112.957, 28.874],
            [112.954, 28.871],
            [112.952, 28.868],
            [112.957, 28.874]  // 闭合多边形
        ],
        "pixel_size_m": 100  // 可选
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': '请求体不能为空'
            }), 400
        
        # 获取参数
        tif_path = data.get('tif_path', DEFAULT_TIF_PATH)
        coordinates = data.get('coordinates')
        pixel_size_m = data.get('pixel_size_m', DEFAULT_PIXEL_SIZE)
        
        # 验证参数
        if not coordinates:
            return jsonify({
                'success': False,
                'error': '缺少 coordinates 参数'
            }), 400
        
        if not isinstance(coordinates, list) or len(coordinates) < 3:
            return jsonify({
                'success': False,
                'error': 'coordinates 必须是至少包含3个点的数组'
            }), 400
        
        # 验证文件存在
        if not os.path.exists(tif_path):
            return jsonify({
                'success': False,
                'error': f'TIF文件不存在: {tif_path}'
            }), 404
        
        # 执行分析
        result = analyze_polygon_data(tif_path, coordinates, pixel_size_m)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

@app.route('/api/stats/batch', methods=['POST'])
def stats_batch():
    """
    批量统计多个范围
    
    请求体示例:
    {
        "tif_path": "f:/code/GQWR/geodata/risk_shange_2000.tif",
        "pixel_size_m": 100,
        "ranges": [
            {
                "name": "区域A",
                "type": "bounds",
                "bounds": {"minLon": 112.5, "maxLon": 113.0, "minLat": 28.5, "maxLat": 29.0}
            },
            {
                "name": "区域B",
                "type": "polygon",
                "coordinates": [[112.957, 28.874], [112.954, 28.871], [112.952, 28.868], [112.957, 28.874]]
            }
        ]
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': '请求体不能为空'
            }), 400
        
        tif_path = data.get('tif_path', DEFAULT_TIF_PATH)
        pixel_size_m = data.get('pixel_size_m', DEFAULT_PIXEL_SIZE)
        ranges = data.get('ranges', [])
        
        if not ranges:
            return jsonify({
                'success': False,
                'error': '缺少 ranges 参数'
            }), 400
        
        # 验证文件存在
        if not os.path.exists(tif_path):
            return jsonify({
                'success': False,
                'error': f'TIF文件不存在: {tif_path}'
            }), 404
        
        # 批量处理
        results = {}
        
        for range_info in ranges:
            name = range_info.get('name', f'Range_{len(results) + 1}')
            range_type = range_info.get('type')
            
            try:
                if range_type == 'bounds':
                    bounds = range_info.get('bounds')
                    result = analyze_bounds_data(
                        tif_path,
                        bounds['minLon'],
                        bounds['maxLon'],
                        bounds['minLat'],
                        bounds['maxLat'],
                        pixel_size_m
                    )
                elif range_type == 'polygon':
                    coordinates = range_info.get('coordinates')
                    result = analyze_polygon_data(tif_path, coordinates, pixel_size_m)
                else:
                    result = {
                        'success': False,
                        'error': f'未知的类型: {range_type}'
                    }
                
                results[name] = result
                
            except Exception as e:
                results[name] = {
                    'success': False,
                    'error': str(e)
                }
        
        return jsonify({
            'success': True,
            'results': results
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

def analyze_admin_division(tif_path, admin_shp, admin_code=None, level_field='code', name_field='name', pixel_size_m=100):
    """
    按行政区划统计风险区域
    
    Args:
        tif_path: 风险栅格图路径
        admin_shp: 行政区划Shapefile路径
        admin_code: 可选，指定行政区划代码
        level_field: 行政区划代码字段名
        name_field: 行政区划名称字段名
        pixel_size_m: 格网大小（米）
    
    Returns:
        dict: 统计结果
    """
    try:
        # 1. 读取行政区划数据
        gdf = gpd.read_file(admin_shp)
        
        # 2. 筛选指定代码的行政区划
        if admin_code:
            gdf = gdf[gdf[level_field].astype(str).str.startswith(str(admin_code))]
        
        results = []
        
        with rasterio.open(tif_path) as src:
            # 3. 遍历每个行政区划
            for _, row in gdf.iterrows():
                try:
                    # 4. 获取行政区划几何
                    geometry = row.geometry
                    
                    # 5. 裁剪栅格
                    out_image, out_transform = mask(
                        src, 
                        [mapping(geometry)], 
                        crop=True, 
                        nodata=np.nan
                    )
                    
                    # 6. 统计风险等级
                    data = out_image[0]
                    valid_data = data[~np.isnan(data)]
                    
                    if len(valid_data) > 0:
                        unique, counts = np.unique(valid_data, return_counts=True)
                        value_counts = dict(zip(unique, counts))
                        
                        # 7. 计算面积和比例
                        pixel_area = abs(out_transform[0] * out_transform[4])  # 像素面积（平方米）
                        total_area = len(valid_data) * pixel_area
                        
                        risk_levels = []
                        for level in [1, 2, 3, 4, 5]:
                            count = int(value_counts.get(level, 0))
                            area = count * pixel_area
                            risk_levels.append({
                                'level': level,
                                'pixel_count': count,
                                'area_m2': round(area, 2),
                                'area_km2': round(area / 1_000_000, 4),
                                'area_hectare': round(area / 10_000, 2),
                                'percentage': round((count / len(valid_data)) * 100, 2) if len(valid_data) > 0 else 0
                            })
                        
                        results.append({
                            'admin_code': str(row[level_field]),
                            'admin_name': str(row[name_field]),
                            'total_pixels': len(valid_data),
                            'total_area_m2': round(total_area, 2),
                            'total_area_km2': round(total_area / 1_000_000, 4),
                            'total_area_hectare': round(total_area / 10_000, 2),
                            'risk_levels': risk_levels
                        })
                except Exception as e:
                    print(f"处理行政区划 {row.get(name_field, '未知')} 时出错: {str(e)}")
                    continue
        
        return {
            'success': True,
            'data': {
                'total_areas': len(results),
                'statistics': results
            }
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }

@app.route('/api/stats/admin_division', methods=['POST'])
def stats_by_admin_division():
    """
    行政区划统计
    
    请求体示例:
    {
        "tif_path": "path/to/risk_map.tif",  // 可选，默认使用配置的路径
        "admin_shp": "path/to/admin_divisions.shp",  // 必填，行政区划数据路径
        "admin_code": "430000",  // 可选，指定行政区划代码
        "level_field": "code",   // 可选，行政区划代码字段名
        "name_field": "name",    // 可选，行政区划名称字段名
        "pixel_size_m": 100      // 可选，格网大小（米）
    }
    """
    try:
        data = request.get_json()
        
        # 获取参数
        tif_path = data.get('tif_path', DEFAULT_TIF_PATH)
        admin_shp = data.get('admin_shp')
        admin_code = data.get('admin_code')
        level_field = data.get('level_field', 'code')
        name_field = data.get('name_field', 'name')
        pixel_size_m = data.get('pixel_size_m', DEFAULT_PIXEL_SIZE)
        
        # 参数检查
        if not admin_shp:
            return jsonify({
                'success': False,
                'error': '缺少必要参数: admin_shp'
            }), 400
            
        if not os.path.exists(tif_path) or not os.path.exists(admin_shp):
            return jsonify({
                'success': False,
                'error': '文件不存在',
                'tif_exists': os.path.exists(tif_path),
                'shp_exists': os.path.exists(admin_shp)
            }), 404
        
        # 执行统计
        result = analyze_admin_division(
            tif_path=tif_path,
            admin_shp=admin_shp,
            admin_code=admin_code,
            level_field=level_field,
            name_field=name_field,
            pixel_size_m=pixel_size_m
        )
        
        if not result['success']:
            return jsonify(result), 500
            
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

if __name__ == '__main__':
    print("="*70)
    print("🚀 栅格统计分析 API 服务")
    print("="*70)
    print(f"\n默认TIF路径: {DEFAULT_TIF_PATH}")
    print(f"默认格网大小: {DEFAULT_PIXEL_SIZE}米")
    print("\nAPI端点:")
    print("  - GET  http://localhost:3000/api/health")
    print("  - POST http://localhost:3000/api/stats/bounds")
    print("  - POST http://localhost:3000/api/stats/polygon")
    print("  - POST http://localhost:3000/api/stats/batch")
    print("  - POST http://localhost:3000/api/stats/admin_division")
    print("\n启动服务...")
    print("="*70)
    
    app.run(host='0.0.0.0', port=3000, debug=True)
