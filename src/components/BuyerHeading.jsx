export default function BuyerHeading({ title, description, children }) {
  return <div className="member-heading"><div><p className="member-eyebrow">SIFIT / KHÔNG GIAN CỦA BẠN</p><h1>{title}</h1>{description && <p className="member-description">{description}</p>}</div>{children && <div className="member-heading-actions">{children}</div>}</div>;
}
