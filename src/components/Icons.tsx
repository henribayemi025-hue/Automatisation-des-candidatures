interface Props {
  className?: string;
}

const base = 'h-[18px] w-[18px]';

function Svg({ children, className }: Props & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? base}
    >
      {children}
    </svg>
  );
}

export const IconGrid = (p: Props) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </Svg>
);

export const IconSparkle = (p: Props) => (
  <Svg {...p}>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
    <path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z" />
  </Svg>
);

export const IconMonitor = (p: Props) => (
  <Svg {...p}>
    <rect x="2.5" y="4" width="19" height="12.5" rx="2" />
    <path d="M8.5 20.5h7M12 16.5v4" />
  </Svg>
);

export const IconWallet = (p: Props) => (
  <Svg {...p}>
    <path d="M3 7.5A2.5 2.5 0 015.5 5H18a2 2 0 012 2v1" />
    <rect x="3" y="7.5" width="18" height="12" rx="2.5" />
    <circle cx="16.5" cy="13.5" r="1.2" />
  </Svg>
);

export const IconBox = (p: Props) => (
  <Svg {...p}>
    <path d="M21 8.5v7a2 2 0 01-1.05 1.76l-7 3.5a2 2 0 01-1.9 0l-7-3.5A2 2 0 013 15.5v-7" />
    <path d="M3.4 7.6l7.6-3.8a2 2 0 011.9 0l7.6 3.8L12 11.8 3.4 7.6z" />
    <path d="M12 11.8V20" />
  </Svg>
);

export const IconCart = (p: Props) => (
  <Svg {...p}>
    <circle cx="9" cy="20" r="1.4" />
    <circle cx="18" cy="20" r="1.4" />
    <path d="M2.5 3.5h2.2l2.3 11.2a1.6 1.6 0 001.6 1.3h8.6a1.6 1.6 0 001.6-1.3L20.5 8H6" />
  </Svg>
);

export const IconLayers = (p: Props) => (
  <Svg {...p}>
    <path d="M12 3l9 4.5-9 4.5-9-4.5L12 3z" />
    <path d="M3 12.5l9 4.5 9-4.5" />
    <path d="M3 17l9 4.5 9-4.5" />
  </Svg>
);

export const IconReceipt = (p: Props) => (
  <Svg {...p}>
    <path d="M5 2.8v18.4l2.3-1.4 2.4 1.4 2.3-1.4 2.4 1.4 2.3-1.4 2.3 1.4V2.8L16.7 4.2 14.4 2.8 12 4.2 9.7 2.8 7.3 4.2 5 2.8z" />
    <path d="M9 9h6M9 13h6" />
  </Svg>
);

export const IconDoc = (p: Props) => (
  <Svg {...p}>
    <path d="M14 2.8H7a2 2 0 00-2 2v14.4a2 2 0 002 2h10a2 2 0 002-2V7.8l-5-5z" />
    <path d="M14 2.8v5h5" />
    <path d="M9 13h6M9 17h4" />
  </Svg>
);

export const IconCard = (p: Props) => (
  <Svg {...p}>
    <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
    <path d="M2.5 10h19" />
  </Svg>
);

export const IconChart = (p: Props) => (
  <Svg {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </Svg>
);

export const IconBook = (p: Props) => (
  <Svg {...p}>
    <path d="M4 4.5A2.5 2.5 0 016.5 2H20v17H6.5A2.5 2.5 0 004 21.5v-17z" />
    <path d="M20 19v3H6.5A2.5 2.5 0 014 19.5" />
    <path d="M8 7h8M8 11h5" />
  </Svg>
);

export const IconScale = (p: Props) => (
  <Svg {...p}>
    <path d="M12 3v18M7 21h10M3 8l4-3 4 3M13 8l4-3 4 3" />
    <path d="M3 8l-1 4a3 3 0 006 0L7 8M17 8l-1 4a3 3 0 006 0l-1-4" />
  </Svg>
);

export const IconShield = (p: Props) => (
  <Svg {...p}>
    <path d="M12 2.5l7.5 3v6c0 4.6-3.1 8.8-7.5 10-4.4-1.2-7.5-5.4-7.5-10v-6l7.5-3z" />
    <path d="M9 12l2.2 2.2L15.5 10" />
  </Svg>
);

export const IconHistory = (p: Props) => (
  <Svg {...p}>
    <path d="M3.5 12a8.5 8.5 0 106-8.1" />
    <path d="M3.5 4.5V9H8" />
    <path d="M12 8v4.5l3 1.8" />
  </Svg>
);

export const IconSettings = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 14.5a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5v.2a2 2 0 11-4 0v-.1a1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1h-.2a2 2 0 110-4h.1a1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3h.1a1.6 1.6 0 001-1.5v-.2a2 2 0 114 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8v.1a1.6 1.6 0 001.5 1h.2a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z" />
  </Svg>
);

