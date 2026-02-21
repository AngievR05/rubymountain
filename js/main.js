// main.js

// =========================
// SMALL UTILITIES
// =========================

const DEBUG = true;

function log(...args) {
  if (DEBUG) console.log("[RubyMountain]", ...args);
}

function warn(...args) {
  if (DEBUG) console.warn("[RubyMountain]", ...args);
}

function errLog(...args) {
  console.error("[RubyMountain]", ...args);
}

// Safe translation helper: won't crash if getString/lang isn't loaded
function t(key, fallback) {
  try {
    if (typeof getString === "function") return getString(key);
  } catch (e) {
    // ignore
  }
  return fallback;
}

// =========================
// NAV / FOOTER helpers
// =========================

function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");

  if (!toggle || !nav) {
    warn("initNav: nav-toggle or nav not found (ok on some pages).");
    return;
  }

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("nav--open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    log("Nav toggled:", isOpen ? "OPEN" : "CLOSED");
  });

  log("initNav: ready");
}

function initYear() {
  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
    log("initYear: set footer year");
  } else {
    warn("initYear: #year not found (ok on some pages).");
  }
}

// =========================
// PROJECTS (rendering only)
// =========================

let activeFilter = "all";

function projectToCardHTML(project) {
  if (!project) return "";

  const lang = window.currentLanguage || "en";
  const title = project?.title?.[lang] || project?.title?.en || "Project";
  const category =
    project?.categoryKey?.[lang] || project?.categoryKey?.en || "";

  const thumbHTML = project.thumb
    ? `
      <div class="project-card__thumb">
        <img src="${project.thumb}" alt="${title}">
      </div>
    `
    : "";

  return `
    <article class="card project-card" data-project-id="${project.id}">
      ${thumbHTML}
      <h3>${title}</h3>
      <p class="project-card__meta">${category} · ${project.location || ""}</p>
    </article>
  `;
}

function attachProjectCardHandlers(container) {
  if (!container) return;

  const cards = container.querySelectorAll(".project-card");
  if (!cards.length) {
    warn("attachProjectCardHandlers: no cards found.");
    return;
  }

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.getAttribute("data-project-id");
      log("Project card clicked:", id);
      openProjectModal(id);
    });
  });

  log("attachProjectCardHandlers: attached to", cards.length, "cards");
}

function renderHomeProjects() {
  const container = document.getElementById("home-projects");
  if (!container) {
    warn("renderHomeProjects: #home-projects not found (ok on non-home pages).");
    return;
  }

  if (!Array.isArray(window.projectsData)) {
    warn("renderHomeProjects: window.projectsData missing or not an array.");
    return;
  }

  const toShow = window.projectsData.slice(0, 3);
  container.innerHTML = toShow.map(projectToCardHTML).join("");
  attachProjectCardHandlers(container);

  log("renderHomeProjects: rendered", toShow.length, "projects");
}

function renderProjects() {
  const grid = document.getElementById("projects-grid");
  if (!grid) {
    warn("renderProjects: #projects-grid not found (ok on non-projects pages).");
    return;
  }

  if (!Array.isArray(window.projectsData)) {
    warn("renderProjects: window.projectsData missing or not an array.");
    return;
  }

  const filtered = window.projectsData.filter((p) => {
    if (activeFilter === "all") return true;
    return p.type === activeFilter;
  });

  if (!filtered.length) {
    grid.innerHTML = `<p>No projects in this category yet.</p>`;
    log("renderProjects: 0 projects for filter:", activeFilter);
    return;
  }

  grid.innerHTML = filtered.map(projectToCardHTML).join("");
  attachProjectCardHandlers(grid);

  log("renderProjects: rendered", filtered.length, "projects for filter:", activeFilter);
}

// =========================
// FILTER BUTTONS
// =========================

function initProjectFilters() {
  const buttons = document.querySelectorAll(".filter-btn");
  if (!buttons.length) {
    warn("initProjectFilters: no filter buttons found (ok on other pages).");
    return;
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("filter-btn--active"));
      btn.classList.add("filter-btn--active");
      activeFilter = btn.dataset.filter || "all";

      log("Filter changed:", activeFilter);
      renderProjects();
    });
  });

  log("initProjectFilters: ready with", buttons.length, "buttons");
}

// =========================
// PROJECT MODAL
// =========================

