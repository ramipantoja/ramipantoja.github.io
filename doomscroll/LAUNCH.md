# DOOM SCROLL launch

This folder is served by the existing Rasp Films GitHub Pages site. URL: https://raspfilms.com/doomscroll/ (GitHub Pages redirects the address without its trailing slash). Game: https://raspfilms.com/doomscroll/play/.

Merge the draft launch PR into optimize-wesite when ready. It adds this folder and a sitemap entry; the existing domain and homepage do not need a hosting change. This is plain static HTML/CSS/JS, with relative assets and a relative play/ game link. No environment variables, package installation or build step are required.

The game bundled here is source commit 90d4952d92cf4c3e0a700ef6a9681fd17dcce8a1 from the current Night One project. Future changes to the separate game project need to be copied into play/ as a new update.

Checks: animated feed and earlier Celtic reveal, thumb withdrawal order, pause/replay/skip/reduced motion, asset resolution from both subpaths, JS syntax. Browser visual testing was unavailable during preparation. After merge, verify the two HTTPS routes, mobile playback, game audio and fullscreen on a real phone.
