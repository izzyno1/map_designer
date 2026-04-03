# 地图标注器 MVP（单草稿）

一个供内部编辑和运营使用的地图标注工具，核心模式是“单次标注稿”：

- 首页只有一个入口：`新建标注`
- 进入后直接在地图上标注
- 只维护两类对象：
  - 标注点（独立点位）
  - 赛段（多点组成的独立折线）
- 保存当前唯一标注稿
- 导出自定义 JSON
- 后端不可用时自动 fallback 到本地演示数据

## 技术栈

- 前端：React + Vite + TypeScript + Leaflet
- 后端：Node.js + Express
- 数据库：SQLite（`better-sqlite3`）
- 部署：Nginx + Node.js + SQLite

## 本地开发

安装依赖：

```bash
npm install
```

启动前端：

```bash
npm run dev
```

启动后端：

```bash
npm run dev:api
```

默认地址：

- 前端：`http://127.0.0.1:5173`
- 后端：`http://127.0.0.1:3000`

`vite.config.ts` 已把 `/api` 代理到 `3000`。

## 生产构建

```bash
npm run build
npm run start:api
```

后端环境变量：

```bash
PORT=3000
DB_PATH=/var/www/map_designer/data/map-designer.sqlite
```

## 前端请求前缀

如前后端不同域，可设置：

```bash
VITE_API_BASE_URL=http://localhost:3000
```

未设置时默认同源。

## 当前核心接口（单草稿）

- `GET /api/health`
- `GET /api/v1/draft`
- `PUT /api/v1/draft`
- `GET /api/v1/draft/export`
- `POST /api/v1/snap-path`

说明：前端主流程只使用以上接口。

## 导出 JSON 结构

```json
{
  "viewport": {
    "center": { "lat": 37.87, "lng": 112.55 },
    "zoom": 12
  },
  "pois": [
    {
      "id": "poi-1",
      "name": "补给点 A",
      "remark": "桥边补水",
      "lat": 37.86,
      "lng": 112.54
    }
  ],
  "segments": [
    {
      "id": "segment-1",
      "name": "赛段 A",
      "remark": "节奏段",
      "points": [
        { "lat": 37.87, "lng": 112.55 },
        { "lat": 37.88, "lng": 112.57 }
      ]
    }
  ]
}
```

## 交互说明

- 点击 `新增标注点` 后，在地图点一下创建点位
- 点击 `新增赛段` 后，在地图连续点多个点，点 `完成赛段` 生成赛段线
- 完成赛段时会自动调用 `snap-path` 接口做道路贴合
- 如果贴路失败，会自动回退到原始赛段线，避免数据丢失
- 左侧列表可快速选中对象
- 右侧可编辑名称和备注，并可删除对象
- `保存标注` 会保存整份当前草稿
- `导出 JSON` 下载当前草稿数据

## fallback 机制

前端优先请求真实后端；请求失败时自动 fallback：

- `GET /api/v1/draft` 失败：读本地草稿（或默认空草稿）
- `PUT /api/v1/draft` 失败：写入本地 `localStorage`
- 导出失败：导出本地草稿

本地存储 key：`map-designer:draft`

## Ubuntu 部署摘要

```bash
apt update
apt install -y curl git nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

```bash
cd /var/www
git clone https://github.com/izzyno1/map_designer
cd /var/www/map_designer
npm install
npm run build
```

Nginx 指向 `dist`，并代理 `/api` 到 `127.0.0.1:3000`。  
后端推荐用 systemd 常驻运行 `npm run start:api`。

## 山西 `.osm.pbf`

`shanxi-260331.osm.pbf` 目前仅作为区域范围和后续扩展参考，不是当前单草稿标注流程的运行依赖。

## 已知限制

- 只支持一个当前标注稿，不支持多稿管理
- 赛段坐标暂不支持右侧逐点编辑，修改建议“删除后重画”
- 地图底图依赖在线 OpenStreetMap
