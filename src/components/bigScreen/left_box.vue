<!--
 * @Author: your name
 * @Date: 2022-02-22 22:38:25
 * @LastEditTime: 2024-07-22 14:57:24
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: \DTSWeekly_zhyq\src\components\left_box.vue
-->
<!-- left_box -->
<template>
  <transition appear name="custom-classes-transition"
    enter-active-class="animate__animated animate__faster  animate__fadeInLeft "
    leave-active-class="animate__animated animate__faster animate__fadeOutLeft ">
    <div v-if="true" class="left_box">
      <div class="content">
        <slot></slot>
      </div>
    </div>
  </transition>
</template>

<script setup>
</script>
<style lang="scss" scoped>
.left_box {
  position: absolute;
  @include Width(800);
  height: 100%;
  background: url("~@/assets/bigScreen/one/左侧面板-黑透@2x.png") no-repeat;
  background-size: 100% 100%;
  @include Top(0);
  @include Left(0);
  box-sizing: border-box;

  //background: url("../assets/bigScreen/基础/left_bg@2x.png") no-repeat center/cover;
  @include Padding(110, 40, 20, 36);
  z-index: 11;

  .content {
    width: 100%;
    height: 100%;
    // border: 1px solid rgba(255, 255, 255, 0.527);
    box-sizing: border-box;
    position: relative;
  }
}
</style>
