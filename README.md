# 骑行路线地图标注后台 MVP

一个供内部编辑和运营使用的骑行路线地图标注工具，支持路线列表、标注点维护、赛段维护、路线坐标编辑，以及 API 失败后的自动演示数据回退。

## 启动方式

```bash
npm install
npm run dev
```

默认使用 Vite 开发服务器。构建与预览命令如下：

```bash
npm run build
npm run preview
```

## API 基础地址

如果后端部署在其他地址，可以通过环境变量覆盖请求前缀：

```bash
VITE_API_BASE_URL=http://localhost:3000
```

`src/api/client.ts` 会把这个值拼到所有真实接口前面。未配置时，会直接请求当前站点同源路径。

## 自动回退到演示数据

前端会优先请求真实 API；如果请求失败，就自动回退到本地 mock 数据，保证编辑器仍然可用。

当前会自动回退到演示数据的地方：

- 路线列表：`GET /api/v1/routes`
- 路线详情：`GET /api/v1/routes/:routeId`
- 路线地图数据：`GET /api/v1/routes/:routeId/map-data`
- 路线坐标保存：`PATCH /api/v1/routes/:routeId/geometry`
- 标注点新建和更新：`POST /api/v1/routes/:routeId/pois`，`PATCH /api/v1/routes/:routeId/pois/:poiId`
- 赛段读取和保存：当前仅使用演示数据，本地 `localStorage` 持久化

## 真实接口列表

目前前端会尝试调用这些真实接口：

- `GET /api/v1/routes`
- `GET /api/v1/routes/:routeId`
- `GET /api/v1/routes/:routeId/map-data`
- `PATCH /api/v1/routes/:routeId/geometry`
- `POST /api/v1/routes/:routeId/pois`
- `PATCH /api/v1/routes/:routeId/pois/:poiId`

如果接口不可用，页面会自动切回演示数据或本地持久化逻辑。

## 目前仍使用演示数据的部分

- 赛段列表的读取与保存：见 `src/api/segments.ts`
- 演示路线与地图数据：见 `src/mock/routes.ts` 与 `src/mock/map-data.ts`
- 演示标注点更新：回退时会直接写回 `src/mock/map-data.ts` 中的内存数据
- 演示路线坐标更新：回退时会直接写回 `src/mock/routes.ts` 与 `src/mock/map-data.ts`

## 山西 `.osm.pbf`

项目里提到的山西 OpenStreetMap 数据包 `shanxi-260331.osm.pbf` 目前只作为区域范围与未来扩展参考，不会在前端直接解析，也不是当前运行所必需的输入。

## 已知限制

- 赛段后端接口还未接入，当前只能依赖本地 mock 存储
- 地图底图依赖在线 OpenStreetMap 资源，离线环境下会受影响
- 路线坐标编辑目前以手动坐标调整为主，没有做吸附、撤销重做或复杂拓扑校验
- 标注点删除按钮当前仍未启用
- 演示数据回退侧重保证可运行，不等同于后端数据一致性
