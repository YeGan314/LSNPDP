import geopandas as gpd

# 读取Shapefile
shp_path = r"f:\code\GQWR\geodata\2024年初县级.shp"
gdf = gpd.read_file(shp_path)

# 打印前几行数据
print("Shapefile结构：")
print(gdf.head())

# 打印字段名
print("\n字段名：")
print(gdf.columns.tolist())

# 打印坐标参考系统
print("\n坐标参考系统(CRS)：")
print(gdf.crs)

# 保存前5条记录到CSV以便查看
gdf.head().to_csv("sample_data.csv", encoding='utf-8-sig')
print("\n已保存前5条记录到 sample_data.csv")
