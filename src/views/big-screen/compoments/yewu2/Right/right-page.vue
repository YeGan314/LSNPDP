<template>
  <div class="right-container">
    <lease-title icon="tingchechang" :rightbox="false">监测断面</lease-title>
    <div class="row-content">
      <div class="traffic-data">
        <div class="row">
          <div
            class="traffic-item"
            :class="{ active: selectedSiteName === item.text }"
            v-for="(item, index) in List1"
            :key="index"
          >
            <icon-box width="24" height="24">
              <img :src="item.img" />
            </icon-box>
            <div class="traffic-content" @click="EntityNameClick(item)">
              <div class="value">{{ item.text }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <lease-title :rightbox="false">污染物类型</lease-title>
    <div class="row-content">
      <box width="700" height="220">
        <div class="pollutant-tabs">
          <button
            class="pollutant-tab"
            :class="{ active: activePollutantGroup === group.value }"
            v-for="group in pollutantGroupTabs"
            :key="group.value"
            type="button"
            @click="selectPollutantGroup(group.value)"
          >
            {{ group.text }}
          </button>
        </div>
        <div class="checkBoxRow pollutant-row">
          <div
            class="checkBox pollutant-item"
            :class="{ active: selectedPollutantCode === item.value }"
            v-for="(item, index) in List2"
            :key="index"
            @click="selectPollutant(item)"
          >
            <div class="img">
              <icon-box width="24" height="24">
                <img :src="item.img" />
              </icon-box>
            </div>
            <div class="text">{{ item.text }}</div>
          </div>
        </div>
      </box>
    </div>

    <lease-title :rightbox="false">时间节点</lease-title>
    <div class="row-content">
      <box width="700" height="220">
        <div class="geo-groups">
          <div class="checkBoxRow geo-row geo-all-row">
            <div
              class="checkBox geo-item geo-all-item"
              :class="{ active: selectedMonDate === ALL_TIME_NODE.value }"
              @click="selectTimeNode(ALL_TIME_NODE)"
            >
              <div class="text">{{ ALL_TIME_NODE.text }}</div>
            </div>
          </div>
          <div class="geo-group" v-for="(group, groupIndex) in List3" :key="group.year || groupIndex">
            <div class="geo-year">{{ group.year }}年</div>
            <div class="checkBoxRow geo-row">
              <div
                class="checkBox geo-item"
                :class="{ active: selectedMonDate === item.value }"
                v-for="(item, index) in group.items"
                :key="`${group.year}-${index}`"
                @click="selectTimeNode(item)"
              >
                <div class="text">{{ item.text }}</div>
              </div>
            </div>
          </div>
        </div>
      </box>
    </div>
  </div>
</template>

<script>
import { defineComponent, inject, ref, watch, onMounted, onUnmounted } from "vue";
import LeaseTitle from "@/components/bigScreen/Lease_title/index-page.vue";
import IconBox from "@/components/bigScreen/IconBox/index-page.vue";
import Box from "@/components/bigScreen/Box/index-page.vue";
import shuiku1 from "@/assets/bigScreen/map/shuiku1.png";
import zhaba from "@/assets/bigScreen/map/b22.png";
import zhandian from "@/assets/bigScreen/map/b21.png";
import * as geoData from "../../../js/geo.js";
import { initWMSService, getViewer } from "../../../js/threeCesium.js";
import { getGeoServerLayers } from "@/utils/geoserver-helper";
import { GEOSERVER_CONFIG } from "@/config/geoserver.config";

const POLLUTANT_FIELD_NAME_MAP = {
  sdz: "磺胺嘧啶",
  stz: "磺胺噻唑",
  spd: "磺胺吡啶",
  smd: "磺胺甲嘧啶",
  sdd: "磺胺二甲嘧啶",
  smm: "磺胺甲噁唑",
  smtz: "磺胺二甲氧嘧啶",
  smp: "磺胺甲氧嘧啶",
  scp: "磺胺氯哒嗪",
  smx: "磺胺甲噁唑",
  enr: "恩诺沙星",
  nor: "诺氟沙星",
  cip: "环丙沙星",
  ofl: "氧氟沙星",
  sar: "沙拉沙星",
  eno: "依诺沙星",
  lom: "洛美沙星",
  nal: "萘啶酸",
  flm: "氟甲喹",
  cin: "西诺沙星",
  spa: "司帕沙星",
  otc: "土霉素",
  tet: "四环素",
  ctc: "金霉素",
  rox: "罗红霉素",
  ery: "红霉素",
  lin: "林可霉素",
  cli: "克林霉素",
  cla: "克拉霉素",
  azi: "阿奇霉素",
  ctx: "头孢噻肟",
  cap: "氯霉素",
  ff: "氟苯尼考",
};

const PHENOL_FIELD_NAME_MAP = {
  bisphenolA: "双酚A",
  tbutylph: "叔丁基苯酚",
  butylph: "丁基苯酚",
  pentylph: "戊基苯酚",
  hexylph: "己基苯酚",
  toctylph: "叔辛基苯酚",
  heptylph: "庚基苯酚",
  bnonylph: "支链壬基苯酚",
  octylph: "辛基苯酚",
  nonylph: "壬基苯酚",
};

const COMPOSITE_POLLUTANT_CODE = "__composite__";
const COMPOSITE_POLLUTANT_ITEM = {
  img: zhandian,
  value: COMPOSITE_POLLUTANT_CODE,
  text: "综合指数",
  isComposite: true,
  hasValue: true,
};
const POLLUTANT_GROUPS = [
  {
    value: "composite",
    text: "综合指数",
    items: [COMPOSITE_POLLUTANT_ITEM],
  },
  {
    value: "antibiotics",
    text: "抗生素",
    fieldMap: POLLUTANT_FIELD_NAME_MAP,
  },
  {
    value: "phenols",
    text: "双酚A及烷基苯酚",
    fieldMap: PHENOL_FIELD_NAME_MAP,
  },
];

const DEFAULT_FLY_CAMERA = {
  height: 3200,
  heading: 13.13,
  pitch: -18.35,
  roll: 0.003,
};

const ALL_SECTION_TEXT = "全部断面";
const ALL_SECTION_ITEM = {
  img: zhandian,
  text: ALL_SECTION_TEXT,
  isAll: true,
};
const ALL_TIME_NODE = {
  value: "",
  text: "全部时段",
};

const GLOBAL_FLY_CAMERA = {
  lon: 113.75300914535553,
  lat: 24.68481663753728,
  height: 64578.45508858897,
  heading: 343.56621396448907,
  pitch: -28.920626021072486,
  roll: 1.2677244429007686,
};

const IDLE_START_MS = 60 * 1000;
const AUTO_SWITCH_MS = 10 * 1000;

export default defineComponent({
  components: { LeaseTitle, Box, IconBox },
  setup() {
    const ListReservoir = geoData.ListReservoir || [];
    const ListQuDao = geoData.ListQuDao || [];
    const ListHeLiu = geoData.ListHeLiu || [];
    const ListQuDao2 = geoData.ListQuDao2 || [];
    const ListPoint1 = geoData.ListPoint1 || [];
    const ListPoint2 = geoData.ListPoint2 || [];

    const loadMap = inject("loadMap");
    const flyToCesium = inject("flyToCesium");
    const removeEntities = inject("removeEntities");
    const getPointCesium = inject("getPointCesium");
    const getLineCesium = inject("getLineCesium");
    const initBigMap = inject("initBigMap");
    const initGaoGeWX = inject("initGaoGeWX");
    const initGaoGeJJ = inject("initGaoGeJJ");

    const List1 = ref([]);
    const List2 = ref([]);
    const List3 = ref([]);
    const pollutantFeatures = ref([]);
    const pollutantGroupTabs = POLLUTANT_GROUPS.map(({ value, text }) => ({ value, text }));
    const activePollutantGroup = ref(POLLUTANT_GROUPS[0].value);
    const selectedMonDate = ref("");
    const selectedPollutantCode = ref("");
    const selectedSiteName = ref("");

    let hsqBufferLayer = null;
    let idleTimer = null;
    let autoSwitchTimer = null;

    const shuikuPoint = { Entity: { image: shuiku1, scale: 0.1, pixelOffset: [0, 0] }, lable: { show: false } };
    const zhabaPoint = { Entity: { image: zhaba, scale: 0.5, pixelOffset: [0, 0] }, lable: { show: false } };
    const zhandianPoint = {
      Entity: { image: zhandian, scale: 0.15, pixelOffset: [0, 0] },
      lable: { show: true, scale: 0.75, fillColor: "WHITE", backgroundColor: "BLUE", pixelOffset: [0, -36], distanceDisplayCondition: [0, 3000000] },
    };

    const toSiteName = (properties = {}) =>
      properties.site_name || properties.siteName || properties.station_name || properties.station || properties.name || "";

    const getPropertyValue = (properties = {}, field = "") => {
      if (!field) return undefined;
      const candidates = [field, String(field).toUpperCase(), String(field).toLowerCase()];
      for (const candidate of candidates) {
        if (Object.prototype.hasOwnProperty.call(properties, candidate)) return properties[candidate];
      }
      const matchedKey = Object.keys(properties).find((key) => key.toLowerCase() === String(field).toLowerCase());
      return matchedKey ? properties[matchedKey] : undefined;
    };

    const extractCoordinates = (feature) => {
      const geometry = feature?.geometry;
      if (!geometry?.type || !geometry?.coordinates) return null;
      if (geometry.type === "Point") return geometry.coordinates;
      if (geometry.type === "MultiPoint" && geometry.coordinates.length > 0) return geometry.coordinates[0];
      return null;
    };

    const normalizeMonDate = (value) => {
      if (!value) return "";
      if (value instanceof Date && !Number.isNaN(value.getTime())) {
        const y = value.getFullYear();
        const m = `${value.getMonth() + 1}`.padStart(2, "0");
        const d = `${value.getDate()}`.padStart(2, "0");
        return `${y}-${m}-${d}`;
      }
      const text = String(value).trim();
      const match = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
      if (!match) {
        const cnMatch = text.match(/^(\d{4})年\s*(\d{1,2})月\s*(上旬|下旬)?/);
        if (!cnMatch) return "";
        const year = Number(cnMatch[1]);
        const month = Number(cnMatch[2]);
        const day = cnMatch[3] === "上旬" ? 10 : cnMatch[3] === "下旬" ? 20 : 1;
        if (!Number.isFinite(year) || month < 1 || month > 12) return "";
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      }
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return "";
      if (month < 1 || month > 12 || day < 1 || day > 31) return "";
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    };

    const emitSelectionChange = (payload = {}) => {
      const normalizedDate = normalizeMonDate(payload.monDate ?? selectedMonDate.value);
      const monMonth = normalizedDate ? normalizedDate.slice(0, 7) : "";
      const siteName = String((payload.siteName ?? (selectedSiteName.value === ALL_SECTION_TEXT ? "" : selectedSiteName.value)) || "");
      window.dispatchEvent(
        new CustomEvent("yewu2-filter-change", {
          detail: {
            pollutantCode: String((payload.pollutantCode ?? selectedPollutantCode.value) || ""),
            pollutantName: String(payload.pollutantName || ""),
            monDate: normalizedDate,
            monMonth,
            siteName,
            siteFocused: Boolean(payload.siteFocused ?? !!siteName),
          },
        })
      );
    };

    const formatMonDateNodeLabel = (monDate) => {
      const normalized = normalizeMonDate(monDate);
      if (!normalized) return String(monDate || "");
      const [, monthText, dayText] = normalized.split("-");
      const month = Number(monthText);
      const day = Number(dayText);
      if (day === 1) return `${month}月`;
      if (day === 10) return `${month}月上旬`;
      if (day === 20) return `${month}月下旬`;
      return `${month}月${day}日`;
    };

    const parseViewConfig = (rawView) => {
      if (!rawView) return null;
      let view = rawView;
      if (typeof rawView === "string") {
        try {
          view = JSON.parse(rawView);
        } catch (error) {
          return null;
        }
      }
      if (typeof view !== "object" || view === null) return null;

      const lon = Number(view.lon);
      const lat = Number(view.lat);
      const height = Number(view.height);
      const heading = Number(view.heading);
      const pitch = Number(view.pitch);
      const roll = Number(view.roll);

      if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
      return {
        lon,
        lat,
        height: Number.isFinite(height) ? height : DEFAULT_FLY_CAMERA.height,
        heading: Number.isFinite(heading) ? heading : DEFAULT_FLY_CAMERA.heading,
        pitch: Number.isFinite(pitch) ? pitch : DEFAULT_FLY_CAMERA.pitch,
        roll: Number.isFinite(roll) ? roll : DEFAULT_FLY_CAMERA.roll,
      };
    };

    const selectPollutant = (item) => {
      if (!item?.value) return;
      selectedPollutantCode.value = item.value;
      const siteFocused = selectedSiteName.value !== ALL_SECTION_TEXT;
      const siteName = siteFocused ? selectedSiteName.value : "";
      const isComposite = item.value === COMPOSITE_POLLUTANT_CODE;
      emitSelectionChange({
        pollutantCode: item.value,
        pollutantName: item.text || "",
        siteName,
        siteFocused,
      });
      const api = window.__layerPanelApi;
      if (api && typeof api.updatePollutantStyle === "function") {
        api.updatePollutantStyle({
          valueMode: isComposite ? "composite" : "field",
          valueFieldCandidates: isComposite ? ["yczb", "YCZB"] : [item.value, String(item.value).toUpperCase(), String(item.value).toLowerCase()],
          monDate: isComposite ? "" : selectedMonDate.value || "",
          siteName,
          siteFocused,
        });
      }
      if (api && typeof api.refreshPollutantLayer === "function") {
        api.refreshPollutantLayer();
      }
    };

    const flyToSection = (item) => {
      const view = parseViewConfig(item?.view);
      const lon = Number(view?.lon ?? item?.longitude);
      const lat = Number(view?.lat ?? item?.latitude);
      const height = Number(view?.height ?? DEFAULT_FLY_CAMERA.height);
      const heading = Number(view?.heading ?? DEFAULT_FLY_CAMERA.heading);
      const pitch = Number(view?.pitch ?? DEFAULT_FLY_CAMERA.pitch);
      const roll = Number(view?.roll ?? DEFAULT_FLY_CAMERA.roll);
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) return;

      const viewer = getViewer?.() || window.viewer;
      const Cesium = window.Cesium;
      if (viewer?.camera && Cesium?.Cartesian3) {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
          orientation: {
            heading: Cesium.Math.toRadians(heading),
            pitch: Cesium.Math.toRadians(pitch),
            roll: Cesium.Math.toRadians(roll),
          },
          duration: 1.8,
        });
        return;
      }
      if (typeof flyToCesium === "function") {
        flyToCesium(lon, lat, height, heading, pitch, roll);
      }
    };

    const flyToGlobalView = () => {
      const viewer = getViewer?.() || window.viewer;
      const Cesium = window.Cesium;
      if (viewer?.camera && Cesium?.Cartesian3) {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(GLOBAL_FLY_CAMERA.lon, GLOBAL_FLY_CAMERA.lat, GLOBAL_FLY_CAMERA.height),
          orientation: {
            heading: Cesium.Math.toRadians(GLOBAL_FLY_CAMERA.heading),
            pitch: Cesium.Math.toRadians(GLOBAL_FLY_CAMERA.pitch),
            roll: Cesium.Math.toRadians(GLOBAL_FLY_CAMERA.roll),
          },
          duration: 1.8,
        });
        return;
      }
      if (typeof flyToCesium === "function") {
        flyToCesium(
          GLOBAL_FLY_CAMERA.lon,
          GLOBAL_FLY_CAMERA.lat,
          GLOBAL_FLY_CAMERA.height,
          GLOBAL_FLY_CAMERA.heading,
          GLOBAL_FLY_CAMERA.pitch,
          GLOBAL_FLY_CAMERA.roll,
          1.8
        );
      }
    };

    const selectSection = (item, shouldFly = true) => {
      if (!item) return;
      selectedSiteName.value = item.text || "";
      if (item.isAll) {
        rebuildPollutantListForSite("");
        const selected = List2.value.find((entry) => entry.value === selectedPollutantCode.value) || List2.value[0];
        if (selected) selectPollutant(selected);
        if (shouldFly) flyToGlobalView();
        return;
      }
      rebuildPollutantListForSite(selectedSiteName.value);
      if (shouldFly) flyToSection(item);
    };

    const clearAutoSwitch = () => {
      if (idleTimer) {
        clearTimeout(idleTimer);
        idleTimer = null;
      }
      if (autoSwitchTimer) {
        clearInterval(autoSwitchTimer);
        autoSwitchTimer = null;
      }
    };

    const rotateNextSection = () => {
      const sections = (List1.value || []).filter((item) => !item.isAll);
      if (!sections.length) return;
      const currentIndex = sections.findIndex((item) => item.text === selectedSiteName.value);
      const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % sections.length;
      selectSection(sections[nextIndex], true);
    };

    const startAutoSwitch = () => {
      if (autoSwitchTimer || !List1.value.length) return;
      autoSwitchTimer = setInterval(rotateNextSection, AUTO_SWITCH_MS);
    };

    const restartIdleCountdown = () => {
      clearAutoSwitch();
      idleTimer = setTimeout(() => {
        startAutoSwitch();
      }, IDLE_START_MS);
    };

    const buildPollutantItem = ([code, name], props = {}) => ({
      img: zhandian,
      value: code,
      text: name,
      hasValue: Number.isFinite(Number(getPropertyValue(props, code))),
    });

    const rebuildPollutantListForSite = (siteName, shouldSelectFirst = true) => {
      const feature = siteName ? pollutantFeatures.value.find((item) => toSiteName(item.properties) === siteName) : null;
      const props = feature?.properties || {};
      const group = POLLUTANT_GROUPS.find((item) => item.value === activePollutantGroup.value) || POLLUTANT_GROUPS[0];

      List2.value = group.items
        ? group.items
        : Object.entries(group.fieldMap || {}).map((entry) => buildPollutantItem(entry, props));

      if (shouldSelectFirst && List2.value.length > 0) selectPollutant(List2.value[0]);
    };

    const selectPollutantGroup = (groupValue) => {
      if (!POLLUTANT_GROUPS.some((item) => item.value === groupValue)) return;
      if (activePollutantGroup.value === groupValue) return;
      activePollutantGroup.value = groupValue;
      rebuildPollutantListForSite(selectedSiteName.value === ALL_SECTION_TEXT ? "" : selectedSiteName.value);
      restartIdleCountdown();
    };

    const rebuildSectionListByMonDate = (monDate) => {
      const normalized = normalizeMonDate(monDate);
      const selectedFeatures = normalized
        ? pollutantFeatures.value.filter((feature) => normalizeMonDate(feature?.properties?.mon_date) === normalized)
        : pollutantFeatures.value;

      const siteMap = new Map();
      selectedFeatures.forEach((feature) => {
        const siteName = toSiteName(feature.properties);
        if (!siteName || siteMap.has(siteName)) return;
        const coord = extractCoordinates(feature) || [];
        const parsedView = parseViewConfig(feature?.properties?.view);
        siteMap.set(siteName, {
          img: zhandian,
          text: siteName,
          longitude: Number(parsedView?.lon ?? coord[0]),
          latitude: Number(parsedView?.lat ?? coord[1]),
          view: parsedView,
          ...DEFAULT_FLY_CAMERA,
        });
      });
      List1.value = [ALL_SECTION_ITEM, ...Array.from(siteMap.values())];
      if (List1.value.length > 0) {
        selectedSiteName.value = ALL_SECTION_TEXT;
        rebuildPollutantListForSite("");
      } else {
        selectedSiteName.value = ALL_SECTION_TEXT;
        List2.value = [];
      }
    };

    const loadPollutantBaseInfo = async () => {
      try {
        const layers = await getGeoServerLayers();
        const layer = layers.find((item) => {
          const name = item?.name || "";
          return name.toLowerCase() === "cz_xwrw_data" || name.toLowerCase().endsWith(":cz_xwrw_data");
        });
        if (!layer) {
          List1.value = [];
          List2.value = [];
          return;
        }

        const fullName = layer.name.includes(":") ? layer.name : `${layer.workspace || "LSNPDP"}:${layer.name}`;
        const workspace = fullName.split(":")[0];
        const requestUrl =
          `${GEOSERVER_CONFIG.baseUrl}/${workspace}/ows?service=WFS&version=1.0.0&request=GetFeature` +
          `&typeName=${encodeURIComponent(fullName)}` +
          `&outputFormat=${encodeURIComponent("application/json")}` +
          `&srsName=EPSG:4326`;

        const response = await fetch(requestUrl);
        if (!response.ok) throw new Error(`WFS 请求失败: ${response.status}`);
        const geojson = await response.json();
        const features = Array.isArray(geojson?.features) ? geojson.features : [];
        pollutantFeatures.value = features;

        const dateMap = new Map();
        features.forEach((feature) => {
          const rawMonDate = feature?.properties?.mon_date;
          const normalized = normalizeMonDate(rawMonDate);
          if (!normalized || dateMap.has(normalized)) return;
          dateMap.set(normalized, {
            value: normalized,
            text: formatMonDateNodeLabel(normalized),
          });
        });
        const sortedDates = Array.from(dateMap.values()).sort((a, b) => a.value.localeCompare(b.value));
        const groups = new Map();
        sortedDates.forEach((item) => {
          const [yearText] = String(item.value).split("-");
          if (!groups.has(yearText)) groups.set(yearText, { year: Number(yearText), items: [] });
          groups.get(yearText).items.push(item);
        });
        List3.value = Array.from(groups.values()).sort((a, b) => a.year - b.year);

        selectedMonDate.value = ALL_TIME_NODE.value;
        rebuildSectionListByMonDate(selectedMonDate.value);
        const selected = List2.value.find((item) => item.value === selectedPollutantCode.value) || List2.value[0];
        if (selected) selectPollutant(selected);
      } catch (error) {
        console.error("加载新污染物数据失败:", error);
        List1.value = [];
        List2.value = [];
        List3.value = [];
        selectedMonDate.value = "";
      }
    };

    const EntityNameClick = (item) => {
      selectSection(item, true);
      restartIdleCountdown();
    };

    const selectTimeNode = (item) => {
      if (!item || selectedMonDate.value === item.value) return;
      const nextMonDate = normalizeMonDate(item.value);
      selectedMonDate.value = nextMonDate;
      rebuildSectionListByMonDate(nextMonDate);
      const selected = List2.value.find((entry) => entry.value === selectedPollutantCode.value) || List2.value[0];
      if (selected) selectPollutant(selected);
      restartIdleCountdown();
    };

    const checkedChaneOther = (item) => {
      if (!item) return;
      const { value, check } = item;
      if (value === "bigmap" && typeof initBigMap === "function") return initBigMap(check);
      if (value === "gaodeWX" && typeof initGaoGeWX === "function") return initGaoGeWX(check);
      if (value === "gaodeJJ" && typeof initGaoGeJJ === "function") return initGaoGeJJ(check);

      if (value === "hsqBuffer") {
        if (check) {
          if (!hsqBufferLayer) {
            hsqBufferLayer = initWMSService({
              url: `${GEOSERVER_CONFIG.baseUrl}/LSNPDP/wms`,
              layers: "LSNPDP:lybj",
              parameters: { transparent: true, format: "image/png" },
              alpha: 0.8,
            });
          } else {
            hsqBufferLayer.show = true;
          }
        } else if (hsqBufferLayer) {
          hsqBufferLayer.show = false;
        }
        return;
      }

    };

    const loadEntity = () => {
      removeEntity();
      getPointCesium(ListReservoir, shuikuPoint.Entity, shuikuPoint.lable);
      getPointCesium(ListPoint2, zhabaPoint.Entity, zhabaPoint.lable);
      getPointCesium(ListPoint1, zhandianPoint.Entity, zhandianPoint.lable);
      getLineCesium(ListHeLiu, "DEEPSKYBLUE", 2);
      getLineCesium(ListQuDao, "WHITH", 1.5);
      getLineCesium(ListQuDao2, "WHITH", 0.5);
    };

    const removeEntity = () => {
      removeEntities(["水库", "河流", "闸坝", "站点", "渠道"]);
    };

    watch(
      () => loadMap,
      (load) => {
        if (load.value) setTimeout(() => loadEntity(), 200);
      },
      { immediate: true, deep: true }
    );

    onMounted(() => {
      loadPollutantBaseInfo();
      restartIdleCountdown();
      ["mousemove", "mousedown", "wheel", "keydown", "touchstart"].forEach((eventName) => {
        window.addEventListener(eventName, restartIdleCountdown, { passive: true });
      });
    });

    onUnmounted(() => {
      removeEntity();
      clearAutoSwitch();
      ["mousemove", "mousedown", "wheel", "keydown", "touchstart"].forEach((eventName) => {
        window.removeEventListener(eventName, restartIdleCountdown);
      });
      const viewer = getViewer();
      if (viewer) {
        if (hsqBufferLayer) {
          viewer.imageryLayers.remove(hsqBufferLayer);
          hsqBufferLayer = null;
        }
      }
    });

    return {
      List1,
      List2,
      List3,
      ALL_TIME_NODE,
      pollutantGroupTabs,
      activePollutantGroup,
      selectedMonDate,
      selectedSiteName,
      selectedPollutantCode,
      checkedChaneOther,
      EntityNameClick,
      selectPollutant,
      selectPollutantGroup,
      selectTimeNode,
    };
  },
});
</script>

