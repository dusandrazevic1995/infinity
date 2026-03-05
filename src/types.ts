export interface Choice {
  text: string;
  id: string;
  type?: 'aggressive' | 'cautious' | 'mystical' | 'neutral' | 'curious';
}

export interface StorySegment {
  text: string;
  choices: Choice[];
  isEnding?: boolean;
}

export interface GameState {
  history: { story: string; choice: string }[];
  currentSegment: StorySegment | null;
  status: 'start' | 'playing' | 'loading' | 'error';
  maxSteps: number;
  language: string;
  gender: 'male' | 'female';
}
