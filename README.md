# 骑行路线地图标注后台 MVP

一个供内部编辑和运营使用的骑行路线地图标注工具，支持：

- 路线列表与路线编辑器
- 地图上新增和编辑标注点
- 赛段列表管理与地图高亮
- 路线 geometry 编辑
- 保存到 SQLite 数据库
- 导出自定义 JSON 文件
- 当后端不可用时自动回退到前端演示数据

## 技术栈

- 前端：React + Vite + TypeScript + Leaflet
- 后端：Node.js + Express
- 数据库：SQLite（`better-sqlite3`）
- 部署建议：Nginx + Node.js + SQLite

## 本地开发

先安装依赖：

```bash
npm install
```

启动前端开发服务器：

```bash
npm run dev
```

启动后端开发服务器：

```bash
npm run dev:api
```

说明：

- 前端默认运行在 `http://127.0.0.1:5173`
- 后端默认运行在 `http://127.0.0.1:3000`
- `vite.config.ts` 已经把 `/api` 代理到 `3000`
- 本地数据库默认写入 `data/map-designer.sqlite`

## 生产构建

构建前端：

```bash
npm run build
```

启动后端生产服务：

```bash
npm run start:api
```

后端可用环境变量：

```bash
PORT=3000
DB_PATH=/var/www/map_designer/data/map-designer.sqlite
```

## API 基础地址

如果前端和后端不在同一域名下，可以通过环境变量覆盖请求前缀：

```bash
VITE_API_BASE_URL=http://localhost:3000
```

`src/api/client.ts` 会把这个值拼到真实接口前面。未配置时，前端会直接请求当前站点同源路径。

推荐部署方式：

- 前端和后端同域
- Nginx 托管 `dist/`
- Nginx 把 `/api` 反向代理到 `127.0.0.1:3000`

这样通常不需要额外设置 `VITE_API_BASE_URL`。

## 当前后端接口

项目内置了最小可运行后端，接口如下：

- `GET /api/health`
- `GET /api/v1/routes`
- `GET /api/v1/routes/:routeId`
- `GET /api/v1/routes/:routeId/map-data`
- `PATCH /api/v1/routes/:routeId/geometry`
- `POST /api/v1/routes/:routeId/pois`
- `PATCH /api/v1/routes/:routeId/pois/:poiId`
- `GET /api/v1/routes/:routeId/segments`
- `PUT /api/v1/routes/:routeId/segments`
- `GET /api/v1/routes/:routeId/export`

`GET /api/v1/routes/:routeId/export` 会下载自定义 JSON 文件，结构如下：

```json
{
  "route": {
    "id": "sx-taiyuan-river-loop",
    "name": "太原汾河晨骑环线",
    "geometry": {
      "type": "LineString",
      "coordinates": [
        { "lat": 37.87, "lng": 112.56, "distanceKm": 0 }
      ]
    }
  },
  "pois": [
    {
      "id": "poi-1",
      "name": "桥下集合点",
      "remark": "方便临时集合",
      "lat": 37.88,
      "lng": 112.57
    }
  ],
  "segments": [
    {
      "id": "segment-1",
      "name": "导出测试赛段",
      "remark": "保持稳定节奏",
      "startIndex": 1,
      "endIndex": 3
    }
  ],
  "meta": {
    "version": 1,
    "exportedAt": "2026-04-03T00:00:00.000Z"
  }
}
```

## 自动回退到演示数据

前端会优先请求真实 API；如果请求失败，就自动回退到本地 mock 数据，保证页面仍然可以使用。

当前支持 fallback 的地方：

- 路线列表
- 路线详情
- 路线地图数据
- 路线坐标保存
- 标注点新增和更新
- 赛段读取和保存

说明：

- 路线、地图、POI 的 fallback 使用 `src/mock/*`
- 赛段 fallback 使用浏览器 `localStorage`
- 顶部状态条会提示当前是“已连接后端接口”还是“当前使用本地演示数据”

## Ubuntu 服务器部署

适合部署到你现有的 Ubuntu 服务器。

### 1. 安装运行环境

```bash
apt update
apt install -y curl git nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

### 2. 拉取项目

```bash
cd /var/www
git clone https://github.com/izzyno1/map_designer
cd /var/www/map_designer
```

### 3. 安装依赖并构建

```bash
npm install
npm run build
```

### 4. 启动后端

先直接试跑：

```bash
cd /var/www/map_designer
PORT=3000 DB_PATH=/var/www/map_designer/data/map-designer.sqlite npm run start:api
```

另开一个终端检查：

```bash
curl http://127.0.0.1:3000/api/health
```

返回 `{"ok":true}` 就说明后端正常。

### 5. 配置 Nginx

```bash
cat > /etc/nginx/sites-available/map_designer <<'EOF'
server {
    listen 80;
    server_name synexis.top www.synexis.top _;

    root /var/www/map_designer/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
```

启用配置：

```bash
rm -f /etc/nginx/sites-enabled/default
ln -s /etc/nginx/sites-available/map_designer /etc/nginx/sites-enabled/map_designer
nginx -t
systemctl restart nginx
systemctl enable nginx
```

### 6. 配成 systemd 常驻服务

```bash
cat > /etc/systemd/system/map-designer-api.service <<'EOF'
[Unit]
Description=Map Designer API
After=network.target

[Service]
Type=simple
WorkingDirectory=/var/www/map_designer
Environment=PORT=3000
Environment=DB_PATH=/var/www/map_designer/data/map-designer.sqlite
ExecStart=/usr/bin/npm run start:api
Restart=always
User=root

[Install]
WantedBy=multi-user.target
EOF
```

启用并启动：

```bash
systemctl daemon-reload
systemctl enable map-designer-api
systemctl start map-designer-api
systemctl status map-designer-api
```

查看日志：

```bash
journalctl -u map-designer-api -f
```

### 7. 放行端口

云厂商安全组至少放行：

- `22`
- `80`
- `443`

如果系统启用了 `ufw`，还可以执行：

```bash
ufw allow 22
ufw allow 80
ufw allow 443
```

## 山西 `.osm.pbf`

项目里提到的山西 OpenStreetMap 数据包 `shanxi-260331.osm.pbf` 目前只作为区域范围与未来扩展参考，不会在前端直接解析，也不是当前运行所必需的输入。

## 已知限制

- 地图底图依赖在线 OpenStreetMap 资源，离线环境下会受影响
- 路线坐标编辑目前以手动坐标调整为主，没有做吸附、撤销重做或复杂拓扑校验
- 标注点删除按钮当前仍未启用
- SQLite 适合 MVP 和轻量内部使用，后续多人高频协作时可以再迁移到 PostgreSQL
