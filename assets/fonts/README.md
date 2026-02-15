# Custom Fonts for The D.A.W.G. App

## Required Font Files

Place all the following `.ttf` files in this directory (`assets/fonts/`):

### 1. Bebas Neue (Display)
- **BebasNeue-Regular.ttf**
- Download from: https://fonts.google.com/specimen/Bebas+Neue
- Select "Regular 400" → Download

### 2. Outfit (Headings, Buttons)
- **Outfit-Regular.ttf** (400)
- **Outfit-Medium.ttf** (500)
- **Outfit-SemiBold.ttf** (600)
- **Outfit-Bold.ttf** (700)
- Download from: https://fonts.google.com/specimen/Outfit
- Select weights: 400, 500, 600, 700 → Download

### 3. DM Sans (Body Text)
- **DMSans-Regular.ttf** (400)
- **DMSans-Medium.ttf** (500)
- **DMSans-Bold.ttf** (700)
- Download from: https://fonts.google.com/specimen/DM+Sans
- Select weights: 400, 500, 700 → Download

### 4. Space Grotesk (Data, Stats)
- **SpaceGrotesk-Regular.ttf** (400)
- **SpaceGrotesk-Medium.ttf** (500)
- **SpaceGrotesk-SemiBold.ttf** (600)
- **SpaceGrotesk-Bold.ttf** (700)
- Download from: https://fonts.google.com/specimen/Space+Grotesk
- Select weights: 400, 500, 600, 700 → Download

---

## Quick Download Instructions

1. Go to Google Fonts for each font family
2. Click "Get font" or "Download family"
3. Extract the ZIP file
4. Find the `.ttf` files (usually in a `static/` folder)
5. Copy the specific weight files listed above to this directory
6. Make sure the filenames match exactly (case-sensitive)

---

## File Checklist

Once you've downloaded all fonts, this directory should contain:

```
✓ BebasNeue-Regular.ttf
✓ Outfit-Regular.ttf
✓ Outfit-Medium.ttf
✓ Outfit-SemiBold.ttf
✓ Outfit-Bold.ttf
✓ DMSans-Regular.ttf
✓ DMSans-Medium.ttf
✓ DMSans-Bold.ttf
✓ SpaceGrotesk-Regular.ttf
✓ SpaceGrotesk-Medium.ttf
✓ SpaceGrotesk-SemiBold.ttf
✓ SpaceGrotesk-Bold.ttf
```

**Total: 12 font files**

---

## After Adding Fonts

1. Restart the Metro bundler: `npx expo start --clear`
2. Reload the app
3. You should see a loading screen while fonts load
4. If fonts fail to load, check console for errors and verify filenames match exactly
