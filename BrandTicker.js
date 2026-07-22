export default function BrandTicker({ brands }) {
  // Duplicate the list so the CSS animation can loop seamlessly
  const loop = [...brands, ...brands];

  return (
    <div className="ve-ticker">
      <div className="ve-ticker-track">
        {loop.map((b, i) => (
          <div className="ve-ticker-item" key={`${b.id}-${i}`}>
            <span className="ve-ticker-logo">
              {b.logo_url ? <img src={b.logo_url} alt="" /> : <strong>{b.name}</strong>}
            </span>
            <span className="ve-ticker-name">{b.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
