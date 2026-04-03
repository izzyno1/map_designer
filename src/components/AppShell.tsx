import { Link } from "react-router-dom";
import type { ReactNode } from "react";

interface AppShellProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AppShell({ title, subtitle, actions, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div>
          <Link className="app-shell__crumb" to="/">
            地图标注工具
          </Link>
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        <div>{actions}</div>
      </header>
      <main className="app-shell__body">{children}</main>
    </div>
  );
}
