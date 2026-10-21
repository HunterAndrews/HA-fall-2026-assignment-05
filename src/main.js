
const PRODUCTS_URL = "./src/data/products.json";
const PRODUCTS_PER_PAGE = 5;

function updatePageIndicator(currentPage, totalProducts) {
  const indicator = document.querySelector("#page-indicator");

  if (!indicator) return;

  const totalPages = Math.max(
    1,
    Math.ceil(totalProducts / PRODUCTS_PER_PAGE)
  );

  indicator.textContent = `Page ${currentPage} of ${totalPages}`;
}

let products = [];
let activeProductIndex = 0;
let activeStorePage = 1;

function getProductName(product) {
  return product.name ?? product.title ?? "Untitled Product";
}

function getProductImage(product) {
  return (
    product.image ??
    product.imageUrl ??
    product.imagePath ??
    product.img ??
    ""
  );
}

function getProductDescription(product) {
  return product.description ?? "Explore this item in the catalog.";
}

function getProductCategory(product) {
  return product.category ?? "Catalog Item";
}

function getProductPrice(product) {
  const price = product.price ?? product.mockPrice;

  if (price === undefined || price === null || price === "") {
    return "";
  }

  if (typeof price === "number") {
    return price.toLocaleString("en-US", {
      style: "currency",
      currency: "USD"
    });
  }

  const numericPrice = Number(String(price).replace(/[$,]/g, ""));

  if (Number.isFinite(numericPrice) && String(price).trim() !== "") {
    return numericPrice.toLocaleString("en-US", {
      style: "currency",
      currency: "USD"
    });
  }

  return String(price);
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
}

function createProductImage(product, className) {
  const frame = createElement("div", className);
  const imagePath = getProductImage(product);

  if (!imagePath) {
    frame.appendChild(
      createElement("span", "image-placeholder", "Image unavailable")
    );
    return frame;
  }

  const image = document.createElement("img");
  image.src = imagePath;
  image.alt = getProductName(product);
  image.loading = "lazy";

  image.addEventListener("error", () => {
    frame.replaceChildren(
      createElement("span", "image-placeholder", "Image unavailable")
    );
  }, { once: true });

  frame.appendChild(image);
  return frame;
}

function createTextLink(text, href, className = "text-link") {
  const link = createElement("a", className);
  link.href = href;
  link.appendChild(document.createTextNode(text + " "));

  const arrow = createElement("span", "", "↗");
  arrow.setAttribute("aria-hidden", "true");
  link.appendChild(arrow);

  return link;
}
// animations
function initializeIntro() {
  const intro = document.querySelector("#intro-screen");

  if (!intro) {
    return;
  }

  let hasSeenIntro = false;

  try {
    hasSeenIntro = sessionStorage.getItem("ma-intro-seen") === "true";
  } catch {
    // Continue normally if browser storage is unavailable.
  }

  if (hasSeenIntro) {
    intro.remove();
    return;
  }

  try {
    sessionStorage.setItem("ma-intro-seen", "true");
  } catch {
    // intro will still work for this page view
  }

  window.setTimeout(() => {
    intro.classList.add("intro-hidden");

    window.setTimeout(() => {
      intro.remove();
    }, 650);
  }, 1200);
}

// homepage product carousel, slidier dots
function renderFeaturedProduct() {
  const container = document.querySelector("#featured-product");

  if (!container || products.length === 0) {
    return;
  }

  const product = products[activeProductIndex];
  const fragment = document.createDocumentFragment();

  fragment.appendChild(
    createProductImage(product, "product-image-frame")
  );

  const info = createElement("div", "featured-product-info");

  info.appendChild(
    createElement("p", "product-category", getProductCategory(product))
  );

  info.appendChild(
    createElement("h2", "", getProductName(product))
  );

  info.appendChild(
    createElement("p", "product-description", getProductDescription(product))
  );

  const price = getProductPrice(product);

  if (price) {
    info.appendChild(createElement("p", "product-price", price));
  }

  info.appendChild(
    createTextLink("View the store", "./store.html")
  );

  fragment.appendChild(info);

  container.replaceChildren(fragment);

  // animation restart
  container.classList.remove("product-animate");
  void container.offsetWidth;
  container.classList.add("product-animate");

  const counter = document.querySelector("#carousel-counter");

  if (counter) {
    const current = String(activeProductIndex + 1).padStart(2, "0");
    const total = String(products.length).padStart(2, "0");
    counter.textContent = `${current} / ${total}`;
  }

  renderCarouselDots();
}

function renderCarouselDots() {
  const dotsContainer = document.querySelector("#carousel-dots");

  if (!dotsContainer) {
    return;
  }

  const fragment = document.createDocumentFragment();

  products.forEach((product, index) => {
    const dot = document.createElement("button");

    dot.type = "button";
    dot.className = "carousel-dot";
    dot.setAttribute(
      "aria-label",
      `Show product ${index + 1}: ${getProductName(product)}`
    );

    if (index === activeProductIndex) {
      dot.classList.add("active");
      dot.setAttribute("aria-current", "true");
    }

    dot.addEventListener("click", () => {
      activeProductIndex = index;
      renderFeaturedProduct();
    });

    fragment.appendChild(dot);
  });

  dotsContainer.replaceChildren(fragment);
}

