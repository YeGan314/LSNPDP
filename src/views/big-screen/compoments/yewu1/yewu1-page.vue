<!--
 * @Author: your name
 * @Date: 2022-03-28 16:38:12
 * @LastEditTime: 2024-07-31 17:13:39
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: \DTSWEEKLY_ZHGK\src\Views\OverAll\index.vue
-->
<!-- OverAll -->
<template>
  <div id="overall">
    <Left_box class="leftshow" v-if="true">
      <LeftView />
    </Left_box>
    <Right_box class="rightshow" v-if="true">
      <RightView />
    </Right_box>
  </div>
</template>

<script setup>
import { watch, inject, onUnmounted } from "vue";
import LeftView from "./Left/left-page.vue";
import RightView from "./Right/right-page.vue";

import Left_box from "@/components/bigScreen/left_box.vue";
import Right_box from "@/components/bigScreen/right_box.vue";
import * as geoData from "../../js/geo";
import shuidi from "@/assets/bigScreen/map/b23.png";
const loadMap = inject("loadMap");
const getPolygonCesium = inject("getPolygonCesium");
const getPointCesium = inject("getPointCesium");
const removeEntities = inject("removeEntities");
const ListDiKuai = geoData.ListDiKuai || [];
const ListPoint3 = geoData.ListPoint3 || [];

//点位-闸坝的基础信息配置
const zhabaPoint = {
  enty: {
    image: shuidi,
    scale: 0.18,
    pixelOffset: [0, 0],
  },
  lable: { show: true, scale: 0.4, pixelOffset: [0, -50] },
}; //点位-站点的基础信息配置

const loadEntity = () => {
  getPolygonCesium(ListDiKuai);
  // 点
  getPointCesium(ListPoint3, zhabaPoint.enty, zhabaPoint.lable);
};
const removeEntity = () => {
  removeEntities(["地块", "地块点"]);
};
onUnmounted(() => {
  removeEntity();
});
watch(
  () => loadMap,
  (load) => {
    console.log("load.value", load.value);
    if (load.value)
      setTimeout(() => {
        loadEntity();
      }, 200);
  },
  {
    immediate: true,
    deep: true,
  }
);
</script>
<style lang="scss" scoped>
@keyframes fidein {
  0% {
    background: #000000;
    position: absolute;
  }

  50% {
    background: #00000070;
  }

  100% {
    background: #00000000;
    position: static;
  }
}

#overall {
  width: 100%;
  height: 100%;
  //   background: #000000;
  //   transition: all 2s;
  // animation: fidein 4s ease-in-out forwards;
}

// lxl 出场动画
.leftshow {
  animation: leftshow 2s;
}

.rightshow {
  animation: rightshow 2s;
}

@keyframes leftshow {
  from {
    left: -300px;
  }

  to {
    left: 0px;
  }
}

@keyframes rightshow {
  from {
    right: -300px;
  }

  to {
    right: 0px;
  }
}
:deep(.right_box) {
  @include Width(600);
}
</style>
