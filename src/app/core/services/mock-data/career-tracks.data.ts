import { CallCategory, CefrLevel, InterviewPosition } from '../../models';

export interface CareerTrackDefinition {
  id: string;
  label: string;
  iconEmoji: string;
  description: string;
  recommendedLevel: CefrLevel;
  position: InterviewPosition;
  roleplayCategories: CallCategory[];
}

/**
 * Spec section 28: career tracks. Deliberately just *configuration* on top
 * of what already exists (InterviewPosition drives question filtering via
 * InterviewQuestionService.forPosition(); CallCategory drives roleplay
 * scenario filtering) — adding a 7th track later is one array entry, not
 * new architecture.
 */
export const CAREER_TRACKS: CareerTrackDefinition[] = [
  {
    id: 'customer-service',
    label: 'Customer Service',
    iconEmoji: '📞',
    description: 'General customer support: orders, accounts, billing questions, everyday requests.',
    recommendedLevel: CefrLevel.A2,
    position: InterviewPosition.CustomerService,
    roleplayCategories: ['Billing', 'Refund', 'Delivery', 'Account'],
  },
  {
    id: 'technical-support',
    label: 'Technical Support',
    iconEmoji: '🛠️',
    description: 'Help customers troubleshoot problems and explain technical issues clearly.',
    recommendedLevel: CefrLevel.B1,
    position: InterviewPosition.TechnicalSupport,
    roleplayCategories: ['Technical Support', 'Account'],
  },
  {
    id: 'sales',
    label: 'Sales',
    iconEmoji: '💰',
    description: 'Persuade and inform customers about products, plans, and upgrades.',
    recommendedLevel: CefrLevel.B1,
    position: InterviewPosition.Sales,
    roleplayCategories: ['Sales', 'Retention'],
  },
  {
    id: 'collections',
    label: 'Collections',
    iconEmoji: '📋',
    description: 'Handle overdue payments and billing disputes professionally and firmly.',
    recommendedLevel: CefrLevel.B1,
    position: InterviewPosition.Collections,
    roleplayCategories: ['Billing', 'Retention'],
  },
  {
    id: 'chat-support',
    label: 'Chat Support',
    iconEmoji: '💬',
    description: 'Written customer support — clear, concise, professional written English.',
    recommendedLevel: CefrLevel.A2,
    position: InterviewPosition.ChatSupport,
    roleplayCategories: ['Account', 'Billing'],
  },
  {
    id: 'back-office',
    label: 'Back Office',
    iconEmoji: '🗂️',
    description: 'Behind-the-scenes processing: less live conversation, more accuracy and process.',
    recommendedLevel: CefrLevel.B1,
    position: InterviewPosition.BackOffice,
    roleplayCategories: ['Billing', 'Account'],
  },
];
