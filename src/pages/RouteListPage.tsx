import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRouteList } from "../api/routes";
import { AppShell } from "../components/AppShell";
import { StatusBanner } from "../components/StatusBanner";
import type { RouteSummary } from "../types/route";

function getRouteStatusLabel(status?: string) {
  switch (status) {
    case "draft":
      return "草稿";
    case "review":
      return "待审核";
    default:
      return "未知";
  }
}

export function RouteListPage() {
  const [routes, setRoutes] = useState<RouteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"api" | "mock">("mock");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const result = await getRouteList();
        setRoutes(result.data);
        setSource(result.source);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载路线失败");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AppShell title="路线列表" subtitle="选择一条路线进入地图标注编辑器">
      <section className="route-list-page">
        <StatusBanner tone={source === "api" ? "success" : "warning"}>
          {source === "api" ? "已连接后端接口" : "当前使用本地演示数据"}
        </StatusBanner>
        {error ? <StatusBanner tone="danger">{error}</StatusBanner> : null}
        {loading ? <div className="panel">正在加载路线...</div> : null}
        {!loading ? (
          <div className="route-grid">
            {routes.map((route) => (
              <Link key={route.id} className="route-card" to={`/routes/${route.id}`}>
                <div className="route-card__title">{route.name}</div>
                <div className="route-card__meta">{route.distanceKm?.toFixed(1)} 公里</div>
                <div className="route-card__meta">状态：{getRouteStatusLabel(route.status)}</div>
              </Link>
            ))}
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}
