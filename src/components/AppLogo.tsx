interface AppLogoProps {
  className?: string;
  size?: number;
}

const AppLogo = ({ className = "", size = 44 }: AppLogoProps) => (
  <div
    className={`relative shrink-0 ${className}`}
    style={{ width: size, height: size }}
    aria-hidden
  >
    <div
      className="absolute inset-0 rounded-full bg-gold/20 blur-md scale-110"
      aria-hidden
    />
    <img
      src="/logo.svg"
      alt=""
      width={size}
      height={size}
      className="relative drop-shadow-[0_2px_10px_hsl(42_70%_55%/0.45)]"
      draggable={false}
    />
  </div>
);

export default AppLogo;
