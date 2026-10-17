/** Animated electric strikes for the home-page battle poster. */
export default function HomeLightning() {
  return (
    <div className="home-lightning pointer-events-none absolute inset-0 z-[2] overflow-hidden" aria-hidden="true">
      <svg className="home-bolt home-bolt-left" viewBox="0 0 180 420" fill="none">
        <path className="home-bolt-glow" d="M105 5 42 164h51L34 285l61-31-18 158 88-220h-58L151 5z" />
        <path className="home-bolt-core" d="M105 5 42 164h51L34 285l61-31-18 158 88-220h-58L151 5z" />
        <path className="home-bolt-branch" d="m45 162-34 17 39-4m90-71 29-16-34 4" />
      </svg>

      <svg className="home-bolt home-bolt-right" viewBox="0 0 180 420" fill="none">
        <path className="home-bolt-glow" d="M74 5 143 145h-48l58 125-61-36 11 178L20 198h59L31 5z" />
        <path className="home-bolt-core" d="M74 5 143 145h-48l58 125-61-36 11 178L20 198h59L31 5z" />
        <path className="home-bolt-branch" d="m139 142 30 17-37-5m-87-72L16 65l34 5" />
      </svg>

      <svg className="home-arc home-arc-one" viewBox="0 0 500 160" fill="none">
        <path className="home-arc-glow" d="m4 125 48-44 38 25 56-77 42 68 54-54 40 64 65-54 39 47 48-72 61 47" />
        <path className="home-arc-core" d="m4 125 48-44 38 25 56-77 42 68 54-54 40 64 65-54 39 47 48-72 61 47" />
      </svg>

      <svg className="home-arc home-arc-two" viewBox="0 0 500 160" fill="none">
        <path className="home-arc-glow" d="m5 24 52 68 41-32 48 66 53-81 43 59 53-68 41 64 49-39 51 50 58-79" />
        <path className="home-arc-core" d="m5 24 52 68 41-32 48 66 53-81 43 59 53-68 41 64 49-39 51 50 58-79" />
      </svg>
    </div>
  );
}