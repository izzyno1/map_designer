import { Link } from "react-router-dom";
import { AppShell } from "../components/AppShell";

export function DraftEntryPage() {
  return (
    <AppShell title="地图标注器" subtitle="单次标注稿：仅标注点与赛段，不创建路线">
      <section className="panel draft-entry">
        <h2>开始新一轮地图标注</h2>
        <p>点击下面按钮进入当前标注稿，直接在地图上新增标注点和赛段。</p>
        <Link className="toolbar-button draft-entry__button" to="/draft">
          新建标注
        </Link>
      </section>
    </AppShell>
  );
}
