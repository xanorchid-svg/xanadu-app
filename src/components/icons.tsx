type P = { size?: number; className?: string }
const base = (size = 22) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, 'aria-hidden': true as const })

export const IconCompass = ({ size, className }: P) => <svg {...base(size)} className={className}><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></svg>
export const IconCalendar = ({ size, className }: P) => <svg {...base(size)} className={className}><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>
export const IconHeart = ({ size, className, filled }: P & { filled?: boolean }) => <svg {...base(size)} fill={filled ? 'currentColor' : 'none'} className={className}><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" /></svg>
export const IconUser = ({ size, className }: P) => <svg {...base(size)} className={className}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
export const IconHome = ({ size, className }: P) => <svg {...base(size)} className={className}><path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" /></svg>
export const IconChat = ({ size, className }: P) => <svg {...base(size)} className={className}><path d="M4 5h16v11H8l-4 4z" /></svg>
export const IconPin = ({ size, className }: P) => <svg {...base(size)} className={className}><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
export const IconPlus = ({ size, className }: P) => <svg {...base(size)} strokeWidth={2} className={className}><path d="M12 5v14M5 12h14" /></svg>
export const IconBack = ({ size = 20, className }: P) => <svg {...base(size)} strokeWidth={1.8} className={className}><path d="M15 6l-6 6 6 6" /></svg>
export const IconNext = ({ size = 18, className }: P) => <svg {...base(size)} strokeWidth={1.8} className={className}><path d="M9 6l6 6-6 6" /></svg>
export const IconClose = ({ size = 18, className }: P) => <svg {...base(size)} strokeWidth={1.8} className={className}><path d="M6 6l12 12M18 6L6 18" /></svg>
export const IconSearch = ({ size = 18, className }: P) => <svg {...base(size)} strokeWidth={1.8} className={className}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
export const IconSend = ({ size = 18, className }: P) => <svg {...base(size)} strokeWidth={2} className={className}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
export const IconPeople = ({ size, className }: P) => <svg {...base(size)} strokeWidth={1.4} className={className}><circle cx="8" cy="9" r="3" /><circle cx="16" cy="9" r="3" /><path d="M3 19c.8-2.6 2.8-4 5-4s4.2 1.4 5 4M11 19c.8-2.6 2.8-4 5-4s4.2 1.4 5 4" /></svg>
export const IconPhoto = ({ size = 18, className }: P) => <svg {...base(size)} className={className}><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-8 8" /></svg>
export const IconStar = ({ size = 28, className }: P) => <svg {...base(size)} strokeWidth={1.3} className={className}><path d="M12 2v6M12 16v6M2 12h6M16 12h6" /><path d="M12 8l1.2 2.8L16 12l-2.8 1.2L12 16l-1.2-2.8L8 12l2.8-1.2z" /></svg>
export const IconChart = ({ size = 22, className }: P) => <svg {...base(size)} strokeWidth={1.4} className={className}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2" /></svg>
export const IconSettings = ({ size = 20, className }: P) => <svg {...base(size)} className={className}><circle cx="12" cy="12" r="3" /><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" /></svg>
