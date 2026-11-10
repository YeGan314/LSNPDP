/*
 * @Author: 叶敢
 * @Date: 2024-07-05 11:21:22
 * @LastEditTime: 2024-08-06 09:06:40
 * @Description: title
 * @FastButton: ctrl+win+i, ctrl+win+t
 */
import {
  Color,
  Cartesian3,
  Ion,
  Viewer,
  Math as CesiumMath,
  PolygonHierarchy,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Material,
  PolygonGeometry,
  EllipsoidSurfaceAppearance,
  Primitive,
  GeometryInstance,
  EasingFunction,
  Terrain,
  ImageMaterialProperty,
  Cartesian2,
  HeightReference,
  DistanceDisplayCondition,
  Credit,
  WebMapTileServiceImageryProvider,
  WebMapServiceImageryProvider,
  Rectangle,
  Matrix4,
  SphereEmitter,
  ParticleSystem,
  // CallbackProperty,
  UrlTemplateImageryProvider,
  PolylineGlowMaterialProperty,
  // WebMercatorTilingScheme,
  // PinBuilder,
  GpxDataSource,
  // ClockStep,
  // ClockRange,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI5ZTdlMWRlMi1jZjZkLTRkZjMtODkzYS00ZWQ1NTdmNGY2MTgiLCJpZCI6MzE5NTIxLCJpYXQiOjE3NTE5NjQ1MDB9.dlR6AAywmuKkezklNLpoEEVfOuZEh0nJ1233ZeiuhwY";
window.CESIUM_BASE_URL = "./CesiumUnminified/";
import water from "@/assets/water.jpg";
import divLabel from "./divLabel.js";

// three
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import TWEEN from "@tweenjs/tween.js";
let viewer = null; // cesium 视图对象
let modalDivLayer = null; //地图弹窗对象
let container = null; //dom元素，加载canvas的父元素

// 降雨降雪对象
const animationRainSnow = {
  Rain: null,
  Snow: null,
};
// 地图图层对象，卫星图，bigmap图，街景图等等
const mapLayer = {
  bigmap: null,
  gaodeWX: null, //高德卫星图
  gaodeJJ: null, //高德街景
};
// 当前场景经纬度

const three = {
  scene: null, //场景
  camera: null, //相机
  renderer: null, //渲染
  _3DOBS: [], //放3d模型
  _3DOS: [], //放其他模型
  animation: [],
};
let minWGS84 = null;
let maxWGS84 = null;
let renderAnimationFrame = null;
let renderLoopRunning = false;
let sceneGeneration = 0;

// 动画
const TW = {
  rtuA: null, //rtu闪烁动画
  carA: null, //汽车动画
};
// const clock = new THREE.Clock();
let mixer = null;

/**
 * 加载地图
 * @param {string} dom dom
 */
async function initCesium(dom) {
  container = document.getElementById(dom);
  // const url =
  //   "http://127.0.0.1:9000/bigemap.53xdp1s0/wmts?access_token=pk.eyJ1IjoiY3VzX2NqbHhzdGMwIiwiYSI6IjJwdDI4N2trZ203OWQ1NnljZTlvMDdxaHAiLCJ0Ijo0fQ.n4ksFkhlnENzAM5JfJl5IUGYsgalWeKjjBegUizuqa8";

  // 初始化视图
  viewer = new Viewer(dom, {
    shouldAnimate: true, // 是否加载动画
    terrain: Terrain.fromWorldTerrain(), // 3D视图
    useDefaultRenderLoop: false,
    selectionIndicator: false,
    homeButton: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    infoBox: false,
    // navigationHelpButton: false,
    navigationInstructionsInitiallyVisible: false,
    animation: false,
    timeline: false,
    fullscreenButton: false,
    allowTextureFilterAnisotropic: false,
    contextOptions: {
      webgl: {
        alpha: false,
        antialias: true,
        preserveDrawingBuffer: true,
        failIfMajorPerformanceCaveat: false,
        depth: true,
        stencil: false,
        anialias: false,
      },
    },
    targetFrameRate: 60,
    resolutionScale: 0.1,
    orderIndependentTranslucency: true,
    // creditContainer: "hidecredit",
    // imageryProvider: new TileMapServiceImageryProvider({
    //   url,
    //   maximumLevel: 18,
    // }),
    baseLayerPicker: false,
    geocoder: false,
    // automaticallyTrackDataSourceClocks: false,
    dataSources: null,
    clock: null,
    // terrainShadows: ShadowMode.DISABLED,
  });
  
  // 隐藏Cesium底部logo和版权信息
  viewer._cesiumWidget._creditContainer.style.display = "none";
}
/**
 * 是否加载 bigmap地图
 * @param {boolean} type true 显示 false 隐藏
 */
function initBigMap(type) {
  // 未创建bigmap 创建layer
  if (!mapLayer.bigmap && type) {
    // 瓦片对象
    const imageryProvider = new WebMapTileServiceImageryProvider({
      url: "http://192.168.110.204:9000/bigemap.53xdp1s0/wmts?access_token=pk.eyJ1IjoiY3VzX2NqbHhzdGMwIiwiYSI6IjJwdDI4N2trZ203OWQ1NnljZTlvMDdxaHAiLCJ0Ijo0fQ.n4ksFkhlnENzAM5JfJl5IUGYsgalWeKjjBegUizuqa8",
      layer: "bigemap.other",
      style: "default",
      format: "image/jpeg",
      tileMatrixSetID: "default028mm",
      maximumLevel: 18,
      credit: new Credit("U. S. Geological Survey"),
    });
    // 返回 图层Layers对象 把瓦片导图，生成图层对象
    mapLayer.bigmap = viewer.imageryLayers.addImageryProvider(imageryProvider);
  }
  if (mapLayer.bigmap && !type) {
    // 删除图层
    viewer.imageryLayers.remove(mapLayer.bigmap);
    mapLayer.bigmap = null;
  }
}
/**
 *加载高德卫星地图
 * @param {boolean} type
 */
function initGaoGeWX(type) {
  // 未创建高德卫星图
  if (!mapLayer.gaodeWX && type) {
    // 瓦片对象
    var UrlImageryProvider = new UrlTemplateImageryProvider({
      url: "https://webst{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&style=6", // 添加高德卫星影像
      subdomains: ["01", "02", "03", "04"], //多域名请求
    });
    // 返回 图层Layers对象 把瓦片导图，生成图层对象
    mapLayer.gaodeWX =
      viewer.imageryLayers.addImageryProvider(UrlImageryProvider);
  }
  if (mapLayer.gaodeWX && !type) {
    // 删除图层
    viewer.imageryLayers.remove(mapLayer.gaodeWX);
    mapLayer.gaodeWX = null;
  }
}
/**
 *加载高德街景地图
 * @param {boolean} type
 */
function initGaoGeJJ(type) {
  console.log("mapLayer", mapLayer);
  // 未创建高德卫星图
  if (!mapLayer.gaodeJJ && type) {
    // 瓦片对象
    var UrlImageryProvider = new UrlTemplateImageryProvider({
      url: "https://webst{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&style=7", // 添加高德街景影像
      subdomains: ["01", "02", "03", "04"], //多域名请求
    });
    // 返回 图层Layers对象 把瓦片导图，生成图层对象
    mapLayer.gaodeJJ =
      viewer.imageryLayers.addImageryProvider(UrlImageryProvider);
  }
  if (mapLayer.gaodeJJ && !type) {
    // 操作图层对象的 显示和隐藏
    viewer.imageryLayers.remove(mapLayer.gaodeJJ);
    mapLayer.gaodeJJ = null;
  }
}

/**
 * 加载 GeoServer WMS 服务
 * @param {Object} config - 配置对象
 * @param {string} config.url - GeoServer WMS 服务的 URL
 * @param {string} config.layers - 要显示的图层名称（工作区:图层名）
 * @param {Object} [config.parameters] - WMS GetMap 请求的额外参数
 * @param {number} [config.alpha=1.0] - 图层透明度（0.0-1.0）
 * @param {number} [config.brightness=1.0] - 图层亮度（0.0-2.0）
 * @param {number} [config.contrast=1.0] - 图层对比度（0.0-2.0）
 * @param {string} [config.credit] - 版权声明
 * @returns {Object} - 返回添加的图层对象
 * @example
 * // 基本用法
 * const wmsLayer = initWMSService({
 *   url: 'http://localhost:8080/geoserver/myworkspace/wms',
 *   layers: 'myworkspace:mylayer',
 * });
 * 
 * // 高级用法
 * const wmsLayer = initWMSService({
 *   url: 'http://localhost:8080/geoserver/wms',
 *   layers: 'workspace:layer1,workspace:layer2',
 *   parameters: {
 *     transparent: true,
 *     format: 'image/png',
 *     version: '1.3.0',
 *     crs: 'EPSG:4326'
 *   },
 *   alpha: 0.8
 * });
 * 
 * // 控制显示/隐藏
 * wmsLayer.show = false;  // 隐藏
 * wmsLayer.show = true;   // 显示
 * 
 * // 移除图层
 * viewer.imageryLayers.remove(wmsLayer);
 */
function initWMSService(config) {
  const {
    url,
    layers,
    parameters = {},
    alpha = 1.0,
    brightness = 1.0,
    contrast = 1.0,
    credit = "",
  } = config;

  if (!url || !layers) {
    console.error("url 和 layers 参数不能为空");
    return null;
  }

  // 默认 WMS 参数
  const defaultParameters = {
    transparent: true,
    format: "image/png",
    ...parameters,
  };

  try {
    // 检查 viewer 是否存在
    if (!viewer) {
      console.error("❌ Viewer 未初始化，无法加载 WMS 图层");
      return null;
    }

    // 创建 WMS ImageryProvider
    const providerOptions = {
      url,
      layers,
      parameters: defaultParameters,
      enablePickFeatures: false,
      tileWidth: 256,
      tileHeight: 256,
      minimumLevel: 0,
      maximumLevel: 18,
    };
    
    // 为不同图层设置边界框
    if (layers.includes("HSQ_XZQ_MAP_BUFFER")) {
      providerOptions.rectangle = Rectangle.fromDegrees(
        112.60473851374479, 28.497291740158655,
        112.6169023176589, 28.504644274803756
      );
    } else if (layers.includes("XJLY_DEM")) {
      // 湘江流域DEM范围（湖南省湘江流域）
      providerOptions.rectangle = Rectangle.fromDegrees(
        110.0, 25.0,  // 西南角
        114.0, 30.0   // 东北角
      );
    } else {
      // 默认使用全球范围
      providerOptions.rectangle = Rectangle.fromDegrees(
        -180, -90, 180, 90
      );
    }
    
    if (credit) {
      providerOptions.credit = new Credit(credit);
    }
    
    const imageryProvider = new WebMapServiceImageryProvider(providerOptions);

    // 添加到图层并设置样式
    const imageryLayer = viewer.imageryLayers.addImageryProvider(imageryProvider);
    imageryLayer.alpha = alpha;
    imageryLayer.brightness = brightness;
    imageryLayer.contrast = contrast;
    
    return imageryLayer;
  } catch (error) {
    console.error("❌ WMS图层加载失败:", error.message);
    return null;
  }
}

/**
 * 加载 WMTS 服务
 * @param {Object} config - WMTS 配置
 * @param {string} config.url - WMTS 服务地址
 * @param {string} config.layer - 图层名称
 * @param {string} config.style - 样式名称，默认 'default'
 * @param {string} config.format - 图像格式，默认 'image/png'
 * @param {string} config.tileMatrixSetID - 瓦片矩阵集 ID，默认 'EPSG:4326'
 * @param {number} config.alpha - 透明度 (0-1)
 * @param {number} config.brightness - 亮度 (0-2)
 * @param {number} config.contrast - 对比度 (0-2)
 * @param {number} config.maximumLevel - 最大缩放级别
 * @param {string} config.credit - 版权信息
 * @returns {Object} Cesium ImageryLayer 对象
 * 
 * 使用示例:
 * const wmtsLayer = initWMTSService({
 *   url: "/geoserver/gwc/service/wmts",
 *   layer: "YG:base_layer",
 *   style: "default",
 *   format: "image/png",
 *   tileMatrixSetID: "EPSG:4326",
 *   alpha: 1.0,
 * });
 */
function initWMTSService(config) {
  const {
    url,
    layer,
    style = "default",
    format = "image/png",
    tileMatrixSetID = "EPSG:4326",
    alpha = 1.0,
    brightness = 1.0,
    contrast = 1.0,
    maximumLevel = 18,
    credit = "",
  } = config;

  if (!url || !layer) {
    console.error("url 和 layer 参数不能为空");
    return null;
  }

  try {
    // 检查 viewer 是否存在
    if (!viewer) {
      console.error("❌ Viewer 未初始化，无法加载 WMTS 图层");
      return null;
    }

    // 创建 WMTS ImageryProvider
    const imageryProvider = new WebMapTileServiceImageryProvider({
      url,
      layer,
      style,
      format,
      tileMatrixSetID,
      maximumLevel,
      credit: credit ? new Credit(credit) : undefined,
    });

    // 添加到图层并设置样式
    const imageryLayer = viewer.imageryLayers.addImageryProvider(imageryProvider);
    imageryLayer.alpha = alpha;
    imageryLayer.brightness = brightness;
    imageryLayer.contrast = contrast;

    return imageryLayer;
  } catch (error) {
    console.error("❌ WMTS 图层加载失败:", error.message);
    return null;
  }
}

/**
 * 加载多边形
 * 实现阴影效果 经纬度
 * @param {array} positions 经纬度数组 没有阴影的部分
 * @returns {Entity} 返回创建的遮罩实体
 */
function getPolygonHolesCesium(positions) {
  if (!Array.isArray(positions) || positions.length < 6) {
    console.warn("⚠️ getPolygonHolesCesium: 无有效边界坐标，跳过绘制");
    return null;
  }
  const lonValues = [];
  const latValues = [];
  for (let i = 0; i < positions.length; i += 2) {
    const lon = Number(positions[i]);
    const lat = Number(positions[i + 1]);
    if (Number.isFinite(lon) && Number.isFinite(lat)) {
      lonValues.push(lon);
      latValues.push(lat);
    }
  }
  if (lonValues.length < 3 || latValues.length < 3) {
    console.warn("⚠️ getPolygonHolesCesium: 边界坐标不足，跳过绘制");
    return null;
  }
  const minLon = Math.min(...lonValues);
  const maxLon = Math.max(...lonValues);
  const minLat = Math.min(...latValues);
  const maxLat = Math.max(...latValues);
  const lonPadding = Math.max((maxLon - minLon) * 0.35, 0.05);
  const latPadding = Math.max((maxLat - minLat) * 0.35, 0.05);
  const outerRing = [
    minLon - lonPadding,
    minLat - latPadding,
    maxLon + lonPadding,
    minLat - latPadding,
    maxLon + lonPadding,
    maxLat + latPadding,
    minLon - lonPadding,
    maxLat + latPadding,
  ];
  const entity = viewer.entities.add({
    name: "带洞多边形",
    polygon: {
      hierarchy: {
        positions: Cartesian3.fromDegreesArray(outerRing),
        holes: [
          {
            positions: Cartesian3.fromDegreesArray(positions),
          },
        ],
      },
      material: Color.BLACK.withAlpha(0.3),
      height: 50,
      outline: false, // 显示外边框
      // outlineColor: Color.GREEN, // 可选：设置边框颜色
      // outlineWidth: 92.0, // 可选：设置边框宽度
    },
  });
  return entity;
  // viewer.entities.add({
  //   name: "带洞描边2",
  //   polyline: {
  //     positions: Cartesian3.fromDegreesArray(positions),
  //     width: 20,
  //     material: Color["WHITH"],
  //   },
  // });
}
/**
 * 围墙墙 经纬度
 * @param {array} positions
 */
function getWallCesium(positions) {
  // 材质（使用图片）
  var wallMaterial = new ImageMaterialProperty({
    image: "wall.png", // 替换为你的图片路径
    repeat: new Cartesian2(1, 1), // 根据需要调整图片重复次数
  });
  const pos = Cartesian3.fromDegreesArray(positions);
  // 创建围墙实体
  viewer.entities.add({
    wall: {
      positions: pos,
      maximumHeights: new Array(pos.length).fill(100.0), // 围墙高度，单位为米，这里设置为10米
      minimumHeights: new Array(pos.length).fill(0.0), // 围墙底部高度，这里设置为地面高度
      material: wallMaterial,
      outline: true, // 是否显示边框
      outlineColor: Color.BLACK,
      outlineWidth: 2,
      distanceDisplayCondition: new DistanceDisplayCondition(10000, 500000),
    },
  });
}

/**
 * 发光围墙
 */
function getWallLightCesium(positions) {
  if (!Array.isArray(positions) || positions.length < 4) {
    console.warn("⚠️ getWallLightCesium: 无有效边界坐标，跳过绘制");
    return;
  }
  const pos = Cartesian3.fromDegreesArray(positions);
  viewer.entities.add({
    name: "aGlowLine",
    polyline: {
      positions: pos,
      width: 40,
      material: new PolylineGlowMaterialProperty({
        glowPower: 0.1,
        color: Color.fromBytes(16, 209, 255, 128),
      }),
    },
  });
}

/**
 * 加载线
 * @param {Object} data  name，positions经纬度数组
 * @param {string} color 颜色
 * @param {number} width 粗细
 */
function getLineCesium(data, color, width) {
  if (!Array.isArray(data) || data.length === 0) {
    console.warn("⚠️ getLineCesium: 线数据为空，跳过绘制");
    return;
  }
  data.forEach((item) => {
    if (!item || !Array.isArray(item.positions) || item.positions.length < 4) {
      return;
    }
    viewer.entities.add({
      name: item.name,
      polyline: {
        positions: Cartesian3.fromDegreesArray(item.positions),
        width,
        material: Color[color],
      },
      data: item,
    });
  });
}

/**
 *
 * @param {*} data  {name,position,...other}
 * @param {*} entities
 * image-strign 应用的图片对象都可以，，，
 * scale-number  缩放级别,，，，
 * pixelOffset-[x,y]偏移,,,,,
 * distanceDisplayCondition-[min,max]最小,最大显示层级 ,,,,

 * @param {*} label
 * show-Boolean 是否显示，
 * scale-string 缩放大小
 * fillColor-string 文字颜色
 * pixelOffset-[x,y] 偏移
 * distanceDisplayCondition-[min,max]最小,最大显示层级 ,,,,
 */
function getPointCesium(data, entities, label) {
  if (!Array.isArray(data) || data.length === 0) {
    console.warn("⚠️ getPointCesium: 点数据为空，跳过绘制");
    return;
  }
  if (!entities) {
    console.warn("⚠️ getPointCesium: 点样式配置为空，跳过绘制");
    return;
  }
  const {
    image,
    scale = 1,
    pixelOffset = [0, 0],
    distanceDisplayCondition = [0, 999999999],
  } = entities;
  const {
    show = false,
    scale: scaleLabel = 1,
    fillColor = "RED",
    backgroundColor = "BLUE",
    pixelOffset: labelPixelOffset = [0, 0],
    distanceDisplayCondition: labeldistanceDisplayCondition = [0, 999999999],
  } = label || {};
  data.forEach((item, index) => {
    if (
      !item ||
      !Array.isArray(item.positions) ||
      item.positions.length < 2 ||
      typeof item.positions[0] !== "number" ||
      typeof item.positions[1] !== "number"
    ) {
      return;
    }
    viewer.entities.add({
      id: item.name + index,
      position: Cartesian3.fromDegrees(item.positions[0], item.positions[1]),
      billboard: {
        heightReference: HeightReference.CLAMP_TO_GROUND,
        image,
        scale,
        pixelOffset: new Cartesian2(pixelOffset[0], pixelOffset[1]),
        distanceDisplayCondition: new DistanceDisplayCondition(
          distanceDisplayCondition[0],
          distanceDisplayCondition[1]
        ),
      },
      data: item,
      label: {
        show,
        scale: scaleLabel || 1,
        // 标签不贴地，避免在复杂地形/远景被压到地表以下导致不可见
        heightReference: HeightReference.NONE,
        fillColor: Color[fillColor],
        outlineColor: Color.BLACK,
        outlineWidth: 3,
        font: "600 28px sans-serif",
        text: item.text || item.name,
        showBackground: true,
        backgroundColor: Color[backgroundColor],
        pixelOffset: new Cartesian2(labelPixelOffset[0], labelPixelOffset[1]),
        // 保证标签不被地形深度测试遮挡
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        // 在高度多少以内显示  最小-最大
        distanceDisplayCondition: new DistanceDisplayCondition(
          labeldistanceDisplayCondition[0],
          labeldistanceDisplayCondition[1]
        ),
      },
    });
  });
}
/**
 * 多边形
 * @param {*} data name，positions经纬度数组
 * @param {*} color 颜色
 */
function getPolygonCesium(data, color = "BLUE") {
  if (Array.isArray(data)) {
    data.forEach((item) => {
      viewer.entities.add({
        name: item.name,
        polygon: {
          hierarchy: Cartesian3.fromDegreesArray(item.positions),
          material: Color[item.color || color].withAlpha(0.5),
          outline: true,
          outlineColor: Color.WHITE,
        },
        data: item,
      });
    });
  } else {
    viewer.entities.add({
      name: data.name,
      polygon: {
        hierarchy: Cartesian3.fromDegreesArray(data.positions),
        material: Color[data.color || color].withAlpha(0.5),
        outline: true,
        outlineColor: Color.WHITE,
      },
      data: data,
    });
  }
}

/**
 * 降雨模拟
 * @param {*} size  降雨大小1,2,3,4
 */
function getRainCesium(size) {
  // 先清空其他效果
  animationRainSnowHide(["Rain", "Snow"]);
  const scene = viewer.scene;
  // rain
  const rainParticleSize = 15.0;
  const rainRadius = 100000.0;
  const rainImageSize = new Cartesian2(
    rainParticleSize,
    rainParticleSize * size //图片大小
  );
  let rainGravityScratch = new Cartesian3();
  const rainUpdate = function (particle) {
    rainGravityScratch = Cartesian3.normalize(
      particle.position,
      rainGravityScratch
    );
    rainGravityScratch = Cartesian3.multiplyByScalar(
      rainGravityScratch,
      -1050.0,
      rainGravityScratch
    );

    particle.position = Cartesian3.add(
      particle.position,
      rainGravityScratch,
      particle.position
    );

    const distance = Cartesian3.distance(
      scene.camera.position,
      particle.position
    );
    if (distance > rainRadius) {
      particle.endColor.alpha = 0.0;
    } else {
      particle.endColor.alpha =
        Color.BLUE.alpha / (distance / rainRadius + 0.1);
    }
  };

  function showRain() {
    animationRainSnow.Rain = scene.primitives.add(
      new ParticleSystem({
        modelMatrix: new Matrix4.fromTranslation(scene.camera.position),
        speed: -1.0,
        lifetime: 15.0,
        emitter: new SphereEmitter(rainRadius),
        startScale: 1.0,
        endScale: 0.0,
        image: "circular_particle.png",
        emissionRate: 9000.0,
        startColor: new Color(0.27, 0.5, 0.7, 0.0),
        endColor: new Color(0.27, 0.5, 0.7, 0.98),
        imageSize: rainImageSize,
        updateCallback: rainUpdate,
      })
    );
    scene.skyAtmosphere.hueShift = -0.97;
    scene.skyAtmosphere.saturationShift = 0.25;
    scene.skyAtmosphere.brightnessShift = -0.4;
    scene.fog.density = 0.00025;
    scene.fog.minimumBrightness = 0.01;
  }
  showRain();
}
/**
 * 降雪模拟
 */
function getSnowCesium() {
  animationRainSnowHide(["Rain", "Snow"]);
  const scene = viewer.scene;
  // snow
  const snowParticleSize = 12.0;
  const snowRadius = 100000.0;
  const minimumSnowImageSize = new Cartesian2(
    snowParticleSize,
    snowParticleSize
  );
  const maximumSnowImageSize = new Cartesian2(
    snowParticleSize * 2.0,
    snowParticleSize * 2.0
  );
  let snowGravityScratch = new Cartesian3();
  const snowUpdate = function (particle) {
    snowGravityScratch = Cartesian3.normalize(
      particle.position,
      snowGravityScratch
    );
    Cartesian3.multiplyByScalar(
      snowGravityScratch,
      CesiumMath.randomBetween(-30.0, -300.0),
      snowGravityScratch
    );
    particle.velocity = Cartesian3.add(
      particle.velocity,
      snowGravityScratch,
      particle.velocity
    );
    const distance = Cartesian3.distance(
      scene.camera.position,
      particle.position
    );
    if (distance > snowRadius) {
      particle.endColor.alpha = 0.0;
    } else {
      particle.endColor.alpha = 1.0 / (distance / snowRadius + 0.1);
    }
  };
  function startSnow() {
    animationRainSnow.Snow = scene.primitives.add(
      new ParticleSystem({
        modelMatrix: new Matrix4.fromTranslation(scene.camera.position),
        minimumSpeed: -1.0,
        maximumSpeed: 0.0,
        lifetime: 15.0,
        emitter: new SphereEmitter(snowRadius),
        startScale: 0.5,
        endScale: 1.0,
        image: "snowflake_particle.png",
        emissionRate: 7000.0,
        startColor: Color.WHITE.withAlpha(0.0),
        endColor: Color.WHITE.withAlpha(1.0),
        minimumImageSize: minimumSnowImageSize,
        maximumImageSize: maximumSnowImageSize,
        updateCallback: snowUpdate,
      })
    );

    scene.skyAtmosphere.hueShift = -0.8;
    scene.skyAtmosphere.saturationShift = -0.7;
    scene.skyAtmosphere.brightnessShift = -0.33;
    scene.fog.density = 0.001;
    scene.fog.minimumBrightness = 0.8;
  }
  startSnow();
}
// 制定路径移动
function getGPXCesium(gpxFile) {
  viewer.dataSources
    .add(
      GpxDataSource.load(gpxFile, {
        clampToGround: true,
      })
    )
    .then(function (dataSource) {
      if (dataSource.entities.values.length > 0) {
        console.log("dataSource", dataSource.entities);
        // viewer.entities.add(dataSource.entities);
        // viewer.zoomTo(dataSource.entities);
      } else {
        console.error("GPX 文件未包含有效的轨迹数据");
      }
    })
    .catch(function (error) {
      console.error("加载 GPX 文件时出错:", error);
    });
}
/**
 * strign or array
 * @param {*} animationType  Rain,Snow 隐藏单个 或者多个['Rain','Snow']
 */
function animationRainSnowHide(animationType) {
  // 数组 遍历关闭
  if (Array.isArray(animationType)) {
    animationType.forEach((item) => {
      if (animationRainSnow[item])
        viewer.scene.primitives.remove(animationRainSnow[item]);
    });
  }
  // 字符串 隐藏单个
  if (typeof animationType === "string") {
    if (animationRainSnow[animationType])
      viewer.scene.primitives.remove(animationRainSnow[animationType]);
  }
}

/**
 * 根据类型或者名称 隐藏实体
 * name,
 * type
 * id
 * 传入字符串数组 或者 字符串
 * @param {*} text
 */
function hideEntities(text) {
  viewer.entities._entities._array.forEach((item) => {
    if (checkHasEntities(item)) item.show = false;
  });

  function checkHasEntities(item) {
    let flag = false;
    if (Array.isArray(text)) {
      flag =
        text.indexOf(item?.name) > -1 ||
        text.indexOf(item?.data?.type) > -1 ||
        text.indexOf(item?.data?.id) > -1 ||
        text.indexOf(item?.data?.name) > -1;
    }
    if (typeof text === "string") {
      flag =
        item?.name == text ||
        item?.data?.type == text ||
        item?.data?.id == text ||
        item?.data?.name == text;
    }
    return flag;
  }
}
/**
 * 删除实体
 * name,
 * type
 * id
 * 传入字符串数组 或者 字符串
 * @param {*} text
 */
function removeEntities(text) {
  for (
    let index = viewer.entities._entities._array.length - 1;
    index >= 0;
    index--
  ) {
    const item = viewer.entities._entities._array[index];
    if (checkHasEntities(item)) viewer.entities.remove(item);
  }
  function checkHasEntities(item) {
    let flag = false;
    if (Array.isArray(text)) {
      flag =
        text.indexOf(item?.name) > -1 ||
        text.indexOf(item?.data?.type) > -1 ||
        text.indexOf(item?.data?.id) > -1 ||
        text.indexOf(item?.data?.name) > -1;
    }
    if (typeof text === "string") {
      flag =
        item?.name == text ||
        item?.data?.type == text ||
        item?.data?.id == text ||
        item?.data?.name == text;
    }
    return flag;
  }
}
/**
 * 根据类型或者名称 显示实体
 * @param {string} text name type id
 * @returns  true false 是否已经有了
 */
function showEntities(text) {
  let has = false;
  viewer.entities._entities._array.forEach((item) => {
    if (
      item.name == text ||
      item?.data?.type == text ||
      item?.data?.id == text ||
      item?.data?.name == text
    ) {
      item.show = true;
      has = true;
    }
  });
  return has;
}

/**
 * 飞跃视角
 * @param {*} longitude 经度
 * @param {*} latitude 纬度
 * @param {*} height 高度
 * @param {*} heading 获取相机的航向角（东向为正）
 * @param {*} pitch 获取相机的俯仰角（上为正）
 * @param {*} roll 获取相机的翻滚角（顺时针为正）
 */
function flyToCesium(
  longitude,
  latitude,
  height,
  heading,
  pitch,
  roll,
  duration = 3,
  easing = false
) {
  // 笛卡尔坐标
  let center = Cartesian3.fromDegrees(longitude, latitude, height);
  // 视角飞跃
  viewer.camera.flyTo({
    destination: center,
    orientation: {
      heading: CesiumMath.toRadians(heading),
      pitch: CesiumMath.toRadians(pitch),
      roll: CesiumMath.toRadians(roll),
    },
    duration,
    easingFunction: easing ? EasingFunction.LINEAR_NONE : null, // 线性无缓动
  });
}
/**
 * 切换视角 不是飞跃
 * @param {*} longitude
 * @param {*} latitude
 * @param {*} height
 * @param {*} heading
 * @param {*} pitch
 * @param {*} roll
 */
function viewerCesium(longitude, latitude, height, heading, pitch, roll) {
  let center = Cartesian3.fromDegrees(longitude, latitude, height);
  viewer.camera.setView({
    destination: center,
    orientation: {
      heading: CesiumMath.toRadians(heading),
      pitch: CesiumMath.toRadians(pitch),
      roll: CesiumMath.toRadians(roll),
    },
  });
}

/**
 * 点击地图
 * 获取经纬度和地图模型数据
 * @returns
 * threeData 模型数据
 * longitude 经度
 * latitude 纬度
 */
const array = [];

function eventCesiumThree(fun) {
  const data = {
    threeData: null, //模型数据
    longitude: null,
    latitude: null,
  };
  // 地图点击事件
  var handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction(function (e) {
    const { x, y } = e.position;
    // 获取鼠标点击位置的二维坐标
    const mouse = new THREE.Vector2();
    mouse.x = (x / window.innerWidth) * 2 - 1;
    mouse.y = -(y / window.innerHeight) * 2 + 1;
    // 使用射线投射来确定鼠标点击位置是否与物体相交
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, three.camera); // camera 是你场景中的相机对象
    // 计算射线投射的物体相交情况
    const intersects = raycaster.intersectObjects(three.scene.children, true); // scene 是你的场景对象
    // 如果有相交的物体  点击到了模型上面
    if (intersects.length > 0) {
      // 获取第一个相交的物体
      const intersectedObject = getEntirety(intersects[0].object);
      data.threeData = intersectedObject;
      // 根据模型名称 找经纬度。 会设置好模型位置
      // console.log("Clicked object Name:", intersectedObject.data.name);
    } else {
      data.threeData = null;
    }
    // 点击到了地图上面 有效点击 经纬度
    if (viewer.camera.pickEllipsoid(e.position)) {
      // 将屏幕坐标转换为笛卡尔坐标
      var cartesian = viewer.scene.globe.ellipsoid.cartesianToCartographic(
        viewer.camera.pickEllipsoid(e.position)
      );
      data.longitude = CesiumMath.toDegrees(cartesian.longitude);
      data.latitude = CesiumMath.toDegrees(cartesian.latitude);
      array.push({
        lat: data.latitude,
        lon: data.longitude,
        value: 0,
      });
      // console.log("您点击的经纬度", data.longitude, data.latitude);
      console.log(array);
    } else {
      data.longitude = null;
      data.latitude = null;
    }
    // 执行函数
    fun(data);
  }, ScreenSpaceEventType.LEFT_CLICK);
  return handler;
}
/**
 * 点击地图，获取实体对象
 * @param {*} fun
 */
