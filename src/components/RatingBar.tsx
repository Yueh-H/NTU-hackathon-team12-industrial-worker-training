import type { Rating } from "../types";

const OPTIONS: { id: Rating; idLabel: string; hint: string }[] = [
  { id: "forgot", idLabel: "Lupa", hint: "Belum hafal" },
  { id: "fuzzy", idLabel: "Ragu-ragu", hint: "Masih campur" },
  { id: "remembered", idLabel: "Ingat", hint: "Siap di lantai" }
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
          <strong>{option.idLabel}</strong>
          <small>{option.hint}</small>
        </button>
      ))}
    </div>
  );
}
