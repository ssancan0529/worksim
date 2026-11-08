export default function ContentCard({ children, className = "", as: Element = "section" }) {
  return <Element className={`content-card ${className}`.trim()}>{children}</Element>;
}