function eventCesiumEntity(fun) {
  var handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction(function (e) {
    if (e.endPosition) {
      var entity = viewer.scene.pick(e.endPosition);
      // 获取实体对象，实体对象data 是自定义的数据，返回实体原对象（后台对象数据）
      if (entity && entity.id?.data) fun(entity.id.data);
    } else {
      fun(false);
    }
  }, ScreenSpaceEventType.MOUSE_MOVE);
  return handler;
}

/**
 * 右点击事件
 * @param {*} fun
 */
function eventCesiumRight(fun) {
  const data = {
    longitude: null,
    latitude: null,
    cameraData: null,
  };
  var handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction(function (e) {
    if (viewer.camera.pickEllipsoid(e.position)) {
      // 将屏幕坐标转换为笛卡尔坐标
      var cartesian = viewer.scene.globe.ellipsoid.cartesianToCartographic(
        viewer.camera.pickEllipsoid(e.position)
      );
      data.longitude = CesiumMath.toDegrees(cartesian.longitude) || null;
      data.latitude = CesiumMath.toDegrees(cartesian.latitude) || null;
      // 获取相机的当前位置和姿态
      var position = viewer.camera.positionCartographic; // 获取相机的经纬度和高度（Cartographic坐标）
      var heading = viewer.camera.heading; // 获取相机的航向角（东向为正）
      var pitch = viewer.camera.pitch; // 获取相机的俯仰角（上为正）
      var roll = viewer.camera.roll; // 获取相机的翻滚角（顺时针为正）
      // 将Cartographic坐标转换为度
      var longitude = CesiumMath.toDegrees(position.longitude);
      var latitude = CesiumMath.toDegrees(position.latitude);
      var height = position.height;
      data.cameraData = {
        longitude,
        latitude,
        height,
        heading: CesiumMath.toDegrees(heading),
        pitch: CesiumMath.toDegrees(pitch),
        roll: CesiumMath.toDegrees(roll),
      };
      // 输出结果
      fun(data);
    }
  }, ScreenSpaceEventType.RIGHT_CLICK);
  return handler;
}

