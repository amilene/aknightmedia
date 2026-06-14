if (/\/index\.html\/?$/.test(window.location.pathname)) {
  history.replaceState(null, "", "/");
}

const logoImages = document.querySelectorAll(".logo-img");

logoImages.forEach((logo) => {
  const staticSrc = logo.dataset.static;
  if (!staticSrc) {
    return;
  }

  const duration = Number(logo.dataset.duration) || 6000;
  const preload = new Image();
  preload.src = staticSrc;

  window.setTimeout(() => {
    logo.src = staticSrc;
  }, duration);
});

const year = document.getElementById("year");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");

if (year) {
  year.textContent = String(new Date().getFullYear());
}

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const filterButtons = document.querySelectorAll(".filter-btn");
const portfolioCards = document.querySelectorAll(".portfolio-card");

if (filterButtons.length && portfolioCards.length) {
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;

      filterButtons.forEach((btn) => {
        btn.classList.remove("is-active", "purple", "pink");
      });

      button.classList.add("is-active");
      if (filter === "video") {
        button.classList.add("purple");
      } else if (filter === "web") {
        button.classList.add("pink");
      }

      portfolioCards.forEach((card) => {
        const category = card.dataset.category;
        const show = filter === "all" || category === filter;
        card.classList.toggle("hidden", !show);
      });
    });
  });
}

const portfolioGrid = document.getElementById("portfolio-grid");
const portfolioLightbox = document.getElementById("portfolio-lightbox");
const portfolioLightboxImage = portfolioLightbox?.querySelector(".lightbox-image");
const portfolioLightboxVideo = portfolioLightbox?.querySelector(".lightbox-video");

if (portfolioGrid && portfolioLightbox && portfolioLightboxImage && portfolioLightboxVideo) {
  const closeLightbox = () => {
    portfolioLightbox.hidden = true;
    portfolioLightboxImage.hidden = true;
    portfolioLightboxImage.removeAttribute("src");
    portfolioLightboxImage.alt = "";
    portfolioLightboxVideo.hidden = true;
    portfolioLightboxVideo.pause();
    portfolioLightboxVideo.removeAttribute("src");
    portfolioLightboxVideo.removeAttribute("poster");
    portfolioLightboxVideo.removeAttribute("aria-label");
    document.body.style.overflow = "";
  };

  const openLightbox = () => {
    portfolioLightbox.hidden = false;
    document.body.style.overflow = "hidden";
    portfolioLightbox.querySelector(".lightbox-close")?.focus();
  };

  portfolioGrid.addEventListener("click", (event) => {
    const video = event.target.closest(".portfolio-card-image .portfolio-card-video");
    if (video) {
      event.preventDefault();
      portfolioLightboxImage.hidden = true;
      portfolioLightboxImage.removeAttribute("src");
      portfolioLightboxImage.alt = "";
      portfolioLightboxVideo.hidden = false;
      portfolioLightboxVideo.src = video.currentSrc || video.src;
      if (video.poster) {
        portfolioLightboxVideo.poster = video.poster;
      } else {
        portfolioLightboxVideo.removeAttribute("poster");
      }
      const label = video.getAttribute("aria-label");
      if (label) {
        portfolioLightboxVideo.setAttribute("aria-label", label);
      }
      openLightbox();
      portfolioLightboxVideo.load();
      portfolioLightboxVideo.play().catch(() => {});
      return;
    }

    const image = event.target.closest(".portfolio-card-image img");
    if (!image || image.closest("a[href]")) {
      return;
    }

    portfolioLightboxVideo.hidden = true;
    portfolioLightboxVideo.pause();
    portfolioLightboxVideo.removeAttribute("src");
    portfolioLightboxVideo.removeAttribute("poster");
    portfolioLightboxVideo.removeAttribute("aria-label");
    portfolioLightboxImage.hidden = false;
    portfolioLightboxImage.src = image.currentSrc || image.src;
    portfolioLightboxImage.alt = image.alt;
    openLightbox();
  });

  portfolioLightbox.querySelectorAll("[data-close]").forEach((element) => {
    element.addEventListener("click", closeLightbox);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !portfolioLightbox.hidden) {
      closeLightbox();
    }
  });
}

