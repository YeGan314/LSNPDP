<template>
  <div ref="num"></div>
</template>

<script setup>
import { onMounted, ref, defineProps, watch } from 'vue';
const props = defineProps({ countNum: { type: Number } });
// 操作 dom
const num = ref(null);
// 动画函数 实例化
let num1 = null;
const CountUp = function (target, startVal, endVal, decimals, duration = 1000, options = null) {
  var self = this;
  self.version = function () {
    return '1.9.2';
  };
  self.options = {
    useEasing: true,
    useGrouping: true,
    separator: ',',
    decimal: '.',
    easingFn: easeOutExpo,
    formattingFn: formatNumber,
    prefix: '',
    suffix: '',
    numerals: [],
  };
  if (options && typeof options === 'object') {
    for (var key in self.options) {
      if (options.hasOwnProperty(key) && options[key] !== null) {
        self.options[key] = options[key];
      }
    }
  }
  if (self.options.separator === '') {
    self.options.useGrouping = false;
  } else {
    self.options.separator = '' + self.options.separator;
  }
  var lastTime = 0;
  var vendors = ['webkit', 'moz', 'ms', 'o'];
  for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
    window.cancelAnimationFrame =
      window[vendors[x] + 'CancelAnimationFrame'] ||
      window[vendors[x] + 'CancelRequestAnimationFrame'];
  }
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function (callback, element) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function () {
        callback(currTime + timeToCall);
      }, timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
  }
  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function (id) {
      clearTimeout(id);
    };
  }
  function formatNumber(num) {
    num = num.toFixed(self.decimals);
    num += '';
    var x, x1, x2, x3, i, l;
    x = num.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? self.options.decimal + x[1] : '';
    if (self.options.useGrouping) {
      x3 = '';
      for (i = 0, l = x1.length; i < l; ++i) {
        if (i !== 0 && i % 3 === 0) {
          x3 = self.options.separator + x3;
        }
        x3 = x1[l - i - 1] + x3;
      }
      x1 = x3;
    }
    if (self.options.numerals.length) {
      x1 = x1.replace(/[0-9]/g, function (w) {
        return self.options.numerals[+w];
      });
      x2 = x2.replace(/[0-9]/g, function (w) {
        return self.options.numerals[+w];
      });
    }
    return self.options.prefix + x1 + x2 + self.options.suffix;
  }
  function easeOutExpo(t, b, c, d) {
    return (c * (-Math.pow(2, (-10 * t) / d) + 1) * 1024) / 1023 + b;
  }
  function ensureNumber(n) {
    return typeof n === 'number' && !isNaN(n);
  }
  self.initialize = function () {
    if (self.initialized) {
      return true;
    }
    self.error = '';
    self.d = typeof target === 'string' ? document.getElementById(target) : target;
    if (!self.d) {
      self.error = '[CountUp] target is null or undefined';
      return false;
    }
    self.startVal = Number(startVal);
    self.endVal = Number(endVal);
    if (ensureNumber(self.startVal) && ensureNumber(self.endVal)) {
      self.decimals = Math.max(0, decimals || 0);
      self.dec = Math.pow(10, self.decimals);
      self.duration = Number(duration) * 1000 || 2000;
      self.countDown = self.startVal > self.endVal;
      self.frameVal = self.startVal;
      self.initialized = true;
      return true;
    } else {
      self.error =
        '[CountUp] startVal (' + startVal + ') or endVal (' + endVal + ') is not a number';
      return false;
    }
  };
  self.printValue = function (value) {
    var result = self.options.formattingFn(value);
    if (self.d.tagName === 'INPUT') {
      this.d.value = result;
    } else {
      if (self.d.tagName === 'text' || self.d.tagName === 'tspan') {
        this.d.textContent = result;
      } else {
        this.d.innerHTML = result;
      }
    }
  };
  self.count = function (timestamp) {
    if (!self.startTime) {
      self.startTime = timestamp;
    }
    self.timestamp = timestamp;
    var progress = timestamp - self.startTime;
    self.remaining = self.duration - progress;
    if (self.options.useEasing) {
      if (self.countDown) {
        self.frameVal =
          self.startVal -
          self.options.easingFn(progress, 0, self.startVal - self.endVal, self.duration);
      } else {
        self.frameVal = self.options.easingFn(
          progress,
          self.startVal,
          self.endVal - self.startVal,
          self.duration,
        );
      }
    } else {
      if (self.countDown) {
        self.frameVal = self.startVal - (self.startVal - self.endVal) * (progress / self.duration);
      } else {
        self.frameVal = self.startVal + (self.endVal - self.startVal) * (progress / self.duration);
      }
    }
    if (self.countDown) {
      self.frameVal = self.frameVal < self.endVal ? self.endVal : self.frameVal;
    } else {
      self.frameVal = self.frameVal > self.endVal ? self.endVal : self.frameVal;
    }
    self.frameVal = Math.round(self.frameVal * self.dec) / self.dec;
    self.printValue(self.frameVal);
    if (progress < self.duration) {
      self.rAF = requestAnimationFrame(self.count);
    } else {
      if (self.callback) {
        self.callback();
      }
    }
  };
  self.start = function (callback) {
    if (!self.initialize()) {
      return;
    }
    self.callback = callback;
    self.rAF = requestAnimationFrame(self.count);
  };
  self.pauseResume = function () {
    if (!self.paused) {
      self.paused = true;
      cancelAnimationFrame(self.rAF);
    } else {
      self.paused = false;
      delete self.startTime;
      self.duration = self.remaining;
      self.startVal = self.frameVal;
      requestAnimationFrame(self.count);
    }
  };
  self.reset = function () {
    self.paused = false;
    delete self.startTime;
    self.initialized = false;
    if (self.initialize()) {
      cancelAnimationFrame(self.rAF);
      self.printValue(self.startVal);
    }
  };
  self.update = function (newEndVal) {
    if (!self.initialize()) {
      return;
    }
    newEndVal = Number(newEndVal);
    if (!ensureNumber(newEndVal)) {
      self.error = '[CountUp] update() - new endVal is not a number: ' + newEndVal;
      return;
    }
    self.error = '';
    if (newEndVal === self.frameVal) {
      return;
    }
    cancelAnimationFrame(self.rAF);
    self.paused = false;
    delete self.startTime;
    self.startVal = self.frameVal;
    self.endVal = newEndVal;
    self.countDown = self.startVal > self.endVal;
    self.rAF = requestAnimationFrame(self.count);
  };
  if (self.initialize()) {
    self.printValue(self.startVal);
  }
};

// var options = {
//   useEasing: true, // 过渡动画效果，默认ture
//   useGrouping: true, // 千分位效果，例：1000->1,000。默认true
//   separator: ',', // 使用千分位时分割符号
//   decimal: '.', // 小数位分割符号
//   prefix: '*', // 前置符号
//   suffix: '', // 后置符号，可汉字
// };

function start() {
  // 开始
  num1.start();
}
// function pause() {
//   console.log('pause');
//   // 暂停或继续
//   num1.pauseResume();
// }
// function reset() {
//   console.log('reset');
//   // 重置初始值
//   num1.reset();
// }
// function updata() {
//   console.log('updata');
//   // 重新赋值
//   num1.update(888);
// }

// 元素加载后 监听数字变化
onMounted(() => {
  watch(
    () => props.countNum,
    countNum => {
      if (num.value && countNum) {
        // 如果初始值太小了 动画太长了
        const startVal = countNum > 200 ? countNum - 100 : countNum;
        num1 = new CountUp(num.value, startVal, countNum, 0, 10);
        start();
      }
    },
    {
      immediate: true,
    },
  );
});
</script>