/**
 * 递归 找模型整体 不找平面xx
 */
function getEntirety(data) {
  // 给后期添加的模型 名字命名modalSelf。标识
  if (data.name == "modalSelf") {
    return data;
  } else if (data.parent) {
    // 向上查询
    return getEntirety(data.parent);
  } else {
    console.log("没有点到模型整体");
    return null;
  }
}
/**
 * 显示弹窗
 * @param {array} position  经度,纬度
 * @param {number} height 高度
 * @param {array} offset 偏移
 * @param {string} dom
 */
function showLayerCesium(position, height, offset, dom) {
  // 一个小弹窗 layer
  var val = {
    viewer: viewer,
    position,
    height,
    offset,
    dom: document.getElementById(dom),
  };
  // 初始化弹窗对象
  modalDivLayer = new divLabel(val);
  // 显示弹窗
  modalDivLayer.toggleShow(true);
}
/**
 * 隐藏弹窗
 */
function hideLayerCesium() {
  if (modalDivLayer) modalDivLayer.toggleShow(false);
}

/**
 * 初始化场景
 * 型场景定位 基于这个坐标 添加模型 只适用于单模型
 * @param {array} minWGS
 * @param {array} maxWGS
 */
function initThree(minWGS, maxWGS) {
  if (three.renderer) return three.renderer;

  sceneGeneration += 1;
  // 模型场景定位 基于这个坐标 添加模型 只适用于单模型
  minWGS84 = minWGS;
  maxWGS84 = maxWGS;
  let fov = 45;
  let width = window.innerWidth;
  let height = window.innerHeight;
  let aspect = width / height;
  let near = 1;
  let far = 10 * 1000 * 1000;
  three.scene = new THREE.Scene(); //场景
  three.camera = new THREE.PerspectiveCamera(fov, aspect, near, far); //相机
  three.renderer = new THREE.WebGLRenderer({ alpha: true }); //渲染
  three.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  let Amlight = new THREE.AmbientLight(0xffffff, 2); //灯光
  three.scene.add(Amlight);
  container.appendChild(three.renderer.domElement);
  mixer = new THREE.AnimationMixer(three.scene);
  return three.renderer;
}
/**
 * 添加GLTF模型
 * @param {string} url 模型地址
 * @param {object} set {} 模型xzy轴的缩放
 * @param {object} position {} 模型xyz轴的移动
 * @param {object} rotation {} 模型xyz轴的旋转
 * @param {object} data {name,id,} 模型其他信息
 * @param {array} minWGS 经纬度
 * @param {array} maxWGS 经纬度
 * @returns {object}  _3DOB Promise
 */
