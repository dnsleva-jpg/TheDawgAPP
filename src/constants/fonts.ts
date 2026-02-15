/**
 * The D.A.W.G. App - Custom Font Definitions
 * 
 * Font Usage Guide:
 * - display: Bebas Neue - for app title, timer, big numbers only
 * - heading: Outfit - for headings, buttons, navigation
 * - body: DM Sans - for body text, descriptions, instructions
 * - mono: Space Grotesk - for data, stats, timestamps, "CAMERA VERIFIED"
 */

export const FONTS = {
  // Bebas Neue (Display)
  display: 'BebasNeue-Regular',
  
  // Outfit (Headings, Buttons)
  heading: 'Outfit-SemiBold',
  headingMedium: 'Outfit-Medium',
  headingBold: 'Outfit-Bold',
  headingRegular: 'Outfit-Regular',
  
  // DM Sans (Body Text)
  body: 'DMSans-Regular',
  bodyMedium: 'DMSans-Medium',
  bodyBold: 'DMSans-Bold',
  
  // Space Grotesk (Data, Stats)
  mono: 'SpaceGrotesk-Regular',
  monoMedium: 'SpaceGrotesk-Medium',
  monoBold: 'SpaceGrotesk-Bold',
  monoSemiBold: 'SpaceGrotesk-SemiBold',
};

/**
 * Font file mappings for expo-font
 * Place all .ttf files in assets/fonts/
 */
export const FONT_FILES = {
  // Bebas Neue
  'BebasNeue-Regular': require('../../assets/fonts/BebasNeue-Regular.ttf'),
  
  // Outfit
  'Outfit-Regular': require('../../assets/fonts/Outfit-Regular.ttf'),
  'Outfit-Medium': require('../../assets/fonts/Outfit-Medium.ttf'),
  'Outfit-SemiBold': require('../../assets/fonts/Outfit-SemiBold.ttf'),
  'Outfit-Bold': require('../../assets/fonts/Outfit-Bold.ttf'),
  
  // DM Sans
  'DMSans-Regular': require('../../assets/fonts/DMSans-Regular.ttf'),
  'DMSans-Medium': require('../../assets/fonts/DMSans-Medium.ttf'),
  'DMSans-Bold': require('../../assets/fonts/DMSans-Bold.ttf'),
  
  // Space Grotesk
  'SpaceGrotesk-Regular': require('../../assets/fonts/SpaceGrotesk-Regular.ttf'),
  'SpaceGrotesk-Medium': require('../../assets/fonts/SpaceGrotesk-Medium.ttf'),
  'SpaceGrotesk-SemiBold': require('../../assets/fonts/SpaceGrotesk-SemiBold.ttf'),
  'SpaceGrotesk-Bold': require('../../assets/fonts/SpaceGrotesk-Bold.ttf'),
};
