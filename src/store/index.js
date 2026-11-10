/*
 * @Author: YG
 * @Date: 2025-11-11 14:30:54
 * @LastEditTime: 2025-11-11 14:30:54
 * @Description: 全局状态管理
 * @FastButton: ctrl+win+i, ctrl+win+t
 */
import { createStore } from "vuex";
import { system } from "./modules/system/index.js";

// import createPersistedState from "vuex-persistedstate";
// import ls from "@/utils/local-storage";

const debug = process.env.NODE_ENV !== "production";
// 本地缓存 app，project
// const persistedPlugin = createPersistedState({
//   paths: ["app", "project", "works"],
//   storage: {
//     getItem: (key) => ls.get(key),
//     setItem: (key, value) => ls.set(key, value),
//     removeItem: (key) => ls.remove(key),
//   },
// });

export default createStore({
  modules: {
    system,
  },
  strict: debug,
  // plugins: debug ? [persistedPlugin] : [],
});
