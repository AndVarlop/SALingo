export interface StarStep {
  letter: string;
  word: string;
  meaning: string;
  example: string;
}

export const STAR_STEPS: StarStep[] = [
  {
    letter: 'S',
    word: 'Situation',
    meaning: 'Set the scene. When and where did this happen?',
    example: 'A customer called very upset because they were charged twice for the same order.',
  },
  {
    letter: 'T',
    word: 'Task',
    meaning: 'What did you need to do?',
    example: 'I needed to calm the situation and find out why the charge happened twice.',
  },
  {
    letter: 'A',
    word: 'Action',
    meaning: 'What did you actually do?',
    example: 'I apologized, checked the account, found a system error, and explained it clearly.',
  },
  {
    letter: 'R',
    word: 'Result',
    meaning: 'What happened at the end?',
    example: 'The extra charge was refunded within a day, and the customer thanked me before hanging up.',
  },
];

export const NO_EXPERIENCE_SOURCES = [
  'School or university group projects',
  'Volunteer work',
  'Helping customers in any part-time job (even outside call centers)',
  'Sales or cashier experience',
  'Team sports or clubs (shows teamwork)',
  'Helping family members or friends solve problems',
];

export const PRE_INTERVIEW_CHECKLIST = [
  'Research the company (what they do, who their customers are)',
  'Review the job description again',
  'Prepare your 30-second introduction',
  'Practice the most common questions out loud, not just in your head',
  'Check your microphone',
  'Check your camera (if it\'s a video interview)',
  'Find a quiet place with good lighting',
  'Dress appropriately, even for a phone interview',
  'Have a copy of your resume nearby',
  'Test your internet connection',
];

export const CANDIDATE_QUESTIONS = {
  good: [
    'What does a typical day look like in this position?',
    'What kind of training do you provide for new employees?',
    'What are the next steps in the hiring process?',
    'What does success look like in this role after the first 90 days?',
    'What do you enjoy most about working here?',
  ],
  avoid: [
    'How much does this job pay? (usually better to wait until it comes up)',
    'Can I work from home whenever I want?',
    'How soon can I take vacation?',
    'Any question you could easily find the answer to on the company website',
  ],
};
