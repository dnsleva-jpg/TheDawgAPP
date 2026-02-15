import { formatDurationText } from './formatTime';

/**
 * Generates a shareable caption for a completed session
 * Optimized for TikTok, Instagram Reels, and Stories
 */
export function generateCaption(durationSeconds: number): string {
  const durationText = formatDurationText(durationSeconds);
  
  const captions = [
    `Just DAWG'd ${durationText} of pure nothing 🐕\n\nNo phone. No distractions. Just existing.\n\n#DAWG #Mindfulness #DigitalDetox #MentalHealth`,
    `${durationText} of doing absolutely nothing 🧘‍♂️\n\nTried it. Highly recommend.\n\n#DAWG #Meditation #SelfCare #Unplugged`,
    `POV: You DAWG'd ${durationText} 🐕\n\nPhone down. Mind clear. Vibes immaculate.\n\n#DAWG #MindfulLiving #PresentMoment #InnerPeace`,
    `Challenge accepted: ${durationText} of nothing ✨\n\nHarder than it looks. Worth it.\n\n#DAWG #Mindfulness #Challenge #MentalWellness`,
    `DAWG'd ${durationText} and felt ✨everything✨\n\nNo scroll. No stimulation. Pure presence.\n\n#DAWG #Mindfulness #SelfCare #DigitalDetox`,
  ];
  
  const randomCaption = captions[Math.floor(Math.random() * captions.length)];
  
  return randomCaption;
}
