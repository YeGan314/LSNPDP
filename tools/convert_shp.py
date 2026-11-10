# -*- coding: utf-8 -*-
import sys
import os

# 导入转换函数（在修改 stdout 之前）
from shp_to_coords import shp_to_coords_array

# 使用原始字符串处理路径
shp_path = r'D:\5-销售资料\24-青年科学家项目\数据资料\重金属污染分析成果-赫山区\HSQ_XZQ_MAP.shp'
output_path = 'HSQ_XZQ_MAP_coords.js'
var_name = 'ListHSQXZQ'

# 检查文件是否存在
if not os.path.exists(shp_path):
    print(f"错误: 文件不存在: {shp_path}")
    print("\n请确认:")
    print("1. 文件路径是否正确")
    print("2. 文件是否真的存在")
    print("3. 是否有访问权限")
    sys.exit(1)

print(f"找到文件: {shp_path}")
print("开始转换...\n")

# 执行转换
try:
    shp_to_coords_array(shp_path, output_path, var_name)
    print(f"\n✓ 转换成功！")
    print(f"输出文件: {os.path.abspath(output_path)}")
except Exception as e:
    print(f"\n✗ 转换失败: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

