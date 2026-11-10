<template>
  <div class="header-bar" ref="headerBar">
    <div class="bar-box">
      <div class="bar-item" v-for="(item, index) in list" :key="index" @click="handleBarItemClick(item, index, list)"
        :class="{ 'bar-item-active': index === activeIndex }">
        {{ item.title }}
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, onBeforeUnmount, onMounted, reactive, ref, toRefs } from 'vue';

export default defineComponent({
  props: {
    list: {
      type: Array,
      default: () => [

        {
          title: '外部传感器',
        },
        {
          title: '内部传感器',
        },

      ],
    },
    isMulti: {
      type: Boolean,
      default: false,
    },
  },

  setup(props, context) {
    const headerBar = ref();

    const handleBarItemClick = (item, index, array) => {
      if (self.activeIndex === index) {
        self.activeIndex = -1;
        item.isActive = false;
      } else {
        self.activeIndex = index;
        item.isActive = true;
      }
      context.emit('clicks', item, index, array);
    };
    const self = reactive({
      activeIndex: -1,
    });
    onMounted(() => {
      document.querySelector('.header')?.appendChild(headerBar.value);
    });
    onBeforeUnmount(() => {
      document.querySelector('.header')?.removeChild(headerBar.value);
    });

    return {
      headerBar,
      handleBarItemClick,
      ...toRefs(self),
    };
  },
});
</script>

<style scoped lang="scss">
.header-bar {
  position: absolute;
  bottom: 0;
  transform: translateY(-50%);
  top: 100%;
  width: 100%;
  height: 32px;
  @include wHeight(20);
  font-family: Oppo, serif;
  @include FontSize(14);

  .bar-box {
    display: flex;
    align-items: center;
    justify-content: center;

    .bar-item {
      color: #FFF;
      background: url('~@/assets/bigScreen/link/navigation1_bg_normal@2x.png') no-repeat;
      //background-color: rgba(21, 25, 31, 0.73);
      background-size: 100% 100%;
      //@include Width(107);

      text-align: center;
      @include LineHeight(20);
      @include LetterSpacing(1);
      cursor: pointer;
      transition: all 0.3s;
      @include MarginRight(16);
      position: relative;
      //box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.15);
      //width: fit-content;
      //@include Padding(0, 24, 0, 24);
      @include FontSize(24);
      @include Width(140);
      @include wHeight(38);

      &:last-child {
        margin-right: 0;
      }

      &-active {
        background: url('~@/assets/bigScreen/link/navigation1_bg_click@2x.png') no-repeat;
        background-size: 100% 100%;
        //background-image: -webkit-linear-gradient(bottom, red, #fd8403, yellow);
        //-webkit-background-clip: text;
        //-webkit-text-fill-color: transparent;
        color: #ffdeab;
      }

      //&-active, &:hover {
      //  &::before {
      //    content: '';
      //    //width: 100%;
      //    position: absolute;
      //    @include wHeight(2);
      //    background-image: linear-gradient(270deg, #347EF2 0%, #B6ECFF 98%);
      //    left: 50%;
      //    transform: translateX(-50%);
      //    @include Top(-5);
      //    animation: anim1 0.5s;
      //    animation-fill-mode: forwards;
      //    animation-direction: alternate;
      //    @keyframes anim1 {
      //      from {
      //        width: 0%;
      //      }
      //      to {
      //        width: 100%;
      //      }
      //    }
      //  }
      //}
    }
  }
}
</style>
