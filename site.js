'use strict';
document.documentElement.classList.add('js');
const menuButton = document.querySelector('.nav-menu');
const navigation = document.querySelector('#main-nav');
if (menuButton && navigation) {
  const closeMenu = () => {
    navigation.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded','false');
  };
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded',String(open));
    navigation.classList.toggle('is-open',open);
  });
  navigation.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if(event.key === 'Escape' && navigation.classList.contains('is-open')) {
      closeMenu();
      menuButton.focus();
    }
  });
}
// Measurement hooks are local until an analytics provider is connected.
// An email click indicates intent; it is not a confirmed enquiry or booking.
document.querySelectorAll('[data-enquiry]').forEach(link => {
  link.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('rasp:enquiry-intent', {
      detail: {placement:link.dataset.enquiry,page:location.pathname}
    }));
  });
});
