(function () {
  const isMobile = matchMedia("(hover: none) and (pointer: coarse)").matches;
  if (!isMobile) return;

  function setVh() {
    document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
  }

  setVh();
  window.addEventListener("resize", setVh);
  window.addEventListener("orientationchange", () => setTimeout(setVh, 150));
})();
// ✅ Yandex 1.6.1.8 — block selection/context menu on iOS/Android
(function blockMobileSelectionAndMenu() {
  // 1) Block long-press context menu
  document.addEventListener("contextmenu", (e) => e.preventDefault(), { capture: true });

  // 2) Block selection start (desktop + some mobile)
  document.addEventListener("selectstart", (e) => e.preventDefault(), { capture: true });

  // 3) iOS: sometimes selection appears anyway — force clear selection
  document.addEventListener("selectionchange", () => {
    const sel = window.getSelection && window.getSelection();
    if (sel && sel.rangeCount) sel.removeAllRanges();
  });

  // 4) iOS pinch/gesture (optional but safe)
  document.addEventListener("gesturestart", (e) => e.preventDefault(), { passive: false });
})();