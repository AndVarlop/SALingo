import { ExerciseType, SpeakingExercise } from '../../models';

export const MOCK_SPEAKING_EXERCISES: SpeakingExercise[] = [
  {
    id: 'sp-1',
    type: ExerciseType.Speaking,
    prompt: 'Practice this everyday sentence.',
    expectedSentence: 'I went to the supermarket yesterday.',
    hint: 'Past tense: "went", not "go".',
    xpReward: 15,
  },
  {
    id: 'sp-2',
    type: ExerciseType.Speaking,
    prompt: 'Practice introducing yourself.',
    expectedSentence: 'My name is Andres and I am learning English.',
    xpReward: 15,
  },
  {
    id: 'sp-3',
    type: ExerciseType.Speaking,
    prompt: 'Practice asking for help politely.',
    expectedSentence: 'Excuse me, could you help me find the train station?',
    hint: '"Could you" is a polite way to ask.',
    xpReward: 15,
  },
  {
    id: 'sp-4',
    type: ExerciseType.Speaking,
    prompt: 'Practice talking about plans.',
    expectedSentence: "I'm going to visit my family this weekend.",
    xpReward: 15,
  },
];
