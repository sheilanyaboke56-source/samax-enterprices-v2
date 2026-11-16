const SUPABASE_URL = "https://htqzicbmlwwlycvtcfvy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_m9bc6NYfuinVNfOJ6lq3-w_C_V9Fgi4";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

// 2. APPLICATION STATE

let products = [];
let cart = [];

const $ = (id) => document.getElementById(id);

const money = (amount) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES"
  }).format(Number(amount) || 0);

// 3. LOAD PRODUCTS FROM SUPABASE

async function loadProductsFromDatabase() {
  const grid = $("productGrid");

  if (grid) {
    grid.textContent = "Loading products...";
  }

  try {
    const { data, error } = await supabaseClient
      .from("products")
      .select(
        "id, name, category, price, stock_quantity, image_url, description"
      )
      .order("name");

    if (error) throw error;

    products = data || [];

    renderProducts();
  } catch (error) {
    console.error("Product loading error:", error);

    if (grid) {
      grid.textContent =
        "Unable to load products. Please refresh and try again.";
    }
  }
}

// 4. DISPLAY PRODUCTS

function renderProducts() {
  const grid = $("productGrid");

  if (!grid) return;

  grid.replaceChildren();

  if (!products.length) {
    grid.textContent = "No products available at the moment.";
    return;
  }

  const search = $("searchInput")?.value.toLowerCase().trim() || "";
  const category = $("categoryFilter")?.value || "All";

  const filtered = products.filter((product) => {
    const matchesSearch =
      (product.name || "").toLowerCase().includes(search) ||
      (product.description || "").toLowerCase().includes(search);

    const matchesCategory =
      category === "All" || product.category === category;

    return matchesSearch && matchesCategory;
  });

  if (!filtered.length) {
    grid.textContent = "No matching products found.";
    return;
  }

  filtered.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";

    if (product.image_url) {
      const image = document.createElement("img");
      image.src = product.image_url;
      image.alt = product.name || "Samax product";
      image.loading = "lazy";
      card.appendChild(image);
    }

    const name = document.createElement("h3");
    name.textContent = product.name || "Unnamed product";

    const description = document.createElement("p");
    description.textContent = product.description || "";

    const price = document.createElement("strong");
    price.textContent = money(product.price);

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.textContent = "Add to Cart";
    addButton.disabled = Number(product.stock_quantity) <= 0;

    if (addButton.disabled) {
      addButton.textContent = "Out of Stock";
    }

    addButton.addEventListener("click", () => {
      addToCart(product.id);
    });

    card.append(name, description, price, addButton);
    grid.appendChild(card);
  });
}

// 5. SHOPPING CART

function addToCart(productId) {
  const product = products.find(
    (item) => String(item.id) === String(productId)
  );

  if (!product) return;

  const existing = cart.find(
    (item) => String(item.id) === String(productId)
  );

  const stock = Number(product.stock_quantity);

  if (existing) {
    if (existing.quantity >= stock) {
      alert("Sorry, there is no more stock available.");
      return;
    }

    existing.quantity++;
  } else {
    if (stock <= 0) {
      alert("This product is out of stock.");
      return;
    }

    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: 1
    });
  }

  renderCart();
}

function changeQuantity(productId, change) {
  const item = cart.find(
    (product) => String(product.id) === String(productId)
  );

  if (!item) return;

  const originalProduct = products.find(
    (product) => String(product.id) === String(productId)
  );

  if (!originalProduct) return;

  const newQuantity = item.quantity + change;

  if (newQuantity <= 0) {
    cart = cart.filter(
      (product) => String(product.id) !== String(productId)
    );
  } else if (newQuantity <= Number(originalProduct.stock_quantity)) {
    item.quantity = newQuantity;
  } else {
    alert("You have reached the available stock.");
  }

  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter(
    (item) => String(item.id) !== String(productId)
  );

  renderCart();
}

// 6. DISPLAY CART

