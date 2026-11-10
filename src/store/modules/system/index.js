/*
 * @Author: 叶敢
 * @Date: 2024-08-10 11:01:39
 * @LastEditTime: 2024-08-10 14:08:55
 * @Description: 系统全局状态管理
 * @FastButton: ctrl+win+i, ctrl+win+t
 */
import { state } from "./state";
import { mutations } from "./mutations";
import { actions } from "./actions";
import { getters } from "./getters";

export const system = {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};
