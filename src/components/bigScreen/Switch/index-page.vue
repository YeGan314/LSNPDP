<!--
 * @Author: 叶敢
 * @Date: 2024-07-05 14:00:39
 * @LastEditTime: 2024-07-05 14:11:54
 * @Description: title
 * @FastButton: ctrl+win+i, ctrl+win+t
-->
<template>
  <div class="switch-box">
    <div
      class="switch-item"
      :class="{ 'switch-active': index === switchedIndex }"
      @click="handleSwitchChange(index)"
      v-for="(item, index) in switchList"
      :key="index"
    >
      {{ item }}
    </div>
  </div>
</template>

<script>
import { defineComponent, reactive, toRefs } from "vue";

export default defineComponent({
  props: {
    switchList: {
      type: Array,
      default: () => ["本月", "本年"],
    },
    width: {
      type: [Number, String],
      default: 99 * 2,
    },
  },
  setup(props, context) {
    const self = reactive({
      switchedIndex: 0,
    });
    const handleSwitchChange = (index) => {
      self.switchedIndex = index;
      context.emit("switchChange", index);
    };
    return {
      ...toRefs(self),
      handleSwitchChange,
      props,
    };
  },
});
</script>

<style scoped lang="scss">
.switch-box {
  display: flex;
  @include boxWidth(v-bind("props.width"));
  @include wHeight(28);

  .switch-item {
    flex: 1;
    color: #ffffff;
    letter-spacing: 1px;
    text-align: center;
    text-shadow: 0 2px 4px rgba(136, 200, 255, 0.5);
    background: #0e213d;
    cursor: pointer;
    transition: all 0.3s;
    @include Border(1, solid, #4f698b);
    @include BorderRadius(1);
    @include LineHeight(28);
    @include FontSize(16);
  }

  .switch-active {
    box-sizing: border-box;
    background: #08335f;
    box-shadow: inset 0 0 10px 0 #1a67a5;
    @include Border(1, solid, #7095f8);
    @include BorderRadius(1);
  }
}
</style>