function renderCart() {
  const container = $("cartItems");

  const count = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  if ($("cartCount")) {
    $("cartCount").textContent = count;
  }

  if ($("cartTotal")) {
    $("cartTotal").textContent = money(subtotal);
  }

  if ($("cartSubtotal")) {
    $("cartSubtotal").textContent = money(subtotal);
  }

  if (!container) return;

  container.replaceChildren();

  if (!cart.length) {
    container.textContent = "Your shopping cart is empty.";
    return;
  }

  cart.forEach((item) => {
    const row = document.createElement("div");
    row.className = "cart-row";

    const title = document.createElement("strong");
    title.textContent = item.name;

    const price = document.createElement("p");
    price.textContent = money(item.price * item.quantity);

    const decrease = document.createElement("button");
    decrease.type = "button";
    decrease.textContent = "−";
    decrease.addEventListener("click", () => {
      changeQuantity(item.id, -1);
    });

    const quantity = document.createElement("span");
    quantity.textContent = item.quantity;

    const increase = document.createElement("button");
    increase.type = "button";
    increase.textContent = "+";
    increase.addEventListener("click", () => {
      changeQuantity(item.id, 1);
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => {
      removeFromCart(item.id);
    });

    row.append(title, price, decrease, quantity, increase, remove);
    container.appendChild(row);
  });
}

// 7. DELIVERY AREA

function updateDeliveryFields() {
  const fulfilment = $("fulfilment");
  const area = $("deliveryArea");
  const label = $("areaLabel");

  if (!fulfilment) return;

  const isDelivery = fulfilment.value === "Delivery";

  if (area) {
    area.required = isDelivery;
    area.disabled = !isDelivery;

    if (!isDelivery) {
      area.value = "";
    }
  }

  if (label) {
    label.hidden = !isDelivery;
  }
}

// 8. PLACE ORDER DIRECTLY INTO SUPABASE

async function placeOrder(event) {
  event.preventDefault();

  if (!cart.length) {
    alert("Your cart is empty. Please add products first.");
    return;
  }

  const name = $("customerName")?.value.trim() || "";
  const phone = $("customerPhone")?.value.trim() || "";
  const fulfilment = $("fulfilment")?.value || "";
  const address = $("deliveryArea")?.value.trim() || "";
  const payment = $("paymentMethod")?.value || "";

  if (!name || !phone) {
    alert("Please enter your name and phone number.");
    return;
  }

  if (!fulfilment || !payment) {
    alert("Please select delivery and payment options.");
    return;
  }

  if (fulfilment === "Delivery" && !address) {
    alert("Please enter your delivery area.");
    return;
  }

  const submitButton = $("checkoutForm")?.querySelector(
    'button[type="submit"], input[type="submit"]'
  );

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Placing order...";
  }

  try {
    const items = cart.map((item) => ({
      product_id: String(item.id),
      quantity: Number(item.quantity)
    }));

    const { data, error } = await supabaseClient.rpc(
      "place_guest_order",
      {
        p_customer_name: name,
        p_customer_phone: phone,
        p_delivery_method: fulfilment,
        p_delivery_address: address,
        p_payment_method: payment,
        p_items: items
      }
    );

    if (error) throw error;

    alert(
      "Your order has been placed successfully!\nOrder number: " + data
    );

    cart = [];

    renderCart();

    $("checkoutForm")?.reset();

    updateDeliveryFields();

  } catch (error) {
    console.error("Order submission error:", error);

    alert(
      "We could not place your order. Please try again.\n" +
      error.message
    );

  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Place Order";
    }
  }
}
unction openCart() {
  const drawer = $("cartDrawer");
  if (!drawer) return;

  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
}

function closeCart() {
  const drawer = $("cartDrawer");
  if (!drawer) return;

  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
}

$("cartOpen")?.addEventListener("click", openCart);
$("cartClose")?.addEventListener("click", closeCart);
$("cartOverlay")?.addEventListener("click", closeCart);
// 9. EVENT LISTENERS

document.addEventListener("DOMContentLoaded", () => {

  $("searchInput")?.addEventListener("input", renderProducts);

  $("categoryFilter")?.addEventListener("change", renderProducts);

  $("fulfilment")?.addEventListener(
    "change",
    updateDeliveryFields
  );

  $("checkoutForm")?.addEventListener(
    "submit",
    placeOrder
  );

  if ($("year")) {
    $("year").textContent = new Date().getFullYear();
  }

  updateDeliveryFields();

  renderCart();

  loadProductsFromDatabase();

});
