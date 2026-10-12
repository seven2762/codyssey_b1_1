"use strict";
const GITHUB_USERNAME = "seven2762";
const state = {
  theme: document.documentElement.dataset.theme,
  menuOpen: false,
  projects: { status: "loading", repos: [], error: "", filter: "all" },
  form: {
    values: { name: "", email: "", message: "" },
    errors: {},
    touched: new Set(),
    submitted: false,
  },
};
const $ = (selector) => document.querySelector(selector);
const elements = {
  menu: $("#nav-menu"),
  menuButton: $("#menu-toggle"),
  themeButton: $("#theme-toggle"),
  projects: $("#projects-content"),
  form: $("#contact-form"),
  backTop: $("#back-top"),
};
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const scrollBehavior = () => (reducedMotion.matches ? "auto" : "smooth");

// 사용자 이벤트 → state 변경 → render 함수로 DOM 갱신
const renderTheme = () => {
  const dark = state.theme === "dark";
  document.documentElement.dataset.theme = state.theme;
  elements.themeButton.setAttribute("aria-pressed", String(dark));
  elements.themeButton.setAttribute(
    "aria-label",
    dark ? "라이트 모드 켜기" : "다크 모드 켜기",
  );
  $("#theme-icon").textContent = dark ? "☀" : "☾";
};
elements.themeButton.addEventListener("click", () => {
  state.theme = state.theme === "dark" ? "light" : "dark";
  try {
    localStorage.setItem("portfolio-theme", state.theme);
  } catch {
    /* 저장 불가 환경에서도 토글은 동작 */
  }
  renderTheme();
});
renderTheme();
const renderMenu = () => {
  elements.menu.classList.toggle("active", state.menuOpen);
  elements.menuButton.classList.toggle("active", state.menuOpen);
  elements.menuButton.setAttribute("aria-expanded", String(state.menuOpen));
  elements.menuButton.setAttribute(
    "aria-label",
    state.menuOpen ? "메뉴 닫기" : "메뉴 열기",
  );
};
elements.menuButton.addEventListener("click", () => {
  state.menuOpen = !state.menuOpen;
  renderMenu();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.menuOpen) {
    state.menuOpen = false;
    renderMenu();
    elements.menuButton.focus();
  }
});
document.addEventListener("click", (event) => {
  if (state.menuOpen && !event.target.closest(".navigation")) {
    state.menuOpen = false;
    renderMenu();
  }
});
window.matchMedia("(min-width: 768px)").addEventListener("change", () => {
  state.menuOpen = false;
  renderMenu();
});
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.getElementById(link.hash.slice(1));
    if (!target) return;
    event.preventDefault();
    state.menuOpen = false;
    renderMenu();
    target.scrollIntoView({ behavior: scrollBehavior() });
    history.replaceState(null, "", link.hash);
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  });
});
const renderScroll = () => {
  $("#header").classList.toggle("scrolled", window.scrollY >= 60);
  elements.backTop.hidden = window.scrollY < 300;
};
window.addEventListener("scroll", renderScroll, { passive: true });
elements.backTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: scrollBehavior() });
  $(".logo").focus({ preventScroll: true });
});
renderScroll();
if ("IntersectionObserver" in window && !reducedMotion.matches) {
  document.documentElement.classList.add("js-ready");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(({ isIntersecting, target }) => {
        if (isIntersecting) {
          target.classList.add("visible");
          observer.unobserve(target);
        }
      });
    },
    { threshold: 0.2 },
  );
  document
    .querySelectorAll(".reveal")
    .forEach((element) => observer.observe(element));
}

