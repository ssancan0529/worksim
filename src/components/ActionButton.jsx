import Icon from "./Icon";

export default function ActionButton({
  children,
  onClick,
  variant = "primary",
  icon,
  iconPosition = "right",
  disabled = false,
  type = "button",
}) {
  return (
    <button
      className={`button ${variant}`}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {icon && iconPosition === "left" && <Icon name={icon} />}
      {children}
      {icon && iconPosition === "right" && <Icon name={icon} />}
    </button>
  );
}
