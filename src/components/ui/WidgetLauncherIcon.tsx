import React from 'react';
import { UploadCloud } from 'lucide-react';

export type WidgetIconType =
  | 'smile_bubble'
  | 'double_bubble'
  | 'dots_bubble'
  | 'smile_line'
  | 'custom_logo';

export interface WidgetIconOption {
  id: WidgetIconType;
  label: string;
  tooltip: string;
}

export const WIDGET_ICON_OPTIONS: WidgetIconOption[] = [
  {
    id: 'smile_bubble',
    label: 'Smile Bubble',
    tooltip: 'Classic friendly chat bubble with smile cutout (Intercom style)',
  },
  {
    id: 'double_bubble',
    label: 'Double Cards',
    tooltip: 'Overlapping conversation cards',
  },
  {
    id: 'dots_bubble',
    label: 'Chat Dots',
    tooltip: 'Chat bubble with 3 conversation dots',
  },
  {
    id: 'smile_line',
    label: 'Smile Curve',
    tooltip: 'Modern speech bubble with curved smile line',
  },
  {
    id: 'custom_logo',
    label: 'Upload / Custom',
    tooltip: 'Custom uploaded company logo or icon',
  },
];

export interface WidgetLauncherIconProps {
  type?: WidgetIconType | string;
  brandColor?: string;
  logoUrl?: string | null;
  className?: string;
  fallbackToDefault?: boolean;
}

/**
 * 1. Smile Bubble (Option 1): Rounded chat bubble with open smile cutout
 */
export function SmileBubbleIcon({
  className = 'w-6 h-6',
  color = 'currentColor',
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5 4C3.895 4 3 4.895 3 6v13c0 1.105.895 2 2 2h4.5v3.2a.8.8 0 001.36.57L15 21h8c1.105 0 2-.895 2-2V6c0-1.105-.895-2-2-2H5zm4 10.5a5 5 0 0010 0H9z"
        fill={color}
      />
    </svg>
  );
}

/**
 * 2. Double Bubble / Overlapping Cards (Option 2)
 */
export function DoubleBubbleIcon({
  className = 'w-6 h-6',
  color = 'currentColor',
  bgColor = '#7c3aed',
}: {
  className?: string;
  color?: string;
  bgColor?: string;
}) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Back bubble */}
      <path
        d="M9 4.5h11a2.5 2.5 0 012.5 2.5v7a2.5 2.5 0 01-2.5 2.5h-1v2.5a.6.6 0 01-1.02.42L15 16.5H9a2.5 2.5 0 01-2.5-2.5V7A2.5 2.5 0 019 4.5z"
        fill={color}
        opacity="0.88"
      />
      {/* Front bubble with crisp separation */}
      <path
        d="M5.5 7.5h10.5a2.5 2.5 0 012.5 2.5V17a2.5 2.5 0 01-2.5 2.5h-4.8l-3.2 2.6a.6.6 0 01-.98-.46V19.5H5.5A2.5 2.5 0 013 17v-7a2.5 2.5 0 012.5-2.5z"
        fill={color}
        stroke={bgColor}
        strokeWidth="1.2"
      />
    </svg>
  );
}

/**
 * 3. Chat Bubble with 3 Dots (Option 3)
 */
export function DotsBubbleIcon({
  className = 'w-6 h-6',
  color = 'currentColor',
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14 4C7.925 4 3 8.477 3 14c0 2.87 1.34 5.46 3.48 7.31L5.2 24.8a.7.7 0 001 .8l4.2-2c1.14.26 2.34.4 3.6.4 6.075 0 11-4.477 11-10S20.075 4 14 4zm-4.75 11.25a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm4.75 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm4.75 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"
        fill={color}
      />
    </svg>
  );
}

/**
 * 4. Chat Bubble with Smile Line (Option 4)
 */
export function SmileLineBubbleIcon({
  className = 'w-6 h-6',
  color = 'currentColor',
  cutoutColor = '#7c3aed',
}: {
  className?: string;
  color?: string;
  cutoutColor?: string;
}) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M5 4.5h16a2.5 2.5 0 012.5 2.5v10a2.5 2.5 0 01-2.5 2.5h-4.5l-3.5 2.8a.7.7 0 01-1.14-.54V19.5H5A2.5 2.5 0 012.5 17V7A2.5 2.5 0 015 4.5z"
        fill={color}
      />
      <path
        d="M8 12.2c1.5 2.2 5.5 2.4 7.2.2.4-.5 1.1-.3 1.2.2"
        stroke={cutoutColor}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Main Dynamic Launcher Icon Renderer
 */
export function WidgetLauncherIcon({
  type = 'smile_bubble',
  brandColor = '#2563eb',
  logoUrl,
  className = 'w-6 h-6',
}: WidgetLauncherIconProps) {
  // If custom logo option is chosen and an image URL is present
  if (type === 'custom_logo' && logoUrl) {
    return (
      <img
        src={logoUrl}
        alt="Widget Icon"
        className="w-full h-full object-cover rounded-full"
      />
    );
  }

  // If custom logo option is chosen but no URL uploaded yet
  if (type === 'custom_logo') {
    return <UploadCloud className={className} />;
  }

  switch (type) {
    case 'double_bubble':
      return (
        <DoubleBubbleIcon
          className={className}
          color="#ffffff"
          bgColor={brandColor}
        />
      );
    case 'dots_bubble':
      return <DotsBubbleIcon className={className} color="#ffffff" />;
    case 'smile_line':
      return (
        <SmileLineBubbleIcon
          className={className}
          color="#ffffff"
          cutoutColor={brandColor}
        />
      );
    case 'smile_bubble':
    default:
      return <SmileBubbleIcon className={className} color="#ffffff" />;
  }
}
