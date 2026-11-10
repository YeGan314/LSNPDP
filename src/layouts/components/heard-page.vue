<!-- header -->
<template>
  <div>

  </div>
</template>

<script setup>
import { computed } from "vue";
import { useStore } from "vuex";
import { useRoute } from "vue-router";
const route = useRoute();
const store = useStore();

// 通过 computed 获取 title
const title = computed(() => store.getters["system/title"]);

const UIClick = () => { };
</script>
<style lang="scss" scoped>
.header {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  @include wHeight(105);
  // background: rgba(0, 0, 0, 0.301);
  background: url("~@/assets/bigScreen/基础/header/top_middle_bg@2x.png") no-repeat;
  background-size: 100% 100%;
  justify-content: center;
  top: 0;
  @include FontSize(12);
  z-index: 10;

  .logo {
    @include Width(400);
    @include wHeight(46);
    @include LineHeight(46);
    text-align: center;
    // background-size: 100% 100%;
    position: absolute;
    // @include Left(350);
    @include Left(0);
    right: 0;
    top: 0;
    // background: #000;
    margin: auto;
    display: flex;
    flex-direction: column;
    // align-items: center;
    justify-content: center;
    // @include PaddingTop(12);
    cursor: pointer;
    z-index: 100;

    .tit {
      @include FontSize(24);
      @include LetterSpacing(3);
      @include wHeight(40);
      //       font-family: Oppo, serif;

      @include MarginBottom(5);
      font-weight: 600;
      //text-shadow: 0 0 5px #98deff;
    }

    .titeng {
      @include FontSize(14);
    }
  }

  .rightbg {
    position: absolute;
    right: 0;
    @include Width(400);
    height: 100%;
    background: linear-gradient(to left,
        #000000d8 0%,
        #000000b6 20%,
        #00000098 40%,
        #00000077 60%,
        #00000054 80%,
        #00000000 100%);
  }

  .title {
    cursor: pointer;
    // @include FontSize(36);
    @include FontSize(30);
    color: #ffffff;
    position: absolute;
    @include Top(10);
    @include LetterSpacing(4.91);
    text-align: center;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    //@include tex
  }
}

.left-bg,
.right-bg {
  @include Width(756);
  @include wHeight(77);
  position: absolute;
  @include Top(-10);
  z-index: 20;
  @include PaddingRight(60);
}

.left-bg {
  left: 0;
  background: url("~@/assets/bigScreen/基础/top_left_bg@2x.png") no-repeat;
  background-size: 100% 100%;
  display: flex;
  //justify-content: center;
  align-items: center;

  .weather-box {
    @include PaddingLeft(63);
    display: flex;
    @include PaddingTop(20);

    .bg-box {
      background: url("~@/assets/bigScreen/基础/header/103@2x.png") no-repeat;
      background-size: 100% 100%;
      @include Width(47);
      @include wHeight(41);
      @include MarginRight(31);
    }

    .weather-item {
      @include Padding(0, 42, 0, 42);
      border-left: 1.5px solid rgba(255, 255, 255, 0.4);
      @include wHeight(31);
      color: #fff;

      .label {
        //@include LineHeight(23);
        position: relative;
        @include Top(-5);
      }

      .value {
        //@include LineHeight(23);
        position: relative;
        @include Bottom(-5);
      }

      &:first-child {}
    }
  }
}

.right-bg {
  right: 0;
  // background: url('~@/assets/images/基础/top_right_bg@2x.png') no-repeat;
  background-size: 100% 100%;

  .tool {
    color: #ffffff;

    position: absolute;
    @include wHeight(75);
    top: 0;
    z-index: 10;
    @include Right(200);
    @include Width(130);
    // @include Top(10);
    //     font-family: SJyunhei, serif;
    display: flex;
    justify-content: space-around;
    align-items: center;
    @include FontSize(20);
    cursor: pointer;

    img {
      @include Width(30);

      transition: transform 0.3s;
    }

    img:hover {}

    img:hover {
      transform: scale(1.2);
    }
  }

  .info {
    @include FontSize(14);
    // @include wHeight(40);
    //height: 100%;
    @include Width(333);
    @include wHeight(56);
    position: absolute;
    z-index: 10;
    @include Left(24);
    @include Top(15);
    z-index: 100;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    //// background: url('~@/assets/images/one/top_logo@2x.png') no-repeat;
    background-size: 100% 100%;

    .weahter {
      // @include Width(380);
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      height: 100%;
      color: #ffffff;

      >.weahtermon {
        cursor: pointer;
        position: relative;
        height: 100%;
        // padding-right: 15px;
        // @include PaddingRight(15);
        @include MarginRight(15);

        font-weight: 800;

        >span {
          display: inline-block;
          @include MarginLeft(5);
        }

        &::after {
          content: "";
          position: absolute;
          @include Width(2);
          @include wHeight(15);

          background: rgba(190, 190, 190, 0.856);
          @include Right(-10);
          top: 0;
          bottom: 0;
          margin: auto;
        }
      }

      .aqi {
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .textDat {
        display: flex;
        justify-content: center;
        align-items: center;
        @include MarginLeft(4);

        i:nth-of-type(1) {
          @include FontSize(20);
          display: inline-block;
          @include MarginRight(5);
        }
      }

      .temp {
        display: flex;
        justify-content: center;
        align-items: center;
        @include MarginLeft(-8);
      }

      .humidity {
        display: flex;
        justify-content: center;
        @include MarginLeft(-4);
        align-items: center;
      }

      .windDir {
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .pm25 {
        display: flex;
        justify-content: space-around;
        align-items: center;
        cursor: pointer;
        @include MarginRight(15);
        @include MarginLeft(3);
        font-weight: 800;

        >span {
          display: inline-block;
          @include MarginRight(3);
        }
      }
    }
  }

  .link {
    position: absolute;
    @include wHeight(75);
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    @include Right(20);
    z-index: 100;
    top: 0;

    img {
      @include Width(54);
      transition: transform 0.3s;

      &:hover {
        transform: scale(2.5);
        transform-origin: 100% 0;
      }

      // margin-right: 3px;
      @include MarginRight(3);
    }
  }

  .time {
    color: #fff;
    position: absolute;
    @include wHeight(75);

    @include Top(0);

    @include Right(80);
    @include FontSize(16);
    //   font-family: SJyunhei;
    display: flex;
    justify-content: center;
    align-items: center;

    span:nth-of-type(1) {
      display: inline-block;
      @include MarginRight(10);
    }
  }
}

.choose {
  display: flex;
  width: 230px;
  height: 60px;
  margin: auto;
  border-bottom: 1px solid rgba(237, 249, 255, 0.2);
  justify-content: space-around;

  .el-button {
    margin-top: 10px;
    @include Width(40);
    @include wHeight(30);
    @include LineHeight(30);
    @include Padding(5, 0, 0, 0);
    text-align: center;
    background-color: transparent;

    .svg-icon {
      @include Width(25);
      @include wHeight(25);
      vertical-align: center;
      fill: currentColor;
      overflow: hidden;
      color: #fff;
      // cursor: pointer;
    }
  }

  .active {
    .svg-icon {
      color: #7afafe;
    }
  }
}

.content {
  width: 230px;
  height: 120px;
  margin: auto;
  border-bottom: 1px solid rgba(237, 249, 255, 0.2);
  overflow: auto;
}

.clear {
  width: 100%;
  height: 40px;
  font-size: 14px;
  // font-family: PingFangSC-Regular, PingFang SC;
  font-weight: 400;
  color: #7afafe;
  line-height: 40px;
  text-align: center;
  cursor: pointer;
}
</style>
