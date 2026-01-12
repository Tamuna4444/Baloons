(function () {
  const isMobile = matchMedia("(hover: none) and (pointer: coarse)").matches;
  if (!isMobile) return;

  function setVh() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  }

  setVh();
  window.addEventListener("resize", setVh);
  window.addEventListener("orientationchange", () => {
    setTimeout(setVh, 150);
  });
})();