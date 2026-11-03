# KAGE DRIFT // 影ドリフト (Production Edition)

A high-octane 3D anime-cyberpunk drift racing game built with **Three.js**, **React 18**, **Tailwind CSS**, and **Vite**, featuring procedural Eurobeat/Synthwave audio, JDM widebody tuning, and an interactive Free-to-Play progression system.

---

## 🚀 Publishing & Sharing with Your Server / Community

Yes! GitHub makes sharing **KAGE DRIFT** completely free, permanent, and accessible by link on any phone, tablet, or PC without needing a dedicated server.

### Option A: Free Permanent Hosting via GitHub Pages (Recommended)

1. **Initialize Git & Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: KAGE DRIFT Production"
   git branch -M main
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git
   git push -u origin main
   ```
2. **Enable GitHub Pages**:
   - Go to your repository on GitHub.
   - Click **Settings** ➔ **Pages** (under Code and automation).
   - Under **Build and deployment** ➔ **Source**, select **GitHub Actions**.
3. **Done!**:
   - The included `.github/workflows/deploy.yml` workflow will automatically build and deploy the game.
   - Your live shareable link will be:
     ```
     https://<YOUR_GITHUB_USERNAME>.github.io/<YOUR_REPO_NAME>/
     ```
   - Share this link in your Discord server, WhatsApp, or Twitter—anyone can click and play instantly in their browser!

### Option B: 1-Click Free Hosting on Vercel or Netlify

1. Push your code to GitHub.
2. Go to [vercel.com](https://vercel.com) (or [netlify.com](https://netlify.com)).
3. Click **Add New Project** ➔ Select your `kage-drift` repository.
4. Framework preset: **Vite** (detected automatically).
5. Click **Deploy**. In ~30 seconds you get a custom URL like `https://kage-drift.vercel.app`!

---

## 🎮 Controls

### Desktop Keyboard
| Key | Function |
| :--- | :--- |
| **`W` / `↑`** | Accelerate Straight Forward |
| **`S` / `↓`** | Brake / Reverse Straight Backward |
| **`A` / `←`** | Steer Left (Speed-responsive) |
| **`D` / `→`** | Steer Right (Speed-responsive) |
| **`SPACE`** | Handbrake (Hold while steering at speed to initiate drift) |
| **`SHIFT`** | N₂O Hyper Boost |
| **`C`** | Cycle Camera (Dynamic Chase ➔ Far ➔ Hood View) |
| **`R`** | Track Centerline Quick Reset |

### Mobile & Touch Gamepad
- **Left Thumb**: Responsive `◀` / `▶` steering buttons.
- **Right Thumb**: Ergonomic `▲ GAS`, `▼ BRK`, `DRIFT`, and `N2O` action pedals.
- **HUD Controls**: Centered tachometer, top-right interactive minimap, audio mute toggle, and music track selector.

---

## ⚡ Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev

# 3. Compile optimized production build
npm run build

# 4. Preview local production build
npm run preview
```
