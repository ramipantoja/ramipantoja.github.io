'use strict';

// Leave a direct film link in the HTML. The overlay enhances it where supported.
const watchDialog = document.querySelector('.watch-dialog');
if (watchDialog && typeof watchDialog.showModal === 'function') {
  const player = watchDialog.querySelector('#watch-player');
  const close = watchDialog.querySelector('.watch-close');
  let opener = null;

  for (const link of document.querySelectorAll('.film-main-link[data-watch-id], .film-main-link[data-watch-src]')) {
    link.addEventListener('click', event => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      const { watchPlatform, watchId, watchSrc, watchTitle } = link.dataset;
      opener = link;
      watchDialog.setAttribute('aria-label', `Watch ${watchTitle}`);
      let media;
      if (watchPlatform === 'mp4') {
        media = document.createElement('video');
        media.className = 'watch-video';
        media.controls = true;
        media.playsInline = true;
        media.preload = 'metadata';
        media.src = watchSrc;
        media.poster = link.querySelector('.film-image > img').src;
        media.setAttribute('aria-label', watchTitle);
      } else {
        // Do not force captions on. YouTube may still honour saved viewer preferences.
        const source = watchPlatform === 'youtube'
          ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(watchId)}?autoplay=1&rel=0&cc_load_policy=0&playsinline=1`
          : `https://player.vimeo.com/video/${encodeURIComponent(watchId)}?autoplay=1&texttrack=false`;
        media = document.createElement('iframe');
        media.title = `Watch ${watchTitle}`;
        media.src = source;
        media.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
        media.allowFullscreen = true;
        media.referrerPolicy = 'strict-origin-when-cross-origin';
      }
      player.replaceChildren(media);
      document.dispatchEvent(new Event('rasp:watch-open'));
      watchDialog.showModal();
      close.focus();
      if (watchPlatform === 'mp4') media.play().catch(() => {});
    });
  }

  close.addEventListener('click', () => watchDialog.close());
  watchDialog.addEventListener('click', event => {
    if (event.target === watchDialog) watchDialog.close();
  });
  watchDialog.addEventListener('close', () => {
    player.querySelector('video')?.pause();
    player.replaceChildren(); // Stop playback and unload the player.
    opener?.focus();
    opener = null;
  });
}
