export function SasutyLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox='0 0 40 40' fill='none' className={className}>
      <path d='M28 10C28 10 22 7 15 11C8 15 10 21 16 23C22 25 31 25 30 31C29 37 22 35 16 33C10 31 10 29 10 29' stroke='currentColor' strokeWidth='3.5' strokeLinecap='round' strokeLinejoin='round'/>
    </svg>
  );
}
