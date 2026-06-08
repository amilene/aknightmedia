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

if (portfolioGrid && portfolioLightbox && portfolioLightboxImage) {
  const closeLightbox = () => {
    portfolioLightbox.hidden = true;
    portfolioLightboxImage.removeAttribute("src");
    portfolioLightboxImage.alt = "";
    document.body.style.overflow = "";
  };

  portfolioGrid.addEventListener("click", (event) => {
    const image = event.target.closest(".portfolio-card-image img");
    if (!image || image.closest("a[href]")) {
      return;
    }

    portfolioLightboxImage.src = image.currentSrc || image.src;
    portfolioLightboxImage.alt = image.alt;
    portfolioLightbox.hidden = false;
    document.body.style.overflow = "hidden";
    portfolioLightbox.querySelector(".lightbox-close")?.focus();
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

const contactForm = document.getElementById("contact-form");

if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);
    const name = formData.get("name");
    const email = formData.get("email");
    const company = formData.get("company");
    const service = formData.get("service");
    const message = formData.get("message");

    const subject = encodeURIComponent(`Project inquiry from ${name}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nCompany: ${company || "N/A"}\nService: ${service}\n\n${message}`
    );

    window.location.href = `mailto:hello@aknightmedia.com?subject=${subject}&body=${body}`;
  });
}