function getDBModelThree(
  url,
  set,
  position,
  rotation,
  data,
  minWGS = null,
  maxWGS = null
) {
  return new Promise((rs) => {
    const loadGeneration = sceneGeneration;
    // 外部模型加载
    const loader = new GLTFLoader();
    loader.load(url, (gltf) => {
      if (
        loadGeneration !== sceneGeneration ||
        !three.scene ||
        !three.renderer
      ) {
        disposeThreeObject(gltf.scene);
        rs(null);
        return;
      }

      const { x: sX, y: sY, z: sZ } = set;
      const { x: pX, y: pY, z: pZ } = position;
      const { x: rX, y: rY, z: rZ } = rotation;
      const modelss = gltf.scene;
      // 记录动画
      three.animation.push(...gltf.animations);
      modelss.name = "modalSelf"; //模型本身  因为点击事件获取模型是获取物体 可能只获取到平
      modelss.data = data; //模型其他信息
      console.log(modelss, "加载到模型");
      modelss.scale.set(sX, sY, sZ); // 缩放相关参数 scale object to be visible at planet scale
      // z方向移动一段距离
      modelss.position.x = pX; //
      modelss.position.y = pY; //
      modelss.position.z = pZ; //

      modelss.rotation.x = rX; //
      modelss.rotation.y = rY; //
      modelss.rotation.z = rZ; //
      //   分组
      let dodecahedronMeshYup = new THREE.Group();
      dodecahedronMeshYup.add(modelss);
      // 添加场景当中
      three.scene.add(dodecahedronMeshYup); // don’t forget to add it to the Three.js scene manually
      let _3DOB = {
        threeMesh: dodecahedronMeshYup,
        minWGS84: minWGS || minWGS84, //可以配置经纬度
        maxWGS84: maxWGS || maxWGS84, // 可以配置经纬度
      };
      // 返回对象 以及经纬度
      rs(_3DOB);
      // 存储模型
      three._3DOBS.push(_3DOB);
    }, undefined, (error) => {
      console.error(`模型加载失败: ${url}`, error);
      rs(null);
    });
  });
}
/**
 * 根据名称删除指定的模型对象
 * @param {array} names
 */
