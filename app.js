const products = [
 {id:'SAM-DEMO-001',name:'Everyday Storage Basket',category:'Household',description:'A practical example item for home organisation.',price:450,icon:'🧺'},
 {id:'SAM-DEMO-002',name:'Kitchen Mixing Bowl',category:'Kitchenware',description:'An example kitchen essential for your catalogue.',price:350,icon:'🥣'},
 {id:'SAM-DEMO-003',name:'Cleaning Brush',category:'Cleaning Supplies',description:'A sample cleaning product listing.',price:180,icon:'🧹'},
 {id:'SAM-DEMO-004',name:'Reusable Water Bottle',category:'Other',description:'Replace this listing with a real shop product.',price:500,icon:'🧴'},
 {id:'SAM-DEMO-005',name:'Personal Care Set',category:'Personal Care',description:'Sample listing; final contents and price to confirm.',price:650,icon:'🧼'},
 {id:'SAM-DEMO-006',name:'Food Storage Containers',category:'Kitchenware',description:'An illustrative listing for household essentials.',price:800,icon:'🍱'},
 {id:'SAM-DEMO-007',name:'Laundry Basket',category:'Household',description:'Sample product only — update before launch.',price:700,icon:'🧺'},
 {id:'SAM-DEMO-008',name:'Microfibre Cloth Set',category:'Cleaning Supplies',description:'Sample set listing for the demo storefront.',price:250,icon:'🧽'}
];
const money = n => new Intl.NumberFormat('en-KE',{style:'currency',currency:'KES',maximumFractionDigits:0}).format(n);
let selectedCategory='All'; let cart={};
const grid=document.getElementById('productGrid'); const cartDrawer=document.getElementById('cartDrawer'); const backdrop=document.getElementById('drawerBackdrop');
function renderProducts(){const term=document.getElementById('searchInput').value.trim().toLowerCase();const shown=products.filter(p=>(selectedCategory==='All'||p.category===selectedCategory)&&`${p.name} ${p.category} ${p.description}`.toLowerCase().includes(term));grid.innerHTML=shown.length?shown.map(p=>`<article class="product-card"><div class="product-art" aria-hidden="true">${p.icon}</div><div class="product-info"><span class="category-label">${p.category}</span><h3>${p.name}</h3><p>${p.description}</p><div class="product-foot"><span class="price">${money(p.price)}</span><button class="add-button" data-add="${p.id}">Add to cart +</button></div></div></article>`).join(''):'<div class="no-results">No products match your search. Try another term.</div>';grid.querySelectorAll('[data-add]').forEach(b=>b.addEventListener('click',()=>{cart[b.dataset.add]=(cart[b.dataset.add]||0)+1;renderCart();openCart();}));}
function renderCart(){const entries=Object.entries(cart).filter(([,q])=>q>0);const count=entries.reduce((s,[,q])=>s+q,0);document.getElementById('cartCount').textContent=count;document.getElementById('cartTotal').textContent=money(entries.reduce((s,[id,q])=>s+products.find(p=>p.id===id).price*q,0));const holder=document.getElementById('cartItems');if(!entries.length){holder.innerHTML='<div class="empty-cart">Your cart is empty.<br>Browse the shop to add items.</div>';return;}holder.innerHTML=entries.map(([id,q])=>{const p=products.find(x=>x.id===id);return `<div class="cart-row"><div><strong>${p.name}</strong><small>${money(p.price)} each · ${money(p.price*q)}</small></div><div class="qty-controls"><button data-minus="${id}" aria-label="Remove one ${p.name}">−</button><span>${q}</span><button data-plus="${id}" aria-label="Add one ${p.name}">+</button></div></div>`}).join('');holder.querySelectorAll('[data-minus]').forEach(b=>b.addEventListener('click',()=>{cart[b.dataset.minus]--;if(cart[b.dataset.minus]<=0)delete cart[b.dataset.minus];renderCart()}));holder.querySelectorAll('[data-plus]').forEach(b=>b.addEventListener('click',()=>{cart[b.dataset.plus]++;renderCart()}));}
function openCart(){cartDrawer.classList.add('open');cartDrawer.setAttribute('aria-hidden','false');backdrop.hidden=false;document.body.style.overflow='hidden';}
function closeCart(){cartDrawer.classList.remove('open');cartDrawer.setAttribute('aria-hidden','true');backdrop.hidden=true;document.body.style.overflow='';}
document.getElementById('filters').querySelectorAll('[data-category]').forEach(b=>b.addEventListener('click',()=>{selectedCategory=b.dataset.category;document.querySelectorAll('.filter').forEach(x=>x.classList.toggle('active',x===b));renderProducts()}));
document.getElementById('searchInput').addEventListener('input',renderProducts);document.getElementById('cartOpen').addEventListener('click',openCart);document.getElementById('cartClose').addEventListener('click',closeCart);backdrop.addEventListener('click',closeCart);document.addEventListener('keydown',e=>{if(e.key==='Escape')closeCart()});
const fulfilment=document.getElementById('fulfilment');const areaLabel=document.getElementById('areaLabel');const areaInput=document.getElementById('deliveryArea');fulfilment.addEventListener('change',()=>{const delivery=fulfilment.value==='Delivery';areaLabel.style.display=delivery?'grid':'none';areaInput.required=delivery;});
document.getElementById('checkoutForm').addEventListener('submit',e=>{e.preventDefault();const entries=Object.entries(cart).filter(([,q])=>q>0);if(!entries.length){alert('Your cart is empty. Add a product first.');return;}const name=document.getElementById('customerName').value.trim();const phone=document.getElementById('customerPhone').value.trim();const mode=fulfilment.value;const area=areaInput.value.trim();if(mode==='Delivery'&&!area){alert('Please enter your delivery area.');areaInput.focus();return;}const subtotal=entries.reduce((s,[id,q])=>s+products.find(p=>p.id===id).price*q,0);const lines=entries.map(([id,q])=>{const p=products.find(x=>x.id===id);return `• ${p.name} × ${q} — ${money(p.price*q)}`}).join('
');const message=`Hello Samax Enterprises, I would like to place an order.

Name: ${name}
Customer phone: ${phone}
Fulfilment: ${mode}${mode==='Delivery'?'
Delivery area: '+area:''}
Payment preference: ${document.getElementById('paymentMethod').value}

Items:
${lines}

Demo catalogue subtotal: ${money(subtotal)}

Please confirm actual stock, final prices and delivery charges before payment. I understand this website is a starter demo and the displayed products/prices are examples.`;window.open(`https://wa.me/254723752583?text=${encodeURIComponent(message)}`,'_blank','noopener,noreferrer');});
document.getElementById('year').textContent=new Date().getFullYear();renderProducts();renderCart();
if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
