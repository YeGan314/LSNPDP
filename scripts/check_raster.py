import rasterio

# 文件路径
tif_path = r"f:\code\GQWR\geodata\risk_shange_2000.tif"

# 打开栅格文件
with rasterio.open(tif_path) as src:
    print("栅格信息：")
    print(f"宽度: {src.width} 像素")
    print(f"高度: {src.height} 像素")
    print(f"波段数: {src.count}")
    print(f"坐标参考系统(CRS): {src.crs}")
    print(f"地理变换参数: {src.transform}")
    print(f"分辨率: {src.res}")
    print(f"边界: {src.bounds}")
    
    # 计算像素面积（平方米）
    pixel_area = abs(src.transform[0] * src.transform[4])
    print(f"\n像素面积: {pixel_area} 平方米 ({pixel_area/10000:.2f} 公顷)")
    
    # 计算总覆盖面积（平方公里）
    total_area = (src.width * src.height * pixel_area) / 1_000_000
    print(f"总覆盖面积: {total_area:.2f} 平方公里")
