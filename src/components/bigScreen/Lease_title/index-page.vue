<!--
 * @Author: your name
 * @Date: 2022-02-25 01:59:49
 * @LastEditTime: 2024-07-05 14:22:47
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: \DTSWeekly_zhyq\src\components\lease_title\index.vue
-->
<template>
  <div class="alease_title_left">
    <img src="@/assets/bigScreen/one/icon_data@2x.png" class="title_icon" />
    <div class="title-text">
      <span>
        <slot>城市治理</slot>
      </span>
      <div class="title-text-bottom"></div>
    </div>
    <slot name="right-box">
      <div class="right-box" v-if="props.rightbox">
        <Switch />
      </div>
    </slot>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import Switch from '@/components/bigScreen/Switch/index-page.vue';

const props = defineProps({
  left: {
    type: Number,
    default: 20,
  },
  rightbox: {
    type: Boolean,
    default: true,
  },
  imgSrc: {
    type: String,
    default: 'icon_data@2x.png',
  },
});
// const switchValue = ref(false);
// const handleSwitchChange = (bool) => {
//   switchValue.value = bool;
// };
</script>
<style lang="scss" scoped>
.alease_title_left {
  position: relative;
  font-family: Oppo;
  font-weight: 500;
  color: #ffffff;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  z-index: 100;
  @include Width(737.4);
  @include hHeight(40);
  @include FontSize(16);
  @include MarginBottom(5);
  overflow: hidden;
  background-size: 100% 100%;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  background: url("~@/assets/bigScreen/基础/tiltle1_bg@2x.png") no-repeat;
  background-size: 100% 100%;
  @include PaddingBottom(10);

  .title_icon {
    display: flex;
    justify-content: center;
    align-items: center;
    //@include boxMarginLeft(v-bind("(props.left )"));
    @include Width(26);
    @include wHeight(24);
    position: absolute;
    @include MarginLeft(14);
  }

  .title-text {
    flex: 1;
    @include MarginLeft(50);
    position: relative;
    @include Top(1);
    width: fit-content;

    span {
      @include FontSize(24);
      //font-weight: 600;
      @include LetterSpacing(1);
      text-shadow: 0 2px 4px rgba(94, 184, 255, 0.50);
    }

    .title-text-bottom {
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
      color: #d2ecff;
      @include FontSize(10);
    }
  }

  .right-box {
    margin-left: auto;
    background: #000;
    @include MarginRight(10.5);
    //@include MarginBottom(6);

  }
}
</style>