const pdfLightbox = document.getElementById("pdf-lightbox");
const pdfTriggers = document.querySelectorAll("[data-pdf-lightbox]");

if (pdfLightbox && pdfTriggers.length && typeof pdfjsLib !== "undefined") {
  const pdfCanvas = pdfLightbox.querySelector(".pdf-lightbox-canvas");
  const pdfLoading = pdfLightbox.querySelector("[data-pdf-loading]");
  const pdfPageLabel = pdfLightbox.querySelector("[data-pdf-page]");
  const pdfPrevButton = pdfLightbox.querySelector("[data-pdf-prev]");
  const pdfNextButton = pdfLightbox.querySelector("[data-pdf-next]");
  const pdfTitle = pdfLightbox.querySelector(".pdf-lightbox-title");
  const pdfContext = pdfCanvas?.getContext("2d");

  let pdfDocument = null;
  let currentPage = 1;
  let isRendering = false;
  let pendingPage = null;

  const updateNavState = () => {
    if (!pdfDocument || !pdfPrevButton || !pdfNextButton || !pdfPageLabel) {
      return;
    }

    pdfPageLabel.textContent = `Page ${currentPage} of ${pdfDocument.numPages}`;
    pdfPrevButton.disabled = currentPage <= 1;
    pdfNextButton.disabled = currentPage >= pdfDocument.numPages;
  };

  const getFitScale = (page) => {
    const unscaled = page.getViewport({ scale: 1 });
    const maxWidth = Math.min(window.innerWidth * 0.92, 56 * 16);
    const maxHeight = window.innerHeight * 0.72;
    return Math.min(maxWidth / unscaled.width, maxHeight / unscaled.height);
  };

  const renderPage = async (pageNumber) => {
    if (!pdfDocument || !pdfCanvas || !pdfContext) {
      return;
    }

    isRendering = true;
    const page = await pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale: getFitScale(page) });

    pdfCanvas.width = viewport.width;
    pdfCanvas.height = viewport.height;
    pdfCanvas.hidden = false;
    if (pdfLoading) {
      pdfLoading.hidden = true;
    }

    await page.render({ canvasContext: pdfContext, viewport }).promise;
    isRendering = false;
    updateNavState();

    if (pendingPage !== null) {
      const nextPage = pendingPage;
      pendingPage = null;
      currentPage = nextPage;
      renderPage(nextPage);
    }
  };

  const queueRenderPage = (pageNumber) => {
    currentPage = pageNumber;
    if (isRendering) {
      pendingPage = pageNumber;
      return;
    }
    renderPage(pageNumber);
  };

  const closePdfLightbox = () => {
    pdfLightbox.hidden = true;
    document.body.style.overflow = "";
    pdfDocument = null;
    currentPage = 1;
    pendingPage = null;
    isRendering = false;

    if (pdfCanvas) {
      pdfCanvas.hidden = true;
      pdfCanvas.width = 0;
      pdfCanvas.height = 0;
    }
    if (pdfLoading) {
      pdfLoading.hidden = false;
      pdfLoading.textContent = "Loading document…";
    }
    if (pdfPrevButton) {
      pdfPrevButton.disabled = true;
    }
    if (pdfNextButton) {
      pdfNextButton.disabled = true;
    }
    if (pdfPageLabel) {
      pdfPageLabel.textContent = "Page 1 of 1";
    }
  };

  const openPdfLightbox = async (url, title) => {
    pdfLightbox.hidden = false;
    document.body.style.overflow = "hidden";
    if (pdfTitle && title) {
      pdfTitle.textContent = title;
    }
    if (pdfLoading) {
      pdfLoading.hidden = false;
      pdfLoading.textContent = "Loading document…";
    }
    if (pdfCanvas) {
      pdfCanvas.hidden = true;
    }
    pdfLightbox.querySelector(".lightbox-close")?.focus();

    try {
      const loadingTask = pdfjsLib.getDocument(url);
      pdfDocument = await loadingTask.promise;
      currentPage = 1;
      await renderPage(1);
    } catch {
      if (pdfLoading) {
        pdfLoading.hidden = false;
        pdfLoading.textContent = "Unable to load this document.";
      }
    }
  };

  pdfTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const url = trigger.dataset.pdfLightbox;
      const title = trigger.dataset.pdfTitle;
      if (url) {
        openPdfLightbox(url, title);
      }
    });
  });

  pdfLightbox.querySelectorAll("[data-pdf-close]").forEach((element) => {
    element.addEventListener("click", closePdfLightbox);
  });

  pdfPrevButton?.addEventListener("click", () => {
    if (currentPage > 1) {
      queueRenderPage(currentPage - 1);
    }
  });

  pdfNextButton?.addEventListener("click", () => {
    if (pdfDocument && currentPage < pdfDocument.numPages) {
      queueRenderPage(currentPage + 1);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (pdfLightbox.hidden) {
      return;
    }

    if (event.key === "Escape") {
      closePdfLightbox();
      return;
    }

    if (event.key === "ArrowLeft" && currentPage > 1) {
      event.preventDefault();
      queueRenderPage(currentPage - 1);
      return;
    }

    if (event.key === "ArrowRight" && pdfDocument && currentPage < pdfDocument.numPages) {
      event.preventDefault();
      queueRenderPage(currentPage + 1);
    }
  });

  window.addEventListener("resize", () => {
    if (!pdfLightbox.hidden && pdfDocument) {
      queueRenderPage(currentPage);
    }
  });
}

