# Rasp Films V3 staging

This branch contains the V3 static site in the repository root for GitHub Pages review. The current live `optimize-wesite` branch remains unchanged. The original live site is pinned in `archive/pre-v3-optimized-2026-09-29` and an owner-only archive Site; the older `master` branch has a separate snapshot.

The site uses plain HTML, CSS and JavaScript. Edit `index.html` and `rasp-post/index.html` for copy; `v3.css` and `post-v3.css` for current design. Images, marks and fonts are in `assets/`. Teaser MP4s in `videos/` use the original files already in this repository; the Girlfriend Deluxe cropped hover preview is in `assets/`.

Before moving this branch into the Pages source, confirm public development claims and company logo use, test on devices, remove `noindex,nofollow` from `index.html` and `rasp-post/index.html`, replace the disallow rule in `robots.txt`, and check the canonical domain against the existing `CNAME`. Preserve the old-site archive and test HTTPS, hover videos, film dialogs, email and mobile navigation after deployment.
