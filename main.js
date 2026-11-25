(function () {
  var d = document, b = d.body;
  var g = d.getElementById('gate'), en = d.getElementById('enter');
  if (g && en) en.addEventListener('click', function () { g.classList.add('open'); b.classList.remove('locked'); });
  var h = d.getElementById('hero');
  if (h) h.addEventListener('pointermove', function (e) {
    var r = h.getBoundingClientRect();
    h.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    h.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });
  var c = d.getElementById('candles'), m = d.getElementById('cmsg'), out = 0;
  if (c && m) {
    var msgs = ['', 'One light fewer.', 'The room grows colder.', 'Someone is watching.', 'Only one flame remains.', 'The safety net is gone. Now they all look at Eliot.'];
    ['I', 'II', 'III', 'IV', 'V'].forEach(function (n) {
      var k = d.createElement('button');
      k.className = 'candle';
      k.setAttribute('aria-label', 'Priest ' + n + ', snuff candle');
      k.innerHTML = '<div class="flame"></div><div class="wick"></div><div class="wax"></div><small>' + n + '</small>';
      k.addEventListener('click', function () { var o = k.classList.toggle('out'); out += o ? 1 : -1; m.textContent = msgs[out] || ''; });
      c.appendChild(k);
    });
  }
  var els = d.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .15 });
    els.forEach(function (e) { io.observe(e); });
  } else { els.forEach(function (e) { e.classList.add('in'); }); }
})();
