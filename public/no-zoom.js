// Bloquea el pellizco de zoom en móvil. iOS ignora user-scalable=no y a veces touch-action,
// así que se anulan sus gestos de pellizco. En escritorio no tiene efecto (no hay gestos táctiles).
(function () {
  var block = function (e) { e.preventDefault(); };
  document.addEventListener('gesturestart', block, { passive: false });
  document.addEventListener('gesturechange', block, { passive: false });
  document.addEventListener('touchmove', function (e) {
    if (e.touches && e.touches.length > 1) e.preventDefault();
  }, { passive: false });
})();
