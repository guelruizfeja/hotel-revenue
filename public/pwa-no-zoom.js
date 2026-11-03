// En la app instalada (PWA) bloquea el pellizco de zoom en iOS, que ignora
// minimum-scale y touch-action en algunos casos. En el navegador normal no hace nada.
(function () {
  var standalone = window.navigator.standalone === true ||
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  if (!standalone) return;
  // iOS amplía la página al enfocar inputs con letra < 16px; como en la app no se puede
  // pellizcar para volver, se fija la escala a 1 (iOS sí respeta maximum-scale para esto).
  var vp = document.querySelector('meta[name="viewport"]');
  if (vp) vp.setAttribute('content', 'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no');
  var block = function (e) { e.preventDefault(); };
  document.addEventListener('gesturestart', block, { passive: false });
  document.addEventListener('gesturechange', block, { passive: false });
  document.addEventListener('touchmove', function (e) {
    if (e.touches && e.touches.length > 1) e.preventDefault();
  }, { passive: false });
})();
