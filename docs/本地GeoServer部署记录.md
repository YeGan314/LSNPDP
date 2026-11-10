# 本地 GeoServer 部署记录

日期：2026-10-23。

本机原有 PostgreSQL 实例只有 `minsheng` 和 `postgres` 两个数据库。本次在已有 `minsheng-postgis` 容器中创建了独立的 `LSNPDP` 数据库，从远程 GeoServer 的 `LSNPDP` WFS 图层取得六份数据，并在本机 `minsheng-geoserver` 容器中建立 `LSNPDP` 工作空间、`postgis_lsnpdp` 数据存储和同名图层。这是一份导入时的快照，不会自动同步远程更新。

|表 / 图层|记录数|几何类型|
|---|---:|---|
|cz_xwrw_data|83|Point|
|cz_szjc_data|5196|Point|
|lybj|1|MultiPolygon|
|zbqy|907|Point|
|zysy|230|MultiLineString|
|sx|4901|MultiLineString|

每张表保留了 WFS 属性字段、几何和源要素 ID，并增加本地主键与空间索引。导入后核对了记录数、非空几何及几何有效性；六个本机 WFS 图层和 `lybj` WMS 均已返回成功。

## 地址与端口

- PostgreSQL：本机 `5432`，数据库 `LSNPDP`，schema `public`。
- GeoServer：本机 `http://localhost:8080/geoserver`，工作空间 `LSNPDP`。
- 原项目开发服务：`http://localhost:3000`。修改 `vue.config.js` 后，需要重启现有开发进程才能生效。
- `LSNPDP_NEW` 开发服务：`http://localhost:3001`，运行 `npm run serve`。开发环境将 `/geoserver` 代理到本机 `127.0.0.1:8080`，浏览器无需直接连跨域的 8080。
- 生产构建默认直连 `http://localhost:8080/geoserver`。如浏览器在另一台机器上访问，构建前设置 `VUE_APP_GEOSERVER_BASE_URL` 为可从该浏览器访问的 GeoServer 地址。

GeoServer 与 PostgreSQL 目前运行在现有 `minsheng-geoserver`、`minsheng-postgis` Docker 容器中；停止这些容器会影响本项目本地图层。当前六表数据已复制到独立数据库，没有改动 `minsheng` 中的其他业务表。

## 验证地址

- WFS：`http://localhost:8080/geoserver/LSNPDP/ows?service=WFS&version=2.0.0&request=GetFeature&typeNames=LSNPDP:cz_szjc_data&outputFormat=application/json&count=1`
- WMS：`http://localhost:8080/geoserver/LSNPDP/wms?service=WMS&version=1.1.1&request=GetCapabilities`
- 开发代理：把上述 URL 的 `localhost:8080` 改为 `localhost:3001`。

数据库和 GeoServer 工作空间备份：`/Users/mac/Documents/Code/LSNPDP_LOCAL_GEOSERVER_BACKUP_20261023_205143`，包含 6 张表的数据与 6 个发布配置。该目录可能含连接配置，按私密备份保存。

## 流域边界样式

`geoserver-styles/lybj-transparent-highlight.sld` 是本机 `LSNPDP:lybj` 的默认样式；内部透明，边界高亮。
