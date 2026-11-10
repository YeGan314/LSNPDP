<template>
  <div class="right-container">
    <lease-title icon="tingchechang" :rightbox="false"> 需水态势 </lease-title>
    <box width="730" height="250">
      <div class="table-box">
        <div class="table-head">
          <div class="head-item">名称</div>
          <div class="head-item">年度用水计划万m³</div>
          <div class="head-item">去年供水量万m³</div>
        </div>
        <div class="table-body">
          <div class="table-body-warp1">
            <div
              :class="['row', item.status == 1 ? '' : 'error']"
              style="color: #ffffffdd"
              v-for="(item, index) in tableList"
              :key="index"
            >
              <div class="col">{{ item.name }}</div>
              <div class="col">{{ item.local }}</div>
              <div class="col">{{ item.time }}</div>
            </div>
          </div>
        </div>
      </div>
      <!-- <V3Echarts :options="option" height="280"/> -->
    </box>
    <lease-title class="title-box" :rightbox="false"> 预测对比 </lease-title>
    <box width="730" height="250">
      <div class="table-box">
        <div class="table-head">
          <div class="head-item">名称</div>
          <div class="head-item">预报需水量m³</div>
          <div class="head-item">上报需水量m³</div>
        </div>
        <div class="table-body">
          <div class="table-body-warp1">
            <div
              :class="['row', item.status == 1 ? '' : 'error']"
              style="color: #ffffffdd"
              v-for="(item, index) in tableList"
              :key="index"
            >
              <div class="col">{{ item.name }}</div>
              <div class="col">{{ item.local }}</div>
              <div class="col">{{ item.time }}</div>
            </div>
          </div>
        </div>
      </div>
      <!-- <V3Echarts :options="option" height="280"/> -->
    </box>
  </div>
</template>

<script>
import { defineComponent, onMounted, reactive, toRefs } from "vue";
import LeaseTitle from "@/components/bigScreen/Lease_title/index-page.vue";

export default defineComponent({
  components: { LeaseTitle },
  setup() {
    const self = reactive({
      tableList: [
        {
          id: 1,
          name: "一灌区",
          time: 1159,
          local: 1080,
        },
        {
          id: 2,
          name: "一干支",
          time: 1129,
          local: 991,
        },
        {
          id: 3,
          name: "一干二支",
          time: 1599,
          local: 800,
        },
        {
          id: 4,
          name: "二灌区",
          time: 1599,
          local: 800,
        },
        {
          id: 5,
          name: "二灌区",
          time: 1599,
          local: 800,
        },
        {
          id: 6,
          name: "二灌区",
          time: 1599,
          local: 800,
        },
        {
          id: 7,
          name: "二灌区",
          time: 1599,
          local: 800,
        },
        {
          id: 2,
          name: "一干支",
          time: 1129,
          local: 991,
        },
        {
          id: 3,
          name: "一干二支",
          time: 1599,
          local: 800,
        },
        {
          id: 4,
          name: "二灌区",
          time: 1599,
          local: 800,
        },
        {
          id: 5,
          name: "二灌区",
          time: 1599,
          local: 800,
        },
        {
          id: 7,
          name: "二灌区",
          time: 1599,
          local: 800,
        },
        {
          id: 2,
          name: "一干支",
          time: 1129,
          local: 991,
        },
      ],
    });
    const tableStatusList = [
      {
        color: "#41A5A0",
        label: "一般",
      },
      {
        color: "#FFCE7F",
        label: "警告",
      },
      {
        color: "#FF8A95",
        label: "严重",
      },
    ];
    onMounted(() => {
      // startMarquee('table-body-warp1', '.row1');
    });
    return {
      tableStatusList,
      ...toRefs(self),
    };
  },
});
</script>

<style scoped lang="scss">
.right-container {
  .table-box {
    width: 100%;
    // @include hHeight(280);
    display: flex;
    flex-direction: column;
    @include FontSize(14);
    box-sizing: border-box;
    @include Padding(25, 40, 0, 40);

    .table-head {
      height: 2em;
      display: flex;
      background: #ffffff30;
      line-height: 2em;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);

      .head-item {
        flex: 1;
        text-align: center;
      }
    }

    .table-body {
      flex: 1;
      overflow-y: hidden;
      //@include wHeight(252);

      .row {
        display: flex;
        width: 100%;
        @include Padding(10, 0, 10, 0);
        box-sizing: border-box;

        .col {
          flex: 1;
          text-align: center;
        }

        &:nth-child(even) {
          background: #ffffff20;
          // color: burlywood;
        }
      }
    }
  }
  .title-box {
    @include MarginTop(25);
  }

  .row-content {
    display: flex;

    video {
      @include Width(360);
      @include hHeight(200);
    }
  }

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

.top-box {
  @include Padding(0, 15, 0, 15);
  box-sizing: border-box;
  @include hHeight(200);
}
</style>
