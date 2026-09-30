// Expects your existing logo at /public/logo.svg (or pass a different src).
// Rendered with currentColor-friendly sizing so it sits correctly in both themes
// as long as your SVG itself uses currentColor / a single fill.
export default function Logo({ src = "/logo.svg", size = 28, className = "" }) {
  return (
    <img
      src={src}
      alt="Orkflo"
      width={size}
      height={size}
      className={className}
      draggable={false}
    />
  );
}
