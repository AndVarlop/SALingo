import { CefrLevel, ExerciseType, MultipleChoiceExercise } from '../../models';

export interface PlacementQuestion {
  exercise: MultipleChoiceExercise;
  level: CefrLevel;
}

export const MOCK_PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  // A1
  {
    level: CefrLevel.A1,
    exercise: { id: 'pt-1', type: ExerciseType.MultipleChoice, prompt: 'She ___ a teacher.', options: ['am', 'is', 'are', 'be'], correctOptionIndex: 1, xpReward: 5 },
  },
  {
    level: CefrLevel.A1,
    exercise: { id: 'pt-2', type: ExerciseType.MultipleChoice, prompt: 'What does "apple" mean?', options: ['Manzana', 'Casa', 'Perro', 'Agua'], correctOptionIndex: 0, xpReward: 5 },
  },
  {
    level: CefrLevel.A1,
    exercise: { id: 'pt-3', type: ExerciseType.MultipleChoice, prompt: 'They ___ from Canada.', options: ['am', 'is', 'are', 'was'], correctOptionIndex: 2, xpReward: 5 },
  },
  // A2
  {
    level: CefrLevel.A2,
    exercise: { id: 'pt-4', type: ExerciseType.MultipleChoice, prompt: 'I ___ to the supermarket yesterday.', options: ['go', 'goes', 'went', 'going'], correctOptionIndex: 2, xpReward: 5 },
  },
  {
    level: CefrLevel.A2,
    exercise: { id: 'pt-5', type: ExerciseType.MultipleChoice, prompt: 'This phone is ___ than that one.', options: ['expensive', 'more expensive', 'expensiver', 'most expensive'], correctOptionIndex: 1, xpReward: 5 },
  },
  {
    level: CefrLevel.A2,
    exercise: { id: 'pt-6', type: ExerciseType.MultipleChoice, prompt: 'Look! It ___ outside.', options: ['rain', 'rains', 'is raining', 'rained'], correctOptionIndex: 2, xpReward: 5 },
  },
  // B1
  {
    level: CefrLevel.B1,
    exercise: { id: 'pt-7', type: ExerciseType.MultipleChoice, prompt: 'I ___ that movie already.', options: ['see', 'saw', 'have seen', 'seeing'], correctOptionIndex: 2, xpReward: 5 },
  },
  {
    level: CefrLevel.B1,
    exercise: { id: 'pt-8', type: ExerciseType.MultipleChoice, prompt: 'If it rains, I ___ home.', options: ['stay', 'will stay', 'stayed', 'staying'], correctOptionIndex: 1, xpReward: 5 },
  },
  {
    level: CefrLevel.B1,
    exercise: { id: 'pt-9', type: ExerciseType.MultipleChoice, prompt: 'Choose the correct passive sentence.', options: ['The cake was baked by my mom.', 'The cake was bake by my mom.', 'The cake baked was by my mom.', 'The cake is baked was my mom.'], correctOptionIndex: 0, xpReward: 5 },
  },
  // B2
  {
    level: CefrLevel.B2,
    exercise: { id: 'pt-10', type: ExerciseType.MultipleChoice, prompt: 'Tom said: "I am busy." Reported: Tom said he ___ busy.', options: ['is', 'was', 'busy', 'be'], correctOptionIndex: 1, xpReward: 5 },
  },
  {
    level: CefrLevel.B2,
    exercise: { id: 'pt-11', type: ExerciseType.MultipleChoice, prompt: 'By next year, she ___ here for a decade.', options: ['will work', 'will have worked', 'works', 'worked'], correctOptionIndex: 1, xpReward: 5 },
  },
  {
    level: CefrLevel.B2,
    exercise: { id: 'pt-12', type: ExerciseType.MultipleChoice, prompt: 'He speaks English ___ than his brother.', options: ['fluent', 'more fluently', 'fluentlier', 'most fluently'], correctOptionIndex: 1, xpReward: 5 },
  },
  // C1
  {
    level: CefrLevel.C1,
    exercise: { id: 'pt-13', type: ExerciseType.MultipleChoice, prompt: 'Choose the sentence with correct inversion: "Never ___ seen such a mess."', options: ['I have', 'have I', 'I did', 'did I have'], correctOptionIndex: 1, xpReward: 5 },
  },
  {
    level: CefrLevel.C1,
    exercise: { id: 'pt-14', type: ExerciseType.MultipleChoice, prompt: 'Had I known about the meeting, I ___ attended.', options: ['would', 'would have', 'will have', 'had'], correctOptionIndex: 1, xpReward: 5 },
  },
  {
    level: CefrLevel.C1,
    exercise: { id: 'pt-15', type: ExerciseType.MultipleChoice, prompt: 'The proposal, ___ was rejected, took months to prepare.', options: ['that', 'which', 'who', 'what'], correctOptionIndex: 1, xpReward: 5 },
  },
];
