document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.menu-btn');
  const nav = document.querySelector('.main-nav');
  if (!btn || !nav) return;

  const closeMenu = () => {
    nav.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    // Also close any open Channels dropdown
    nav.querySelectorAll('.has-dropdown.open').forEach((item) => {
      item.classList.remove('open');
      const t = item.querySelector(':scope > button, :scope > a');
      if (t) t.setAttribute('aria-expanded', 'false');
    });
  };

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    document.body.classList.toggle('menu-open', isOpen);
    if (!isOpen) closeMenu();
  });

  // Close when a real link is tapped — NOT the Channels trigger on mobile
  nav.querySelectorAll('a').forEach((a) => {
    // Channels trigger: let the dropdown handler below own it on mobile
    if (a.parentElement && a.parentElement.classList.contains('has-dropdown') && window.innerWidth <= 900) {
      return;
    }
    a.addEventListener('click', closeMenu);
  });

  // Close when tapping outside
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('open') && !nav.contains(e.target) && !btn.contains(e.target)) {
      closeMenu();
    }
  });

  // Escape closes
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  // CHANNELS dropdown on mobile — toggle .open on the PARENT, not the dropdown
  const dropdownTriggers = nav.querySelectorAll('.has-dropdown > button, .has-dropdown > a');
  dropdownTriggers.forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      if (window.innerWidth <= 900) {
        e.preventDefault();
        e.stopPropagation();
        const parent = trigger.closest('.has-dropdown');
        if (!parent) return;
        const isOpen = parent.classList.toggle('open');
        trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      }
    });
  });
});