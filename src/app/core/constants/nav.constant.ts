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
  { label: 'Pronunciation Coach', icon: '🗣️', routerLink: '/pronunciation-coach' },
  { label: 'Writing', icon: '📝', routerLink: '/writing' },
  { label: 'Progress', icon: '📊', routerLink: '/progress' },
  { label: 'Career Path', icon: '🗺️', routerLink: '/career-path' },
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
  NAV_ITEMS[13], // Profile
];

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Full navigation, grouped for the mobile menu drawer — every top-level
 * route the desktop sidebar links to, PLUS the 3 mini-games
 * (Grammar Battle, Vocabulary Rush, Find the Mistake), which previously had
 * no nav entry anywhere and were only reachable via CTA cards on the
 * Grammar/Vocabulary hub pages. Every routerLink here is a real route from
 * app.routes.ts — nothing invented.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Learn',
    items: [
      NAV_ITEMS[1], // Learn (lessons)
      NAV_ITEMS[3], // Vocabulary
      NAV_ITEMS[4], // Grammar
      NAV_ITEMS[5], // Listening
      NAV_ITEMS[6], // Speaking
      NAV_ITEMS[7], // Pronunciation Coach
      NAV_ITEMS[8], // Writing
    ],
  },
  {
    label: 'Practice',
    items: [
      NAV_ITEMS[2], // Review
      { label: 'Grammar Battle', icon: '⚔️', routerLink: '/grammar-battle' },
      { label: 'Vocabulary Rush', icon: '⚡', routerLink: '/vocabulary-rush' },
      { label: 'Find the Mistake', icon: '🕵️', routerLink: '/find-the-mistake' },
    ],
  },
  {
    label: 'Career',
    items: [
      NAV_ITEMS[10], // Career Path
      NAV_ITEMS[11], // Interview Prep
    ],
  },
  {
    label: 'Progress',
    items: [
      NAV_ITEMS[9], // Progress
    ],
  },
  {
    label: 'Account',
    items: [
      NAV_ITEMS[12], // AI Tutor
      NAV_ITEMS[13], // Profile
    ],
  },
];
