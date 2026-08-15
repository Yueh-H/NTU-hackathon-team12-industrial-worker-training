import { BiText } from "./BiText";
import { t } from "../lib/copy";
import type { Rating } from "../types";

const OPTIONS: { id: Rating; label: { zh: string; idn: string }; hint: { zh: string; idn: string } }[] = [
  { id: "forgot", label: t.forgot, hint: t.forgotHint },
  { id: "fuzzy", label: t.fuzzy, hint: t.fuzzyHint },
  { id: "remembered", label: t.remembered, hint: t.rememberedHint }
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
          <BiText as="strong" {...option.label} />
          <BiText as="small" {...option.hint} />
        </button>
      ))}
    </div>
  );
}
