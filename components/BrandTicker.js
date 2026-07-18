export default function BrandTicker({ brands }) {
  // Duplicate the list so the CSS animation can loop seamlessly
  const loop = [...brands, ...brands];

  return (
    <div className="ve-ticker">
      <div className="ve-ticker-track">
        {loop.map((b, i) => (
          <div className="ve-ticker-item" key={`${b.id}-${i}`}>
            {b.logo_url ? <img src={b.logo_url} alt={b.name} /> : <span>{b.name}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
