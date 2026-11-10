#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
栅格统计API测试客户端
"""

import requests
import json

API_BASE_URL = 'http://localhost:5001/api'

def test_health():
    """测试健康检查"""
    print("="*70)
    print("测试 1: 健康检查")
    print("="*70)
    
    response = requests.get(f'{API_BASE_URL}/health')
    print(f"状态码: {response.status_code}")
    print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    print()

def test_bounds_stats():
    """测试矩形范围统计"""
    print("="*70)
    print("测试 2: 矩形范围统计")
    print("="*70)
    
    data = {
        "bounds": {
            "minLon": 112.5,
            "maxLon": 113.0,
            "minLat": 28.5,
            "maxLat": 29.0
        },
        "pixel_size_m": 100
    }
    
    print(f"请求数据: {json.dumps(data, indent=2, ensure_ascii=False)}")
    
    response = requests.post(
        f'{API_BASE_URL}/stats/bounds',
        json=data,
        headers={'Content-Type': 'application/json'}
    )
    
    print(f"\n状态码: {response.status_code}")
    result = response.json()
    
    if result.get('success'):
        print("\n✅ 统计成功!")
        print(f"\n总面积: {result['data']['total_area_km2']} km²")
        print("\n风险等级分布:")
        for level in result['data']['risk_levels']:
            print(f"  等级 {level['level']}: {level['area_km2']} km² ({level['percentage']}%)")
    else:
        print(f"\n❌ 错误: {result.get('error')}")
    print()

def test_polygon_stats():
    """测试多边形范围统计"""
    print("="*70)
    print("测试 3: 多边形范围统计")
    print("="*70)
    
    data = {
        "coordinates": [
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
            [112.957262992859, 28.874103168171]
        ],
        "pixel_size_m": 100
    }
    
    print(f"多边形顶点数: {len(data['coordinates'])}")
    
    response = requests.post(
        f'{API_BASE_URL}/stats/polygon',
        json=data,
        headers={'Content-Type': 'application/json'}
    )
    
    print(f"\n状态码: {response.status_code}")
    result = response.json()
    
    if result.get('success'):
        print("\n✅ 统计成功!")
        print(f"\n总面积: {result['data']['total_area_km2']} km²")
        print("\n风险等级分布:")
        for level in result['data']['risk_levels']:
            print(f"  等级 {level['level']}: {level['area_km2']} km² ({level['percentage']}%)")
    else:
        print(f"\n❌ 错误: {result.get('error')}")
    print()

def test_batch_stats():
    """测试批量统计"""
    print("="*70)
    print("测试 4: 批量统计")
    print("="*70)
    
    data = {
        "pixel_size_m": 100,
        "ranges": [
            {
                "name": "区域A",
                "type": "bounds",
                "bounds": {
                    "minLon": 112.5,
                    "maxLon": 113.0,
                    "minLat": 28.5,
                    "maxLat": 29.0
                }
            },
            {
                "name": "区域B",
                "type": "bounds",
                "bounds": {
                    "minLon": 113.0,
                    "maxLon": 113.5,
                    "minLat": 28.5,
                    "maxLat": 29.0
                }
            }
        ]
    }
    
    print(f"批量范围数: {len(data['ranges'])}")
    
    response = requests.post(
        f'{API_BASE_URL}/stats/batch',
        json=data,
        headers={'Content-Type': 'application/json'}
    )
    
    print(f"\n状态码: {response.status_code}")
    result = response.json()
    
    if result.get('success'):
        print("\n✅ 批量统计成功!")
        for name, stats in result['results'].items():
            if stats.get('success'):
                print(f"\n{name}:")
                print(f"  总面积: {stats['data']['total_area_km2']} km²")
                print(f"  风险等级数: {len(stats['data']['risk_levels'])}")
            else:
                print(f"\n{name}: ❌ {stats.get('error')}")
    else:
        print(f"\n❌ 错误: {result.get('error')}")
    print()

if __name__ == '__main__':
    print("\n🧪 开始测试栅格统计API...\n")
    
    try:
        test_health()
        test_bounds_stats()
        test_polygon_stats()
        test_batch_stats()
        
        print("="*70)
        print("✅ 所有测试完成!")
        print("="*70)
        
    except requests.exceptions.ConnectionError:
        print("\n❌ 错误: 无法连接到API服务")
        print("请确保API服务已启动: python raster_stats_api.py")
    except Exception as e:
        print(f"\n❌ 错误: {e}")
        import traceback
        traceback.print_exc()
