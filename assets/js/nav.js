/* MIAMIX mobile menu + dropdown. */
(function () {
    'use strict';
    var btn = document.getElementById('mobileMenuBtn');
    var menu = document.getElementById('navMenu');
    var dropdown = document.querySelector('.nav-item.dropdown');

    if (btn && menu) {
        btn.addEventListener('click', function () {
            var open = menu.classList.toggle('active');
            btn.innerHTML = open ? '✕' : '☰';
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            if (!open && dropdown) dropdown.classList.remove('mobile-open');
        });
    }

    if (dropdown) {
        dropdown.addEventListener('click', function (e) {
            // On mobile, tapping "CHANNELS" toggles the list; tapping a link just navigates.
            if (window.innerWidth <= 900 && e.target.tagName !== 'A') {
                e.preventDefault();
                dropdown.classList.toggle('mobile-open');
            }
        });
    }
})();
