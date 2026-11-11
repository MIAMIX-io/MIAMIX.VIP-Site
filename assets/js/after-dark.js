/* After Dark gallery: a revolving 3D carousel.
   Photos sit on a ring; the ring keeps turning in one direction and wraps forever.
   Photos come from the <li> items in #adRing (img + data-caption), so adding one means adding one <li>.
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
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var INTERVAL = 3800;
    var step = 360 / n;
    var rot = 0;                         // keeps counting up or down, so the ring never "rewinds"
    var playing = !reduceMotion;
    var held = false;                    // hovering or focused
    var timer = null;
    var radius = 300;

    function pad(v) { return (v < 10 ? '0' : '') + v; }
    function active() { return ((rot % n) + n) % n; }

    function measure() {
        var w = items[0].offsetWidth || 260;
        // tight-fit radius for n flat cards, plus a little air between them
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
            var d = Math.abs(i - a); d = Math.min(d, n - d);          // distance around the ring
            li.classList.toggle('is-active', d === 0);
            li.style.opacity = d === 0 ? '1' : d === 1 ? '.72' : d === 2 ? '.38' : '.18';
            li.setAttribute('aria-hidden', d === 0 ? 'false' : 'true');
        });
        captionEl.textContent = items[a].getAttribute('data-caption') || '';
        countEl.textContent = pad(a + 1) + ' / ' + pad(n);
        var dots = dotsEl.children;
        for (var k = 0; k < dots.length; k++) dots[k].classList.toggle('active', k === a);
    }

    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function start() {
        stop();
        if (playing && !held) timer = setInterval(function () { rot += 1; render(); }, INTERVAL);
    }
    function turn(by) { rot += by; render(); start(); }
    function goTo(i) {                                                  // shortest way round
        var delta = i - active();
        if (delta > n / 2) delta -= n;
        if (delta < -n / 2) delta += n;
        turn(delta);
    }

    /* build dots, wire clicks on the photos themselves */
    items.forEach(function (li, i) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', 'Show photo ' + (i + 1) + ' of ' + n);
        dot.addEventListener('click', function () { goTo(i); });
        dotsEl.appendChild(dot);
        li.setAttribute('role', 'group');
        li.setAttribute('aria-roledescription', 'slide');
        li.setAttribute('aria-label', (i + 1) + ' of ' + n);
        li.addEventListener('click', function () { if (!li.classList.contains('is-active')) goTo(i); });
    });

    document.getElementById('adPrev').addEventListener('click', function () { turn(-1); });
    document.getElementById('adNext').addEventListener('click', function () { turn(1); });

    function syncPause() {
        pauseBtn.textContent = playing ? 'Pause' : 'Play';
        pauseBtn.setAttribute('aria-pressed', playing ? 'false' : 'true');
    }
    pauseBtn.addEventListener('click', function () { playing = !playing; syncPause(); start(); });

    scene.addEventListener('mouseenter', function () { held = true; stop(); });
    scene.addEventListener('mouseleave', function () { held = false; start(); });
    scene.addEventListener('focusin', function () { held = true; stop(); });
    scene.addEventListener('focusout', function () { held = false; start(); });

    /* arrow keys only while the carousel has focus, so page scrolling isn't hijacked */
    scene.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); turn(1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); turn(-1); }
    });

    /* drag or swipe to spin */
    var x0 = null;
    scene.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
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

    scene.classList.add('is-3d');        // switch from the plain row to the ring
    measure();
    render();
    syncPause();
    start();
})();