<style scoped lang="scss">
.row-content {
  display: flex;
}

.traffic-data {
  @include Padding(16, 0, 0, 0);
  width: 100%;

  .row {
    display: flex;
    flex-wrap: wrap;

    .traffic-item {
      cursor: pointer;
      display: flex;
      @include Width(235);
      border-radius: 6px;
      transition: all 0.2s ease;
      padding-right: 8px;

      &:last-child {
        margin-right: 0;
      }

      &:hover {
        background: rgba(32, 118, 255, 0.14);
        box-shadow: inset 0 0 0 1px rgba(133, 189, 255, 0.28), 0 0 8px rgba(49, 131, 255, 0.2);
      }

      &.active {
        background: rgba(25, 104, 255, 0.24);
        box-shadow: inset 0 0 0 1px rgba(130, 203, 255, 0.75), 0 0 12px rgba(50, 143, 255, 0.45);
      }

      .traffic-content {
        display: flex;
        flex-direction: column;
        @include MarginLeft(11);
        @include MarginBottom(14);

        .value {
          @include FontSize(18);
          line-height: 1.5;
          color: #ffd08a;
          display: flex;
          font-family: Tencent, sans-serif;
          font-weight: 600;
        }
      }
    }
  }
}

.checkBoxRow {
  display: flex;
  flex-wrap: wrap;
}

