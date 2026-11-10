import geopandas as gpd
import rasterio
from rasterio.mask import mask
from rasterio.warp import calculate_default_transform, reproject, Resampling
import numpy as np
import os
import json
from pyproj import CRS
from shapely.geometry import box

# 文件路径
tif_path = r"f:\code\GQWR\geodata\risk_shange_2000.tif"
shp_path = r"f:\code\GQWR\geodata\2024年初县级.shp"
output_dir = r"f:\code\GQWR\output"

# 确保输出目录存在
os.makedirs(output_dir, exist_ok=True)

def get_hunan_counties():
    """获取湖南省的区县数据"""
    print("正在读取湖南省区县数据...")
    # 读取全国区县数据
    gdf = gpd.read_file(shp_path)
    
    # 筛选湖南省的区县
    hunan_gdf = gdf[gdf['省级'] == '湖南省'].copy()
    
    # 确保使用WGS84坐标系统
    if hunan_gdf.crs is None or hunan_gdf.crs.to_epsg() != 4326:
        hunan_gdf = hunan_gdf.to_crs(epsg=4326)
    
    print(f"找到湖南省 {len(hunan_gdf)} 个区县")
    return hunan_gdf

def calculate_area_in_square_meters(geom, src_crs):
    """计算几何图形的实际面积（平方米）"""
    # 创建一个临时的GeoDataFrame
    temp_gdf = gpd.GeoDataFrame(geometry=[geom], crs=src_crs)
    
    # 转换为等面积投影（如EPSG:4526 - CGCS2000 / 3-degree Gauss-Kruger zone 36）
    # 这里我们使用一个适用于中国大部分地区的UTM投影
    temp_gdf = temp_gdf.to_crs(epsg=32650)  # UTM zone 50N
    
    # 返回面积（平方米）
    return temp_gdf.geometry.area.values[0]

def analyze_risk_for_hunan():
    """分析湖南省各区县的污染风险"""
    # 获取湖南省区县数据
    hunan_gdf = get_hunan_counties()
    
    # 初始化结果列表
    results = []
    
    # 打开栅格数据
    with rasterio.open(tif_path) as src:
        # 获取栅格数据的CRS
        src_crs = src.crs
        
        # 处理每个区县
        for idx, row in hunan_gdf.iterrows():
            county_name = row['县级']
            city_name = row['地级']
            print(f"正在处理: {city_name} - {county_name}")
            
            try:
                # 获取区县几何图形
                geom = row.geometry
                
                # 裁剪栅格
                out_image, out_transform = mask(
                    src, 
                    [geom], 
                    crop=True, 
                    nodata=np.nan
                )
                
                # 统计风险等级
                data = out_image[0]
                valid_data = data[~np.isnan(data)]
                
                if len(valid_data) == 0:
                    print(f"  警告: {county_name} 范围内没有有效数据")
                    continue
                
                # 统计各风险等级的数量
                unique, counts = np.unique(valid_data, return_counts=True)
                value_counts = dict(zip(unique, counts))
                
                # 计算实际面积
                pixel_area = abs(out_transform[0] * out_transform[4])  # 像素面积（度²）
                
                # 计算每个像素的实际面积（平方米）
                # 由于像素大小是度，我们需要考虑纬度对面积的影响
                # 这里我们使用一个近似方法：1度纬度约等于111公里，1度经度约等于111*cos(纬度)公里
                # 获取区县中心点的纬度
                centroid = geom.centroid
                lat = centroid.y
                lon_pixel_width = 111.32 * np.cos(np.radians(lat)) * 1000  # 米/度(经度)
                lat_pixel_height = 111.0 * 1000  # 米/度(纬度)
                
                # 计算每个像素的实际面积（平方米）
                pixel_area_m2 = abs(out_transform[0] * lat_pixel_height * out_transform[4] * lon_pixel_width)
                
                # 计算总面积（平方米）
                total_area_m2 = len(valid_data) * pixel_area_m2
                
                # 统计各风险等级
                risk_stats = {}
                for level in [1, 2, 3, 4, 5]:
                    count = int(value_counts.get(level, 0))
                    area_m2 = count * pixel_area_m2
                    percentage = (count / len(valid_data)) * 100 if len(valid_data) > 0 else 0
                    
                    risk_stats[f'level_{level}'] = {
                        'pixel_count': count,
                        'area_km2': round(area_m2 / 1_000_000, 4),  # 转换为平方公里
                        'percentage': round(percentage, 2)
                    }
                
                # 添加区县结果
                results.append({
                    'province': '湖南省',
                    'city': city_name,
                    'county': county_name,
                    'county_code': row['区划码'],
                    'total_pixels': int(len(valid_data)),
                    'total_area_km2': round(total_area_m2 / 1_000_000, 4),  # 转换为平方公里
                    'risk_levels': risk_stats
                })
                
            except Exception as e:
                print(f"处理{county_name}时出错: {str(e)}")
                continue
    
    return results

