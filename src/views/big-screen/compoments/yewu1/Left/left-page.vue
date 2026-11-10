<template>
  <div class="left-container">
    <lease-title :rightbox="false">
      用水计划
      <template v-slot:slot-bottom>Personnel accounted</template>
    </lease-title>
    <div class="row-content">
      <div class="traffic-data">
        <div class="row">
          <div class="traffic-item">
            <icon-box height="34" width="34">
              <img src="@/assets/bigScreen/home/icon_things@2x.png" />
            </icon-box>
            <div class="traffic-content">
              <div class="label">一干渠</div>
              <div class="value">
                385
                <div class="suffix">万m³</div>
              </div>
            </div>
          </div>
          <div class="traffic-item">
            <icon-box height="41" width="41">
              <img src="@/assets/bigScreen/home/icon_health@2x.png" />
            </icon-box>
            <div class="traffic-content">
              <div class="label">二干渠</div>
              <div class="value">
                261
                <div class="suffix">万m³</div>
              </div>
            </div>
          </div>

          <div class="traffic-item">
            <icon-box height="34" width="34">
              <img src="@/assets/bigScreen/home/icon_alarm@2x.png" />
            </icon-box>
            <div class="traffic-content">
              <div class="label">三干渠</div>
              <div class="value">
                68
                <div class="suffix">万m³</div>
              </div>
            </div>
          </div>
          <div class="traffic-item">
            <icon-box height="34" width="34">
              <img src="@/assets/bigScreen/home/icon_accident@2x.png" />
            </icon-box>
            <div class="traffic-content">
              <div class="label">四干渠</div>
              <div class="value">
                56
                <div class="suffix">万m³</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <lease-title class="lease-title" :rightbox="false">
      关键指标对比
      <template v-slot:slot-bottom>Traffic analysis</template>
    </lease-title>
    <div class="row-content">
      <box height="230" width="730">
        <v3-echarts :options="monitoringBarOption" :height="200" />
      </box>
    </div>
    <lease-title icon="nenghaoqushi" :rightbox="false">
      趋势与异常分析
      <template v-slot:slot-bottom>Consumption trend</template>
    </lease-title>
    <box width="730" height="1050">
      <div class="table-box">
        <div class="table-head">
          <div class="head-item col-site">地块名称</div>
          <div class="head-item col-date">计划用水量(m³)</div>
          <div class="head-item col-type">农户</div>
          <div class="head-item col-value">种植类型</div>
        </div>
        <div class="table-body">
          <div class="table-body-warp1">
            <div
              :class="['row', item.status == 1 ? '' : 'error']"
              style="color: #ffffffdd"
              v-for="(item, index) in tableList"
              :key="index"
            >
              <div class="col col-site" :title="item.name">{{ item.name }}</div>
              <div class="col col-date">{{ item.local }}</div>
              <div class="col col-type" :title="item.time">{{ item.time }}</div>
              <div
                class="col col-value"
                :style="`color:${tableStatusList[item.status].color}`"
              >
                {{ tableStatusList[item.status].label }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </box>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, onUnmounted } from "vue";
import LeaseTitle from "@/components/bigScreen/Lease_title/index-page.vue";
import V3Echarts from "@/components/bigScreen/V3Echarts/index-page.vue";
import {
  option6,
  option1,
  option,
  option3,
  option4,
  option7,
  option8,
  option9,
  option10,
  option11,
  option12,
  option13,
  option14,
} from "./chartOpt/index.js";

import IconBox from "@/components/bigScreen/IconBox/index-page.vue";
import { getGeoServerLayers } from "@/utils/geoserver-helper";
import { GEOSERVER_CONFIG } from "@/config/geoserver.config";

import Box from "@/components/bigScreen/Box/index-page.vue";

