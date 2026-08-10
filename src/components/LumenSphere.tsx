export default function LumenSphere({
  className = "",
  live = true,
}: {
  className?: string;
  live?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={`lumen-sphere${live ? " lumen-sphere--live" : ""} ${className}`}
    />
  );
}
