# DO NOTHIN. — rules for Claude Code

## About the owner
- I am not a developer. Explain what you did and why in plain English, briefly, after every task.
- Do one task at a time. Stop and wait for my confirmation before starting the next one.
- Before any large change, commit and push to GitHub first so we can undo it.
- At the end of every session, remind me to commit and push.

## Project facts
- Expo SDK 54, React Native, TypeScript. Built with EAS. Tested on a real iPhone.
- Bundle ID com.anonymous.raw-dawg-app can NEVER change.
- App blocking uses react-native-device-activity and @kingstinct/expo-apple-targets. The four extensions live in /targets. Apple has approved Family Controls (Distribution) for all bundle IDs.
- The /patches folder holds required fixes applied by patch-package. Never delete or edit it without asking.
- Supabase client is in /lib. Design system is in src/constants/designSystem.ts. Use it, never invent new colors or fonts.
- The project lives in ~/Apps/raw-dawg-app. Never move it into Documents, Desktop, or iCloud.

## Never do these without asking me first
- Never remove, disable, or stub out Family Controls, Screen Time, or the /targets extensions for any reason, including to make the Simulator work.
- Never install, remove, or upgrade packages. Never run npm audit fix --force.
- Never change app.json, eas.json, entitlements, or anything in /targets or /ios.
- Never delete files. If something looks unused, tell me instead.

## Code rules
- Never hardcode isPro or any paywall state to true. Pro status must come from RevenueCat.
- Never hide errors or fake success. If something fails, show it and tell me.
- After changes, run npx tsc --noEmit and report any errors.

## Copy rules
- No medical claims or brain-training claims. No claims that the app improves brain function or cures addiction.
