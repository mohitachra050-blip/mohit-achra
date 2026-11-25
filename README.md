# Mohit Achra – author site

## Writing a post (after setup)
1. Open pagescms.org, sign in with GitHub, choose this repository.
2. Journal posts → New. Fill title, date, short summary, write the post, add pictures with the image button.
3. Save. The site updates by itself in a few minutes.
Tick "Draft" to keep a post hidden until you are ready.

## One-time setup
1. Create a free GitHub account, make a new repository, upload everything from this folder.
2. Free hosting (pick one):
   - Cloudflare Pages: Create project → connect the GitHub repo → build command `node build.js`, output folder `dist`.
   - Netlify: Add new site → import from GitHub → same build command and publish folder `dist`.
3. Buy your domain, then connect it in the host's "Custom domains" section.
4. Open `site.json` and change `url` to your real domain (for example https://mohitachra.com). Google uses this.
5. Connect Pages CMS to the repository (step 1 above).

## Later
- Social preview image: put a picture in `public/images/` and set `ogImage` in `site.json` (for example "/images/cover.jpg").
- Submit `https://your-domain/sitemap.xml` in Google Search Console.
- Build locally: `node build.js` (needs Node 18+), result appears in `dist/`.
