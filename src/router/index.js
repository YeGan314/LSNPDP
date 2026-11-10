/*
 * @Author: YG
 * @Date: 2025-11-11 14:30:54
 * @LastEditTime: 2025-11-11 14:30:54
 * @Description: 路由配置页
 * @FastButton: ctrl+win+i, ctrl+win+t
 */
import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "灌区",
    component: () =>
      import(/* webpackChunkName: "src" */ "@/views/big-screen/index-page.vue"),
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHistory("/"),
  routes: routes,
});

export default router;