def save_results(results, output_dir):
    """保存统计结果"""
    # 保存为JSON
    json_path = os.path.join(output_dir, 'hunan_risk_statistics.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\nJSON结果已保存到: {json_path}")
    
    # 保存为CSV
    import csv
    csv_path = os.path.join(output_dir, 'hunan_risk_statistics.csv')
    with open(csv_path, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        # 写入表头
        header = ['省份', '地级市', '区县', '区县代码', '总像素数', '总面积(km²)']
        for level in [1, 2, 3, 4, 5]:
            header.extend([f'{level}级风险面积(km²)', f'{level}级风险占比(%)'])
        writer.writerow(header)
        
        # 写入数据
        for item in results:
            row = [
                item['province'],
                item['city'],
                item['county'],
                item['county_code'],
                item['total_pixels'],
                item['total_area_km2']
            ]
            
            for level in [1, 2, 3, 4, 5]:
                level_data = item['risk_levels'].get(f'level_{level}', {})
                row.extend([
                    level_data.get('area_km2', 0),
                    level_data.get('percentage', 0)
                ])
            
            writer.writerow(row)
    
    print(f"CSV结果已保存到: {csv_path}")
    return csv_path

def print_summary(results):
    """打印统计摘要"""
    print("\n=== 湖南省各区县污染风险统计 ===")
    print("=" * 80)
    print(f"{'地级市':<10} {'区县':<10} {'总面积(km²)':<12} {'1级(%)':<8} {'2级(%)':<8} {'3级(%)':<8} {'4级(%)':<8} {'5级(%)':<8}")
    print("-" * 80)
    
    # 按地级市分组
    cities = {}
    for item in results:
        city = item['city']
        if city not in cities:
            cities[city] = []
        cities[city].append(item)
    
    # 打印每个地级市的数据
    for city, counties in cities.items():
        print(f"\n{city}:")
        print("-" * 80)
        
        # 打印该地级市下各区县的数据
        for county in counties:
            print(f"  {county['county']:<10} {county['total_area_km2']:>10.2f} ", end="")
            for level in [1, 2, 3, 4, 5]:
                level_data = county['risk_levels'].get(f'level_{level}', {})
                print(f"{level_data.get('percentage', 0):>7.2f}% ", end="")
            print()
        
        # 计算地级市汇总
        city_total_area = sum(c['total_area_km2'] for c in counties)
        city_levels = {level: 0 for level in [1, 2, 3, 4, 5]}
        
        for county in counties:
            for level in [1, 2, 3, 4, 5]:
                level_data = county['risk_levels'].get(f'level_{level}', {})
                city_levels[level] += level_data.get('area_km2', 0)
        
        print(f"{'全市合计':<10} {city_total_area:>10.2f} ", end="")
        for level in [1, 2, 3, 4, 5]:
            percentage = (city_levels[level] / city_total_area * 100) if city_total_area > 0 else 0
            print(f"{percentage:>7.2f}% ", end="")
        print()

if __name__ == '__main__':
    print("开始处理湖南省各区县污染风险统计...")
    results = analyze_risk_for_hunan()
    
    if not results:
        print("没有找到有效的统计结果，请检查数据路径和格式。")
    else:
        # 保存结果
        csv_path = save_results(results, output_dir)
        
        # 打印摘要
        print_summary(results)
        
        print("\n处理完成！详细结果已保存到 output 目录")
