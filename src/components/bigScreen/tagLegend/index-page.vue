<template>
  <div :class="['legend-container', hasLegend ? 'w350' : '']">
    <div class="line"></div>
    <div class="list">
      <div class="legend" v-if="hasLegend">
        <slot></slot>
      </div>
      <div class="checkboxlist" v-for="(item, index) in legendList" :key="index" @change="change">
        <a-checkbox v-model:checked="item.checked">
          <img :src="item.imgUrl" alt="" />
          <div class="label">{{ item.label }}</div>
        </a-checkbox>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, reactive, toRefs } from 'vue';

export default defineComponent({
  props: {
    legendList: {
      type: Object,
    },
    hasLegend: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['check'],
  setup(props, { emit }) {
    const self = reactive({
      legendList: props.legendList,
      // 当前选中情况
      checkList: [],
      change: () => {
        const valueList = self.legendList.filter(item => item.checked).map(item => item.value);
        emit('check', valueList);
      },
    });

    return {
      ...toRefs(self),
    };
  },
});
</script>

<style scoped lang="scss">
.legend-container {
  position: fixed;
  //z-index: 11;
  display: flex;
  @include Width(240);
  @include minWHeight(150);
  height: auto;
  @include Right(800);
  @include Bottom(40);
  background-color: rgba(121, 137, 198, 0.302);
  flex-wrap: wrap;
  @include Padding(10, 10, 10, 10);
  // justify-content: space-between;
  z-index: 999;

  &.w350 {
    @include Width(350);
  }

  .list {
    // @include maxWidth(300);
    width: 100%;

    // display: flex;
    .legend {
      width: 50%;
      // background: #000;
      height: 100%;
    }
  }

  .line {
    @include hHeight(2);
    @include Width(330);
    background: rgba(204, 204, 204, 0.5);
  }

  :deep(.el-checkbox-group) {
    // width: 100%;
    width: 50%;
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    @include Padding(0, 20, 0, 20);
    justify-content: space-between;

    // @include maxWHeight(250);
    .el-checkbox {
      // @include maxWidth(123);
      // @include MarginRight(0);
      @include wHeight(27.6);
      @include Margin(10, 0, 0, 3);

      .el-checkbox__input.is-checked .el-checkbox__inner {
        background-color: #fff;
        border-color: #333;

        &::after {
          border: 1px solid #000;
          border-top: 0px;
          border-left: 0px;
        }
      }

      .el-checkbox__input {
        @include LineHeight(27.6);
      }

      .el-checkbox__label {
        display: inline-block;
        @include Width(110);
        color: #fff;
        @include LetterSpacing(1);
        display: flex;
        @include LineHeight(27.6);

        img {
          @include Width(20);
          @include wHeight(27.6);
          @include MarginRight(15);
        }
      }
    }
  }
}


.checkboxlist {
  @include Margin(10, 0, 10, 0);

  :deep(.ant-checkbox-wrapper) {
    img {
      @include Width(22);
      @include MarginRight(15);
    }

    div {
      display: inline;
    }

    // 方框 选择框
    .ant-checkbox-inner {
      @include wHeight(20);
      @include Width(20);
      @include Margin(0, 0, 0, 2);
    }

    .ant-checkbox-checked .ant-checkbox-inner {

      background-color: #FFF;
      border-color: #FFF;
      color: #FFF;

    }

    .ant-checkbox-checked .ant-checkbox-inner::after {
      position: absolute;
      display: table;
      border: 2px solid rgb(70, 79, 116);
      border-top: 0;
      border-left: 0;
      transform: rotate(45deg) scale(1) translate(-50%, -50%);
      opacity: 1;
      transition: all 0.2s cubic-bezier(0.12, 0.4, 0.29, 1.46) 0.1s;
      content: ' ';
    }
  }

  .label {
    color: #FFF;
    display: inline-block;
    @include Width(110);
    color: #fff;
    @include LetterSpacing(1);
    display: flex;
    @include LineHeight(27.6);
  }

  .ant-checkbox-checked::after {
    border: none;
  }
}
</style>