const contactForm = document.getElementById("contact-form");
const contactFormStatus = document.getElementById("contact-form-status");
const contactFormSubmit = document.getElementById("contact-form-submit");
let contactFormApiUrl = null;

async function loadContactFormConfig() {
  if (!contactForm) {
    return;
  }

  try {
    const response = await fetch("/config/contact-form.json", { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const config = await response.json();
    if (config?.apiUrl) {
      contactFormApiUrl = config.apiUrl;
    }
  } catch {
    // Fall back to mailto when the API config is unavailable.
  }
}

function setContactFormStatus(message, type) {
  if (!contactFormStatus) {
    return;
  }

  contactFormStatus.textContent = message;
  contactFormStatus.hidden = false;
  contactFormStatus.classList.remove("is-success", "is-error");
  contactFormStatus.classList.add(type === "success" ? "is-success" : "is-error");
}

function setContactFormBusy(isBusy) {
  if (!contactFormSubmit) {
    return;
  }

  contactFormSubmit.disabled = isBusy;
  contactFormSubmit.style.opacity = isBusy ? "0.7" : "";
  contactFormSubmit.style.cursor = isBusy ? "wait" : "";
}

function sendContactFormViaMailto(payload) {
  const subject = encodeURIComponent(`Project inquiry from ${payload.name}`);
  const body = encodeURIComponent(
    `Name: ${payload.name}\nEmail: ${payload.email}\nCompany: ${payload.company || "N/A"}\nService: ${payload.service}\n\n${payload.message}`
  );

  window.location.href = `mailto:aknightmedia@gmail.com?subject=${subject}&body=${body}`;
}

if (contactForm) {
  loadContactFormConfig();

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      company: String(formData.get("company") || "").trim(),
      service: String(formData.get("service") || "").trim(),
      message: String(formData.get("message") || "").trim(),
      website: String(formData.get("website") || "").trim(),
    };

    if (!contactFormApiUrl) {
      sendContactFormViaMailto(payload);
      return;
    }

    setContactFormBusy(true);
    if (contactFormStatus) {
      contactFormStatus.hidden = true;
    }

    try {
      const response = await fetch(contactFormApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      contactForm.reset();
      setContactFormStatus("Thanks! Your message was sent. I will get back to you soon.", "success");
    } catch {
      setContactFormStatus(
        "Sorry, your message could not be sent right now. Please email aknightmedia@gmail.com directly.",
        "error"
      );
    } finally {
      setContactFormBusy(false);
    }
  });
}
