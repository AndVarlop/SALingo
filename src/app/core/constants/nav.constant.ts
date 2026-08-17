export interface NavItem {
  label: string;
  icon: string;
  routerLink: string;
}

/** Primary app navigation, shared by the sidebar (desktop) and bottom-nav (mobile). */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: '🏠', routerLink: '/dashboard' },
  { label: 'Learn', icon: '📚', routerLink: '/lessons' },
  { label: 'Review', icon: '🧠', routerLink: '/review' },
  { label: 'Vocabulary', icon: '📖', routerLink: '/vocabulary' },
  { label: 'Grammar', icon: '✏️', routerLink: '/grammar' },
  { label: 'Listening', icon: '🎧', routerLink: '/listening' },
  { label: 'Speaking', icon: '🎤', routerLink: '/speaking' },
  { label: 'Writing', icon: '📝', routerLink: '/writing' },
  { label: 'Progress', icon: '📊', routerLink: '/progress' },
  { label: 'Interview Prep', icon: '📞', routerLink: '/interview-prep' },
  { label: 'AI Tutor', icon: '🤖', routerLink: '/ai-tutor' },
  { label: 'Profile', icon: '👤', routerLink: '/profile' },
];

/** Subset shown in the mobile bottom navigation (limited real estate). */
export const MOBILE_NAV_ITEMS: NavItem[] = [
  NAV_ITEMS[0], // Dashboard
  NAV_ITEMS[1], // Learn
  NAV_ITEMS[2], // Review
  NAV_ITEMS[3], // Vocabulary
  NAV_ITEMS[11], // Profile
];
