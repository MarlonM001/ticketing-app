import type { StaffRole } from "@/lib/staff-session";

// Íconos lineales simples (sin dependencias) para representar cada rol de
// staff en el panel de admin y en las pantallas de trabajo.
export default function RoleIcon({
  role,
  className = "h-5 w-5",
}: {
  role: StaffRole;
  className?: string;
}) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (role) {
    case "puerta":
      return (
        <svg {...common} aria-hidden="true">
          <rect x="5" y="3" width="12" height="18" rx="1" />
          <circle cx="14" cy="12" r="0.9" fill="currentColor" stroke="none" />
          <path d="M17 8l4-1v10l-4-1" />
        </svg>
      );
    case "caja":
      return (
        <svg {...common} aria-hidden="true">
          <rect x="3" y="9" width="18" height="11" rx="1.5" />
          <path d="M7 9V7a5 5 0 0 1 10 0v2" />
          <path d="M3 13h18" />
          <circle cx="12" cy="16" r="1.3" />
        </svg>
      );
    case "mesero":
      return (
        <svg {...common} aria-hidden="true">
          <ellipse cx="12" cy="14" rx="9" ry="2.4" />
          <path d="M12 3v7" />
          <path d="M9 6h6" />
          <circle cx="12" cy="14" r="2.2" />
        </svg>
      );
    case "dj":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M4 13a8 8 0 0 1 16 0" />
          <rect x="2.5" y="13" width="4" height="6" rx="1.3" />
          <rect x="17.5" y="13" width="4" height="6" rx="1.3" />
        </svg>
      );
    case "vendedor":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M3 12 12 3l8 1 1 8-9 9z" />
          <circle cx="15" cy="8" r="1.3" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      return null;
  }
}