function moveCarousel(direction) {
  if (products.length === 0) {
    return;
  }

  activeProductIndex =
    (activeProductIndex + direction + products.length) % products.length;

  renderFeaturedProduct();
}

function initializeCarousel() {
  const previousButton = document.querySelector("#previous-product");
  const nextButton = document.querySelector("#next-product");

  previousButton?.addEventListener("click", () => {
    moveCarousel(-1);
  });

  nextButton?.addEventListener("click", () => {
    moveCarousel(1);
  });

  // moving between products uysing keyboard
  const carousel = document.querySelector("#featured-carousel");

  carousel?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      moveCarousel(-1);
    }

    if (event.key === "ArrowRight") {
      moveCarousel(1);
    }
  });
}

// store catalog and pagination
function renderStorePage(page = 1) {
  const container = document.querySelector("#product-container");
  const pagination = document.querySelector("#pagination");

  if (!container || !pagination) {
    return;
  }

  const totalPages = Math.max(
    1,
    Math.ceil(products.length / PRODUCTS_PER_PAGE)
  );

  activeStorePage = Math.min(Math.max(1, page), totalPages);

  const startIndex = (activeStorePage - 1) * PRODUCTS_PER_PAGE;
  const visibleProducts = products.slice(
    startIndex,
    startIndex + PRODUCTS_PER_PAGE
  );

  if (visibleProducts.length === 0) {
    container.replaceChildren(
      createElement("p", "error-message", "No products are available.")
    );
    pagination.replaceChildren();
    return;
  }

  const fragment = document.createDocumentFragment();

  visibleProducts.forEach((product) => {
    const card = createElement("article", "store-product");

    card.appendChild(
      createProductImage(product, "store-product-image")
    );

    const info = createElement("div", "store-product-info");

    info.appendChild(
      createElement("p", "product-category", getProductCategory(product))
    );

    info.appendChild(
      createElement("h2", "", getProductName(product))
    );

    info.appendChild(
      createElement("p", "product-description", getProductDescription(product))
    );

    const price = getProductPrice(product);

    if (price) {
      info.appendChild(createElement("p", "product-price", price));
    }

    card.appendChild(info);
    fragment.appendChild(card);
  });

  container.replaceChildren(fragment);

  updatePageIndicator(activeStorePage, products.length);    // Creates page 2 of 3, etc.

  renderPagination(totalPages);

  const count = document.querySelector("#catalog-count");

  if (count) {
    count.textContent = `${products.length} ITEMS`;
  }
}

function renderPagination(totalPages) {
  const pagination = document.querySelector("#pagination");

  if (!pagination) {
    return;
  }

  const fragment = document.createDocumentFragment();

  function addPageButton(label, page, options = {}) {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = label;

    if (options.active) {
      button.classList.add("active");
      button.setAttribute("aria-current", "page");
    }

    if (options.disabled) {
      button.disabled = true;
    }

    button.addEventListener("click", () => {
      renderStorePage(page);
      document.querySelector("#product-container")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });

    fragment.appendChild(button);
  }

  addPageButton("←", activeStorePage - 1, {
    disabled: activeStorePage === 1
  });

  for (let page = 1; page <= totalPages; page += 1) {
    addPageButton(String(page), page, {
      active: page === activeStorePage
    });
  }

  addPageButton("→", activeStorePage + 1, {
    disabled: activeStorePage === totalPages
  });

  pagination.replaceChildren(fragment);
}

// load local product data
async function loadProducts() {
  try {
    const response = await fetch(PRODUCTS_URL);

    if (!response.ok) {
      throw new Error(`Catalog request failed: ${response.status}`);
    }

    const data = await response.json();

    products = Array.isArray(data) ? data : data.products;

    if (!Array.isArray(products)) {
      throw new Error(
        "Expected products.json to contain an array of products."
      );
    }

    if (products.length === 0) {
      throw new Error("The product catalog is empty.");
    }

    renderFeaturedProduct();
    renderStorePage(1);
  } catch (error) {
    console.error("Unable to load the product catalog:", error);

    const featured = document.querySelector("#featured-product");

    if (featured) {
      featured.replaceChildren(
        createElement(
          "p",
          "error-message",
          "The catalog could not be loaded. Check the products.json file and image paths."
        )
      );
    }

    const store = document.querySelector("#product-container");

    if (store) {
      store.replaceChildren(
        createElement(
          "p",
          "error-message",
          "Unable to load products. Check the browser console for details."
        )
      );
    }
  }
}

// start here kinda
initializeIntro();
initializeCarousel();
loadProducts();
