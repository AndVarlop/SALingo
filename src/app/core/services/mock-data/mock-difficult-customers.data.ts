export interface DifficultCustomerTip {
  id: string;
  situation: string;
  avoid: string;
  useInstead: string;
}

export const MOCK_DIFFICULT_CUSTOMER_TIPS: DifficultCustomerTip[] = [
  {
    id: 'dc-angry',
    situation: 'Angry customer',
    avoid: '"Calm down."',
    useInstead: '"I understand how frustrating this must be."',
  },
  {
    id: 'dc-yelling',
    situation: 'Customer yelling',
    avoid: '"Stop shouting at me."',
    useInstead: '"I want to help you — let\'s work through this together."',
  },
  {
    id: 'dc-refund',
    situation: 'Customer demanding a refund',
    avoid: '"I can\'t do that."',
    useInstead: '"Let me see what options are available for you."',
  },
  {
    id: 'dc-threat',
    situation: 'Customer threatening to complain',
    avoid: '"Go ahead, do what you want."',
    useInstead: '"I want to make this right for you — let\'s find a solution."',
  },
  {
    id: 'dc-confused',
    situation: "Customer doesn't understand the process",
    avoid: '"I already explained this."',
    useInstead: '"Let me explain it a different way."',
  },
  {
    id: 'dc-interrupt',
    situation: 'Customer keeps interrupting',
    avoid: '"Let me finish!"',
    useInstead: '"I want to make sure I answer everything — may I finish this point?"',
  },
  {
    id: 'dc-supervisor',
    situation: 'Customer wants a supervisor',
    avoid: '"You don\'t need a supervisor for this."',
    useInstead: '"Of course — let me connect you, and I\'ll share the details so you don\'t have to repeat yourself."',
  },
  {
    id: 'dc-waiting',
    situation: 'Customer has been waiting too long',
    avoid: '"That\'s not my fault."',
    useInstead: '"Thank you for your patience — I\'ll do my best to resolve this quickly."',
  },
];
