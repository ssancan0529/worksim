import { REQUIREMENTS } from "../data/scenario";
import Icon from "./Icon";

export default function RequirementsList({ items = REQUIREMENTS }) {
  return (
    <ul className="requirements-list">
      {items.map((item) => (
        <li key={item}><Icon name="circle-check" size={17} />{item}</li>
      ))}
    </ul>
  );
}
