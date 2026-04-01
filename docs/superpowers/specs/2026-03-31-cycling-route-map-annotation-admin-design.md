# 骑行路线地图标注后台 MVP 设计文档

## 1. 项目概述

本项目是一个面向内部编辑与运营人员的骑行路线地图标注后台，用于给既有骑行路线添加和维护两类信息：

- 补给点（POI）
- 赛段（Segment）

同时，该工具在 MVP 阶段还需要支持路线 geometry 的可视化编辑与保存。项目不是营销型展示站，而是强调效率、清晰度和可扩展性的桌面优先内部工具。

用户还提供了一个山西区域的 OpenStreetMap 数据包：

- `/Users/a123/Downloads/shanxi-260331.osm.pbf`

该文件在 MVP 中不作为前端直接解析的数据源，而是作为项目地图范围和后续离线化扩展的参考基础。前端第一版仍使用在线 OpenStreetMap 瓦片底图完成地图显示和标注工作。

## 2. 目标与非目标

### 2.1 MVP 目标

- 提供路线列表页，支持从后端获取已有路线并进入编辑器
- 提供地图编辑页，采用左中右三栏布局
- 基于 OpenStreetMap + Leaflet 显示路线折线、POI 点位、赛段高亮
- 以山西区域数据包作为项目范围背景，前端仍使用在线 OSM 底图
- 支持点击地图新增 POI，并通过右侧面板编辑
- 支持编辑已有 POI，并调用后端保存
- 支持赛段的结构化列表编辑，并高亮对应路线区间
- 支持 geometry 编辑，包括地图拖拽节点和右侧坐标列表联动
- 支持真实 API 请求失败后的自动 mock fallback，使前端可独立运行
- 清晰标注哪些实现是 mock，方便未来替换为真实后端

### 2.2 非目标

- 不实现面向 C 端用户的视觉包装或营销风格页面
- 不优先优化移动端体验
- 不在前端浏览器内直接解析 `.osm.pbf` 文件
- 不实现复杂框选式赛段绘制
- 不实现高级路线编辑能力，如吸附、撤销重做、批量拓扑修正
- 不实现真实赛段后端接口，MVP 阶段先用前端本地持久化模拟

## 3. 用户与使用场景

### 3.1 目标用户

- 内部编辑
- 内部运营

### 3.2 核心场景

- 查看路线列表，找到目标路线
- 进入路线编辑页，查看地图与已有标注
- 在山西区域范围内完成路线与标注维护
- 点击地图添加补给点并填写信息
- 修改已有补给点信息并保存
- 添加或维护赛段信息，并指定起点索引与终点索引
- 编辑 geometry 节点，使路线形状和数据更准确
- 在真实接口不可用时，仍可用 mock 数据完成演示和基础操作

## 4. 信息架构

应用采用两页式后台结构，而不是单页重型工作台。

### 4.1 页面结构

- `/`
  - 路线列表页
- `/routes/:routeId`
  - 路线编辑页

### 4.2 编辑器布局

采用“列表优先”的左中右三栏布局：

- 左栏
  - 路线基础信息
  - 数据来源状态
  - 标注列表（POI、赛段）
  - geometry 编辑入口
- 中栏
  - 地图画布
  - 路线折线
  - POI 标记
  - 赛段高亮
  - geometry 节点编辑
- 右栏
  - 当前选中对象属性面板
  - 支持 POI、赛段、geometry 三种编辑视图

此结构优先服务于内部运营高频“列表选择 + 地图确认 + 表单修改”的工作流。

## 5. 数据模型设计

数据分为真实后端实体、前端编辑态实体、mock 持久层三类。

### 5.1 真实后端实体

#### RouteSummary

- `id: string`
- `name: string`
- `distanceKm?: number`
- `updatedAt?: string`
- `status?: string`

#### RouteGeometryPoint

- `lat: number`
- `lng: number`
- `distanceKm?: number`

#### RouteGeometry

- `type: "LineString"`
- `coordinates: RouteGeometryPoint[]`

#### RouteDetail

- `id: string`
- `name: string`
- `description?: string`
- `distanceKm?: number`
- `status?: string`
- `geometry: RouteGeometry`

#### Poi

- `id: string`
- `name: string`
- `type: "supply" | "coffee" | "repair" | "meetup"`
- `iconName?: string`
- `distanceLabel?: string`
- `description?: string`
- `tone?: string`
- `lat: number`
- `lng: number`

#### RouteMapDataResponse

- `routeId: string`
- `geometry: RouteGeometry`
- `pois: Poi[]`

### 5.2 前端编辑态实体

#### Segment

- `id: string`
- `routeId: string`
- `name: string`
- `type: "climb" | "flat" | "tempo" | "sprint"`
- `effort?: string`
- `rank?: string`
- `best?: string`
- `pr?: string`
- `likes?: number`
- `riders?: number`
- `startIndex?: number`
- `endIndex?: number`

