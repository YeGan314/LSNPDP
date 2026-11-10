/*
 * @Author: YG
 * @Date: 2024-06-14 16:15:38
 * @LastEditTime: 2025-11-11 14:30:54
 * @Description: vue 配置页
 * @FastButton: ctrl+win+i, ctrl+win+t
 */
const path = require("path");
function resolve(dir) {
  return path.join(__dirname, dir);
}
const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  publicPath: "/",
  chainWebpack: (config) => {
    config.resolve.alias.set("@", resolve("./src"));
  },
  css: {
    extract: true, // 确保 CSS 被提取到单独文件中
    loaderOptions: {
      sass: {
        additionalData: `
        @import "@/styles/common.scss";
      `,
      },
      less: {
        // 配置Less，@/ 是src/ 的别名， 这里可以写一些全局的less变量和mixin
        // additionalData: `@import "@/styles/variables.less";`
      },
    },
  },
  configureWebpack: {
    optimization: {
      splitChunks: {
        cacheGroups: {
          styles: {
            name: "styles",
            test: /\.css$/,
            chunks: "all",
            enforce: true,
          },
        },
      },
    },
  },
  transpileDependencies: [],
  // 开发服务器配置
  devServer: {
    port: 3001, // 前端与 GeoServer 8080 分开；LSNPDP_NEW 使用 3001 避开现有 3000 进程
    host: '0.0.0.0', // 允许外部访问
    proxy: {
      // 代理 GeoServer 请求，解决跨域问题
      '/geoserver': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        secure: false,
        ws: false,  // 关闭 websocket，WMS 不需要
        pathRewrite: {
          // 不重写路径，保持 /geoserver 前缀
        },
        onProxyReq: function(proxyReq, req, res) {
          console.log('📤 [代理请求]', req.method, req.url);
          console.log('📤 [目标地址]', 'http://127.0.0.1:8080' + req.url);

          // 添加 GeoServer 认证信息 (如果需要)
          // const auth = Buffer.from('admin:geoserver').toString('base64');
          // proxyReq.setHeader('Authorization', `Basic ${auth}`);
        },
        onProxyRes: function(proxyRes, req, res) {
          const statusCode = proxyRes.statusCode;
          const statusText = statusCode >= 200 && statusCode < 300 ? '✅' : '❌';
          console.log(`📥 [代理响应] ${statusText} ${statusCode}`, req.url);
        },
        onError: function(err, req, res) {
          console.error('❌ [代理错误]', err.code, err.message);
          console.error('❌ [请求URL]', req.url);
          console.error('❌ [目标服务器]', 'http://127.0.0.1:8080');

          // 返回友好的错误信息
          res.writeHead(502, {
            'Content-Type': 'application/json',
          });
          res.end(JSON.stringify({
            error: 'GeoServer 代理失败',
            message: err.message,
            code: err.code,
            url: req.url,
            target: 'http://127.0.0.1:8080',
            suggestion: '请检查: 1) GeoServer 是否启动 2) 网络连接 3) 防火墙设置'
          }));
        }
      }
    }
  }
});
