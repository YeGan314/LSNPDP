<!--
 * @Author: YG
 * @Date: 2025-11-11 14:30:54
 * @LastEditTime: 2025-11-11 14:30:54
 * @Description: title
 * @FastButton: ctrl+win+i, ctrl+win+t
-->
<template>
  <div class="home" id="home">
    <div class="top">
      <div class="top-title">智慧农业监管平台</div>
    </div>
    <div class="home-bg">
      <div class="home-bg2">
        <div class="list-box">
          <ul :class="{ 'imgs-box': true, ulWidth: ulWidth }">
            <div
              style="
                height: 80vh;
                width: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                text-align: center;
                flex-wrap: wrap;
              "
            >
              <li
                v-for="(item, index) in system.data"
                :key="index"
                :style="styleList"
              >
                <div class="li-box">
                  <img class="bgimg" :src="item.SystemImage" alt="" />
                  <div class="mask">
                    <div @click="systemTo(item)">前往</div>
                    <!-- <div>详情</div> -->
                  </div>
                  <div class="title">
                    <img src="./static/img/right-arrow.f8e407c8.svg" />
                    <span>{{ item.SystemName }}</span>
                  </div>
                </div>
              </li>
            </div>
          </ul>
        </div>
      </div>
    </div>
    <div class="bottom">
      <div class="time">
        <img src="./static/img/date-icon.1ea6edbf.svg" />
        <span>{{ today }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import img1 from "@/assets/nav/img1.png";
import img2 from "@/assets/nav/img2.png";

const styleList = reactive({
  width: "50%",
  height: "auto",
  padding: "0 1%",
});
const ulWidth = ref(false);
const today = computed(() => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}年${month}月${day}日`;
});

// 系统数据
const system = reactive({
  data: [
    {
      ID: 531970865352773,
      CompanyID: 381239035449413,
      SystemName: "数字孪生大桥智能监测",
      SystemUrl: "/qiao",
      SystemImage: img1,
      SystemType: "智慧水利",
      Remark: null,
      OrderNum: 1,
      SysCentreRegister: null,
    },
    {
      ID: 531970865352773,
      CompanyID: 381239035449413,
      SystemName: "智慧灌区监测一张图",
      SystemUrl: "/guanqu",
      SystemImage: img2,
      SystemType: "智慧水利",
      Remark: null,
      OrderNum: 1,
      SysCentreRegister: null,
    },
  ],
  loading: true,
});
// 自适配
if (system.data.length == 4) {
  styleList.width = "33%";
  styleList.height = "36vh";
  styleList.padding = "0 1%";
  ulWidth.value = false;
} else if (system.data.length < 4) {
  styleList.width = "30%";
  styleList.height = "36vh";
  styleList.padding = "0 1%";
  ulWidth.value = false;
} else if (system.data.length <= 6) {
  styleList.width = "30%";
  styleList.height = "34vh";
  styleList.padding = "0 1.2%";
  ulWidth.value = true;
} else if (system.data.length <= 8) {
  styleList.width = "24%";
  styleList.height = "34vh";
  styleList.padding = "0 0.6%";
  ulWidth.value = false;
} else if (system.data.length <= 9) {
  styleList.width = "33%";
  styleList.height = "26vh";
  styleList.padding = "0 2%";
  ulWidth.value = true;
} else if (system.data.length <= 12) {
  styleList.width = "25%";
  styleList.height = "25.6vh";
  styleList.padding = "0 1%";
  ulWidth.value = true;
}
const systemTo = (data) => {
  const { SystemUrl } = data;
  window.open(SystemUrl);
};

//================================
console.log(`
项目开发中，感谢理解！
`);
//================================
</script>

<style scoped lang="less">
@import "./static/css/192.5bd1d739.less";

.imgs-box {
  flex-wrap: wrap;
  height: 98vh !important;
  // padding-top: 10vh;
  overflow-y: auto;
}

.ulWidth {
  width: 95% !important;
  margin: auto;
}

.top-title {
  font-size: 2em;
  font-weight: bold;
  color: #fff;
  text-align: center;
}
</style>
