export default function PageActions({ children, className = "" }) {
  return <div className={`page-actions ${className}`.trim()}>{children}</div>;
}
