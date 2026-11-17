const SUPABASE_URL = "https://htqzicbmlwwlycvtcfvy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_m9bc6NYfuinVNfOJ6lq3-w_C_V9Fgi4";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
let products = [];
let cart = [];
let activeCategory = "All";
const $ = (id) => document.getElementById(id);
const money = (amount) => new Intl.NumberFormat("en-KE", {style:"currency",currency:"KES",maximumFractionDigits:0}).format(Number(amount)||0);

async function loadProductsFromDatabase() {
  const grid = $("productGrid");
  if (grid) grid.innerHTML = '<div class="loading-state">Loading the Samax collection…</div>';
  try {
    const {data,error} = await supabaseClient.from("products")
      .select("id, name, category, price, stock_quantity, image_url, description")
      .order("name");
    if (error) throw error;
    products = data || [];
    renderFilters();
    renderProducts();
  } catch (error) {
    console.error("Product loading error:", error);
    if (grid) grid.innerHTML = '<div class="empty-state">We could not load the products. Please refresh and try again.</div>';
  }
}

function renderFilters() {
  const holder = $("filters");
  if (!holder) return;
  const categories = [...new Set(products.map(p => (p.category || "Other").trim()).filter(Boolean))];
  holder.replaceChildren();
  ["All", ...categories].forEach(category => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter" + (activeCategory === category ? " active" : "");
    button.dataset.category = category;
    button.textContent = category === "All" ? "All products" : category;
    button.addEventListener("click", () => {
      activeCategory = category;
      renderFilters();
      renderProducts();
    });
    holder.appendChild(button);
  });
}

function renderProducts() {
  const grid = $("productGrid");
  if (!grid) return;
  grid.replaceChildren();
  const search = ($("searchInput")?.value || "").toLowerCase().trim();
  const filtered = products.filter(product => {
    const text = `${product.name||""} ${product.description||""} ${product.category||""}`.toLowerCase();
    return text.includes(search) && (activeCategory === "All" || (product.category||"Other").trim() === activeCategory);
  });
  if (!filtered.length) {
    grid.innerHTML = '<div class="empty-state">No products found. Try another search or category.</div>';
    return;
  }
  filtered.forEach(product => {
    const card = document.createElement("article");
    card.className = "product-card";
    const imageWrap = document.createElement("div");
    imageWrap.className = "product-image-wrap";
    if (product.image_url) {
      const img = document.createElement("img");
      img.src = product.image_url;
      img.alt = product.name || "Samax product";
      img.loading = "lazy";
      img.onerror = () => { imageWrap.innerHTML = '<div class="image-placeholder">S</div>'; };
      imageWrap.appendChild(img);
    } else {
      imageWrap.innerHTML = '<div class="image-placeholder">S</div>';
    }
    const info = document.createElement("div");
    info.className = "product-info";
    const category = document.createElement("span");
    category.className = "product-category";
    category.textContent = product.category || "Everyday essentials";
    const name = document.createElement("h3");
    name.textContent = product.name || "Unnamed product";
    const description = document.createElement("p");
    description.textContent = product.description || "A useful find for everyday living.";
    const bottom = document.createElement("div");
    bottom.className = "product-bottom";
    const price = document.createElement("strong");
    price.className = "product-price";
    price.textContent = money(product.price);
    const add = document.createElement("button");
    add.type = "button";
    add.className = "add-button";
    add.disabled = Number(product.stock_quantity) <= 0;
    add.textContent = add.disabled ? "Out of stock" : "Add to bag +";
    add.addEventListener("click", () => addToCart(product.id));
    bottom.append(price, add);
    info.append(category, name, description, bottom);
    card.append(imageWrap, info);
    grid.appendChild(card);
  });
}

function addToCart(productId) {
  const product = products.find(p => String(p.id) === String(productId));
  if (!product) return;
  const stock = Number(product.stock_quantity) || 0;
  const existing = cart.find(item => String(item.id) === String(productId));
  if (existing) {
    if (existing.quantity >= stock) return alert("You have reached the available stock.");
    existing.quantity++;
  } else {
    if (stock <= 0) return alert("This product is out of stock.");
    cart.push({id:product.id,name:product.name,price:Number(product.price)||0,quantity:1});
  }
  renderCart();
  openCart();
}

function changeQuantity(productId, change) {
  const item = cart.find(p => String(p.id) === String(productId));
  const product = products.find(p => String(p.id) === String(productId));
  if (!item || !product) return;
  const next = item.quantity + change;
  if (next <= 0) cart = cart.filter(p => String(p.id) !== String(productId));
  else if (next <= Number(product.stock_quantity)) item.quantity = next;
  else return alert("You have reached the available stock.");
  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter(item => String(item.id) !== String(productId));
  renderCart();
}

