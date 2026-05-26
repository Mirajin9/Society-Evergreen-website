# Publishing on GitHub Pages

This repository is ready to publish the static prototype on GitHub Pages.

## First push

1. Create an empty repository on GitHub.
2. Push this local repository:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

3. On GitHub, open the repository settings.
4. Go to **Pages**.
5. Under **Build and deployment**, set **Source** to **GitHub Actions**.

After the first push, the included workflow deploys these static demo files:

- `index.html`
- `styles.css`
- the root `*.jsx` prototype files

## Important privacy note

The raw `uploads/` folder is intentionally ignored by Git so the original member-list document is not accidentally published. Before making the GitHub repository public, review `data.jsx` too, because the prototype data may still contain member names or other society information.

## About the Next.js app

The newer Next.js app under `app/` includes API routes and backend wiring, so it is better suited to a host like Vercel, Netlify, or a server-backed deployment. GitHub Pages is static-only, so the included Pages workflow publishes the browser-only prototype.
