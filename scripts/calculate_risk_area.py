#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
栅格数据面积统计脚本
统计 risk_shange_2000.tif 中各污染风险等级的面积
"""

from osgeo import gdal
import numpy as np
import json

def calculate_risk_areas(tif_path):
    """
    统计栅格数据中各风险等级的面积
    
    Args:
        tif_path: TIF文件路径
    
    Returns:
        dict: 统计结果
    """
    # 打开栅格数据
    dataset = gdal.Open(tif_path)
    if dataset is None:
        raise Exception(f"无法打开文件: {tif_path}")
    
    # 获取栅格信息
    band = dataset.GetRasterBand(1)
    cols = dataset.RasterXSize
    rows = dataset.RasterYSize
    
    # 获取地理转换参数
    geotransform = dataset.GetGeoTransform()
    pixel_width = abs(geotransform[1])   # 像素宽度（度）
    pixel_height = abs(geotransform[5])  # 像素高度（度）
    
    print(f"栅格尺寸: {cols} × {rows} = {cols * rows:,} 个像素")
    print(f"像素大小: {pixel_width}° × {pixel_height}°")
    
    # 读取所有数据
    print("\n正在读取栅格数据...")
    data = band.ReadAsArray()
    
    # 统计各值的像素数量
    unique, counts = np.unique(data, return_counts=True)
    value_counts = dict(zip(unique, counts))
    
    print(f"\n发现 {len(unique)} 个不同的像素值")
    
    # 计算每个像素的面积（平方米）
    # 注意：这里假设是等经纬度投影，需要根据纬度修正
    # 简化计算：使用平均纬度
    
    # 如果有投影信息，使用投影坐标系
    projection = dataset.GetProjection()
    
    if 'PROJCS' in projection:
        # 投影坐标系，直接使用像素大小
        # 假设单位是米
        pixel_area_m2 = pixel_width * pixel_height
        print(f"投影坐标系，像素面积: {pixel_area_m2} 平方米")
    else:
        # 地理坐标系（经纬度），需要转换
        # 在中纬度地区，1度约等于111km
        # 这里使用近似值：100米×100米 = 10000平方米
        pixel_area_m2 = 10000  # 根据您提供的信息：100米×100米
        print(f"地理坐标系，使用固定像素面积: {pixel_area_m2} 平方米 (100m×100m)")
    
    # 统计结果
    results = {
        'file': tif_path,
        'total_pixels': int(cols * rows),
        'pixel_area_m2': pixel_area_m2,
        'risk_levels': {}
    }
    
    print("\n" + "="*60)
    print("污染风险等级面积统计")
    print("="*60)
    
    total_area = 0
    for value in sorted(value_counts.keys()):
        count = int(value_counts[value])
        area_m2 = count * pixel_area_m2
        area_km2 = area_m2 / 1_000_000
        percentage = (count / (cols * rows)) * 100
        
        # 只统计风险等级 1-5
        if value in [1, 2, 3, 4, 5]:
            results['risk_levels'][int(value)] = {
                'pixel_count': count,
                'area_m2': area_m2,
                'area_km2': area_km2,
                'percentage': round(percentage, 2)
            }
            
            total_area += area_m2
            
            print(f"风险等级 {int(value)}: ")
            print(f"  像素数量: {count:,}")
            print(f"  面积: {area_m2:,.2f} m² ({area_km2:.4f} km²)")
            print(f"  占比: {percentage:.2f}%")
            print()
        elif value == 0 or np.isnan(value):
            print(f"NoData/背景值 ({value}): {count:,} 像素")
        else:
            print(f"其他值 ({value}): {count:,} 像素")
    
    print("="*60)
    print(f"风险区域总面积: {total_area:,.2f} m² ({total_area/1_000_000:.4f} km²)")
    print("="*60)
    
    # 关闭数据集
    dataset = None
    
    return results

def export_to_json(results, output_path):
    """导出结果为JSON"""
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n结果已导出到: {output_path}")

def export_to_csv(results, output_path):
    """导出结果为CSV"""
    import csv
    
    with open(output_path, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        writer.writerow(['风险等级', '像素数量', '面积(m²)', '面积(km²)', '占比(%)'])
        
        for level in sorted(results['risk_levels'].keys()):
            data = results['risk_levels'][level]
            writer.writerow([
                level,
                data['pixel_count'],
                f"{data['area_m2']:.2f}",
                f"{data['area_km2']:.4f}",
                data['percentage']
            ])
    
    print(f"结果已导出到: {output_path}")

if __name__ == '__main__':
    # TIF文件路径
    tif_path = r'f:\code\GQWR\geodata\risk_shange_2000.tif'
    
    try:
        # 计算面积
        results = calculate_risk_areas(tif_path)
        
        # 导出结果
        export_to_json(results, r'f:\code\GQWR\geodata\risk_area_stats.json')
        export_to_csv(results, r'f:\code\GQWR\geodata\risk_area_stats.csv')
        
    except Exception as e:
        print(f"错误: {e}")
        import traceback
        traceback.print_exc()
