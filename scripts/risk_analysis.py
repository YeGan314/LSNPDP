import geopandas as gpd
import rasterio
from rasterio.mask import mask
import numpy as np
import os
import json

# 文件路径
tif_path = r"f:\code\GQWR\geodata\risk_shange_2000.tif"
shp_path = r"f:\code\GQWR\geodata\2024年初县级.shp"

def analyze_risk_by_administrative_division():
    # 读取行政区划数据
    print("正在读取行政区划数据...")
    gdf = gpd.read_file(shp_path)
    
    # 确保使用WGS84坐标系统
    if gdf.crs is None or gdf.crs.to_epsg() != 4326:
        gdf = gdf.to_crs(epsg=4326)
    
    # 按地级市分组
    print("正在按地级市分组...")
    city_stats = []
    
    # 获取所有地级市
    cities = gdf['地级'].drop_duplicates().dropna()
    
    for city_name in cities:
        print(f"正在处理: {city_name}...")
        city_data = gdf[gdf['地级'] == city_name]
        
        city_result = {
            'city': city_name,
            'province': city_data.iloc[0]['省级'],  # 获取省份名称
            'counties': [],
            'total_stats': {
                'level_1': {'pixels': 0, 'area_km2': 0},
                'level_2': {'pixels': 0, 'area_km2': 0},
                'level_3': {'pixels': 0, 'area_km2': 0},
                'level_4': {'pixels': 0, 'area_km2': 0},
                'level_5': {'pixels': 0, 'area_km2': 0},
                'total_pixels': 0
            }
        }
        
        # 遍历该市下所有区县
        for _, row in city_data.iterrows():
            try:
                with rasterio.open(tif_path) as src:
                    # 裁剪栅格
                    out_image, out_transform = mask(
                        src, 
                        [row.geometry], 
                        crop=True, 
                        nodata=np.nan
                    )
                    
                    # 统计风险等级
                    data = out_image[0]
                    valid_data = data[~np.isnan(data)]
                    
                    if len(valid_data) > 0:
                        unique, counts = np.unique(valid_data, return_counts=True)
                        value_counts = dict(zip(unique, counts))
                        
                        # 计算面积
                        pixel_area = abs(out_transform[0] * out_transform[4])  # 像素面积（平方米）
                        total_area = len(valid_data) * pixel_area / 1_000_000  # 转换为平方公里
                        
                        # 统计各风险等级
                        county_stats = {
                            'county_name': row['县级'],
                            'county_code': row['区划码'],
                            'total_area_km2': round(total_area, 2),
                            'risk_levels': {}
                        }
                        
                        total_pixels = len(valid_data)
                        for level in [1, 2, 3, 4, 5]:
                            count = int(value_counts.get(level, 0))
                            area = (count * pixel_area) / 1_000_000  # 转换为平方公里
                            
                            county_stats['risk_levels'][f'level_{level}'] = {
                                'pixels': count,
                                'area_km2': round(area, 2),
                                'percentage': round((count / total_pixels) * 100, 2) if total_pixels > 0 else 0
                            }
                            
                            # 累加到市级统计
                            city_result['total_stats'][f'level_{level}']['pixels'] += count
                            city_result['total_stats'][f'level_{level}']['area_km2'] += area
                        
                        city_result['total_stats']['total_pixels'] += total_pixels
                        city_result['counties'].append(county_stats)
                        
            except Exception as e:
                print(f"处理{row['县级']}时出错: {str(e)}")
                continue
        
        # 计算市级统计的百分比
        total = city_result['total_stats']['total_pixels']
        if total > 0:
            for level in [1, 2, 3, 4, 5]:
                level_data = city_result['total_stats'][f'level_{level}']
                level_data['percentage'] = round((level_data['pixels'] / total) * 100, 2)
                level_data['area_km2'] = round(level_data['area_km2'], 2)
        
        city_stats.append(city_result)
    
    return city_stats

def save_results(city_stats, output_dir='output'):
    """保存统计结果"""
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # 保存为JSON
    with open(os.path.join(output_dir, 'risk_statistics.json'), 'w', encoding='utf-8') as f:
        json.dump(city_stats, f, ensure_ascii=False, indent=2)
    
    # 保存为CSV
    import csv
    with open(os.path.join(output_dir, 'risk_statistics.csv'), 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['省份', '地级市', '区县', '区县代码', '总面积(km²)', 
                        '1级风险面积(km²)', '1级风险占比(%)',
                        '2级风险面积(km²)', '2级风险占比(%)',
                        '3级风险面积(km²)', '3级风险占比(%)',
                        '4级风险面积(km²)', '4级风险占比(%)',
                        '5级风险面积(km²)', '5级风险占比(%)'])
        
        for city in city_stats:
            for county in city['counties']:
                row = [
                    city['province'],
                    city['city'],
                    county['county_name'],
                    county['county_code'],
                    county['total_area_km2']
                ]
                
                for level in [1, 2, 3, 4, 5]:
                    level_data = county['risk_levels'].get(f'level_{level}', {})
                    row.extend([
                        level_data.get('area_km2', 0),
                        level_data.get('percentage', 0)
                    ])
                
                writer.writerow(row)

def print_summary(city_stats, city_name=None):
    """打印统计摘要"""
    print("\n=== 污染风险统计结果 ===")
    
    for city in city_stats:
        if city_name and city_name not in city['city']:
            continue
            
        print(f"\n{city['province']} - {city['city']} (共{len(city['counties'])}个区县)")
        print("=" * 60)
        print(f"{'风险等级':<10} {'像素数量':<15} {'面积(km²)':<15} 占比(%)")
        print("-" * 50)
        
        total = city['total_stats']['total_pixels']
        for level in [1, 2, 3, 4, 5]:
            level_data = city['total_stats'][f'level_{level}']
            print(f"  {level}级风险:  {level_data['pixels']:<15,} {level_data['area_km2']:<15.2f} {level_data.get('percentage', 0):.2f}%")
        
        print("\n各区县统计详情已保存到 output 目录")

if __name__ == '__main__':
    print("开始处理...")
    results = analyze_risk_by_administrative_division()
    save_results(results)
    print_summary(results, city_name='株洲市')  # 只显示株洲市的结果
    print("\n处理完成！结果已保存到 output 目录")
