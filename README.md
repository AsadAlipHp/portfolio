# Asad Ali — Portfolio

React + TypeScript + Vite + Tailwind. Content lives in `src/content.json`.

## Run locally
```bash
npm install --legacy-peer-deps
npm run dev
```

## Deploy on GitHub Pages
1. Create a new GitHub repo and push this folder to the `main` branch.
2. In the repo go to **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Every push to `main` builds and deploys the site to `https://<username>.github.io/<repo>/`.
   (Name the repo `<username>.github.io` to serve it from `https://<username>.github.io/`.)

## Editing content (admin dashboard)
Open the dashboard by clicking the logo 5 times, pressing **Alt+Shift+D**, or adding `#admin` to the URL.
The first password is set in `src/App.tsx` (hashed) — change it from **Dashboard → Data**.

Dashboard edits are a local draft in your browser. To publish them:
1. **Dashboard → Data → Export JSON**
2. Replace `src/content.json` with the exported file
3. Commit and push — GitHub Actions redeploys automatically.

> The dashboard password is a front-end lock only (it hides the dashboard from visitors, but the code is public). Nothing a visitor does can change what others see: the published content only changes when you push to the repo.
