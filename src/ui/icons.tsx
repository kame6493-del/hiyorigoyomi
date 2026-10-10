import type { ReactNode } from 'react';
/** 線の絵記号(見本のデザインシステムの「アイコン例」に合わせた細めの線)と、切り出した水彩の絵 */
import { artUrl } from '../domain/catalog';

type P = { size?: number };
const svg = (size: number, children: ReactNode, sw = 1.8) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export const BackIcon = ({ size = 24 }: P) => svg(size, <path d="M20 12H5M11 5l-7 7 7 7" />, 2);
export const ChevronL = ({ size = 20 }: P) => svg(size, <path d="M14.5 5.5 8 12l6.5 6.5" />, 2.2);
export const ChevronR = ({ size = 20 }: P) => svg(size, <path d="M9.5 5.5 16 12l-6.5 6.5" />, 2.2);
export const CloseIcon = ({ size = 20 }: P) => svg(size, <path d="M6 6l12 12M18 6 6 18" />, 2);
export const SearchIcon = ({ size = 22 }: P) =>
  svg(
    size,
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5 21 21" />
    </>,
    2,
  );
export const GearIcon = ({ size = 24 }: P) =>
  svg(
    size,
    <>
      <circle cx="12" cy="12" r="3.1" />
      <path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.5A7.6 7.6 0 0 0 7 6.5l-2.4-1-2 3.4 2 1.6a7.6 7.6 0 0 0 0 3l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 2.6 1.5l.4 2.5h4l.4-2.5a7.6 7.6 0 0 0 2.6-1.5l2.4 1 2-3.4z" />
    </>,
    1.6,
  );
export const CalendarIcon = ({ size = 24 }: P) =>
  svg(
    size,
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
      <path d="M7.5 13h2M11 13h2M14.5 13h2M7.5 16.5h2M11 16.5h2" strokeWidth="1.6" />
    </>,
  );
export const StampIcon = ({ size = 22 }: P) =>
  svg(
    size,
    <>
      <path d="M9.5 11.5V9a2.5 2.5 0 1 1 5 0v2.5" />
      <path d="M5 15.5c0-2 1.5-4 4-4h6c2.5 0 4 2 4 4v1H5z" />
      <path d="M4.5 20h15" />
    </>,
  );
export const DotsIcon = ({ size = 24 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="5.5" cy="12" r="1.7" />
    <circle cx="12" cy="12" r="1.7" />
    <circle cx="18.5" cy="12" r="1.7" />
  </svg>
);
export const TrashIcon = ({ size = 22 }: P) => svg(size, <path d="M4.5 6.5h15M9.5 6.5V4.5h5v2M6.5 6.5l1 13.5h9l1-13.5M10 10.5v6M14 10.5v6" />);
export const BellIcon = ({ size = 22 }: P) => svg(size, <path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 2h-15zM10 20.5a2.2 2.2 0 0 0 4 0" />);
export const PaletteIcon = ({ size = 22 }: P) =>
  svg(
    size,
    <>
      <path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.3 0 1.8-1 1.3-2-.6-1.2.2-2.5 1.6-2.5H17a3.5 3.5 0 0 0 3.5-3.5c0-5-3.8-9-8.5-9z" />
      <circle cx="7.8" cy="11" r="1" />
      <circle cx="10.5" cy="7.5" r="1" />
      <circle cx="15" cy="8" r="1" />
    </>,
  );
export const RepeatIcon = ({ size = 22 }: P) => svg(size, <path d="M4.5 11a7 7 0 0 1 12.5-4.3L19 9M19.5 13a7 7 0 0 1-12.5 4.3L5 15M19 4.5V9h-4.5M5 19.5V15h4.5" />);
export const CopyIcon = ({ size = 22 }: P) =>
  svg(
    size,
    <>
      <rect x="8" y="8" width="11.5" height="12.5" rx="2" />
      <path d="M16 8V5.5A2 2 0 0 0 14 3.5H6.5a2 2 0 0 0-2 2V15a2 2 0 0 0 2 2H8" />
    </>,
  );
export const ClockIcon = ({ size = 22 }: P) =>
  svg(
    size,
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>,
  );
export const PencilIcon = ({ size = 20 }: P) => svg(size, <path d="M4.5 19.5l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3l-10 10zM13.5 7l3 3" />);
export const CheckIcon = ({ size = 16 }: P) => svg(size, <path d="M5 12.5l4.5 4.5L19 7.5" />, 2.6);
export const PlusIcon = ({ size = 26 }: P) => svg(size, <path d="M12 5v14M5 12h14" />, 2.6);

/** 切り出した水彩の絵(public/art/*.webp) */
export function Art({ name, className, alt = '' }: { name: string; className?: string; alt?: string }) {
  return <img className={`art ${className ?? ''}`} src={artUrl(name)} alt={alt} draggable={false} aria-hidden={alt ? undefined : true} />;
}
