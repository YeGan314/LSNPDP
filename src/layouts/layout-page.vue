<!--
 * @Author: 叶敢
 * @Date: 2024-07-05 11:22:04
 * @LastEditTime: 2024-08-09 17:13:44
 * @Description: 导航菜单
 * @FastButton: ctrl+win+i, ctrl+win+t
-->
<template>
  <div>
    <router-view />
    <DeepSeek></DeepSeek>
  </div>
</template>
<script setup>
import DeepSeek from "./components/deep-seek/index-page.vue";
</script>
<style>
* {
  margin: 0;
  padding: 0;
}
</style>
