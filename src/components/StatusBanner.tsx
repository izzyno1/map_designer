interface StatusBannerProps {
  tone: "neutral" | "success" | "warning" | "danger";
  children: string;
}

export function StatusBanner({ tone, children }: StatusBannerProps) {
  return <div className={`status-banner status-banner--${tone}`}>{children}</div>;
}
