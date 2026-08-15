import type { Bi } from "../lib/copy";

export function BiText({
  zh,
  idn,
  as: Tag = "span",
  className
}: Bi & {
  as?: "span" | "p" | "h1" | "h2" | "h3" | "small" | "strong" | "div";
  className?: string;
}) {
  return (
    <Tag className={`bi${className ? ` ${className}` : ""}`}>
      <span className="bi-zh">{zh}</span>
      <span className="bi-idn" lang="id">
        {idn}
      </span>
    </Tag>
  );
}

export function biLine({ zh, idn }: Bi): string {
  return `${zh} / ${idn}`;
}