function clearDBModelThree(names) {
  console.log(names);
  three._3DOBS.forEach((item) => {
    item.threeMesh.children[0].children.forEach((mesh) => {
      if (names.indexOf(mesh.name) > -1) {
        item.threeMesh.children[0].remove(mesh);
      }
    });
  });
}
/**
 *部署点位
 * @param {array} data
 */
function createRtuModalThree(data) {
  const array = data || [
    {
      id: 1,
      name: "GNSS111",
      type: "rtu",
      state: 1,
      scale: { x: 0.8, y: 0.8, z: 0.8 },
      position: { x: -7.2, y: 27.4, z: 1.8 },
    },
    {
      id: 2,
      name: "GNSS222",
      type: "rtu",
      state: 1,
      scale: { x: 0.8, y: 0.8, z: 0.8 },
      position: { x: -7.1, y: 26.5, z: 1.8 },
    },
    {
      id: 3,
      name: "GNSS333",
      type: "rtu",
      state: 0,
      scale: { x: 0.8, y: 0.8, z: 0.8 },
      position: { x: 0, y: -10, z: 1.8 },
    },
    {
      id: 4,
      name: "GNSS444",
      type: "rtu",
      state: 1,
      scale: { x: 0.8, y: 0.8, z: 0.8 },
      position: { x: 0.3, y: -11, z: 1.8 },
    },

    {
      id: 5,
      name: "GNSS5",
      type: "rtu",
      state: 0,
      scale: { x: 0.8, y: 0.8, z: 0.8 },
      position: { x: 7.2, y: -47.4, z: 1.8 },
    },
    {
      id: 6,
      name: "GNSS6",
      type: "rtu",
      state: 1,
      scale: { x: 0.8, y: 0.8, z: 0.8 },
      position: { x: 7.4, y: -48.4, z: 1.8 },
    },
    {
      id: 7,
      name: "GNSS7",
      type: "rtu",
      state: 1,
      scale: { x: 0.8, y: 0.8, z: 0.8 },
      position: { x: 14, y: -84.8, z: 1.8 },
    },
    {
      id: 8,
      name: "GNSS8",
      type: "rtu",
      state: 1,
      scale: { x: 0.8, y: 0.8, z: 0.8 },
      position: { x: 14.2, y: -85.8, z: 1.8 },
    },

    // -------
    {
      id: 11,
      name: "正弦式压力应变计1",
      type: "rtu",
      state: 1,
      scale: { x: 0.8, y: 0.8, z: 0.8 },
      position: { x: 20.6, y: -84.5, z: 1.8 },
    },
    {
      id: 12,
      name: "正弦式压力应变计2",
      type: "rtu",
      state: 0,
      scale: { x: 0.8, y: 0.8, z: 0.8 },
      position: { x: 20.5, y: -83.5, z: 1.8 },
    },
    {
      id: 13,
      name: "正弦式压力应变计3",
      state: 1,
      scale: { x: 0.8, y: 0.8, z: 0.8 },
      position: { x: 13.5, y: -47.1, z: 1.8 },
    },
    {
      id: 14,
      name: "正弦式压力应变计4",
      type: "rtu",
      state: 1,
      scale: { x: 0.8, y: 0.8, z: 0.8 },
      position: { x: 13.3, y: -46.1, z: 1.8 },
    },

    {
      id: 15,
      name: "正弦式压力应变计5",
      type: "rtu",
      state: 1,
      scale: { x: 0.8, y: 0.8, z: 0.8 },
      position: { x: 6.2, y: -9.7, z: 1.8 },
    },
    {
      id: 16,
      name: "正弦式压力应变计6",
      type: "rtu",
      state: 1,
      scale: { x: 0.8, y: 0.8, z: 0.8 },
      position: { x: 6.2, y: -8.7, z: 1.8 },
    },

    {
      id: 17,
      name: "正弦式压力应变计7",
      type: "rtu",
      state: 0,
      scale: { x: 0.8, y: 0.8, z: 0.8 },
      position: { x: -0.9, y: 27.7, z: 1.8 },
    },
    {
      id: 18,
      name: "正弦式压力应变计8",
      type: "rtu",
      state: 1,
      scale: { x: 0.8, y: 0.8, z: 0.8 },
      position: { x: -1, y: 28.7, z: 1.8 },
    },
  ];
  array.forEach((item) => {
    const { state, scale, position } = item;
    const texture = new THREE.TextureLoader().load(
      state ? "b21.png" : "a03.png"
    );

    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture, //设置精灵纹理贴图
      transparent: true, //SpriteMaterial默认是true
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    // 放大物体
    sprite.scale.set(scale.x, scale.y, scale.z); // 放大
    sprite.position.set(position.x, position.y, position.z); // x 左右 y前后  z向上
    sprite.name = "modalSelf";
    sprite.data = item;
    let meshGroup = new THREE.Group();
    meshGroup.add(sprite);
    // 添加至场景
    three.scene.add(meshGroup);
    let _3DOB = {
      threeMesh: meshGroup,
      minWGS84: minWGS84,
      maxWGS84: maxWGS84,
    };
    three._3DOS.push(_3DOB);

    //创建一段rtu 闪烁的动画
    TW.rtuA = new TWEEN.Tween(spriteMaterial)
      .to({ opacity: 0.2 }, 500) // 1秒内从完全不透明变为完全透明
      .easing(TWEEN.Easing.Linear.None)
      .yoyo(true) // 使动画往返进行
      .repeat(Infinity) // 无限重复
      .start();
  });
}

