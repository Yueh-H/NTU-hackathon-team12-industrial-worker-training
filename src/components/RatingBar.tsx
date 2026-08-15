import type { Rating } from "../types";

const OPTIONS: { id: Rating; label: string; hint: string }[] = [
  { id: "forgot", label: "忘記", hint: "還沒記住" },
  { id: "fuzzy", label: "模糊", hint: "有印象但不穩" },
  { id: "remembered", label: "記得", hint: "現場叫得出來" }
];

export function RatingBar({
  value,
  onChange,
  disabled
}: {
  value?: Rating;
  onChange: (rating: Rating) => void;
  disabled?: boolean;
}) {
  return (
    <div className="rating-bar">
      {OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`rate ${option.id} ${value === option.id ? "is-on" : ""}`}
          disabled={disabled}
          onClick={() => onChange(option.id)}
        >
          <strong>{option.label}</strong>
          <small>{option.hint}</small>
        </button>
      ))}
    </div>
  );
}
