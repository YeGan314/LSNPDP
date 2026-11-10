#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
栅格数据范围内面积统计脚本
支持指定经纬度范围，统计该范围内各污染风险等级的面积

使用方法:
1. 直接运行，使用预设范围
2. 修改 BOUNDS 变量自定义范围
3. 或者调用 calculate_risk_areas_in_bounds() 函数传入自定义范围
"""

import rasterio
from rasterio.windows import from_bounds
import numpy as np
import json

# 预设范围示例（可修改）
BOUNDS = {
    'minLon': 112.5,   # 最小经度
    'maxLon': 113.5,   # 最大经度
    'minLat': 28.5,    # 最小纬度
    'maxLat': 29.5     # 最大纬度
}

# 像素面积（100米 × 100米）
PIXEL_AREA_M2 = 10000

def calculate_risk_areas_in_bounds(tif_path, bounds, pixel_area_m2=10000):
    """
    统计指定范围内各风险等级的面积
    
    Args:
        tif_path: TIF文件路径
        bounds: 范围字典 {'minLon': x, 'maxLon': x, 'minLat': x, 'maxLat': x}
        pixel_area_m2: 每个像素的面积（平方米）
    
    Returns:
        dict: 统计结果
    """
    print(f"正在打开文件: {tif_path}")
    print(f"\n分析范围:")
    print(f"  经度: {bounds['minLon']} - {bounds['maxLon']}")
    print(f"  纬度: {bounds['minLat']} - {bounds['maxLat']}")
    
    with rasterio.open(tif_path) as dataset:
        # 显示完整栅格信息
        print(f"\n完整栅格信息:")
        print(f"  尺寸: {dataset.width} × {dataset.height} = {dataset.width * dataset.height:,} 个像素")
        print(f"  边界: {dataset.bounds}")
        print(f"  坐标系: {dataset.crs}")
        
        # 计算指定范围的窗口
        try:
            window = from_bounds(
                bounds['minLon'], 
                bounds['minLat'], 
                bounds['maxLon'], 
                bounds['maxLat'],
                dataset.transform
            )
            
            # 确保窗口在有效范围内
            window = window.intersection(
                rasterio.windows.Window(0, 0, dataset.width, dataset.height)
            )
            
            print(f"\n读取窗口:")
            print(f"  行范围: {int(window.row_off)} - {int(window.row_off + window.height)}")
            print(f"  列范围: {int(window.col_off)} - {int(window.col_off + window.width)}")
            print(f"  窗口尺寸: {int(window.width)} × {int(window.height)} = {int(window.width * window.height):,} 个像素")
            
        except Exception as e:
            print(f"\n❌ 错误: 无法创建窗口 - {e}")
            print("   请检查范围是否在栅格数据范围内")
            return None
        
        # 读取指定窗口的数据
        print("\n正在读取范围内的栅格数据...")
        data = dataset.read(1, window=window)
        
        # 获取NoData值并过滤
        nodata = dataset.nodata
        if nodata is not None and not np.isnan(nodata):
            valid_data = data[data != nodata]
        else:
            # 过滤NaN值
            valid_data = data[~np.isnan(data)]
        
        print(f"  窗口内总像素: {data.size:,}")
        print(f"  有效像素数: {len(valid_data):,}")
        print(f"  NoData像素: {data.size - len(valid_data):,}")
        
        # 统计各值的数量
        unique, counts = np.unique(valid_data, return_counts=True)
        value_counts = dict(zip(unique, counts))
        
        print(f"  发现 {len(unique)} 个不同的像素值")
        
        # 统计结果
        results = {
            'file': tif_path,
            'bounds': bounds,
            'window_pixels': int(data.size),
            'valid_pixels': len(valid_data),
            'nodata_pixels': int(data.size - len(valid_data)),
            'pixel_area_m2': pixel_area_m2,
            'risk_levels': {}
        }
        
        # 输出统计结果
        print("\n" + "="*70)
        print("指定范围内污染风险等级面积统计")
        print("="*70)
        
        total_risk_area = 0
        total_risk_pixels = 0
        
        for value in sorted(value_counts.keys()):
            count = int(value_counts[value])
            area_m2 = count * pixel_area_m2
            area_km2 = area_m2 / 1_000_000
            area_hectare = area_m2 / 10_000
            percentage = (count / len(valid_data)) * 100 if len(valid_data) > 0 else 0
            
            # 判断是否为风险等级 1-5
            if value in [1, 2, 3, 4, 5]:
                results['risk_levels'][int(value)] = {
                    'pixel_count': count,
                    'area_m2': area_m2,
                    'area_km2': area_km2,
                    'area_hectare': area_hectare,
                    'percentage': round(percentage, 2)
                }
                
                total_risk_area += area_m2
                total_risk_pixels += count
                
                print(f"\n风险等级 {int(value)}:")
                print(f"  像素数量: {count:,}")
                print(f"  面积: {area_m2:,.2f} m²")
                print(f"  面积: {area_km2:.4f} km²")
                print(f"  面积: {area_hectare:.2f} 公顷")
                print(f"  占比: {percentage:.2f}%")
        
        print("\n" + "="*70)
        print(f"范围内风险区域汇总:")
        print(f"  总像素数: {total_risk_pixels:,}")
        print(f"  总面积: {total_risk_area:,.2f} m²")
        print(f"  总面积: {total_risk_area/1_000_000:.4f} km²")
        print(f"  总面积: {total_risk_area/10_000:.2f} 公顷")
        print("="*70)
        
        return results

def calculate_polygon_area(tif_path, polygon_coords, pixel_area_m2=10000):
    """
    统计多边形范围内各风险等级的面积
    
    Args:
        tif_path: TIF文件路径
        polygon_coords: 多边形坐标数组 [[lon1, lat1], [lon2, lat2], ...]
        pixel_area_m2: 每个像素的面积（平方米）
    
    Returns:
        dict: 统计结果
    """
    from rasterio.mask import mask
    from shapely.geometry import Polygon
    
    print(f"正在打开文件: {tif_path}")
    print(f"\n多边形顶点数: {len(polygon_coords)}")
    
    # 创建多边形几何对象
    polygon = Polygon(polygon_coords)
    
    with rasterio.open(tif_path) as dataset:
        print(f"\n完整栅格信息:")
        print(f"  尺寸: {dataset.width} × {dataset.height}")
        print(f"  边界: {dataset.bounds}")
        
        # 使用多边形裁剪栅格
        print("\n正在裁剪多边形范围...")
        out_image, out_transform = mask(dataset, [polygon], crop=True, nodata=np.nan)
        
        # 获取裁剪后的数据
        data = out_image[0]
        
        # 过滤NoData
        valid_data = data[~np.isnan(data)]
        
        print(f"  裁剪后像素: {data.size:,}")
        print(f"  有效像素数: {len(valid_data):,}")
        
        # 统计各值的数量
        unique, counts = np.unique(valid_data, return_counts=True)
        value_counts = dict(zip(unique, counts))
        
        # 统计结果
        results = {
            'file': tif_path,
            'polygon_vertices': len(polygon_coords),
            'polygon_bounds': list(polygon.bounds),
            'total_pixels': int(data.size),
            'valid_pixels': len(valid_data),
            'pixel_area_m2': pixel_area_m2,
            'risk_levels': {}
        }
        
        print("\n" + "="*70)
        print("多边形范围内污染风险等级面积统计")
        print("="*70)
        
        total_risk_area = 0
        total_risk_pixels = 0
        
        for value in sorted(value_counts.keys()):
            count = int(value_counts[value])
            area_m2 = count * pixel_area_m2
            area_km2 = area_m2 / 1_000_000
            area_hectare = area_m2 / 10_000
            percentage = (count / len(valid_data)) * 100 if len(valid_data) > 0 else 0
            
            if value in [1, 2, 3, 4, 5]:
                results['risk_levels'][int(value)] = {
                    'pixel_count': count,
                    'area_m2': area_m2,
                    'area_km2': area_km2,
                    'area_hectare': area_hectare,
                    'percentage': round(percentage, 2)
                }
                
                total_risk_area += area_m2
                total_risk_pixels += count
                
                print(f"\n风险等级 {int(value)}:")
                print(f"  像素数量: {count:,}")
                print(f"  面积: {area_m2:,.2f} m²")
                print(f"  面积: {area_km2:.4f} km²")
                print(f"  面积: {area_hectare:.2f} 公顷")
                print(f"  占比: {percentage:.2f}%")
        
        print("\n" + "="*70)
        print(f"多边形内风险区域汇总:")
        print(f"  总像素数: {total_risk_pixels:,}")
        print(f"  总面积: {total_risk_area:,.2f} m²")
        print(f"  总面积: {total_risk_area/1_000_000:.4f} km²")
        print(f"  总面积: {total_risk_area/10_000:.2f} 公顷")
        print("="*70)
        
        return results

def export_to_json(results, output_path):
    """导出结果为JSON"""
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n✅ JSON结果已导出到: {output_path}")

def export_to_csv(results, output_path):
    """导出结果为CSV"""
    import csv
    
    with open(output_path, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        writer.writerow(['风险等级', '像素数量', '面积(m²)', '面积(km²)', '面积(公顷)', '占比(%)'])
        
        total_pixels = 0
        total_area_m2 = 0
        
        for level in sorted(results['risk_levels'].keys()):
            data = results['risk_levels'][level]
            writer.writerow([
                level,
                data['pixel_count'],
                f"{data['area_m2']:.2f}",
                f"{data['area_km2']:.4f}",
                f"{data['area_hectare']:.2f}",
                data['percentage']
            ])
            total_pixels += data['pixel_count']
            total_area_m2 += data['area_m2']
        
        # 添加总计行
        writer.writerow([
            '总计',
            total_pixels,
            f"{total_area_m2:.2f}",
            f"{total_area_m2/1_000_000:.4f}",
            f"{total_area_m2/10_000:.2f}",
            100.00
        ])
    
    print(f"✅ CSV结果已导出到: {output_path}")

if __name__ == '__main__':
    tif_path = r'f:\code\GQWR\geodata\risk_shange_2000.tif'
    
    print("🚀 开始统计指定范围内的栅格数据...")
    print("="*70)
    
    # 方式1: 使用矩形范围（经纬度边界框）
    print("\n【方式1: 矩形范围统计】")
    bounds = {
        'minLon': 112.5,
        'maxLon': 113.0,
        'minLat': 28.5,
        'maxLat': 29.0
    }
    
    try:
        results = calculate_risk_areas_in_bounds(tif_path, bounds, PIXEL_AREA_M2)
        
        if results:
            # 导出结果
            print("\n📊 导出统计结果...")
            export_to_json(results, r'f:\code\GQWR\geodata\risk_area_bounds_stats.json')
            export_to_csv(results, r'f:\code\GQWR\geodata\risk_area_bounds_stats.csv')
    except Exception as e:
        print(f"\n❌ 错误: {e}")
        import traceback
        traceback.print_exc()
    
    # 方式2: 使用多边形范围（需要安装 shapely: pip install shapely）
    print("\n\n【方式2: 多边形范围统计】")
    print("提示: 需要安装 shapely 库")
    print("安装命令: pip install shapely")
    
    try:
        # 示例多边形坐标（从 geo.js 中的北洲河坐标）
        polygon_coords = [
            [112.957262992859, 28.874103168171],
            [112.954859733582, 28.871397356238],
            [112.952284812927, 28.868616309441],
            [112.950911521912, 28.866211019762],
            [112.950267791748, 28.865384188578],
            [112.95069694519, 28.863617754469],
            [112.950739860535, 28.862903655564],
            [112.94988155365, 28.86061098908],
            [112.949023246765, 28.858618959117],
            [112.948937416077, 28.857829653669],
            [112.957262992859, 28.874103168171]  # 闭合多边形
        ]
        
        results_polygon = calculate_polygon_area(tif_path, polygon_coords, PIXEL_AREA_M2)
        
        if results_polygon:
            print("\n📊 导出多边形统计结果...")
            export_to_json(results_polygon, r'f:\code\GQWR\geodata\risk_area_polygon_stats.json')
            export_to_csv(results_polygon, r'f:\code\GQWR\geodata\risk_area_polygon_stats.csv')
            
    except ImportError:
        print("\n⚠️ 未安装 shapely，跳过多边形统计")
        print("   安装命令: pip install shapely")
    except Exception as e:
        print(f"\n❌ 多边形统计错误: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n✅ 统计完成！")
