import Icon from "./Icon";

export default function StatusNotice({ children, variant = "info", className = "" }) {
  if (!children) return null;
  const icons = {
    info: "info",
    success: "circle-check",
    warning: "circle-alert",
    error: "circle-x",
  };

  return (
    <div className={`status-notice ${variant} ${className}`.trim()} role="status">
      <Icon name={icons[variant] || icons.info} />
      <span>{children}</span>
    </div>
  );
}
