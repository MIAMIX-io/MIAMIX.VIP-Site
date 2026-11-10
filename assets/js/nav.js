document.addEventListener('DOMContentLoaded', function() {
  var btn = document.getElementById('mobileMenuBtn');
  var nav = document.getElementById('navMenu');
  if (!btn || !nav) return;
  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    var open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.classList.toggle('open', open);
  });
  var drops = nav.querySelectorAll('.has-dropdown > button, .has-dropdown > a');
  drops.forEach(function(a) {
    a.addEventListener('click', function(e) {
      if (window.innerWidth <= 900) {
        e.preventDefault();
        a.parentElement.classList.toggle('open');
      }
    });
  });
  document.addEventListener('click', function(e) {
    if (!nav.contains(e.target) && !btn.contains(e.target)) {
      nav.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      btn.classList.remove('open');
    }
  });
});