#### SelectedAnnotation

联合类型：

- `{ kind: "poi"; id: string }`
- `{ kind: "segment"; id: string }`
- `{ kind: "geometry" }`
- `{ kind: "new-poi" }`
- `{ kind: "none" }`

#### DraftPoi

- 继承 `Poi` 的编辑字段
- 新增 `isNew?: boolean`

#### GeometryPointDraft

- `index: number`
- `lat: number`
- `lng: number`
- `distanceKm?: number`

#### SaveStatus

- `"idle" | "loading" | "success" | "error"`

### 5.3 mock 持久层

- 路线列表 mock
- 路线详情 mock
- 地图数据 mock
- 赛段 localStorage 持久化
- geometry fallback 保存结果

其中赛段在 MVP 中不依赖真实后端，而是写入 `localStorage`。geometry 在真实保存失败时，会进入 fallback mock 流程以保证前端继续可用。

## 6. API 与 fallback 策略

### 6.1 真实接口

- `GET /api/v1/routes`
- `GET /api/v1/routes/{route_id}`
- `GET /api/v1/routes/{route_id}/map-data`
- `PATCH /api/v1/routes/{route_id}/geometry`
- `POST /api/v1/routes/{route_id}/pois`
- `PATCH /api/v1/routes/{route_id}/pois/{poi_id}`

### 6.2 API 模块结构

- `src/api/client.ts`
- `src/api/routes.ts`
- `src/api/pois.ts`
- `src/api/segments.ts`

### 6.3 fallback 原则

- 前端默认允许脱离真实后端单独运行
- 对真实接口的请求失败后，自动降级到 mock 数据
- 赛段相关逻辑默认使用 mock 持久化，并在代码中清晰注释为临时实现
- geometry 更新在真实接口失败时，也允许写入本地 fallback 数据，以保持编辑器可演示和可验证

### 6.4 数据来源提示

编辑页顶部提供轻量状态提示：

- `Connected to API`
- `Fallback mock mode`

用于帮助开发和运营判断当前数据是否来自真实后端。

## 7. 页面与组件设计

### 7.1 顶层结构

- `AppShell`
  - 负责页面骨架、顶部栏、全局状态提示、返回入口

### 7.2 页面组件

- `RouteListPage`
  - 拉取路线列表
  - 展示路线概要信息
  - 支持进入编辑页

- `RouteEditorPage`
  - 拉取路线详情、地图数据、赛段数据
  - 维护当前选中对象
  - 组织左中右三栏联动

### 7.3 编辑器子组件

- `AnnotationSidebar`
  - 展示路线基础信息
  - 展示 POI 列表与赛段列表
  - 提供 geometry 编辑入口

- `MapCanvas`
  - 渲染 OSM 底图
  - 渲染路线折线
  - 渲染 POI marker
  - 渲染赛段高亮子段
  - 渲染 geometry 可编辑节点

- `PoiEditorPanel`
  - 处理新增或编辑 POI

- `SegmentEditorPanel`
  - 处理赛段列表编辑和字段维护

- `GeometryEditorPanel`
  - 处理坐标点列表编辑、插入、删除、保存

- `StatusToast` 或 `StatusBanner`
  - 反馈 loading、success、error

## 8. 核心交互设计

### 8.1 路线列表页

- 默认进入路线列表页
- 页面展示路线列表和基础信息
- 点击路线进入 `/routes/:routeId`

### 8.2 地图编辑页加载流程

进入编辑器时并行加载：

- 路线详情
- 路线地图数据
- 本地赛段数据

加载失败时启用 fallback 数据，并更新数据来源提示。

### 8.3 POI 交互

- 点击地图空白位置
  - 创建一个新的 POI 草稿
  - 自动打开右侧 POI 表单
- 点击已有 POI marker
  - 地图和左侧列表同步选中
  - 右侧切换到编辑模式
- 点击保存
  - 新增时调用 `POST /pois`
  - 编辑时调用 `PATCH /pois/{poi_id}`
  - 成功后刷新当前路线地图数据

删除能力第一版只保留 UI 按钮占位，不执行真实删除。

### 8.4 赛段交互

- 左侧赛段列表支持新增、选择、编辑
- 右侧面板支持维护赛段字段
- 通过 `startIndex`、`endIndex` 标识路线区间
- 地图根据索引截取 geometry 子段进行高亮
- 保存时写入 localStorage

### 8.5 geometry 交互

- 进入 geometry 编辑模式后显示可编辑节点
- 支持拖拽节点修改坐标
- 右侧显示坐标点列表，包含索引、经纬度、distanceKm
- 右侧支持手动修改坐标
- 支持在指定索引后插入节点
- 支持删除节点
- 保存时调用 `PATCH /geometry`
- 失败时写入 fallback mock 存储并提示当前为 mock 模式

