export interface DurationOption {
  label: string;
  minutes: number;
  seconds: number;
  isRogueMode?: boolean;
}

export const DURATION_OPTIONS: DurationOption[] = [
  { label: '1 min', minutes: 1, seconds: 1 * 60 },
  { label: '5 min', minutes: 5, seconds: 5 * 60 },
  { label: '10 min', minutes: 10, seconds: 10 * 60 },
  { label: '15 min', minutes: 15, seconds: 15 * 60 },
  { label: '30 min', minutes: 30, seconds: 30 * 60 },
  { label: '60 min', minutes: 60, seconds: 60 * 60 },
  { label: '∞ Rogue', minutes: 0, seconds: -1, isRogueMode: true },
];