// API 문자열을 HTML로 삽입하기 전에 이스케이프합니다.
const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const renderProjects = () => {
  const { status, repos, error, filter } = state.projects;
  elements.projects.classList.remove("has-error");
  elements.projects.setAttribute("aria-busy", String(status === "loading"));
  $("#project-count").textContent = "";
  document.querySelectorAll("[data-filter]").forEach((button) => {
    const selected = button.dataset.filter === filter;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  if (status === "loading") {
    elements.projects.innerHTML =
      '<div class="state-panel"><span class="spinner" aria-hidden="true"></span><p>프로젝트를 불러오는 중입니다…</p></div>';
    return;
  }
  if (status === "error") {
    elements.projects.classList.add("has-error");
    elements.projects.innerHTML = `<div class="state-panel"><p>프로젝트를 불러올 수 없습니다.</p><p>${escapeHTML(error)}</p><button class="button secondary" id="retry-projects">다시 시도하기 ↻</button></div>`;
    $("#retry-projects").addEventListener("click", () => loadProjects(true));
    return;
  }
  const visible = repos
    .filter(({ fork }) => filter === "all" || !fork)
    .slice(0, 6);
  $("#project-count").textContent = `· ${visible.length} projects`;
  if (!visible.length) {
    elements.projects.innerHTML =
      '<div class="state-panel"><p>표시할 프로젝트가 없습니다.</p><p>공개 저장소 또는 다른 필터를 확인해 주세요.</p></div>';
    return;
  }
  elements.projects.innerHTML = `<div class="projects-grid">${visible
    .map(
      ({ name, description, language, stargazers_count, fork }) => `
    <article class="project-card"><div class="project-top"><span aria-hidden="true">⌘</span><span class="project-kind">${fork ? "FORK" : "REPOSITORY"}</span></div><h3><a href="https://github.com/${GITHUB_USERNAME}/${encodeURIComponent(name)}" target="_blank" rel="noopener noreferrer">${escapeHTML(name)} ↗</a></h3><p>${escapeHTML(description || "설명은 GitHub 저장소에서 확인해 주세요.")}</p><div class="project-footer"><span><span class="language-dot" aria-hidden="true">●</span>${escapeHTML(language || "기타")}</span><span aria-label="별 ${Number(stargazers_count) || 0}개">☆ ${Number(stargazers_count) || 0}</span></div></article>`,
    )
    .join("")}</div>`;
};
const CACHE_KEY = "portfolio-repos-v1";
const loadProjects = async (force = false) => {
  state.projects.status = "loading";
  renderProjects();
  try {
    let cached;
    try {
      cached = JSON.parse(sessionStorage.getItem(CACHE_KEY));
    } catch {
      /* 캐시 실패 시 API 호출 */
    }
    if (
      !force &&
      cached &&
      Date.now() - cached.time < 300000 &&
      Array.isArray(cached.repos)
    ) {
      state.projects.repos = cached.repos;
    } else {
      const response = await fetch(
        `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`,
        {
          signal: AbortSignal.timeout(15000),
          headers: { Accept: "application/vnd.github+json" },
        },
      );
      if (!response.ok)
        throw new Error(
          response.status === 403 || response.status === 429
            ? "GitHub 요청 한도에 도달했습니다. 잠시 후 다시 시도해 주세요."
            : `GitHub 응답 오류 (${response.status}). 잠시 후 다시 시도해 주세요.`,
        );
      const repos = await response.json();
      if (!Array.isArray(repos))
        throw new Error("올바른 저장소 응답을 받지 못했습니다.");
      state.projects.repos = repos;
      try {
        sessionStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ time: Date.now(), repos }),
        );
      } catch {
        /* 캐시는 선택적 */
      }
    }
    state.projects.status = "success";
  } catch (error) {
    state.projects.status = "error";
    state.projects.error =
      error.name === "TimeoutError"
        ? "응답 시간이 초과되었습니다. 다시 시도해 주세요."
        : error instanceof TypeError
          ? "네트워크 연결을 확인해 주세요."
          : error.message;
  }
  renderProjects();
};
document.querySelectorAll("[data-filter]").forEach((button) =>
  button.addEventListener("click", () => {
    state.projects.filter = button.dataset.filter;
    renderProjects();
  }),
);
loadProjects();

const validateField = (name) => {
  const value = state.form.values[name].trim();
  if (!value)
    return {
      name: "이름을 입력해 주세요.",
      email: "이메일을 입력해 주세요.",
      message: "메시지를 입력해 주세요.",
    }[name];
  if (
    name === "email" &&
    (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ||
      $("#email").validity.typeMismatch)
  )
    return "올바른 이메일 형식을 입력해 주세요.";
  return "";
};
const renderForm = () => {
  ["name", "email", "message"].forEach((name) => {
    const error = state.form.touched.has(name)
      ? state.form.errors[name] || ""
      : "";
    $(`#${name}-error`).textContent = error;
    $(`#${name}`).setAttribute("aria-invalid", String(Boolean(error)));
  });
  $("#form-status").textContent = state.form.submitted
    ? "입력 검증이 완료되었습니다! 데모 폼이므로 메시지는 전송되지 않았습니다."
    : "";
};
["name", "email", "message"].forEach((name) => {
  $(`#${name}`).addEventListener("input", (event) => {
    state.form.values[name] = event.target.value;
    state.form.touched.add(name);
    state.form.errors[name] = validateField(name);
    state.form.submitted = false;
    renderForm();
  });
});
elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  ["name", "email", "message"].forEach((name) => {
    state.form.values[name] = $(`#${name}`).value;
    state.form.touched.add(name);
    state.form.errors[name] = validateField(name);
  });
  state.form.submitted = Object.values(state.form.errors).every(
    (error) => !error,
  );
  renderForm();
  const invalid = elements.form.querySelector('[aria-invalid="true"]');
  if (invalid) invalid.focus();
});
$("#year").textContent = new Date().getFullYear();
