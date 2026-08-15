export function StarPair({ count }: { count: number }) {
  const safeCount = Math.max(0, Math.min(2, Math.round(count)));
  return (
    <span className="star-pair" role="img" aria-label={`${safeCount} 顆星`}>
      {[0, 1].map((index) => (
        <span className={index < safeCount ? "on" : "off"} key={index} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  );
}
