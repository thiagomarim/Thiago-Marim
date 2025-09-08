window.addEventListener("DOMContentLoaded", () => {
  const grid = document.querySelector(".product-grid-hiring__grid");
  const modal = document.querySelector(".product-grid-hiring__modal");
  if (!grid || !modal) return;

  const backdrop = modal.querySelector(".product-grid-hiring__modal-backdrop");
  const closeBtn = modal.querySelector(".product-grid-hiring__modal-close");
  const content = modal.querySelector(".product-grid-hiring__modal-content");
  const mediaImg = modal.querySelector(
    ".product-grid-hiring__modal-content__info__media img"
  );
  const titleEl = modal.querySelector("#modal-title");
  const priceEl = modal.querySelector("#modal-price");
  const descEl = modal.querySelector("#modal-description");
  const colorWrap = modal.querySelector("[data-variant-colors]");
  const sizeWrap = modal.querySelector("[data-variant-sizes]");
  const addToCartBtn = modal.querySelector(
    ".product-grid-hiring__modal-content__actions__button"
  );
  let currentProduct = null;
  let selectedColor = null;
  let selectedSize = null;

  function renderColorButtons(colors) {
    if (!colorWrap) return;
    colorWrap.innerHTML = "";
    colors.forEach((color, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "variant-color-btn";
      // Insert swatch on the left and label text
      btn.innerHTML = `<span class="variant-color-btn__swatch" style="background:${color}"></span><span class="variant-color-btn__label">${color}</span>`;
      btn.setAttribute("aria-pressed", "false");
      btn.addEventListener("click", () => {
        selectedColor = color;
        [...colorWrap.querySelectorAll("button")].forEach((b) => {
          b.classList.remove("is-active");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("is-active");
        btn.setAttribute("aria-pressed", "true");
        // Reset selected size when color changes and re-render sizes for this color
        selectedSize = null;
        renderSizeOptions();
      });
      colorWrap.appendChild(btn);
    });
    // Clear sizes until the user selects a color
    if (sizeWrap) sizeWrap.innerHTML = "";
  }

  function renderSizeOptions() {
    if (!sizeWrap || !currentProduct) return;

    // Clear existing content and rebuild
    sizeWrap.innerHTML = `
    <div class="variant-size-select__container">
      <div class="variant-size-select__trigger">
        <span class="variant-size-select__text">Choose your size</span>
      </div>
      <div class="variant-size-select__arrow-container">
       <div class="variant-size-select__arrow">
          <svg width="16" height="10" viewBox="0 0 16 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 2L8 8L14 2" stroke="black" stroke-width="1.5" stroke-linecap="square"/>
          </svg>
        </div>
      </div>
      <ul class="variant-size-select__dropdown" style="display: none;">
          <!-- Options will be populated below -->
        </ul>
      </div>
    `;

    // Filter variants by selectedColor (assume option1 is Color, option2 is Size; but detect by name)
    const optionNames = currentProduct.options.map((o) => o.name);
    const colorIndex = optionNames.findIndex((n) => /color/i.test(n));
    const sizeIndex = optionNames.findIndex((n) => /size/i.test(n));
    const variants = currentProduct.variants.filter((v) => {
      if (colorIndex === -1) return true;
      const colorValue = v[`option${colorIndex + 1}`];
      return selectedColor ? colorValue === selectedColor : true;
    });
    const sizesSet = new Set();
    variants.forEach((v) => {
      if (sizeIndex !== -1) sizesSet.add(v[`option${sizeIndex + 1}`]);
    });
    const sizes = Array.from(sizesSet);

    const dropdown = sizeWrap.querySelector(".variant-size-select__dropdown");
    const trigger = sizeWrap.querySelector(".variant-size-select__trigger");
    const arrowTrigger = sizeWrap.querySelector(".variant-size-select__arrow-container");
    const textSpan = sizeWrap.querySelector(".variant-size-select__text");

    // Add size options to dropdown
    sizes.forEach((size) => {
      const li = document.createElement("li");
      li.textContent = size;
      li.addEventListener("click", () => {
        selectedSize = size;
        textSpan.textContent = size;
        sizeWrap.classList.remove("is-open");
        dropdown.style.display = "none";

        // Remove selected class from all items and add to clicked one
        dropdown
          .querySelectorAll("li")
          .forEach((item) => item.classList.remove("is-selected"));
        li.classList.add("is-selected");
      });
      dropdown.appendChild(li);
    });

    // Toggle dropdown on trigger click
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = sizeWrap.classList.contains("is-open");
      if (isOpen) {
        sizeWrap.classList.remove("is-open");
        dropdown.style.display = "none";
      } else {
        sizeWrap.classList.add("is-open");
        dropdown.style.display = "block";
      }
    });

    // Toggle dropdown on arrow container click
    arrowTrigger?.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = sizeWrap.classList.contains("is-open");
      if (isOpen) {
        sizeWrap.classList.remove("is-open");
        dropdown.style.display = "none";
      } else {
        sizeWrap.classList.add("is-open");
        dropdown.style.display = "block";
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!sizeWrap.contains(e.target)) {
        sizeWrap.classList.remove("is-open");
        dropdown.style.display = "none";
      }
    });
  }

  function openModal(data) {
    // Reset state each time modal opens
    selectedColor = null;
    selectedSize = null;
    if (colorWrap) colorWrap.innerHTML = "";
    if (sizeWrap) sizeWrap.innerHTML = "";
    if (mediaImg) {
      mediaImg.src = data.image || "";
      mediaImg.alt = data.title || "";
    }
    if (titleEl) titleEl.textContent = data.title || "";
    if (priceEl) priceEl.textContent = data.price || "";
    if (descEl) descEl.textContent = data.description || "";
    modal.classList.add("is-open");
    document.addEventListener("keydown", onKeydown);
  }

  function closeModal() {
    modal.classList.remove("is-open");
    document.removeEventListener("keydown", onKeydown);
  }

  function onKeydown(e) {
    if (e.key === "Escape") closeModal();
  }

  grid.addEventListener("click", async (e) => {
    const plus = e.target.closest(".product-grid-hiring__grid-plus-icon");
    if (!plus) return;
    const item = plus.closest(".product-grid-hiring__grid-item");
    if (!item) return;

    const data = {
      title: item.getAttribute("data-title") || "",
      price: item.getAttribute("data-price") || "",
      description: item.getAttribute("data-description") || "",
      image: item.getAttribute("data-image") || "",
    };
    openModal(data);

    // Load product JSON by handle for variants
    const handle = item.getAttribute("data-handle");
    if (!handle) return;
    try {
      const res = await fetch(`/products/${handle}.js`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Failed to load product");
      currentProduct = await res.json();
      // Determine color options
      const colorOption = currentProduct.options.find((o) =>
        /color/i.test(o.name)
      );
      const colors = colorOption ? colorOption.values : [];
      renderColorButtons(colors);
      renderSizeOptions();
      // Wait for user to choose a color, then sizes will render
    } catch (err) {
      console.error(err);
    }
  });

  backdrop?.addEventListener("click", closeModal);
  closeBtn?.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (!content) return;
    if (!content.contains(e.target)) {
      closeModal();
    }
  });

  // Add to cart handler
  addToCartBtn?.addEventListener("click", async (e) => {
    e.preventDefault();
    if (!currentProduct) return;

    const optionNames = currentProduct.options.map((o) => o.name);
    const colorIndex = optionNames.findIndex((n) => /color/i.test(n));
    const sizeIndex = optionNames.findIndex((n) => /size/i.test(n));

    // Validate selections when options exist
    if (colorIndex !== -1 && !selectedColor) {
      alert("Please choose a color.");
      return;
    }
    if (sizeIndex !== -1 && !selectedSize) {
      alert("Please choose a size.");
      return;
    }

    // Find matching variant by selected options
    const matchingVariant = currentProduct.variants.find((v) => {
      const colorMatches =
        colorIndex === -1 || (selectedColor && v[`option${colorIndex + 1}`] === selectedColor);
      const sizeMatches =
        sizeIndex === -1 || (selectedSize && v[`option${sizeIndex + 1}`] === selectedSize);
      return colorMatches && sizeMatches;
    });

    if (!matchingVariant) {
      alert("This variant is unavailable. Please choose different options.");
      return;
    }

    try {
      const res = await fetch("/cart/add.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ id: matchingVariant.id, quantity: 1 }),
      });
      if (!res.ok) throw new Error("Failed to add to cart");
      await res.json();
      // Optionally close modal or give feedback
      closeModal();
      // Dispatch a custom event so theme cart UI can react if listening
      document.dispatchEvent(new CustomEvent("product:added", { detail: { variantId: matchingVariant.id } }));
      // Redirect to cart after successful add
      window.location.href = "/cart";
    } catch (err) {
      console.error(err);
      alert("Could not add to cart. Please try again.");
    }
  });
});
