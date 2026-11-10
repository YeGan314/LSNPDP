<!--
 * @Author: your name
 * @Date: 2022-02-25 04:18:38
 * @LastEditTime: 2024-07-05 14:58:37
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: \DTSWeekly_zhyq\src\components\box\index.vue
-->
<!-- box     -->
<template>
  <div class="box">
    <slot></slot>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
const props = defineProps({
  width: {
    type: [Number, String],
    default: 737 / 2,
  },
  height: {
    type: [Number, String],
    default: 298,
  },
});
</script>
<style lang="scss" scoped>
.box {
  @include boxWidth(v-bind('props.width'));
  @include boxhHeight(v-bind('props.height'));
  @include MarginBottom(10);
  @include FontSize(14);
  @include Padding(20, 0, 0, 27);
  box-sizing: border-box;
  overflow: hidden;
}
</style>
