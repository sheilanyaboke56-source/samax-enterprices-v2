const SUPABASE_URL = "PASTE_YOUR_PROJECT_URL_HERE";
const SUPABASE_PUBLISHABLE_KEY = "PASTE_YOUR_PUBLISHABLE_KEY_HERE";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
const sampleProducts = [
  { id: 1, name: "Storage Basket", category: "Household", price: 450, description: "Everyday home storage." },
  { id: 2, name: "Kitchen Utensil Set", category: "Kitchenware", price: 850, description: "Useful kitchen essentials." },
  { id: 3, name: "Dishwashing Liquid", category: "Cleaning Supplies", price: 180, description: "For everyday dish cleaning." },
  { id: 4, name: "Bathing Soap", category: "Personal Care", price: 120, description: "An everyday personal-care essential." },
  { id: 5, name: "Laundry Basket", category: "Household", price: 650, description: "Keep laundry organised." },
  { id: 6, name: "Food Storage Containers", category: "Kitchenware", price: 500, description: "Store kitchen ingredients neatly." }
];

let products = [];
let cart = [];
let activeCategory = "All";

const $ = (id) => document.getElementById(id);
const money = (amount) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0
  }).format(amount);

function renderProducts() {
  const grid = $("productGrid");
  if (!grid) return;

  const query = ($("searchInput")?.value || "").trim().toLowerCase();

  const filtered = products.filter((p) => {
    const matchesCategory =
      activeCategory === "All" || p.category === activeCategory;
    const matchesSearch =
      `${p.name} ${p.category} ${p.description || ""}`
        .toLowerCase()
        .includes(query);

    return matchesCategory && matchesSearch;
  });

  if (!filtered.length) {
    grid.innerHTML = "<p>No matching products found. Try another search.</p>";
    return;
  }

  grid.replaceChildren();

  filtered.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";

    const category = document.createElement("p");
    category.className = "eyebrow";
    category.textContent = product.category;

    const title = document.createElement("h3");
    title.textContent = product.name;

    const description = document.createElement("p");
    description.textContent = product.description || "";

    const price = document.createElement("strong");
    price.textContent = money(Number(product.price));

    const addButton = document.createElement("button");
    addButton.className = "button gold-button";
    addButton.type = "button";
    addButton.textContent = "Add to cart";
    addButton.addEventListener("click", () => addToCart(product.id));

    card.append(category, title, description, price, addButton);
    grid.appendChild(card);
  });
}

function addToCart(productId) {
  const product = products.find((p) => p.id === productId);
  if (!product) return;

  const item = cart.find((p) => p.id === productId);
  if (item) {
    item.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  renderCart();
}

function renderCart() {
  const itemsContainer = $("cartItems");
  if (!itemsContainer) return;

  itemsContainer.replaceChildren();

  cart.forEach((item) => {
    const row = document.createElement("div");
    row.className = "cart-item";

    const details = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = item.name;

    const info = document.createElement("p");
    info.textContent = `${item.quantity} × ${money(Number(item.price))}`;

    details.append(name, info);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", `Remove ${item.name}`);
    remove.addEventListener("click", () => {
      cart = cart.filter((p) => p.id !== item.id);
      renderCart();
    });

    row.append(details, remove);
    itemsContainer.appendChild(row);
  });

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  if ($("cartCount")) $("cartCount").textContent = String(count);
  if ($("cartTotal")) $("cartTotal").textContent = money(subtotal);
}

function openCart() {
  $("cartDrawer")?.classList.add("open");
  $("cartDrawer")?.setAttribute("aria-hidden", "false");
  if ($("drawerBackdrop")) $("drawerBackdrop").hidden = false;
}

function closeCart() {
  $("cartDrawer")?.classList.remove("open");
  $("cartDrawer")?.setAttribute("aria-hidden", "true");
  if ($("drawerBackdrop")) $("drawerBackdrop").hidden = true;
}

document.querySelectorAll("#filters [data-category]").forEach((button) => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.category || "All";

    document.querySelectorAll("#filters [data-category]").forEach((b) => {
      b.classList.toggle("active", b === button);
    });

    renderProducts();
  });
});

$("searchInput")?.addEventListener("input", renderProducts);
$("cartOpen")?.addEventListener("click", openCart);
$("cartClose")?.addEventListener("click", closeCart);
$("drawerBackdrop")?.addEventListener("click", closeCart);

$("fulfilment")?.addEventListener("change", (event) => {
  const isDelivery = event.target.value === "Delivery";
  const area = $("deliveryArea");
  const label = $("areaLabel");

  if (area) {
    area.required = isDelivery;
    area.disabled = !isDelivery;
    if (!isDelivery) area.value = "";
  }
  if (label) label.hidden = !isDelivery;
});

$("checkoutForm")?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!cart.length) {
    alert("Your cart is empty. Please add products first.");
    return;
  }

  const name = $("customerName")?.value.trim() || "";
  const phone = $("customerPhone")?.value.trim() || "";
  const fulfilment = $("fulfilment")?.value || "Delivery";
  const area = $("deliveryArea")?.value.trim() || "";
  const payment = $("paymentMethod")?.value || "M-Pesa";

  const lines = cart.map(
    (item) =>
      `- ${item.name} x ${item.quantity}: ${money(Number(item.price) * item.quantity)}`
  );

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  const message = [
    "Hello Samax Enterprises, I would like to place an order:",
    "",
    ...lines,
    "",
    `Estimated subtotal: ${money(subtotal)}`,
    `Customer: ${name}`,
    `Phone: ${phone}`,
    `Fulfilment: ${fulfilment}`,
    ...(fulfilment === "Delivery" ? [`Delivery area: ${area}`] : []),
    `Preferred payment: ${payment}`,
    "",
    "Please confirm stock availability, final price and payment instructions."
  ].join("\n");

  window.open(
    `https://wa.me/254723752583?text=${encodeURIComponent(message)}`,
    "_blank",
    "noopener,noreferrer"
  );
});

if ($("year")) $("year").textContent = String(new Date().getFullYear());

renderProducts();
renderCart();
