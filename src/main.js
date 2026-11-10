/*
 * @Author: 叶敢
 * @Date: 2024-06-14 16:15:38
 * @LastEditTime: 2024-08-10 14:06:25
 * @Description: title
 * @FastButton: ctrl+win+i, ctrl+win+t
 */
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router/index.js";
import store from "./store/index"; // 导入 Vuex store
import "./styles/font.css";

const app = createApp(App);
app.use(router).use(store).mount("#app");
