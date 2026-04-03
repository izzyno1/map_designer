export const seedRoutes = [
  {
    id: "sx-taiyuan-river-loop",
    name: "太原汾河晨骑环线",
    distanceKm: 71.5,
    updatedAt: "2026-03-31T10:00:00Z",
    status: "draft",
    description: "沿汾河主线展开的城市长距离训练路线。",
    geometry: {
      type: "LineString",
      coordinates: [
        { lat: 37.8735, lng: 112.5624, distanceKm: 0 },
        { lat: 37.8672, lng: 112.5481, distanceKm: 8.2 },
        { lat: 37.8581, lng: 112.534, distanceKm: 16.7 },
        { lat: 37.8451, lng: 112.5202, distanceKm: 28.4 },
        { lat: 37.8512, lng: 112.5383, distanceKm: 71.5 },
      ],
    },
  },
  {
    id: "sx-jiexiu-ancient-city",
    name: "介休古城进阶训练线",
    distanceKm: 96.2,
    updatedAt: "2026-03-29T08:30:00Z",
    status: "review",
    description: "适合节奏骑与赛段维护演示的晋中区域训练线。",
    geometry: {
      type: "LineString",
      coordinates: [
        { lat: 37.0274, lng: 111.9131, distanceKm: 0 },
        { lat: 37.041, lng: 111.9278, distanceKm: 15.4 },
        { lat: 37.0553, lng: 111.9362, distanceKm: 40.1 },
        { lat: 37.0698, lng: 111.9429, distanceKm: 67.8 },
        { lat: 37.0841, lng: 111.955, distanceKm: 96.2 },
      ],
    },
  },
];

export const seedPois = [
  {
    id: "poi-1",
    routeId: "sx-taiyuan-river-loop",
    name: "汾河补水点",
    type: "supply",
    iconName: "water",
    distanceLabel: "约 8km",
    description: "河边便利店，适合补水。",
    tone: "轻松补给",
    lat: 37.8672,
    lng: 112.5481,
  },
  {
    id: "poi-2",
    routeId: "sx-taiyuan-river-loop",
    name: "桥头咖啡站",
    type: "coffee",
    iconName: "coffee",
    distanceLabel: "约 28km",
    description: "适合短暂停留。",
    tone: "提神一下",
    lat: 37.8451,
    lng: 112.5202,
  },
];

export const seedSegments = [
  {
    id: "segment-1",
    routeId: "sx-taiyuan-river-loop",
    name: "汾河节奏段",
    type: "tempo",
    effort: "持续输出",
    rank: "A",
    best: "08:45",
    pr: "09:10",
    likes: 123,
    riders: 58,
    startIndex: 1,
    endIndex: 3,
  },
];
