export function PartArt({ partId, label }: { partId: string; label: string }) {
  return (
    <figure className="part-art">
      <img src={`/parts/${partId}.png`} alt={label} />
    </figure>
  );
}
