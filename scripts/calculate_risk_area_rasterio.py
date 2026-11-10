#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
栅格数据面积统计脚本 - 使用 rasterio
统计 risk_shange_2000.tif 中各污染风险等级的面积

安装依赖:
pip install rasterio numpy
或
conda install -c conda-forge rasterio numpy
"""

import rasterio
import numpy as np
import json
from collections import Counter

def calculate_risk_areas(tif_path):
    """
    统计栅格数据中各风险等级的面积
    
    Args:
        tif_path: TIF文件路径
    
    Returns:
        dict: 统计结果
    """
    print(f"正在打开文件: {tif_path}")
    
    # 打开栅格数据
    with rasterio.open(tif_path) as dataset:
        # 获取栅格信息
        print(f"\n栅格信息:")
        print(f"  驱动: {dataset.driver}")
        print(f"  尺寸: {dataset.width} × {dataset.height} = {dataset.width * dataset.height:,} 个像素")
        print(f"  波段数: {dataset.count}")
        print(f"  数据类型: {dataset.dtypes[0]}")
        print(f"  坐标系: {dataset.crs}")
        print(f"  边界: {dataset.bounds}")
        
        # 获取像素分辨率
        transform = dataset.transform
        pixel_width = abs(transform[0])
        pixel_height = abs(transform[4])
        
        print(f"  像素分辨率: {pixel_width} × {pixel_height}")
        
        # 读取数据
        print("\n正在读取栅格数据...")
        data = dataset.read(1)  # 读取第一个波段
        
        # 获取NoData值
        nodata = dataset.nodata
        print(f"  NoData值: {nodata}")
        
        # 过滤NoData
        if nodata is not None:
            valid_data = data[data != nodata]
        else:
            valid_data = data.flatten()
        
        print(f"  有效像素数: {len(valid_data):,}")
        
        # 统计各值的数量
        print("\n正在统计像素值分布...")
        unique, counts = np.unique(valid_data, return_counts=True)
        value_counts = dict(zip(unique, counts))
        
        print(f"  发现 {len(unique)} 个不同的像素值: {sorted(unique)}")
        
        # 计算像素面积
        # 根据您的说明：100米 × 100米
        pixel_area_m2 = 10000  # 100m × 100m = 10,000 m²
        
        print(f"\n像素面积: {pixel_area_m2} m² (100m × 100m)")
        
        # 统计结果
        results = {
            'file': tif_path,
            'width': dataset.width,
            'height': dataset.height,
            'total_pixels': dataset.width * dataset.height,
            'valid_pixels': len(valid_data),
            'pixel_area_m2': pixel_area_m2,
            'crs': str(dataset.crs),
            'bounds': {
                'left': dataset.bounds.left,
                'bottom': dataset.bounds.bottom,
                'right': dataset.bounds.right,
                'top': dataset.bounds.top
            },
            'risk_levels': {}
        }
        
        # 输出统计结果
        print("\n" + "="*70)
        print("污染风险等级面积统计")
        print("="*70)
        
        total_risk_area = 0
        total_risk_pixels = 0
        
        for value in sorted(value_counts.keys()):
            count = int(value_counts[value])
            area_m2 = count * pixel_area_m2
            area_km2 = area_m2 / 1_000_000
            area_hectare = area_m2 / 10_000  # 公顷
            percentage = (count / len(valid_data)) * 100
            
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
            else:
                # 其他值（NoData、背景等）
                print(f"\n其他值 ({int(value) if not np.isnan(value) else 'NaN'}):")
                print(f"  像素数量: {count:,}")
                print(f"  占比: {percentage:.2f}%")
        
        print("\n" + "="*70)
        print(f"风险区域汇总:")
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

def export_to_excel(results, output_path):
    """导出结果为Excel（需要安装openpyxl）"""
    try:
        import openpyxl
        from openpyxl.styles import Font, Alignment, PatternFill
        
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "风险等级统计"
        
        # 标题行
        headers = ['风险等级', '像素数量', '面积(m²)', '面积(km²)', '面积(公顷)', '占比(%)']
        ws.append(headers)
        
        # 设置标题样式
        for cell in ws[1]:
            cell.font = Font(bold=True, size=12)
            cell.fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
            cell.font = Font(bold=True, color="FFFFFF")
            cell.alignment = Alignment(horizontal='center')
        
        # 数据行
        total_pixels = 0
        total_area_m2 = 0
        
        for level in sorted(results['risk_levels'].keys()):
            data = results['risk_levels'][level]
            ws.append([
                level,
                data['pixel_count'],
                round(data['area_m2'], 2),
                round(data['area_km2'], 4),
                round(data['area_hectare'], 2),
                data['percentage']
            ])
            total_pixels += data['pixel_count']
            total_area_m2 += data['area_m2']
        
        # 总计行
        ws.append([
            '总计',
            total_pixels,
            round(total_area_m2, 2),
            round(total_area_m2/1_000_000, 4),
            round(total_area_m2/10_000, 2),
            100.00
        ])
        
        # 设置总计行样式
        for cell in ws[ws.max_row]:
            cell.font = Font(bold=True)
            cell.fill = PatternFill(start_color="E7E6E6", end_color="E7E6E6", fill_type="solid")
        
        # 调整列宽
        ws.column_dimensions['A'].width = 12
        ws.column_dimensions['B'].width = 15
        ws.column_dimensions['C'].width = 18
        ws.column_dimensions['D'].width = 15
        ws.column_dimensions['E'].width = 15
        ws.column_dimensions['F'].width = 12
        
        wb.save(output_path)
        print(f"✅ Excel结果已导出到: {output_path}")
        
    except ImportError:
        print("⚠️ 未安装 openpyxl，跳过Excel导出")
        print("   安装命令: pip install openpyxl")

if __name__ == '__main__':
    # TIF文件路径
    tif_path = r'f:\code\GQWR\geodata\risk_shange_2000.tif'
    
    try:
        print("🚀 开始统计栅格数据...")
        print("="*70)
        
        # 计算面积
        results = calculate_risk_areas(tif_path)
        
        # 导出结果
        print("\n📊 导出统计结果...")
        export_to_json(results, r'f:\code\GQWR\geodata\risk_area_stats.json')
        export_to_csv(results, r'f:\code\GQWR\geodata\risk_area_stats.csv')
        export_to_excel(results, r'f:\code\GQWR\geodata\risk_area_stats.xlsx')
        
        print("\n✅ 统计完成！")
        
    except FileNotFoundError:
        print(f"\n❌ 错误: 找不到文件 {tif_path}")
        print("   请检查文件路径是否正确")
    except Exception as e:
        print(f"\n❌ 错误: {e}")
        import traceback
        traceback.print_exc()
