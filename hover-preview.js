'use strict';

// The still holds until the muted teaser has a frame ready to show.
const motionAllowed = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
const previewVideos = [...document.querySelectorAll('.film-image .film-preview')];
const controllers = [];

for (const video of previewVideos) {
  const image = video.closest('.film-image');
  const link = image.closest('.film-main-link');
  let hovered = false;
  let generation = 0;
  let intentTimer;
  let resetTimer;

  const reset = () => {
    if (video.readyState > 0) video.currentTime = 0;
  };

  const stop = (immediate = false) => {
    hovered = false;
    generation++;
    clearTimeout(intentTimer);
    clearTimeout(resetTimer);
    video.pause(); // Preserve the last frame throughout the fade out.
    image.classList.remove('is-preview-playing');
    if (immediate) reset();
    else resetTimer = setTimeout(reset, 400);
  };

  const revealWhenReady = () => {
    const attempt = generation;
    const reveal = () => {
      if (generation !== attempt || !hovered || !motionAllowed.matches || !link.matches(':hover')) return;
      image.classList.add('is-preview-playing');
    };
    if (typeof video.requestVideoFrameCallback === 'function') {
      video.requestVideoFrameCallback(reveal);
    } else if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      requestAnimationFrame(reveal);
    }
  };

  link.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse' || !motionAllowed.matches) return;
    hovered = true;
    generation++;
    clearTimeout(resetTimer);
    clearTimeout(intentTimer);
    intentTimer = setTimeout(() => {
      if (!hovered || !motionAllowed.matches) return;
      const attempt = generation;
      if (!video.getAttribute('src')) {
        video.src = video.dataset.src;
        video.load();
      }
      video.play().catch(() => {
        if (generation === attempt) stop(true);
      });
    }, 150);
  });

  link.addEventListener('pointerleave', () => stop());
  video.addEventListener('playing', revealWhenReady);
  video.addEventListener('error', () => stop(true));
  controllers.push(stop);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) controllers.forEach(stop => stop(true));
});
document.addEventListener('rasp:watch-open', () => controllers.forEach(stop => stop(true)));
window.addEventListener('pagehide', () => controllers.forEach(stop => stop(true)));
if (typeof motionAllowed.addEventListener === 'function') {
  motionAllowed.addEventListener('change', () => {
    if (!motionAllowed.matches) controllers.forEach(stop => stop(true));
  });
}