const POLLUTANT_FIELD_NAME_MAP = {
  sdz: "磺胺噻唑",
  stz: "磺胺噻嗪",
  spd: "磺胺吡啶",
  smd: "磺胺甲嘧啶",
  sdd: "磺胺二甲嘧啶",
  smm: "磺胺甲氧嘧啶",
  smtz: "磺胺二甲氧嘧啶",
  smp: "磺胺甲噁唑",
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

export default defineComponent({
  components: {
    LeaseTitle,
    V3Echarts,
    IconBox,
    Box,
  },
  setup() {
    const allFeatures = ref([]);
    const selectedFilter = ref({
      pollutantCode: "",
      monMonth: "",
    });
    const monitoringBarOption = ref({});

    const normalizeMonDate = (value) => {
      if (!value) return "";
      const text = String(value).trim();
      const match = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
      if (!match) return "";
      return `${match[1]}-${String(Number(match[2])).padStart(2, "0")}-${String(Number(match[3])).padStart(2, "0")}`;
    };

    const toSiteName = (properties = {}) =>
      properties.site_name || properties.siteName || properties.station_name || properties.station || properties.name || "";

    const toNumber = (value) => {
      const num = Number(value);
      return Number.isFinite(num) ? num : null;
    };

    const buildBarOption = (xData = [], yData = [], pollutantLabel = "") => ({
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
      },
      grid: {
        top: "18%",
        left: "8%",
        right: "5%",
        bottom: "24%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: xData,
        axisLabel: {
          color: "#d7e8ff",
          interval: 0,
          rotate: 35,
          fontSize: 11,
        },
        axisLine: { lineStyle: { color: "rgba(170, 205, 235, 0.5)" } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        name: pollutantLabel ? `${pollutantLabel}(监测值)` : "监测值",
        nameTextStyle: { color: "#d7e8ff", fontSize: 11, padding: [0, 0, 0, -10] },
        axisLabel: { color: "#d7e8ff", fontSize: 11 },
        splitLine: { lineStyle: { color: "rgba(170, 205, 235, 0.18)" } },
      },
      series: [
        {
          type: "bar",
          data: yData,
          barWidth: 10,
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "#52E5FF" },
                { offset: 1, color: "#0089D6" },
              ],
            },
          },
          label: {
            show: true,
            position: "top",
            color: "#e8f5ff",
            fontSize: 10,
          },
        },
      ],
    });

    const rebuildMonitoringBar = () => {
      const pollutantCode = String(selectedFilter.value?.pollutantCode || "").trim().toLowerCase();
      const targetMonth = String(selectedFilter.value?.monMonth || "").trim();
      if (!pollutantCode) {
        monitoringBarOption.value = buildBarOption([], [], "");
        return;
      }
      const pollutantLabel = POLLUTANT_FIELD_NAME_MAP[pollutantCode] || pollutantCode.toUpperCase();
      const siteValueMap = new Map();
      (allFeatures.value || []).forEach((feature) => {
        const props = feature?.properties || {};
        const monDate = normalizeMonDate(props.mon_date || props.monitor_date || props.date || "");
        if (targetMonth && (!monDate || !monDate.startsWith(targetMonth))) return;
        const site = toSiteName(props);
        if (!site) return;
        const value = toNumber(props[pollutantCode] ?? props[pollutantCode.toUpperCase()]);
        if (value === null) return;
        siteValueMap.set(site, value);
      });

      const xData = Array.from(siteValueMap.keys());
      const yData = xData.map((site) => siteValueMap.get(site));
      monitoringBarOption.value = buildBarOption(xData, yData, pollutantLabel);
    };

    const loadMonitoringFeatures = async () => {
      try {
        const layers = await getGeoServerLayers();
        const layer = layers.find((item) => {
          const name = item?.name || "";
          return name.toLowerCase() === "cz_xwrw_data" || name.toLowerCase().endsWith(":cz_xwrw_data");
        });
        if (!layer) {
          allFeatures.value = [];
          rebuildMonitoringBar();
          return;
        }
        const fullName = layer.name.includes(":") ? layer.name : `${layer.workspace || GEOSERVER_CONFIG.workspace}:${layer.name}`;
        const workspace = fullName.split(":")[0];
        const requestUrl =
          `${GEOSERVER_CONFIG.baseUrl}/${workspace}/ows?service=WFS&version=1.0.0&request=GetFeature` +
          `&typeName=${encodeURIComponent(fullName)}` +
          `&outputFormat=${encodeURIComponent("application/json")}` +
          `&srsName=EPSG:4326`;
        const response = await fetch(requestUrl);
        if (!response.ok) throw new Error(`WFS request failed: ${response.status}`);
        const geojson = await response.json();
        allFeatures.value = Array.isArray(geojson?.features) ? geojson.features : [];
      } catch (error) {
        console.error("load monitoring features error:", error);
        allFeatures.value = [];
      }
      rebuildMonitoringBar();
    };

    const handleYewu2FilterChange = (event) => {
      const detail = event?.detail || {};
      selectedFilter.value = {
        pollutantCode: String(detail.pollutantCode || ""),
        monMonth: String(detail.monMonth || ""),
      };
      rebuildMonitoringBar();
    };

    const handleHeadBarClick = (item) => {
      item;
    };
    const handleClose = () => {};

    onMounted(() => {
      window.addEventListener("yewu2-filter-change", handleYewu2FilterChange);
      loadMonitoringFeatures();
    });

    onUnmounted(() => {
      window.removeEventListener("yewu2-filter-change", handleYewu2FilterChange);
    });

    return {
      option6,
      option1,
      option,
      option3,
      option4,
      option7,
      option8,
      option9,
      option10,
      option11,
      option12,
      option13,
      option14,
      monitoringBarOption,
      handleHeadBarClick,
      handleClose,
      tableStatusList: [
        {
          color: "#41A5A0",
          label: "其他",
        },
        {
          color: "#FFCE7F",
          label: "50",
        },
        {
          color: "#FF8A95",
          label: "玉米",
        },
      ],
      tableList: [
        {
          id: 1,
          name: "地块一",
          time: "王大伟",
          local: "50",
          status: 1,
        },
        {
          id: 2,
          name: "地块二",
          time: "刘思佳",
          local: "100",
          status: 0,
        },
        {
          id: 3,
          name: "地块三",
          time: "樊伟伟",
          local: "50",
          status: 2,
        },
        {
          id: 4,
          name: "地块四",
          time: "曹恩迪",
          local: "20",
          status: 1,
        },
        {
          id: 5,
          name: "地块五",
          time: "高小军",
          local: "其他",
          status: 0,
        },
        {
          id: 6,
          name: "地块六",
          time: "王德军",
          local: "20",
          status: 1,
        },
        {
          id: 7,
          name: "地块七",
          time: "冯伟",
          local: "20",
          status: 0,
        },
        {
          id: 1,
          name: "地块一",
          time: "王大伟",
          local: "50",
          status: 1,
        },
        {
          id: 2,
          name: "地块二",
          time: "刘思佳",
          local: "100",
          status: 0,
        },
        {
          id: 3,
          name: "地块三",
          time: "樊伟伟",
          local: "50",
          status: 2,
        },
        {
          id: 4,
          name: "地块四",
          time: "曹恩迪",
          local: "20",
          status: 1,
        },
        {
          id: 5,
          name: "地块五",
          time: "高小军",
          local: "其他",
          status: 0,
        },
        {
          id: 6,
          name: "地块六",
          time: "王德军",
          local: "20",
          status: 1,
        },
        {
          id: 7,
          name: "地块七",
          time: "冯伟",
          local: "20",
          status: 0,
        },
      ],
    };
  },
});
</script>

