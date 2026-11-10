<!--
 * @Author: 叶敢
 * @Date: 2024-07-05 14:00:39
 * @LastEditTime: 2024-07-05 14:11:35
 * @Description: title
 * @FastButton: ctrl+win+i, ctrl+win+t
-->
<template>
  <div class="icon-box">
    <slot>
      <img src="@/assets/bigScreen/home/icon_thiingcount@2x.png" />
    </slot>
  </div>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    width: {
      type: [String, Number],
      default: 41,
    },
    height: {
      type: [String, Number],
      default: 41,
    },
  },
  setup(props) {
    return {
      props,
    };
  },
});
</script>

<style lang="scss">
.icon-box {
  @include boxWidth(v-bind("props.width"));
  @include boxwHeight(v-bind("props.height"));

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
</style>
