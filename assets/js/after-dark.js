/* After Dark gallery: a revolving 3D carousel + fullscreen lightbox.
   Photos sit on a ring; the ring keeps turning in one direction and wraps forever.
   Photos come from the <li> items in #adRing (img + data-caption), so adding one means adding one <li>.
   Click the FRONT (active) photo — or "View fullscreen" — to open it fullscreen.
   Click a non-front photo to bring it to the front first.
   Without JavaScript (or with reduced motion) the same list is a plain swipeable row. */
(function () {
    'use strict';

    var scene = document.getElementById('adScene');
    var ring = document.getElementById('adRing');
    if (!scene || !ring) return;

    var items = Array.prototype.slice.call(ring.children);
    var n = items.length;
    if (n < 3) return;

    var captionEl = document.getElementById('adCaption');
    var countEl = document.getElementById('adCount');
    var dotsEl = document.getElementById('adDots');
    var pauseBtn = document.getElementById('adPause');
    var fullscreenBtn = document.getElementById('adFullscreenBtn');
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var INTERVAL = 3800;
    var step = 360 / n;
    var rot = 0;
    var playing = !reduceMotion;
    var held = false;
    var timer = null;
    var radius = 300;

    /* ---------- lightbox ---------- */
    var lightbox = document.getElementById('adLightbox');
    var lbImg = document.getElementById('adLightboxImg');
    var lbCaption = document.getElementById('adLightboxCaption');
    var lbCount = document.getElementById('adLightboxCount');
    var lbIndex = 0;
    var lbOpen = false;
    var lastFocused = null;

    function pad(v) { return (v < 10 ? '0' : '') + v; }
    function active() { return ((rot % n) + n) % n; }

    function measure() {
        var w = items[0].offsetWidth || 340;
        radius = Math.round((w / 2) / Math.tan(Math.PI / n) * 1.18);
        items.forEach(function (li, i) {
            li.style.transform = 'rotateY(' + (i * step) + 'deg) translateZ(' + radius + 'px)';
        });
        scene.style.setProperty('--ad-depth', radius + 'px');
    }

    function render() {
        ring.style.transform = 'translateZ(' + (-radius) + 'px) rotateY(' + (-rot * step) + 'deg)';
        var a = active();
        items.forEach(function (li, i) {
            var d = Math.abs(i - a); d = Math.min(d, n - d);
            li.classList.toggle('is-active', d === 0);
            li.style.opacity = d === 0 ? '1' : d === 1 ? '.72' : d === 2 ? '.38' : '.18';
            li.setAttribute('aria-hidden', d === 0 ? 'false' : 'true');
        });
        if (captionEl) captionEl.textContent = items[a].getAttribute('data-caption') || '';
        if (countEl) countEl.textContent = pad(a + 1) + ' / ' + pad(n);
        var dots = dotsEl.children;
        for (var k = 0; k < dots.length; k++) dots[k].classList.toggle('active', k === a);
    }

    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function start() {
        stop();
        if (playing && !held && !lbOpen) timer = setInterval(function () { rot += 1; render(); }, INTERVAL);
    }
    function turn(by) { rot += by; render(); start(); }
    function goTo(i) {
        var delta = i - active();
        if (delta > n / 2) delta -= n;
        if (delta < -n / 2) delta += n;
        turn(delta);
    }

    function lbRender() {
        var li = items[lbIndex];
        var img = li.querySelector('img');
        if (lbImg && img) {
            lbImg.src = img.getAttribute('src');
            lbImg.alt = img.getAttribute('alt') || '';
        }
        if (lbCaption) lbCaption.textContent = li.getAttribute('data-caption') || '';
        if (lbCount) lbCount.textContent = pad(lbIndex + 1) + ' / ' + pad(n);
    }
    function openLightbox(i) {
        lbIndex = (typeof i === 'number') ? i : active();
        lbOpen = true;
        lastFocused = document.activeElement;
        lbRender();
        if (lightbox) {
            lightbox.hidden = false;
            document.body.style.overflow = 'hidden';
            var closeBtn = document.getElementById('adLightboxClose');
            if (closeBtn) closeBtn.focus();
        }
        stop();
    }
    function closeLightbox() {
        lbOpen = false;
        if (lightbox) lightbox.hidden = true;
        document.body.style.overflow = '';
        if (lastFocused && lastFocused.focus) lastFocused.focus();
        start();
    }
    function lbStep(by) {
        lbIndex = ((lbIndex + by) % n + n) % n;
        lbRender();
    }

    /* build dots, wire clicks: front photo -> fullscreen, others -> bring to front */
    items.forEach(function (li, i) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', 'Show photo ' + (i + 1) + ' of ' + n);
        dot.addEventListener('click', function () { goTo(i); });
        dotsEl.appendChild(dot);
        li.setAttribute('role', 'group');
        li.setAttribute('aria-roledescription', 'slide');
        li.setAttribute('aria-label', (i + 1) + ' of ' + n + ' — click to view fullscreen');
        li.addEventListener('click', function () {
            if (li.classList.contains('is-active')) openLightbox(i);
            else goTo(i);
        });
    });

    document.getElementById('adPrev').addEventListener('click', function () { turn(-1); });
    document.getElementById('adNext').addEventListener('click', function () { turn(1); });

    function syncPause() {
        pauseBtn.textContent = playing ? 'Pause' : 'Play';
        pauseBtn.setAttribute('aria-pressed', playing ? 'false' : 'true');
    }
    pauseBtn.addEventListener('click', function () { playing = !playing; syncPause(); start(); });
    if (fullscreenBtn) fullscreenBtn.addEventListener('click', function () { openLightbox(active()); });

    /* lightbox controls */
    var lbClose = document.getElementById('adLightboxClose');
    var lbPrev = document.getElementById('adLightboxPrev');
    var lbNext = document.getElementById('adLightboxNext');
    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    if (lbPrev) lbPrev.addEventListener('click', function (e) { e.stopPropagation(); lbStep(-1); });
    if (lbNext) lbNext.addEventListener('click', function (e) { e.stopPropagation(); lbStep(1); });
    if (lightbox) lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox) closeLightbox();
    });

    scene.addEventListener('mouseenter', function () { held = true; stop(); });
    scene.addEventListener('mouseleave', function () { held = false; start(); });
    scene.addEventListener('focusin', function () { held = true; stop(); });
    scene.addEventListener('focusout', function () { held = false; start(); });

    /* keys: Esc closes lightbox; arrows browse lightbox when open, carousel otherwise */
    document.addEventListener('keydown', function (e) {
        if (lbOpen) {
            if (e.key === 'Escape') { e.preventDefault(); closeLightbox(); }
            if (e.key === 'ArrowRight') { e.preventDefault(); lbStep(1); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); lbStep(-1); }
            return;
        }
        if (document.activeElement === scene || scene.contains(document.activeElement)) {
            if (e.key === 'ArrowRight') { e.preventDefault(); turn(1); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); turn(-1); }
            if (e.key === 'Enter') { e.preventDefault(); openLightbox(active()); }
        }
    });
    scene.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && document.activeElement && document.activeElement.tagName === 'LI') {
            e.preventDefault(); openLightbox(active());
        }
    });

    /* drag or swipe to spin — ignore if it was a tap (tap = click opens lightbox) */
    var x0 = null, moved = false;
    scene.addEventListener('pointerdown', function (e) { x0 = e.clientX; moved = false; });
    scene.addEventListener('pointermove', function (e) {
        if (x0 !== null && Math.abs(e.clientX - x0) > 8) moved = true;
    });
    scene.addEventListener('pointerup', function (e) {
        if (x0 === null) return;
        var dx = e.clientX - x0; x0 = null;
        if (Math.abs(dx) > 40) turn(dx < 0 ? 1 : -1);
    });
    scene.addEventListener('pointercancel', function () { x0 = null; });

    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });

    var resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () { measure(); render(); }, 120);
    });

    scene.classList.add('is-3d');
    measure();
    render();
    syncPause();
    start();
})();
