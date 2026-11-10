document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.menu-btn');
  const nav = document.querySelector('.main-nav');
  if (!btn || !nav) return;

  const closeMenu = () => {
    nav.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  };

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    document.body.classList.toggle('menu-open', isOpen);
  });

  // Close when a link is tapped
  nav.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', closeMenu);
  });

  // Close when tapping outside
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('open') && !nav.contains(e.target) && !btn.contains(e.target)) {
      closeMenu();
    }
  });

  // CHANNELS dropdown on mobile
  const dropdownBtn = nav.querySelector('.has-dropdown > button, .has-dropdown > a');
  const dropdown = nav.querySelector('.has-dropdown .dropdown');
  if (dropdownBtn && dropdown) {
    dropdownBtn.addEventListener('click', (e) => {
      if (window.innerWidth <= 900) {
        e.preventDefault();
        dropdown.classList.toggle('open');
      }
    });
  }
});