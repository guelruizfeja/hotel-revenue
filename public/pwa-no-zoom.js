// En la app instalada (PWA) bloquea el pellizco de zoom en iOS, que ignora
// minimum-scale y touch-action en algunos casos. En el navegador normal no hace nada.
(function () {
  var standalone = window.navigator.standalone === true ||
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  if (!standalone) return;
  var block = function (e) { e.preventDefault(); };
  document.addEventListener('gesturestart', block, { passive: false });
  document.addEventListener('gesturechange', block, { passive: false });
  document.addEventListener('touchmove', function (e) {
    if (e.touches && e.touches.length > 1) e.preventDefault();
  }, { passive: false });
})();