/**
 * 动态水流 添加材质
 * @param {array} RiverPoint 河流数据
 */
function createShuiCesium(RiverPoint) {
  if (!Array.isArray(RiverPoint) || RiverPoint.length < 6) {
    console.warn("⚠️ createShuiCesium: 水域坐标为空，跳过水流材质绘制");
    return;
  }
  var River1Point = RiverPoint;
  //河道1多边形
  var polygon1 = new PolygonGeometry({
    polygonHierarchy: new PolygonHierarchy(
      Cartesian3.fromDegreesArray(River1Point)
    ),
    extrudedHeight: 0,
    height: 0,
    vertexFormat: EllipsoidSurfaceAppearance.VERTEX_FORMAT,
  });
  var River1 = new Primitive({
    geometryInstances: new GeometryInstance({
      geometry: polygon1,
    }),
    appearance: new EllipsoidSurfaceAppearance({
      aboveGround: true,
    }),
    show: true,
  });
  var River1_Material = new Material({
    fabric: {
      type: "Water",
      uniforms: {
        baseWaterColor: new Color(151 / 255.0, 201 / 255.0, 185 / 255.0, 0.8),
        // blendColor: new Color(0.0, 1.0, 0.7, 1),
        normalMap: water,
        frequency: 500.0,
        animationSpeed: 0.01,
        amplitude: 10.0,
      },
    },
  });
  var scene = viewer.scene;
  River1.appearance.material = River1_Material;
  scene.primitives.add(River1); //添加到场景
}

