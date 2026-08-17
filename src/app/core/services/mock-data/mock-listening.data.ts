import { ExerciseType, ListeningExercise } from '../../models';

export const MOCK_LISTENING_EXERCISES: ListeningExercise[] = [
  {
    id: 'li-1',
    type: ExerciseType.Listening,
    prompt: 'Listen and choose what you heard.',
    audioText: 'Can you pass me the salt, please?',
    options: [
      'Can you pass me the salt, please?',
      'Can you pass me the sauce, please?',
      'Can you pass me the salad, please?',
    ],
    correctOptionIndex: 0,
    xpReward: 10,
  },
  {
    id: 'li-2',
    type: ExerciseType.Listening,
    prompt: 'Listen and choose what you heard.',
    audioText: 'She has already finished her project.',
    options: [
      'She already finishes her project.',
      'She has already finished her project.',
      'She had finished her project already.',
    ],
    correctOptionIndex: 1,
    xpReward: 10,
  },
  {
    id: 'li-3',
    type: ExerciseType.Listening,
    prompt: 'Listen and choose what you heard.',
    audioText: 'The meeting was moved to next Friday.',
    options: [
      'The meeting was moved to next Friday.',
      'The meeting was moved to last Friday.',
      'The meeting was removed on Friday.',
    ],
    correctOptionIndex: 0,
    xpReward: 10,
  },
  {
    id: 'li-4',
    type: ExerciseType.Listening,
    prompt: 'Listen and choose what you heard.',
    audioText: "I haven't decided what to wear yet.",
    options: [
      "I haven't decided what to where yet.",
      "I haven't decided what to wear yet.",
      "I didn't decide what to wear yet.",
    ],
    correctOptionIndex: 1,
    xpReward: 10,
  },
  {
    id: 'li-5',
    type: ExerciseType.Listening,
    prompt: 'Listen and choose what you heard.',
    audioText: 'They are planning to travel next summer.',
    options: [
      'They are planning to travel this summer.',
      'They were planning to travel next summer.',
      'They are planning to travel next summer.',
    ],
    correctOptionIndex: 2,
    xpReward: 10,
  },
];
