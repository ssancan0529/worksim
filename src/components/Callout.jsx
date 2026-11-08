import Icon from "./Icon";

export default function Callout({ children, icon = "info", className = "" }) {
  return (
    <div className={`callout ${className}`.trim()}>
      <Icon name={icon} />
      <p>{children}</p>
    </div>
  );
}
