export default function DaisyLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-label="dAIsy logo"
    >
      {/* Petals */}
      <ellipse cx="20" cy="9" rx="4" ry="8" fill="#E8A598" transform="rotate(0 20 20)" />
      <ellipse cx="20" cy="9" rx="4" ry="8" fill="#A89BC2" transform="rotate(120 20 20)" />
      <ellipse cx="20" cy="9" rx="4" ry="8" fill="#7BB8D4" transform="rotate(240 20 20)" />
      {/* Center */}
      <circle cx="20" cy="20" r="7" fill="#F5C842" />
      <circle cx="20" cy="20" r="4" fill="#1B4332" />
    </svg>
  );
}
