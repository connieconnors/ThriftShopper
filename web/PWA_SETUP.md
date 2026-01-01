# PWA Setup for ThriftShopper

## ✅ What's Been Set Up

1. **manifest.json** - PWA manifest with app metadata
2. **Service Worker (sw.js)** - Basic caching for offline support
3. **PWARegister component** - Automatically registers the service worker
4. **Layout metadata** - Added PWA metadata to Next.js layout

## 🔲 What You Need to Add

### PWA Icons

**What are PWA icons?**  
These are app icons (like phone app icons) that appear on users' home screens when they install your PWA. They're NOT splash screens—they're the icon users tap to open your app.

**Required Icons (minimum):**
1. **`/public/icon-192.png`** - 192x192 pixels (for Android home screen)
2. **`/public/icon-512.png`** - 512x512 pixels (for Android splash screen, app stores)

**What should they look like?**
- Use your **TS logo design** (the "TS" with star from your TSLogo component)
- Background: Navy (#191970) 
- Logo: "TS" text in Playfair Display style
- Accent: Gold star/decoration (#cfb53b)
- Should be simple and recognizable at small sizes (like a phone app icon)

**How to create them:**
1. **Easy option:** Use your TS logo from the TSLogo component as a base
2. **Tool option:** [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator) (can generate from a single image)
3. **Design tool:** Create in Figma/Photoshop - square canvas, centered logo

**Note:** The app will work without icons, but users won't be able to install it to their home screen until icons are added.

## 🧪 Testing the PWA

### Local Testing

1. **Start dev server:**
   ```bash
   cd web
   npm run dev
   ```

2. **Open in browser:** http://localhost:3000

3. **Check Service Worker:**
   - Open DevTools (F12)
   - Go to **Application** tab → **Service Workers**
   - You should see your service worker registered

4. **Check Manifest:**
   - DevTools → **Application** → **Manifest**
   - Should show your manifest.json (may show icon errors if icons are missing - that's OK)

5. **Test offline mode:**
   - DevTools → **Network** tab
   - Check "Offline"
   - Refresh page - should still load (cached pages)

### Production Testing (beta.thriftshopper.com)

1. Deploy to Vercel
2. Open in Chrome/Edge on mobile or desktop
3. Look for "Install" button in address bar (only works with HTTPS)
4. On mobile Chrome: Menu → "Add to Home Screen"
5. On iOS Safari: Share button → "Add to Home Screen"

**Note:** The "Install" prompt typically only appears on HTTPS (production) or localhost. It won't work on `http://localhost:3000` in some browsers.

## 📝 Notes

- Service worker caches basic pages for offline use
- Icons are required for full PWA functionality (app won't install without them)
- Theme color matches your brand navy (#191970)
- App displays in standalone mode (no browser UI when installed)

