type Props = { height?: number; className?: string };

const HIBOB_LOGO = new URL("../../assets/hibob-logo.png", import.meta.url).href;

const LOGO_ASPECT = 888 / 357;

/** Official HiBob logotype (Hi bubble + Bob). */
export function HiBobLogo({ height = 35, className }: Props) {
  const width = Math.round(height * LOGO_ASPECT);

  return (
    <img
      src={HIBOB_LOGO}
      alt="HiBob"
      height={height}
      width={width}
      className={className ? `site-brand-logo ${className}` : "site-brand-logo"}
      style={{ width: "auto", height, display: "block" }}
    />
  );
}
