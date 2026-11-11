/* After Dark gallery: one photo at a time.
   Reads its photos from the thumbnail buttons in the page (data-src / data-caption),
   so adding a photo means adding one <button> there. No autoplay for reduced-motion users. */
(function () {
    'use strict';

    var stage = document.getElementById('adStage');
    var imgEl = document.getElementById('adImg');
    var thumbsEl = document.getElementById('adThumbs');
    if (!stage || !imgEl || !thumbsEl) return;

    var thumbs = Array.prototype.slice.call(thumbsEl.querySelectorAll('button'));
    var total = thumbs.length;
    if (!total) return;

    var captionEl = document.getElementById('adCaption');
    var countEl = document.getElementById('adCount');
    var barEl = document.getElementById('adBar');
    var dotsEl = document.getElementById('adDots');
    var pauseBtn = document.getElementById('adPause');
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var INTERVAL = 4500;
    var current = 0;
    var playing = !reduceMotion;
    var hovering = false;
    var timer = null;

    function pad(n) { return (n < 10 ? '0' : '') + n; }

    function show(i) {
        current = (i + total) % total;
        var t = thumbs[current];
        imgEl.src = t.getAttribute('data-src');
        imgEl.alt = t.getAttribute('data-caption') || '';
        captionEl.textContent = t.getAttribute('data-caption') || '';
        countEl.textContent = pad(current + 1) + ' / ' + pad(total);
        barEl.style.width = ((current + 1) / total * 100) + '%';
        thumbs.forEach(function (b, n) { b.classList.toggle('active', n === current); b.setAttribute('aria-current', n === current ? 'true' : 'false'); });
        var dots = dotsEl.children;
        for (var d = 0; d < dots.length; d++) dots[d].classList.toggle('active', d === current);
    }

    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function start() {
        stop();
        if (playing && !hovering) timer = setInterval(function () { show(current + 1); }, INTERVAL);
    }
    function go(i) { show(i); start(); }

    /* dots + thumbnails */
    thumbs.forEach(function (b, i) {
        var dot = document.createElement('span');
        dotsEl.appendChild(dot);
        b.setAttribute('aria-label', 'Show photo ' + (i + 1) + ' of ' + total);
        b.addEventListener('click', function () { go(i); });
    });

    document.getElementById('adPrev').addEventListener('click', function () { go(current - 1); });
    document.getElementById('adNext').addEventListener('click', function () { go(current + 1); });

    function syncPause() { pauseBtn.textContent = playing ? 'Pause' : 'Play'; pauseBtn.setAttribute('aria-pressed', playing ? 'false' : 'true'); }
    pauseBtn.addEventListener('click', function () { playing = !playing; syncPause(); start(); });

    stage.addEventListener('mouseenter', function () { hovering = true; stop(); });
    stage.addEventListener('mouseleave', function () { hovering = false; start(); });

    /* arrow keys only while the gallery has focus, so page scrolling isn't hijacked */
    stage.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); go(current + 1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); go(current - 1); }
    });

    /* swipe on touch screens */
    var x0 = null;
    stage.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', function (e) {
        if (x0 === null) return;
        var dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1));
        x0 = null;
    }, { passive: true });

    /* don't burn cycles while the tab is hidden */
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });

    syncPause();
    show(0);
    start();
})();