function renderCart() {
  const container = $("cartItems");
  const count = cart.reduce((sum,item) => sum + item.quantity,0);
  const subtotal = cart.reduce((sum,item) => sum + item.price * item.quantity,0);
  if ($("cartCount")) $("cartCount").textContent = count;
  if ($("drawerItemCount")) $("drawerItemCount").textContent = `(${count})`;
  if ($("cartTotal")) $("cartTotal").textContent = money(subtotal);
  if (!container) return;
  container.replaceChildren();
  if (!cart.length) {
    const empty = document.createElement("p");
    empty.className = "empty-cart";
    empty.textContent = "Your bag is waiting for something lovely.";
    container.appendChild(empty);
    return;
  }
  cart.forEach(item => {
    const row = document.createElement("div");
    row.className = "cart-row";
    const details = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = item.name;
    const price = document.createElement("p");
    price.textContent = money(item.price * item.quantity);
    details.append(title,price);
    const controls = document.createElement("div");
    controls.className = "quantity-controls";
    const minus = document.createElement("button");
    minus.type = "button"; minus.textContent = "−";
    minus.setAttribute("aria-label",`Decrease ${item.name}`);
    minus.addEventListener("click",() => changeQuantity(item.id,-1));
    const quantity = document.createElement("span");
    quantity.textContent = item.quantity;
    const plus = document.createElement("button");
    plus.type = "button"; plus.textContent = "+";
    plus.setAttribute("aria-label",`Increase ${item.name}`);
    plus.addEventListener("click",() => changeQuantity(item.id,1));
    controls.append(minus,quantity,plus);
    const remove = document.createElement("button");
    remove.type = "button"; remove.className = "remove-item"; remove.textContent = "Remove";
    remove.addEventListener("click",() => removeFromCart(item.id));
    row.append(details,controls,remove);
    container.appendChild(row);
  });
}

function updateDeliveryFields() {
  const fulfilment = $("fulfilment");
  const area = $("deliveryArea");
  const label = $("areaLabel");
  if (!fulfilment) return;
  const isDelivery = fulfilment.value === "Delivery";
  if (area) { area.required = isDelivery; area.disabled = !isDelivery; if (!isDelivery) area.value = ""; }
  if (label) label.hidden = !isDelivery;
}

function openCart() {
  $("cartDrawer")?.classList.add("open");
  $("cartDrawer")?.setAttribute("aria-hidden","false");
  if ($("drawerBackdrop")) $("drawerBackdrop").hidden = false;
  document.body.classList.add("drawer-open");
}
function closeCart() {
  $("cartDrawer")?.classList.remove("open");
  $("cartDrawer")?.setAttribute("aria-hidden","true");
  if ($("drawerBackdrop")) $("drawerBackdrop").hidden = true;
  document.body.classList.remove("drawer-open");
}

async function placeOrder(event) {
  event.preventDefault();
  if (!cart.length) return alert("Your cart is empty. Please add products first.");
  const name = $("customerName")?.value.trim() || "";
  const phone = $("customerPhone")?.value.trim() || "";
  const fulfilment = $("fulfilment")?.value || "";
  const address = $("deliveryArea")?.value.trim() || "";
  const payment = $("paymentMethod")?.value || "";
  if (!name || !phone) return alert("Please enter your name and phone number.");
  if (fulfilment === "Delivery" && !address) return alert("Please enter your delivery area.");
  const button = $("checkoutForm")?.querySelector('button[type="submit"]');
  if (button) { button.disabled = true; button.textContent = "Placing your order…"; }
  try {
    const items = cart.map(item => ({product_id:String(item.id),quantity:Number(item.quantity)}));
    const {data,error} = await supabaseClient.rpc("place_guest_order",{
      p_customer_name:name,p_customer_phone:phone,p_delivery_method:fulfilment,
      p_delivery_address:address,p_payment_method:payment,p_items:items
    });
    if (error) throw error;
    alert("Your order has been placed successfully!\nOrder number: " + data);
    cart = [];
    renderCart();
    $("checkoutForm")?.reset();
    updateDeliveryFields();
    closeCart();
  } catch (error) {
    console.error("Order submission error:",error);
    alert("We could not place your order. Please try again.\n" + (error.message || "Unknown error"));
  } finally {
    if (button) { button.disabled = false; button.innerHTML = 'Place my order <span>↗</span>'; }
  }
}

document.addEventListener("DOMContentLoaded",() => {
  $("searchInput")?.addEventListener("input",renderProducts);
  $("cartOpen")?.addEventListener("click",openCart);
  $("cartClose")?.addEventListener("click",closeCart);
  $("drawerBackdrop")?.addEventListener("click",closeCart);
  $("fulfilment")?.addEventListener("change",updateDeliveryFields);
  $("checkoutForm")?.addEventListener("submit",placeOrder);
  document.addEventListener("keydown",event => { if (event.key === "Escape") closeCart(); });
  if ($("year")) $("year").textContent = new Date().getFullYear();
  updateDeliveryFields();
  renderCart();
  loadProductsFromDatabase();
});
