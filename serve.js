/*
 * @Author: YG
 * @Date: 2025-11-11 14:30:54
 * @LastEditTime: 2025-11-11
 * @Description: title
 * @FastButton: ctrl+win+i, ctrl+win+t
 */
const express = require("express");
const http = require("http");
const app = express();
const port = 8013; // 自定义端口号（不要与已存在端口冲突）
const geoserverTarget = new URL(process.env.GEOSERVER_PROXY_TARGET || "http://8.146.208.20");
app.use("/geoserver", (req, res) => {
  const upstream = http.request({
    hostname: geoserverTarget.hostname,
    port: geoserverTarget.port || 80,
    path: req.originalUrl,
    method: req.method,
    headers: { ...req.headers, host: geoserverTarget.host },
  }, (upstreamResponse) => {
    res.writeHead(upstreamResponse.statusCode, upstreamResponse.headers);
    upstreamResponse.pipe(res);
  });
  upstream.on("error", () => res.status(502).send("GeoServer proxy unavailable"));
  req.pipe(upstream);
});
app.use(express.static("dist")); // dist 是项目的打包资源路径
app.listen(port, () => console.log(`服务器 ${port} 开启成功!`));
// node server.js