.pollutant-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr 1.45fr;
  gap: 8px;
  margin-bottom: 8px;
}

.pollutant-tab {
  cursor: pointer;
  min-width: 0;
  height: 28px;
  border: 1px solid rgba(105, 177, 255, 0.28);
  border-radius: 6px;
  color: #cfe8ff;
  background: rgba(11, 51, 103, 0.34);
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(130, 203, 255, 0.58);
    background: rgba(32, 118, 255, 0.2);
  }

  &.active {
    color: #ffffff;
    border-color: rgba(130, 203, 255, 0.9);
    background: rgba(25, 104, 255, 0.34);
    box-shadow: inset 0 0 0 1px rgba(130, 203, 255, 0.28), 0 0 12px rgba(50, 143, 255, 0.38);
  }
}

.pollutant-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-content: flex-start;
  gap: 4px 4px;
  max-height: 160px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
}

.checkBox {
  display: flex;
  align-items: center;
  min-width: 0;
  @include MarginBottom(4);

  .img {
    margin: 0px 4px 0px 4px;
  }

  .text {
    font-size: 14px;
    line-height: 1.5;
    color: #fff;
  }
}

.pollutant-item {
  cursor: pointer;
  width: 100%;
  max-width: none;
  min-width: 0;
  padding: 1px 2px 1px 0;
  border-radius: 6px;
  transition: all 0.2s ease;

  .text {
    color: #d9edff;
    text-shadow: 0 0 6px rgba(25, 114, 255, 0.22);
    letter-spacing: 0.1px;
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &:hover {
    background: rgba(32, 118, 255, 0.18);
    box-shadow: inset 0 0 0 1px rgba(133, 189, 255, 0.35), 0 0 10px rgba(49, 131, 255, 0.25);
  }

  &.active {
    background: rgba(25, 104, 255, 0.3);
    box-shadow: inset 0 0 0 1px rgba(130, 203, 255, 0.85), 0 0 14px rgba(50, 143, 255, 0.55);

    .text {
      color: #ffffff;
      text-shadow: 0 0 10px rgba(121, 202, 255, 0.9);
      font-weight: 600;
    }
  }
}

.geo-groups {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
}

.geo-group {
  width: 100%;
}

.geo-all-row {
  width: 100%;
  margin-bottom: 0;
}

.geo-all-item {
  grid-column: 1 / -1;
  width: 100%;
  justify-content: center;
  min-height: 24px !important;
  padding: 3px 8px !important;

  .text {
    font-size: 11px !important;
    line-height: 1.2;
  }
}

.geo-year {
  color: #a9d7ff;
  font-size: 11px;
  line-height: 1.4;
  margin-bottom: 2px;
  font-weight: 600;
  text-shadow: 0 0 6px rgba(76, 165, 255, 0.35);
}

.geo-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
  width: 100%;
  align-content: start;

  .geo-item {
    cursor: pointer;
    margin-bottom: 0;
    padding: 3px 8px;
    border-radius: 6px;
    transition: all 0.2s ease;
    min-height: 24px;
    justify-content: center;

    .text {
      color: #d9ecff;
      font-size: 11px;
      letter-spacing: 0.2px;
      text-shadow: 0 0 5px rgba(88, 171, 255, 0.2);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &:hover {
      background: rgba(32, 118, 255, 0.18);
      box-shadow: inset 0 0 0 1px rgba(133, 189, 255, 0.35), 0 0 10px rgba(49, 131, 255, 0.25);
    }

    &.active {
      background: rgba(25, 104, 255, 0.3);
      box-shadow: inset 0 0 0 1px rgba(130, 203, 255, 0.85), 0 0 14px rgba(50, 143, 255, 0.55);

      .text {
        color: #ffffff;
        text-shadow: 0 0 10px rgba(121, 202, 255, 0.9);
        font-weight: 600;
      }
    }
  }
}

@media (max-width: 1600px) {
  .geo-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
