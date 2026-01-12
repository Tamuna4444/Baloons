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