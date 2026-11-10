#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
交互式栅格风险等级统计工具
支持通过命令行输入范围进行统计
"""

import rasterio
from rasterio.windows import from_bounds
import numpy as np
import json
import sys

PIXEL_AREA_M2 = 10000  # 100m × 100m

def analyze_bounds(tif_path, min_lon, max_lon, min_lat, max_lat):
    """分析指定范围"""
    bounds = {
        'minLon': min_lon,
        'maxLon': max_lon,
        'minLat': min_lat,
        'maxLat': max_lat
    }
    
    print(f"\n📍 分析范围:")
    print(f"   经度: {min_lon} - {max_lon}")
    print(f"   纬度: {min_lat} - {max_lat}")
    
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
            print("\n⚠️ 该范围内没有有效数据")
            return None
        
        # 统计
        unique, counts = np.unique(valid_data, return_counts=True)
        value_counts = dict(zip(unique, counts))
        
        print(f"\n📊 统计结果:")
        print(f"   有效像素: {len(valid_data):,}")
        print("   " + "="*60)
        
        results = []
        total_area = 0
        
        for value in sorted(value_counts.keys()):
            if value in [1, 2, 3, 4, 5]:
                count = int(value_counts[value])
                area_m2 = count * PIXEL_AREA_M2
                area_km2 = area_m2 / 1_000_000
                percentage = (count / len(valid_data)) * 100
                
                results.append({
                    'level': int(value),
                    'count': count,
                    'area_m2': area_m2,
                    'area_km2': area_km2,
                    'percentage': percentage
                })
                
                total_area += area_m2
                
                print(f"   风险等级 {int(value)}: {count:,} 像素 | "
                      f"{area_km2:.2f} km² | {percentage:.1f}%")
        
        print("   " + "="*60)
        print(f"   总面积: {total_area/1_000_000:.2f} km²")
        
        return results

def interactive_mode():
    """交互式模式"""
    tif_path = r'f:\code\GQWR\geodata\risk_shange_2000.tif'
    
    print("="*70)
    print("🌍 栅格风险等级统计工具 - 交互式模式")
    print("="*70)
    
    # 显示栅格范围
    with rasterio.open(tif_path) as dataset:
        bounds = dataset.bounds
        print(f"\n栅格数据范围:")
        print(f"  经度: {bounds.left:.4f} - {bounds.right:.4f}")
        print(f"  纬度: {bounds.bottom:.4f} - {bounds.top:.4f}")
    
    print("\n请输入要分析的范围（直接回车使用示例范围）:")
    
    # 输入范围
    try:
        min_lon_input = input(f"  最小经度 [112.5]: ").strip()
        min_lon = float(min_lon_input) if min_lon_input else 112.5
        
        max_lon_input = input(f"  最大经度 [113.0]: ").strip()
        max_lon = float(max_lon_input) if max_lon_input else 113.0
        
        min_lat_input = input(f"  最小纬度 [28.5]: ").strip()
        min_lat = float(min_lat_input) if min_lat_input else 28.5
        
        max_lat_input = input(f"  最大纬度 [29.0]: ").strip()
        max_lat = float(max_lat_input) if max_lat_input else 29.0
        
        # 执行分析
        results = analyze_bounds(tif_path, min_lon, max_lon, min_lat, max_lat)
        
        if results:
            # 询问是否导出
            export = input("\n是否导出结果? (y/n) [n]: ").strip().lower()
            if export == 'y':
                output_file = f"f:\\code\\GQWR\\geodata\\risk_stats_{min_lon}_{max_lon}_{min_lat}_{max_lat}.json"
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump({
                        'bounds': {'minLon': min_lon, 'maxLon': max_lon, 'minLat': min_lat, 'maxLat': max_lat},
                        'results': results
                    }, f, ensure_ascii=False, indent=2)
                print(f"✅ 已导出到: {output_file}")
        
        # 继续分析
        again = input("\n继续分析其他范围? (y/n) [n]: ").strip().lower()
        if again == 'y':
            interactive_mode()
            
    except KeyboardInterrupt:
        print("\n\n👋 已退出")
    except Exception as e:
        print(f"\n❌ 错误: {e}")

def batch_mode():
    """批量模式 - 分析预设的多个范围"""
    tif_path = r'f:\code\GQWR\geodata\risk_shange_2000.tif'
    
    # 预设范围列表
    ranges = [
        {'name': '区域A', 'minLon': 112.5, 'maxLon': 113.0, 'minLat': 28.5, 'maxLat': 29.0},
        {'name': '区域B', 'minLon': 113.0, 'maxLon': 113.5, 'minLat': 28.5, 'maxLat': 29.0},
        {'name': '区域C', 'minLon': 112.5, 'maxLon': 113.0, 'minLat': 29.0, 'maxLat': 29.5},
    ]
    
    print("="*70)
    print("🌍 栅格风险等级统计工具 - 批量模式")
    print("="*70)
    
    all_results = {}
    
    for range_info in ranges:
        print(f"\n分析 {range_info['name']}...")
        results = analyze_bounds(
            tif_path,
            range_info['minLon'],
            range_info['maxLon'],
            range_info['minLat'],
            range_info['maxLat']
        )
        
        if results:
            all_results[range_info['name']] = {
                'bounds': {k: v for k, v in range_info.items() if k != 'name'},
                'results': results
            }
    
    # 导出所有结果
    output_file = r'f:\code\GQWR\geodata\risk_stats_batch.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ 批量结果已导出到: {output_file}")

if __name__ == '__main__':
    if len(sys.argv) > 1:
        # 命令行模式
        if sys.argv[1] == 'batch':
            batch_mode()
        elif len(sys.argv) == 5:
            # 直接传入范围: python script.py min_lon max_lon min_lat max_lat
            tif_path = r'f:\code\GQWR\geodata\risk_shange_2000.tif'
            analyze_bounds(
                tif_path,
                float(sys.argv[1]),
                float(sys.argv[2]),
                float(sys.argv[3]),
                float(sys.argv[4])
            )
        else:
            print("用法:")
            print("  交互模式: python interactive_risk_analysis.py")
            print("  批量模式: python interactive_risk_analysis.py batch")
            print("  命令行模式: python interactive_risk_analysis.py min_lon max_lon min_lat max_lat")
    else:
        # 默认交互模式
        interactive_mode()
