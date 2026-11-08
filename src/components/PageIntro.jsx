export default function PageIntro({ eyebrow, title, description, children }) {
  return (
    <div className="page-intro">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {description && <p className="intro-copy">{description}</p>}
      </div>
      {children}
    </div>
  );
}
