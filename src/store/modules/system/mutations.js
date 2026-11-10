/*
 * @Author: 叶敢
 * @Date: 2024-08-10 11:01:39
 * @LastEditTime: 2024-08-10 14:20:28
 * @Description: 静态编辑状态
 * @FastButton: ctrl+win+i, ctrl+win+t
 */
export const SET_TITLE = "SET_TITLE";

export const mutations = {
  [SET_TITLE](state, title) {
    state.title = title;
  },
};