function openProjectModal(projectId) {
  const modal = document.getElementById("project-modal");
  if (!modal) {
    warn("openProjectModal: #project-modal not found.");
    return;
  }

  if (!Array.isArray(window.projectsData)) {
    warn("openProjectModal: window.projectsData missing or not an array.");
    return;
  }

  const project = window.projectsData.find((p) => p.id === projectId);
  if (!project) {
    warn("openProjectModal: project not found for id:", projectId);
    return;
  }

  const lang = window.currentLanguage || "en";
  const title = project.title?.[lang] || project.title?.en || "Project";
  const category = project.categoryKey?.[lang] || project.categoryKey?.en || "";
  const desc = project.description?.[lang] || project.description?.en || "";

  const titleEl = document.getElementById("modal-title");
  const metaEl = document.getElementById("modal-meta");
  const descEl = document.getElementById("modal-description");
  const galleryEl = document.getElementById("modal-gallery");

  if (titleEl) titleEl.textContent = title;
  if (metaEl) metaEl.textContent = `${category} · ${project.location || ""}`;
  if (descEl) descEl.textContent = desc;

  if (galleryEl) {
    if (project.images && project.images.length) {
      galleryEl.innerHTML = project.images
        .map(
          (src) => `
            <img 
              src="${src}" 
              alt="${title}" 
              class="modal-gallery-img"
              data-full="${src}"
              loading="lazy"
            >
          `
        )
        .join("");
    } else {
      galleryEl.innerHTML = "";
    }
  }

  modal.classList.add("modal--open");
  modal.setAttribute("aria-hidden", "false");

  log("openProjectModal: opened:", projectId);
}

function initModal() {
  const modal = document.getElementById("project-modal");
  if (!modal) {
    warn("initModal: #project-modal not found (ok on other pages).");
    return;
  }

  const closeBtn = document.getElementById("project-modal-close");
  const backdrop = modal.querySelector(".modal__backdrop");

  function close() {
    modal.classList.remove("modal--open");
    modal.setAttribute("aria-hidden", "true");
    log("initModal: closed");
  }

  if (closeBtn) closeBtn.addEventListener("click", close);
  if (backdrop) backdrop.addEventListener("click", close);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  log("initModal: ready");
}

// =========================
// SCROLL REVEAL (PROJECT CARDS)
// =========================

function initScrollReveal() {
  const items = document.querySelectorAll(
    ".project-card, .card, .section__header, .stats"
  );

  if (!("IntersectionObserver" in window) || !items.length) {
    items.forEach((el) => el.classList.add("is-visible"));
    warn("initScrollReveal: IntersectionObserver missing or no items found.");
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  items.forEach((el) => {
    el.classList.add("reveal");
    observer.observe(el);
  });

  log("initScrollReveal: observing", items.length, "items");
}

// =========================
// IMAGE LIGHTBOX (85% screen)
// =========================

function initImageLightbox() {
  const lightbox = document.getElementById("image-lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const closeBtn = document.getElementById("lightbox-close");

  if (!lightbox || !lightboxImg || !closeBtn) {
    warn("initImageLightbox: elements not found (ok on pages without modal).");
    return;
  }

  const backdrop = lightbox.querySelector(".image-lightbox__backdrop");
  if (!backdrop) {
    warn("initImageLightbox: backdrop not found.");
    return;
  }

  function openLightbox(src, alt = "") {
    lightboxImg.src = src;
    lightboxImg.alt = alt;
    lightbox.classList.add("image-lightbox--open");
    lightbox.setAttribute("aria-hidden", "false");
    log("Lightbox opened");
  }

  function closeLightbox() {
    lightbox.classList.remove("image-lightbox--open");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImg.src = "";
    lightboxImg.alt = "";
    log("Lightbox closed");
  }

  // Event delegation so it works for injected images
  document.addEventListener("click", (e) => {
    const img = e.target.closest(".modal-gallery-img");
    if (!img) return;
    openLightbox(img.dataset.full || img.src, img.alt || "");
  });

  closeBtn.addEventListener("click", closeLightbox);
  backdrop.addEventListener("click", closeLightbox);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });

  log("initImageLightbox: ready");
}

// =========================
// INIT ON LOAD
// =========================

document.addEventListener("DOMContentLoaded", () => {
  log("Boot: DOMContentLoaded");

  if (typeof initLanguage === "function") {
    initLanguage();
    log("Language: initLanguage() called");
  } else {
    warn("Language: initLanguage() not found (lang.js not loaded?)");
  }

  initNav();
  initYear();
  initProjectFilters();
  initModal();
  initImageLightbox();

  renderHomeProjects();
  renderProjects();
  initScrollReveal();

  if (Array.isArray(window.projectsData)) {
    log("projectsData length:", window.projectsData.length);
  } else {
    warn("projectsData missing: window.projectsData is not an array (ok if not on projects pages).");
  }
});
