window.addEventListener("DOMContentLoaded", () => {
  // Basic references for grid and modal. If missing, do nothing.
  const grid = document.querySelector(".product-grid-hiring__grid");
  const modal = document.querySelector(".product-grid-hiring__modal");
  if (!grid || !modal) return;

  // Bundle rule configuration (editable)
  // If the shopper selects Color = "Black" AND Size = "M",
  // we will also add the bonus product below to the cart.
  const BUNDLE_COLOR_VALUE = "black"; // comparison is case-insensitive
  const BUNDLE_SIZE_VALUE = "m"; // comparison is case-insensitive
  // Change this handle if your store uses a different URL handle for this product.
  const BONUS_PRODUCT_HANDLE = "dark-winter-jacket";

  // Modal elements
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

  // Current product state and user selections
  let currentProduct = null;
  let selectedColor = null;
  let selectedSize = null;

  // Small utilities
  const setText = (el, value) => {
    if (el) el.textContent = value || "";
  };
  const setMedia = (imgEl, src, alt) => {
    if (!imgEl) return;
    imgEl.src = src || "";
    imgEl.alt = alt || "";
  };
  // POST /cart/add.js for a single variant
  async function addVariantToCart(variantId, quantity = 1) {
    const res = await fetch("/cart/add.js", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ id: variantId, quantity }),
    });
    if (!res.ok) throw new Error("Failed to add to cart");
    return res.json();
  }

  // Fetch a product by handle and return the first available variant id (fallback: first variant)
  async function getFirstAvailableVariantIdByHandle(handle) {
    const res = await fetch(`/products/${handle}.js`, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`Failed to load product by handle: ${handle}`);
    const prod = await res.json();
    const available = prod.variants?.find((v) => v.available);
    return (available || prod.variants?.[0])?.id || null;
  }
  const toggleDropdown = (open) => {
    if (!sizeWrap) return;
    const dropdown = sizeWrap.querySelector(".variant-size-select__dropdown");
    if (!dropdown) return;
    if (open) {
      sizeWrap.classList.add("is-open");
      dropdown.style.display = "block";
    } else {
      sizeWrap.classList.remove("is-open");
      dropdown.style.display = "none";
    }
  };

  // Inline error helpers
  const showFieldError = (containerEl, message) => {
    if (!containerEl) return;
    let errorEl = containerEl.nextElementSibling;
    if (!errorEl || !errorEl.classList?.contains("variant-error")) {
      errorEl = document.createElement("p");
      errorEl.className = "variant-error";
      containerEl.after(errorEl);
    }
    errorEl.textContent = message || "";
  };

  const clearFieldError = (containerEl) => {
    if (!containerEl) return;
    const errorEl = containerEl.nextElementSibling;
    if (errorEl && errorEl.classList?.contains("variant-error")) {
      errorEl.remove();
    }
  };

  const getOptionIndexes = (product) => {
    const optionNames = product.options.map((o) => o.name);
    return {
      colorIndex: optionNames.findIndex((n) => /color/i.test(n)),
      sizeIndex: optionNames.findIndex((n) => /size/i.test(n)),
    };
  };

  // Normalize user-entered/option strings for safe comparison
  function normalize(value) {
    return (value || "").toString().toLowerCase().trim();
  }

  // Determine if current selections satisfy the bundle rule
  function shouldBundle(selectedColor, selectedSize, indexes) {
    const { colorIndex, sizeIndex } = indexes;
    const colorOk = colorIndex !== -1 && selectedColor && normalize(selectedColor) === BUNDLE_COLOR_VALUE;
    const sizeOk = sizeIndex !== -1 && selectedSize && normalize(selectedSize) === BUNDLE_SIZE_VALUE;
    return Boolean(colorOk && sizeOk);
  }

  // Validate that required selections are present
  function validateSelections(product, selectedColor, selectedSize) {
    const { colorIndex, sizeIndex } = getOptionIndexes(product);

    if (colorIndex !== -1 && !selectedColor) {
      showFieldError(colorWrap, "Please choose a color.");
      return { ok: false };
    }
    if (sizeIndex !== -1 && !selectedSize) {
      showFieldError(sizeWrap, "Please choose a size.");
      return { ok: false };
    }

    return { ok: true, indexes: { colorIndex, sizeIndex } };
  }

  // Find a product variant that matches the user's selections
  function findMatchingVariant(product, selectedColor, selectedSize, indexes) {
    const { colorIndex, sizeIndex } = indexes;
    return product.variants.find((v) => {
      const colorMatches =
        colorIndex === -1 || (selectedColor && v[`option${colorIndex + 1}`] === selectedColor);
      const sizeMatches =
        sizeIndex === -1 || (selectedSize && v[`option${sizeIndex + 1}`] === selectedSize);
      return colorMatches && sizeMatches;
    });
  }

  // Encapsulate the logic for adding the bonus product when eligible
  async function addBonusProductIfEligible(indexes, selectedColor, selectedSize) {
    const eligible = shouldBundle(selectedColor, selectedSize, indexes);
    if (!eligible) return;

    try {
      const bonusVariantId = await getFirstAvailableVariantIdByHandle(BONUS_PRODUCT_HANDLE);
      if (bonusVariantId) {
        await addVariantToCart(bonusVariantId, 1);
      } else {
        console.warn("Bonus product variant not found. Skipping bonus add-to-cart.");
      }
    } catch (err) {
      console.warn("Failed to add bonus product:", err);
    }
  }

  // Render color buttons
  function renderColorButtons(colors) {
    if (!colorWrap) return;
    colorWrap.innerHTML = "";

    colors.forEach((color) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "variant-color-btn";
      btn.setAttribute("aria-pressed", "false");
      btn.innerHTML = `
        <span class="variant-color-btn__swatch" style="background:${color}"></span>
        <span class="variant-color-btn__label">${color}</span>
      `;

      btn.addEventListener("click", () => {
        selectedColor = color;
        // Update active-state UI
        [...colorWrap.querySelectorAll("button")].forEach((b) => {
          b.classList.remove("is-active");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("is-active");
        btn.setAttribute("aria-pressed", "true");

        // Reset size selection when color changes
        selectedSize = null;
        // Clear any color-related error
        clearFieldError(colorWrap);
        renderSizeOptions();
      });

      colorWrap.appendChild(btn);
    });

    // Clear sizes until the user selects a color
    if (sizeWrap) sizeWrap.innerHTML = "";
  }

  // Render size dropdown based on the selected color
  function renderSizeOptions() {
    if (!sizeWrap || !currentProduct) return;

    const { colorIndex, sizeIndex } = getOptionIndexes(currentProduct);

    // Build base HTML for the size selector
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
        <ul class="variant-size-select__dropdown" style="display: none;"></ul>
      </div>
    `;

    // Ensure alignment reflects no selection state on (re)render
    sizeWrap.classList.remove("has-selection");

    // Compute valid sizes (filtered by color when applicable)
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

    // Populate size items
    sizes.forEach((size) => {
      const li = document.createElement("li");
      li.textContent = size;
      li.addEventListener("click", () => {
        selectedSize = size;
        setText(textSpan, size);
        toggleDropdown(false);

        // Mark selection
        dropdown.querySelectorAll("li").forEach((item) => item.classList.remove("is-selected"));
        li.classList.add("is-selected");
        // Clear any size-related error
        clearFieldError(sizeWrap);
        // Center-align trigger text when a size is selected
        sizeWrap.classList.add("has-selection");
      });
      dropdown.appendChild(li);
    });

    // Toggle dropdown using both triggers
    const handleToggle = (e) => {
      e.stopPropagation();
      const isOpen = sizeWrap.classList.contains("is-open");
      toggleDropdown(!isOpen);
    };
    trigger.addEventListener("click", handleToggle);
    arrowTrigger?.addEventListener("click", handleToggle);

    // Close dropdown when clicking outside (attach once per session)
    if (!sizeWrap.dataset.listenerAttached) {
      document.addEventListener("click", (e) => {
        if (!sizeWrap.contains(e.target)) {
          toggleDropdown(false);
        }
      });
      sizeWrap.dataset.listenerAttached = "true";
    }
  }

  // Open modal and inject basic data
  function openModal(data) {
    selectedColor = null;
    selectedSize = null;
    if (colorWrap) colorWrap.innerHTML = "";
    if (sizeWrap) sizeWrap.innerHTML = "";
    // Clear lingering errors from previous opens
    clearFieldError(colorWrap);
    clearFieldError(sizeWrap);

    setMedia(mediaImg, data.image, data.title);
    setText(titleEl, data.title);
    setText(priceEl, data.price);
    setText(descEl, data.description);

    modal.classList.add("is-open");
    // Lock page scroll while modal is open
    document.documentElement.classList.add("no-scroll");
    document.body.classList.add("no-scroll");
    document.addEventListener("keydown", onKeydown);
  }

  // Close modal
  function closeModal() {
    modal.classList.remove("is-open");
    // Re-enable page scroll when modal closes
    document.documentElement.classList.remove("no-scroll");
    document.body.classList.remove("no-scroll");
    document.removeEventListener("keydown", onKeydown);
  }

  // Accessibility: close on ESC
  function onKeydown(e) {
    if (e.key === "Escape") closeModal();
  }

  // Open modal when clicking the plus icon and load product data
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

    // Fetch product JSON by handle to build variant selectors
    const handle = item.getAttribute("data-handle");
    if (!handle) return;
    try {
      const res = await fetch(`/products/${handle}.js`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Failed to load product");
      currentProduct = await res.json();

      const colorOption = currentProduct.options.find((o) => /color/i.test(o.name));
      const colors = colorOption ? colorOption.values : [];
      renderColorButtons(colors);
      renderSizeOptions();
    } catch (err) {
      console.error(err);
    }
  });

  // Close modal via backdrop, close button, and clicks outside content
  backdrop?.addEventListener("click", closeModal);
  closeBtn?.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (!content) return;
    if (!content.contains(e.target)) closeModal();
  });

  // Add to cart with color and size validations
  addToCartBtn?.addEventListener("click", async (e) => {
    e.preventDefault();
    if (!currentProduct) return;

    // Step 1: validate selections
    const validation = validateSelections(currentProduct, selectedColor, selectedSize);
    if (!validation.ok) return;

    // Step 2: find matching variant
    const matchingVariant = findMatchingVariant(
      currentProduct,
      selectedColor,
      selectedSize,
      validation.indexes
    );

    if (!matchingVariant) {
      showFieldError(sizeWrap, "This variant is unavailable. Please choose different options.");
      return;
    }

    try {
      // Always add the currently selected product first
      await addVariantToCart(matchingVariant.id, 1);

      // Step 3: attempt to add bonus product when eligible
      await addBonusProductIfEligible(validation.indexes, selectedColor, selectedSize);

      // Step 4: wrap-up UX
      closeModal();
      document.dispatchEvent(
        new CustomEvent("product:added", { detail: { variantId: matchingVariant.id } })
      );
      window.location.href = "/cart";
    } catch (err) {
      console.error(err);
      alert("Could not add to cart. Please try again.");
    }
  });
});
