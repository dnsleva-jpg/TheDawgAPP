import { formatDurationText } from './formatTime';

/**
 * Generates a shareable caption for a completed session
 * Optimized for TikTok, Instagram Reels, and Stories
 */
export function generateCaption(durationSeconds: number): string {
  const durationText = formatDurationText(durationSeconds);
  
  const captions = [
    `Just raw dawgged ${durationText} of pure nothing 🐕\n\nNo phone. No distractions. Just existing.\n\n#RawDawg #Mindfulness #DigitalDetox #MentalHealth`,
    `${durationText} of doing absolutely nothing 🧘‍♂️\n\nTried it. Highly recommend.\n\n#RawDawg #Meditation #SelfCare #Unplugged`,
    `POV: You raw dawgged ${durationText} 🐕\n\nPhone down. Mind clear. Vibes immaculate.\n\n#RawDawg #MindfulLiving #PresentMoment #InnerPeace`,
    `Challenge accepted: ${durationText} of nothing ✨\n\nHarder than it looks. Worth it.\n\n#RawDawg #Mindfulness #Challenge #MentalWellness`,
    `Raw dawgged ${durationText} and felt ✨everything✨\n\nNo scroll. No stimulation. Pure presence.\n\n#RawDawg #Mindfulness #SelfCare #DigitalDetox`,
  ];
  
  const randomCaption = captions[Math.floor(Math.random() * captions.length)];
  
  return randomCaption;
}
