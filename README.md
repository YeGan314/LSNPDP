# LSNPDP

本目录是原项目当前工作文件的精简副本，整理日期：2026-10-23。原目录未修改。

## 目录

- `src/`：当前前端源码，首页使用 `views/big-screen/index-page.vue`。
- `public/`：运行所需的静态资源（含 Cesium 和地图数据）。
- `scripts/`、`tools/`：数据导入、转换、分析等辅助代码。
- `tests/`：现有测试。
- `sql/`、`geoserver-styles/`：数据库脚本与地图样式。
- `geodata/`、`geo_data/`：地图和分析数据，保留原路径以兼容代码引用。
- `docs/`：使用和集成文档。

## 运行

前端依赖和启动命令见 `package.json`：先执行 `npm ci`，再执行 `npm run serve`；构建执行 `npm run build`。开发端口为 3001，`/geoserver` 默认代理到阿里云 GeoServer `http://8.146.208.20`。

阿里云部署地址为 `http://8.146.208.20/lsnpdp/`。部署构建命令为 `VUE_APP_PUBLIC_PATH=/lsnpdp/ npm run build`，Nginx 子路径配置见 `deploy/nginx-lsnpdp.conf`；服务器现有 `/geoserver/` 代理供页面使用。

气象处理后端及其 Docker Compose 配置已移除。监测、企业、水质和地图图层继续通过远程 GeoServer 获取；前端现有高德天气功能保留。清理记录见 `docs/database-audit/气象服务清理记录.md`。

## 整理范围

保留当前磁盘上的前端源码、依赖锁文件、配置和相关数据（气象处理后端已按要求移除）；未复制 node_modules、Python 虚拟环境、构建产物、output、backup、旧版 big-screen-bak 页面、压缩包、缓存、系统元数据、散落的手工调试页面和历史完成报告。

旧 start-all 脚本引用了本项目不存在的 server 目录，因此未纳入。部分栅格分析代码仍引用原有绝对数据路径，迁移运行时需按实际位置调整。本次仅整理文件，未修改业务代码，也未验证外部数据库及 GeoServer 服务。
