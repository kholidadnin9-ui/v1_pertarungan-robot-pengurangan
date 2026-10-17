/**
 * Robot sprite renderer.
 * The PNG assets already have a fully transparent background (removed at build
 * time), so this is a thin wrapper that keeps a single place for sprite tweaks.
 */
export default function ChromaRobot({
  src,
  alt,
  className = '',
  style,
  draggable = false,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  draggable?: boolean;
}) {
  return <img src={src} alt={alt} className={className} style={style} draggable={draggable} />;
}