### 8.6 联动规则

- 左侧点击列表项，地图定位到对应对象
- 地图点击对象，左侧与右侧同步更新
- 右侧修改数据，局部状态即时更新
- 成功保存后刷新对应数据源，避免前端状态漂移

## 9. 地图与数据处理

### 9.0 山西 `.osm.pbf` 文件的使用边界

提供文件：

- `/Users/a123/Downloads/shanxi-260331.osm.pbf`

MVP 中该文件的用途限定为：

- 作为当前项目聚焦山西区域的背景依据
- 为后续可能的离线瓦片、边界裁剪、后端预处理预留扩展点

MVP 中明确不做：

- 在前端直接读取或解析 `.osm.pbf`
- 在浏览器内将 `.osm.pbf` 转换为可视化道路图层
- 基于该文件实时生成矢量瓦片或离线切片服务

当前前端实际显示方案：

- 地图底图继续使用在线 OpenStreetMap 瓦片
- 地图初始视野优先根据路线 geometry 自动 `fitBounds`
- 无路线 geometry 时，默认视野可回退到山西区域中心附近

### 9.1 geometry 渲染

后端 geometry 示例：

```json
{
  "type": "LineString",
  "coordinates": [
    { "lat": 37.8701, "lng": 112.5485, "distanceKm": 0.0 },
    { "lat": 37.8512, "lng": 112.5383, "distanceKm": 71.5 }
  ]
}
```

前端将其转换为 Leaflet 可识别的坐标数组用于 polyline 渲染，同时保留原始索引以支持：

- geometry 节点编辑
- 赛段索引定位
- 右侧列表展示

### 9.2 赛段高亮

根据 `startIndex` 和 `endIndex` 从 geometry 坐标数组中截取子段，并以不同颜色或线宽进行高亮显示。

### 9.3 POI 渲染

POI 使用后端返回结构直接渲染，仅在视图层做必要字段兼容和默认值处理。

## 10. 样式与视觉原则

- 风格偏内部工具，不做宣传风
- 桌面端优先
- 左中右三栏层级清楚
- 表单清晰、地图可读、列表高密度但不过载
- 使用简洁专业的配色和留白
- 减少视觉装饰，强化功能状态、选中态、保存反馈

## 11. 目录结构建议

```text
src/
  app/
  api/
  components/
  hooks/
  lib/
  mock/
  pages/
  styles/
  types/
```

推荐关键文件：

- `src/components/AppShell.tsx`
- `src/pages/RouteListPage.tsx`
- `src/pages/RouteEditorPage.tsx`
- `src/components/MapCanvas.tsx`
- `src/components/AnnotationSidebar.tsx`
- `src/components/PoiEditorPanel.tsx`
- `src/components/SegmentEditorPanel.tsx`
- `src/components/GeometryEditorPanel.tsx`
- `src/api/routes.ts`
- `src/api/pois.ts`
- `src/api/segments.ts`
- `src/types/route.ts`

## 12. 错误处理与状态反馈

- 页面首次加载显示 loading 状态
- 请求成功显示轻量 success 提示
- 请求失败显示明确 error 提示
- API 失败但 mock 接管成功时，显示“已降级到 mock 模式”
- 右侧无选中对象时，显示操作提示而非空白面板

## 13. 测试与验证策略

MVP 阶段重点覆盖以下内容：

- geometry 数据转换工具函数
- 赛段区间截取逻辑
- localStorage 赛段持久化逻辑
- API fallback 行为的基础验证

页面级以手动验证为主，保证：

- 路线列表可进入编辑页
- 地图正常加载 OSM 底图
- POI 新增和编辑流程可跑通
- 赛段本地保存可持久化
- geometry 编辑与保存流程可跑通

## 14. README 交付要求

README 需要说明：

- 如何安装依赖并启动项目
- 如何配置 `VITE_API_BASE_URL`
- 当前哪些接口对接真实后端
- 哪些逻辑存在 mock fallback
- 赛段当前为 localStorage mock
- geometry 保存失败时的 fallback 行为
- 后续接入真实赛段 API 的位置和方式

## 15. 后续扩展点

- 将 `/Users/a123/Downloads/shanxi-260331.osm.pbf` 纳入后端预处理流程，用于生成山西区域离线底图或裁剪道路参考图层
- 接入真实赛段 API
- 增加 POI 删除能力
- 增加 geometry 撤销与重做
- 增加筛选、搜索、标注分类
- 增加权限与审核流程

## 16. 结论

本 MVP 采用“两页式后台 + 列表优先三栏编辑器”的结构，通过真实 API 与自动 fallback mock 并存的方案，优先保证工具可运行、可演示、可扩展。geometry 编辑被纳入第一版范围，赛段则通过本地持久化先完成业务闭环，并为后续后端接入保留清晰扩展点。
