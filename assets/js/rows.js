/* MIAMIX endless-scroll rows.
 *
 * - Free scrolling (touch, trackpad, wheel, drag, arrow buttons) with no snapping.
 * - A row loops endlessly only when its posts are wider than the screen;
 *   shorter rows stay a normal static shelf, so you never see the same poster twice side by side.
 * - Loop = three copies of the posts; scrollLeft is kept inside the middle copy.
 * - The loop "jump" happens only once native scrolling has stopped (or if the very
 *   edge is hit). Changing scrollLeft mid-swipe cancels the browser's momentum and
 *   caused the glitching on fast flicks.
 */
(function () {
    'use strict';

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function initAll() {
        var rows = document.querySelectorAll('[data-row]');
        Array.prototype.forEach.call(rows, initRow);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
    } else {
        initAll();
    }

    function initRow(row) {
        var track = row.querySelector('.row-track');
        var prev = row.querySelector('.row-btn--prev');
        var next = row.querySelector('.row-btn--next');
        var originals = Array.prototype.slice.call(track.children);
        if (!originals.length) return;

        var looping = false;
        var setW = 0;      // width of one full set of posts (incl. trailing gap)
        var start = 0;     // scrollLeft where the middle copy begins
        var lastWidth = 0;
        var anim = null;
        var idleTimer = null;
        var touching = false;

        function makeClone(node) {
            var c = node.cloneNode(true);
            c.setAttribute('data-clone', '');
            c.setAttribute('aria-hidden', 'true');
            c.setAttribute('tabindex', '-1');
            c.setAttribute('inert', '');
            return c;
        }

        function build() {
            Array.prototype.forEach.call(track.querySelectorAll('[data-clone]'), function (n) { n.remove(); });
            looping = false;
            cancelAnim();

            var cs = getComputedStyle(track);
            var padL = parseFloat(cs.paddingLeft) || 0;
            var gap = parseFloat(cs.columnGap) || parseFloat(cs.gap) || 0;
            var first = originals[0];
            var last = originals[originals.length - 1];
            var origW = last.offsetLeft + last.offsetWidth - first.offsetLeft + gap;
            var viewW = track.clientWidth;

            if (originals.length > 1 && origW > viewW) {
                var before = document.createDocumentFragment();
                originals.forEach(function (o) { before.appendChild(makeClone(o)); });
                track.insertBefore(before, first);
                originals.forEach(function (o) { track.appendChild(makeClone(o)); });

                var firstClone = track.querySelector('[data-clone]');
                setW = first.offsetLeft - firstClone.offsetLeft;
                start = first.offsetLeft - padL;
                track.scrollLeft = start;
                looping = true;
            } else {
                track.scrollLeft = 0;
            }
            lastWidth = track.clientWidth;
            updateButtons();
        }

        // Keep scrollLeft inside the middle copy. Returns the adjustment applied.
        function wrap() {
            if (!looping) return 0;
            var x = track.scrollLeft;
            if (x >= start + setW) { track.scrollLeft = x - setW; return -setW; }
            if (x < start) { track.scrollLeft = x + setW; return setW; }
            return 0;
        }

        // Native scrolling (touch / wheel / trackpad): wait until it has settled
        // before jumping, so we never interrupt the browser's momentum.
        function onScroll() {
            if (!looping) return;
            var x = track.scrollLeft;
            var max = track.scrollWidth - track.clientWidth;
            if (x <= 2 || x >= max - 2) { wrap(); return; }   // hit a hard edge: jump now
            clearTimeout(idleTimer);
            idleTimer = setTimeout(settle, 140);
        }
        function settle() {
            if (touching || dragging) { idleTimer = setTimeout(settle, 140); return; }
            wrap();
        }

        function updateButtons() {
            var canScroll = looping || track.scrollWidth > track.clientWidth + 2;
            if (prev) prev.hidden = !canScroll;
            if (next) next.hidden = !canScroll;
        }

        function cancelAnim() {
            if (anim) { cancelAnimationFrame(anim); anim = null; }
        }

        function animateBy(dx) {
            cancelAnim();
            if (reduceMotion) { track.scrollLeft += dx; wrap(); return; }
            var dur = 480, t0 = null, applied = 0;
            function step(t) {
                if (t0 === null) t0 = t;
                var p = Math.min(1, (t - t0) / dur);
                var eased = 1 - Math.pow(1 - p, 3);
                var target = Math.round(dx * eased);
                track.scrollLeft += target - applied;
                applied = target;
                wrap();
                anim = p < 1 ? requestAnimationFrame(step) : null;
            }
            anim = requestAnimationFrame(step);
        }

        function pageAmount() {
            var card = originals[0];
            var cs = getComputedStyle(track);
            var gap = parseFloat(cs.columnGap) || parseFloat(cs.gap) || 0;
            var per = card.offsetWidth + gap;
            var cards = Math.max(1, Math.floor(track.clientWidth / per) - 1);
            return per * cards;
        }

        if (prev) prev.addEventListener('click', function () { animateBy(-pageAmount()); });
        if (next) next.addEventListener('click', function () { animateBy(pageAmount()); });

        track.addEventListener('scroll', onScroll, { passive: true });
        // User input (wheel / touch / drag) should interrupt a running button animation.
        track.addEventListener('wheel', cancelAnim, { passive: true });
        track.addEventListener('touchstart', function () { touching = true; cancelAnim(); }, { passive: true });
        track.addEventListener('touchend', function () { touching = false; }, { passive: true });
        track.addEventListener('touchcancel', function () { touching = false; }, { passive: true });

        // Mouse drag (touch uses native scrolling).
        var dragging = false, moved = 0, startX = 0, startLeft = 0;
        track.addEventListener('pointerdown', function (e) {
            if (e.pointerType !== 'mouse' || e.button !== 0) return;
            cancelAnim();
            dragging = true; moved = 0; startX = e.clientX; startLeft = track.scrollLeft;
        });
        window.addEventListener('pointermove', function (e) {
            if (!dragging) return;
            var dx = e.clientX - startX;
            moved = Math.max(moved, Math.abs(dx));
            if (moved > 5) track.classList.add('is-dragging');
            track.scrollLeft = startLeft - dx;
            startLeft += wrap();
        });
        function endDrag() {
            if (!dragging) return;
            dragging = false;
            track.classList.remove('is-dragging');
        }
        window.addEventListener('pointerup', endDrag);
        window.addEventListener('pointercancel', endDrag);
        // Swallow the click that ends a drag so it doesn't open the post.
        track.addEventListener('click', function (e) {
            if (moved > 5) { e.preventDefault(); e.stopPropagation(); moved = 0; }
        }, true);

        // Rebuild when the width changes (ignore mobile URL-bar height changes).
        var resizeTimer;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                if (track.clientWidth !== lastWidth) build();
            }, 150);
        });

        build();
        window.addEventListener('load', build);
    }
})();
