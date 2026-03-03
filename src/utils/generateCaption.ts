import { formatDurationText } from './formatTime';

/**
 * Generates a shareable caption for a completed session
 * Optimized for TikTok, Instagram Reels, and Stories
 */
export function generateCaption(durationSeconds: number): string {
  const durationText = formatDurationText(durationSeconds);
  
  const captions = [
    `Just did NOTHIN for ${durationText} 🧘\n\nNo phone. No distractions. Just existing.\n\n#DoNothin #Mindfulness #DigitalDetox #MentalHealth`,
    `${durationText} of doing absolutely nothing 🧘‍♂️\n\nTried it. Highly recommend.\n\n#DoNothin #Meditation #SelfCare #Unplugged`,
    `POV: You did NOTHIN for ${durationText} 🧘\n\nPhone down. Mind clear. Vibes immaculate.\n\n#DoNothin #MindfulLiving #PresentMoment #InnerPeace`,
    `Challenge accepted: ${durationText} of nothing ✨\n\nHarder than it looks. Worth it.\n\n#DoNothin #Mindfulness #Challenge #MentalWellness`,
    `Did NOTHIN for ${durationText} and felt ✨everything✨\n\nNo scroll. No stimulation. Pure presence.\n\n#DoNothin #Mindfulness #SelfCare #DigitalDetox`,
  ];
  
  const randomCaption = captions[Math.floor(Math.random() * captions.length)];
  
  return randomCaption;
}
