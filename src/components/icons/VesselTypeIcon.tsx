interface VesselTypeIconProps {
  type: 'FISHING_BOAT' | 'ZODIAC' | 'COVERED_VESSEL';
  className?: string;
}

export function VesselTypeIcon({ type, className = "w-8 h-8" }: VesselTypeIconProps) {
  const iconClass = `${className} text-current`;

  switch (type) {
    case 'FISHING_BOAT':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15s4-1 9-1 9 1 9 1v-2c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8V4m0 0l-2 2m2-2l2 2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h8" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 16l1.5 3h9l1.5-3" />
        </svg>
      );
    
    case 'ZODIAC':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 18c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16c0-2.2 1.8-4 4-4h8c2.2 0 4 1.8 4 4" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8V6m0 0l-1.5 1.5M12 6l1.5 1.5" />
          <circle cx="7" cy="18" r="1" strokeWidth={2} />
          <circle cx="17" cy="18" r="1" strokeWidth={2} />
        </svg>
      );
    
    case 'COVERED_VESSEL':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15s4-1 9-1 9 1 9 1v-2c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11h14c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5V3m0 0l-2 2m2-2l2 2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 16l1.5 3h9l1.5-3" />
        </svg>
      );
    
    default:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12c0 1.657-4.03 3-9 3s-9-1.343-9-3m18 0c0 1.657-4.03 3-9 3s-9-1.343-9-3m18 0V9c0-1.657-4.03-3-9-3S3 7.343 3 9v3m18 0V15" />
        </svg>
      );
  }
}