<template>
  <div class="sub-title">
    {{ titleText }}
    <div class="right-box">
      <slot></slot>
    </div>
  </div>
</template>

<script>
import { reactive } from 'vue';

export default {
  name: 'SubTitle',
  props: {
    width: {
      type: Number,
      default: 315,
    },
    titleText: {
      type: String,
      default: '默认标题',
    },
  },
  setup(props) {
    const self = reactive({});
    return {
      self,
      props,
    };
  },
};
</script>

<style scoped lang="scss">
.sub-title {
  @include boxWidth(v-bind('props.width'));
  display: flex;
  box-sizing: border-box;
  color: #bae3ff;
  text-shadow: 0 3px 4px #002440;
  background: url('~@/assets/bigScreen/基础/tiltle2_bg@2x.png') no-repeat;
  background-size: 100% 100%;
  @include wHeight(17.63);
  @include PaddingLeft(23.07);
  @include LineHeight(18);
  @include FontSize(18);

  .right-box {
    position: relative;
    bottom: 80%;
    margin-left: auto;
  }
}
</style>