<style lang="scss" scoped>
.left-container {
  .row-content {
    display: flex;

    .traffic-data {
      @include Padding(16, 0, 0, 0);
      width: 100%;

      .row {
        display: flex;

        .traffic-item {
          display: flex;
          @include MarginRight(29);
          flex: 1;

          &:last-child {
            margin-right: 0;
          }

          .traffic-content {
            display: flex;
            flex-direction: column;
            @include MarginLeft(11);

            .label {
              @include FontSize(14);
              color: #ffffff;
              @include MarginBottom(5);
            }

            .value {
              @include FontSize(26);
              color: #ffce7f;
              display: flex;
              font-family: Tencent, serif;

              .suffix {
                @include FontSize(16);
                justify-self: flex-end;
                align-self: flex-end;
                color: #93c0ec;
                @include MarginLeft(12.7);
                font-family: Oppo, serif;
              }
            }
          }
        }

        .traffic-item:first-child {
          @include MarginBottom(25);
        }
      }
    }
  }

  .introduce-box {
    @include Padding(10, 40, 10, 30);

    .text-box {
      @include Padding(10, 10, 10, 10);
      background: rgba(0, 0, 0, 0.123);
      text-indent: 2em;
      border-radius: 10px;
      display: flex;
      flex-direction: column;

      .row {
        //&:first-child
      }
    }
  }

  .table-box {
    width: 100%;
    height: 100% !important;
    display: flex;
    flex-direction: column;
    @include FontSize(14);
    box-sizing: border-box;
    @include Padding(12, 28, 0, 28);

    .table-head {
      @include wHeight(36);
      display: grid;
      grid-template-columns: 30% 20% 30% 20%;
      background: rgba(175, 185, 198, 0.4);
      @include LineHeight(36);

      .head-item {
        text-align: center;
        color: rgba(236, 243, 251, 0.95);
        @include FontSize(14);
        font-weight: 700;
        letter-spacing: 0.2px;
      }
    }

    .table-body {
      flex: 1;
      overflow-y: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;

      &::-webkit-scrollbar {
        width: 0;
        height: 0;
      }

      .row {
        display: grid;
        grid-template-columns: 30% 20% 30% 20%;
        width: 100%;
        @include Padding(10, 0, 10, 0);
        box-sizing: border-box;
        color: rgba(231, 239, 248, 0.96);
        @include FontSize(13);
        line-height: 1.3;

        .col {
          text-align: center;
          @include FontSize(13);
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          @include Padding(0, 6, 0, 6);
          box-sizing: border-box;
        }

        .col-site {
          text-align: center;
        }

        .col-value {
          font-weight: 700;
        }

        &:nth-child(odd) {
          background: rgba(170, 180, 194, 0.22);
        }

        &:nth-child(even) {
          background: rgba(120, 136, 158, 0.18);
        }
      }
    }
  }

  .lease-title {
    @include MarginTop(20);
  }
}