/**
 * 模型透明度
 * @param {number} opacity 透明度为0.35 1透明度为1
 * @param {string} type 需要透明的 模型类型（自定义的）
 */
function opacityModalThree(opacity, type) {
  three._3DOBS.forEach((threeMeshItem) => {
    threeMeshItem.threeMesh.children.forEach((item) => {
      console.log(item.data.type);
      if (item.data.type == type) {
        item.traverse(function (child) {
          // 检查对象是否是网格
          if (child.isMesh) {
            // 设置材质的透明度属性
            child.material.transparent = !opacity; // 启用透明度
            child.material.opacity = opacity ? 1 : 0.2; // 设置透明度值，例如0.5为半透明
          }
        });
      }
      console.log(item);
    });
  });
}
/**
 * 在场景搭建时创建的动画
 * 根据动画名称播放动画
 * @param {string} name
 */
function palyAnimationByName(name) {
  three.animation.forEach((item) => {
    if (item.name == name) {
      const clipAction = mixer.clipAction(item); //创建动画clipAction对象
      clipAction.play(); //播放动画
      // 如果想播放动画,需要周期性执行`mixer.update()`更新AnimationMixer时间数据
    }
  });
}

/**
 * 小汽车动画
 */
async function carQiaoThree() {
  const modal = await getDBModelThree(
    "/modal/car.glb",
    { x: 0.4, y: 0.4, z: 0.4 },
    { x: 0, y: 0, z: 0 },
    { x: CesiumMath.PI / 2, y: 0.19, z: 0 },
    { name: "小汽车1", type: "car" },
    [112.33124881435724, 28.587927693177438],
    [112.33128061107594, 28.58799380302639]
  );
  const threeMesh = modal.threeMesh.children[0];
  //创建一段汽车的动画
  TW.carA = new TWEEN.Tween(threeMesh)
    .to(
      {
        position: { x: 14.8, y: -80, z: 9 },
      },
      1000 * 5
    ) // 1秒内从完全不透明变为完全透明
    .easing(TWEEN.Easing.Linear.None)
    // 第二段
    .onComplete(function () {
      new TWEEN.Tween(threeMesh)
        .to(
          {
            position: { x: 71, y: -372, z: 8 },
          },
          1000 * 15
        ) // 1秒内从完全不透明变为完全透明
        .easing(TWEEN.Easing.Linear.None)
        // 第三段
        .onComplete(function () {
          new TWEEN.Tween(threeMesh)
            .to(
              {
                position: { x: 86, y: -450, z: 1 },
              },
              1000 * 5
            ) // 1秒内从完全不透明变为完全透明
            .easing(TWEEN.Easing.Linear.None)

            .start();
        })

        .start();
    })
    .onStart(function () {
      flyToCesium(
        112.33095798583932,
        28.589348757853145,
        9.70677443281772,
        347.6515985751144,
        -2.0196611864997087,
        0.00004974526774126226,
        15,
        true
      );
      setTimeout(() => {
        flyToCesium(
          112.33144052062501,
          28.59066476654278,
          62.4888360948069,
          312.1107184383778,
          -27.54949531113535,
          0.00019721415548975052,
          10,
          true
        );
      }, 10000);
    })
    .start();
}

/**
 * three.js每次刷新的操作
 */
