type LogoProps = {
  className?: string;
  title?: string;
};

/** Marca oficial: chevron isométrico. El color lo pone `currentColor`. */
export function Logo({ className, title }: LogoProps) {
  return (
    <svg
      viewBox="0 0 150 175"
      className={className}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      <path fill="currentColor" d="M100 0 150 25v50L100 50 50 75V25Z" />
      <path fill="currentColor" d="M50 75 0 100v50l50 25 50-25 50 25v-50l-50-25-50 25V75Z" />
    </svg>
  );
}