.dialog-img {
  @include Width(calc(620 / 5));
  object-fit: cover;
  display: inline-block;
}

.dialog-content {
  display: flex;
  @include Padding(0, 10, 0, 10);
  @include FontSize(14);
  justify-content: space-between;
  flex-wrap: wrap;
  flex-direction: column;
  box-sizing: border-box;

  div {
    //min-width: 60%;
    //max-width: 60%;
    @include wHeight(30);
    @include LineHeight(30);
    color: #ffffff;
    @include LetterSpacing(0.88);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);

    &:nth-child(odd) {
      //@include MarginRight(30);
    }

    &:last-child {
      width: 100% !important;
      display: flex;

      div {
        width: 50%;
      }
    }
  }
}

.camera-info {
  width: 100%;
  height: 100%;

  video {
    width: 100%;
    @include hHeight(180);
    object-fit: fill;
  }
}

.dialog-bottom {
  @include Padding(5, 10, 10, 10);
  @include FontSize(14);
  display: flex;
  width: 100%;
  justify-content: space-around;
  color: #ffffff;
  @include LetterSpacing(0.88);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);

  > div {
    // border: 1px #fff solid;
    @include Width(140);
    @include wHeight(35);
    @include LineHeight(35);
    @include BorderRadius(5);
    cursor: pointer;
    transition: 0.5s all;
    text-align: center;
    background: linear-gradient(
      221deg,
      #b1b1b1bf 0%,
      #102a30 45%,
      #b1b1b1bf 100%
    );
    opacity: 1;

    &:hover {
      opacity: 0.8;
    }
  }
}

.inspection-info {
  display: flex;
  @include Padding(0, 10, 0, 10);
  align-items: center;

  width: 100%;
  height: 100%;
  box-sizing: border-box;

  .avatar {
    @include Width(36 * 3.2);
    @include wHeight(48 * 3.5);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .info-box {
    @include FontSize(14);
    @include Padding(0, 0, 0, 15);
    box-sizing: border-box;

    .row {
      display: flex;
      @include LineHeight(30);

      .label {
        width: 6em;
      }

      .value {
        flex: 1;
      }
    }
  }
}
</style>
