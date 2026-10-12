// 첫 페인트 전에 저장된 테마를 적용해 화면 깜빡임을 줄입니다.
(() => {
  let theme = "light";
  try {
    const saved = localStorage.getItem("portfolio-theme");
    theme =
      saved === "dark" || saved === "light"
        ? saved
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
  } catch {
    theme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  document.documentElement.dataset.theme = theme;
})();
