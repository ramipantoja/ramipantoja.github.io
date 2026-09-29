'use strict';

// Leave a direct film link in the HTML. The overlay enhances it where supported.
const watchDialog = document.querySelector('.watch-dialog');
if (watchDialog && typeof watchDialog.showModal === 'function') {
  const player = watchDialog.querySelector('#watch-player');
  const title = watchDialog.querySelector('#watch-title');
  const external = watchDialog.querySelector('.watch-external');
  const platformName = watchDialog.querySelector('#watch-platform');
  const close = watchDialog.querySelector('.watch-close');
  let opener = null;

  for (const link of document.querySelectorAll('.film-main-link[data-watch-id]')) {
    link.addEventListener('click', event => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      const { watchPlatform, watchId, watchTitle } = link.dataset;
      const source = watchPlatform === 'youtube'
        ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(watchId)}?autoplay=1&rel=0`
        : `https://player.vimeo.com/video/${encodeURIComponent(watchId)}?autoplay=1`;
      opener = link;
      title.textContent = watchTitle;
      platformName.textContent = watchPlatform === 'youtube' ? 'YouTube' : 'Vimeo';
      external.href = link.href;
      const iframe = document.createElement('iframe');
      iframe.title = `Watch ${watchTitle}`;
      iframe.src = source;
      iframe.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      player.replaceChildren(iframe);
      document.dispatchEvent(new Event('rasp:watch-open'));
      watchDialog.showModal();
      close.focus();
    });
  }

  close.addEventListener('click', () => watchDialog.close());
  watchDialog.addEventListener('click', event => {
    if (event.target === watchDialog) watchDialog.close();
  });
  watchDialog.addEventListener('close', () => {
    player.replaceChildren(); // Stop playback and unload the third-party player.
    opener?.focus();
    opener = null;
  });
}