export const IconPlus = (p: Props) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const IconSearch = (p: Props) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </Svg>
);

export const IconMoon = (p: Props) => (
  <Svg {...p}>
    <path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z" />
  </Svg>
);

export const IconSun = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Svg>
);

export const IconTrend = (p: Props) => (
  <Svg {...p}>
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M14 7h7v7" />
  </Svg>
);

export const IconAlert = (p: Props) => (
  <Svg {...p}>
    <path d="M10.3 3.9L2.6 17.2A2 2 0 004.3 20h15.4a2 2 0 001.7-2.8L13.7 3.9a2 2 0 00-3.4 0z" />
    <path d="M12 9v4M12 17h.01" />
  </Svg>
);

export const IconCheck = (p: Props) => (
  <Svg {...p}>
    <path d="M20 6L9 17l-5-5" />
  </Svg>
);

export const IconX = (p: Props) => (
  <Svg {...p}>
    <path d="M18 6L6 18M6 6l12 12" />
  </Svg>
);

export const IconMenu = (p: Props) => (
  <Svg {...p}>
    <path d="M3 6h18M3 12h18M3 18h18" />
  </Svg>
);

export const IconUsers = (p: Props) => (
  <Svg {...p}>
    <path d="M16 20v-1.5a4 4 0 00-4-4H6a4 4 0 00-4 4V20" />
    <circle cx="9" cy="7" r="3.5" />
    <path d="M22 20v-1.5a4 4 0 00-3-3.9M16.5 3.7a4 4 0 010 7.1" />
  </Svg>
);

export const IconDownload = (p: Props) => (
  <Svg {...p}>
    <path d="M12 3v12" />
    <path d="M7.5 10.5L12 15l4.5-4.5" />
    <path d="M4 20h16" />
  </Svg>
);

export const IconSend = (p: Props) => (
  <Svg {...p}>
    <path d="M21 3L10.5 13.5" />
    <path d="M21 3l-6.8 18-3.7-7.5L3 9.8 21 3z" />
  </Svg>
);

export const IconEye = (p: Props) => (
  <Svg {...p}>
    <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const IconEyeOff = (p: Props) => (
  <Svg {...p}>
    <path d="M3 3l18 18" />
    <path d="M10.6 5.7A10 10 0 0112 5.5c6.5 0 10 6.5 10 6.5a17 17 0 01-3.2 4M6.6 6.6C3.9 8.4 2 12 2 12s3.5 6.5 10 6.5a9.7 9.7 0 004.3-1" />
    <path d="M9.9 9.9a3 3 0 004.2 4.2" />
  </Svg>
);

export const IconHome = (p: Props) => (
  <Svg {...p}>
    <path d="M3 11l9-7 9 7" />
    <path d="M5 10v10h5v-6h4v6h5V10" />
  </Svg>
);

export const IconLogout = (p: Props) => (
  <Svg {...p}>
    <path d="M10 4H6a2 2 0 00-2 2v12a2 2 0 002 2h4" />
    <path d="M15 8l5 4-5 4M20 12H9" />
  </Svg>
);

export const IconApps = (p: Props) => (
  <Svg {...p}>
    <circle cx="5" cy="5" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="12" cy="5" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="19" cy="5" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="5" cy="19" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="12" cy="19" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="19" cy="19" r="1.6" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconChevronRight = (p: Props) => (
  <Svg {...p}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
);

export const IconChevronDown = (p: Props) => (
  <Svg {...p}>
    <path d="M6 9l6 6 6-6" />
  </Svg>
);

export const IconHelp = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 015 0c0 1.7-2.5 2-2.5 3.5M12 17h.01" />
  </Svg>
);

export const IconTrash = (p: Props) => (
  <Svg {...p}>
    <path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13" />
  </Svg>
);

export const IconCamera = (p: Props) => (
  <Svg {...p}>
    <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z" />
    <circle cx="12" cy="13" r="3.5" />
  </Svg>
);

export const IconFolder = (p: Props) => (
  <Svg {...p}>
    <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
  </Svg>
);

export const IconChat = (p: Props) => (
  <Svg {...p}>
    <path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H9l-4 4v-4H6a2 2 0 01-2-2V6z" />
  </Svg>
);

export const IconGoogle = (p: Props) => (
  <svg viewBox="0 0 24 24" className={p.className ?? 'h-[18px] w-[18px]'} aria-hidden="true">
    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 01-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9z" />
    <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3a7.2 7.2 0 01-10.8-3.8H1.3v3.1A12 12 0 0012 24z" />
    <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 010-4.6V6.6H1.3a12 12 0 000 10.8l4-3.1z" />
    <path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4A12 12 0 001.3 6.6l4 3.1A7.2 7.2 0 0112 4.8z" />
  </svg>
);