function renderThreeObj() {
  if (!viewer || !three.scene || !three.camera || !three.renderer || !container) {
    return;
  }
  // register Three.js scene with Cesium
  // 镜头同步
  three.camera.fov = CesiumMath.toDegrees(viewer.camera.frustum.fovy); // ThreeJS FOV is vertical
  //three.camera.updateProjectionMatrix();
  let cartToVec = function (cart) {
    return new THREE.Vector3(cart.x, cart.y, cart.z);
  };
  const _3Dobjects = [...three._3DOBS, ...three._3DOS];
  // 将Three.js网格配置为相对于地球仪中心位置向上
  for (let id in _3Dobjects) {
    minWGS84 = _3Dobjects[id].minWGS84;
    maxWGS84 = _3Dobjects[id].maxWGS84;
    // convert lat/long center position to Cartesian3
    let center = Cartesian3.fromDegrees(
      (minWGS84[0] + maxWGS84[0]) / 2,
      (minWGS84[1] + maxWGS84[1]) / 2
    );
    // get forward direction for orienting model
    let centerHigh = Cartesian3.fromDegrees(
      (minWGS84[0] + maxWGS84[0]) / 2,
      (minWGS84[1] + maxWGS84[1]) / 2,
      1
    );
    // use direction from bottom left to top left as up-vector
    let bottomLeft = cartToVec(
      Cartesian3.fromDegrees(minWGS84[0], minWGS84[1])
    );
    let topLeft = cartToVec(Cartesian3.fromDegrees(minWGS84[0], maxWGS84[1]));
    let latDir = new THREE.Vector3()
      .subVectors(bottomLeft, topLeft)
      .normalize();
    // configure entity position and orientation
    // 配置实体位置和方向
    _3Dobjects[id].threeMesh.position.copy(center); // 控制更新后的模型位置
    // if(_3Dobjects[id].myType) _3Dobjects[id].threeMesh.position.y += 10.0;

    _3Dobjects[id].threeMesh.lookAt(centerHigh.x, centerHigh.y, centerHigh.z);
    _3Dobjects[id].threeMesh.up.copy(latDir);
  }
  // Clone Cesium Camera projection position so the
  // Three.js Object will appear to be at the same place as above the Cesium Globe
  // 克隆铯相机的投影位置，使Three.js对象看起来与铯地球仪上方的位置相同
  three.camera.matrixAutoUpdate = false;
  let cvm = viewer.camera.viewMatrix;
  let civm = viewer.camera.inverseViewMatrix;

  // 注意这里，经大神博客得知，three高版本这行代码需要放在 three.camera.matrixWorld 之前
  three.camera.lookAt(0, 0, 0);

  three.camera.matrixWorld.set(
    civm[0],
    civm[4],
    civm[8],
    civm[12],
    civm[1],
    civm[5],
    civm[9],
    civm[13],
    civm[2],
    civm[6],
    civm[10],
    civm[14],
    civm[3],
    civm[7],
    civm[11],
    civm[15]
  );

  three.camera.matrixWorldInverse.set(
    cvm[0],
    cvm[4],
    cvm[8],
    cvm[12],
    cvm[1],
    cvm[5],
    cvm[9],
    cvm[13],
    cvm[2],
    cvm[6],
    cvm[10],
    cvm[14],
    cvm[3],
    cvm[7],
    cvm[11],
    cvm[15]
  );

  // 设置three宽高
  let width = container.clientWidth;
  let height = container.clientHeight;
  let aspect = width / height;
  three.camera.aspect = aspect;
  three.camera.updateProjectionMatrix();
  const pixelRatio = three.renderer.getPixelRatio();
  const targetWidth = Math.floor(width * pixelRatio);
  const targetHeight = Math.floor(height * pixelRatio);
  if (
    three.renderer.domElement.width !== targetWidth ||
    three.renderer.domElement.height !== targetHeight
  ) {
    three.renderer.setSize(width, height);
  }
  three.renderer.clear();
  three.renderer.render(three.scene, three.camera);
}
// cesium 渲染
function renderCesium() {
  if (viewer && !viewer.isDestroyed()) {
    viewer.render();
  }
}

/**
 * 更新渲染
 */
function loop() {
  if (renderLoopRunning) return viewer;

  renderLoopRunning = true;
  const renderFrame = () => {
    if (!renderLoopRunning) return;

    TWEEN.update();
    renderCesium();
    renderThreeObj();
    renderAnimationFrame = requestAnimationFrame(renderFrame);
  };

  renderAnimationFrame = requestAnimationFrame(renderFrame);
  return viewer;
}

function stopRenderLoop() {
  renderLoopRunning = false;
  if (renderAnimationFrame !== null) {
    cancelAnimationFrame(renderAnimationFrame);
    renderAnimationFrame = null;
  }
}

function disposeThreeMaterial(material) {
  if (!material) return;

  Object.values(material).forEach((value) => {
    if (value && typeof value === "object" && value.isTexture) {
      value.dispose();
    }
  });
  material.dispose?.();
}

function disposeThreeObject(root) {
  root?.traverse?.((object) => {
    object.geometry?.dispose?.();
    if (Array.isArray(object.material)) {
      object.material.forEach(disposeThreeMaterial);
    } else {
      disposeThreeMaterial(object.material);
    }
  });
}

function destroyCesiumScene() {
  stopRenderLoop();
  sceneGeneration += 1;
  TWEEN.removeAll();

  three._3DOBS.forEach((item) => disposeThreeObject(item.threeMesh));
  three._3DOS.forEach((item) => disposeThreeObject(item.threeMesh || item));
  disposeThreeObject(three.scene);

  if (mixer) {
    mixer.stopAllAction();
    mixer.uncacheRoot(three.scene);
    mixer = null;
  }

  if (three.renderer) {
    three.renderer.renderLists?.dispose?.();
    three.renderer.dispose();
    three.renderer.forceContextLoss?.();
    three.renderer.domElement?.remove();
  }

  three.scene = null;
  three.camera = null;
  three.renderer = null;
  three._3DOBS.length = 0;
  three._3DOS.length = 0;
  three.animation.length = 0;

  if (viewer && !viewer.isDestroyed()) {
    viewer.destroy();
  }

  viewer = null;
  container = null;
  modalDivLayer = null;
  mapLayer.bigmap = null;
  mapLayer.gaodeWX = null;
  mapLayer.gaodeJJ = null;
}

/**
 * 获取 Cesium Viewer 实例
 * @returns {Viewer} Cesium Viewer 实例
 */
function getViewer() {
  return viewer;
}

export {
  initCesium,
  initBigMap,
  initGaoGeWX,
  initGaoGeJJ,
  initWMSService,
  initWMTSService,
  flyToCesium,
  viewerCesium,
  getLineCesium,
  getWallCesium,
  getWallLightCesium,
  getPolygonCesium,
  getPolygonHolesCesium,
  getPointCesium,
  getRainCesium,
  getSnowCesium,
  getGPXCesium,
  animationRainSnowHide,
  removeEntities,
  hideEntities,
  showEntities,
  createShuiCesium,
  showLayerCesium,
  hideLayerCesium,
  eventCesiumThree,
  eventCesiumEntity,
  eventCesiumRight,
  initThree,
  getDBModelThree,
  clearDBModelThree,
  palyAnimationByName,
  createRtuModalThree,
  opacityModalThree,
  carQiaoThree,
  renderThreeObj,
  loop,
  stopRenderLoop,
  destroyCesiumScene,
  getViewer, // 导出 viewer 获取方法
};
