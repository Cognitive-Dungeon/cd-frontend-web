<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1qqZ0mp7cPN_m28SbC5pqf5Fi7GuYenpi

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Linting and Code Style (ESLint)

Use ESLint to ensure consistent code style and catch common issues.

- Run lint:
  `npm run lint`
- Auto-fix:
  `npm run lint:fix`

Notes:
- ESLint is configured for React + TypeScript.
- Build artifacts and vendor directories are ignored (`dist`, `node_modules`).
- Some console statements are allowed (warn, error). Regular `console.log` may be flagged.
