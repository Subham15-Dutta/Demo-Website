// app.js — simple client-side e-commerce demo
const products = [
  {id:1,name:'Classic Tee',price:29.99,category:'clothing',image:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop'},
  {id:2,name:'Smartwatch X',price:199.99,category:'gadgets',image:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop'},
  {id:3,name:'Coffee Maker',price:89.99,category:'home',image:'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&h=300&fit=crop'},
  {id:4,name:'Running Shoes',price:119.99,category:'clothing',image:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop'},
  {id:5,name:'Bluetooth Speaker',price:49.99,category:'gadgets',image:'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=300&fit=crop'},
  {id:6,name:'Desk Lamp',price:34.99,category:'home',image:'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=300&fit=crop'},
  {id:7,name:'Denim Jacket',price:79.99,category:'clothing',image:'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=300&fit=crop'},
  {id:8,name:'Wireless Earbuds',price:129.99,category:'gadgets',image:'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400&h=300&fit=crop'}
];

// Cart represented as Map of productId -> qty
let cart = {};

// DOM refs
const productsEl = document.getElementById('products');
const cartBtn = document.getElementById('cartBtn');
const cartCount = document.getElementById('cartCount');
const cartDrawer = document.getElementById('cartDrawer');
const cartItemsEl = document.getElementById('cartItems');
const cartSubtotalEl = document.getElementById('cartSubtotal');
const closeCartBtn = document.getElementById('closeCart');
const clearCartBtn = document.getElementById('clearCart');
const checkoutBtn = document.getElementById('checkoutBtn');
const searchInput = document.getElementById('search');
const categoryFilter = document.getElementById('categoryFilter');
const maxPriceRange = document.getElementById('maxPrice');
const maxPriceVal = document.getElementById('maxPriceVal');

// init
function init(){
  loadCart();
  renderProducts();
  updateCartUI();
  attachEvents();
}

function attachEvents(){
  cartBtn.addEventListener('click',openCart);
  closeCartBtn.addEventListener('click',closeCart);
  clearCartBtn.addEventListener('click',clearCart);
  checkoutBtn.addEventListener('click',checkout);
  searchInput.addEventListener('input',debounce(renderProducts,250));
  categoryFilter.addEventListener('change',renderProducts);
  maxPriceRange.addEventListener('input',()=>{maxPriceVal.textContent=`$${maxPriceRange.value}`;renderProducts();});

  // Close cart when clicking outside
  document.addEventListener('click',(ev)=>{
    if(!cartDrawer.hidden && !cartDrawer.contains(ev.target) && !cartBtn.contains(ev.target)){
      closeCart();
    }
  });

  // Close cart on Escape key
  document.addEventListener('keydown',(ev)=>{
    if(ev.key === 'Escape' && !cartDrawer.hidden){
      closeCart();
    }
  });

  document.getElementById('contactForm').addEventListener('submit',ev=>{
    ev.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const msg = document.getElementById('msg').value;
    // For demo: show simple message and clear
    document.getElementById('formResult').textContent = `Thanks, ${name}! We'll reach out to ${email}.`;
    ev.target.reset();
  });
}

function renderProducts(){
  const q = (searchInput.value || '').toLowerCase();
  const category = categoryFilter.value;
  const maxPrice = Number(maxPriceRange.value);
  productsEl.innerHTML = '';
  const filtered = products.filter(p=>{
    if(category !== 'all' && p.category !== category) return false;
    if(p.price > maxPrice) return false;
    if(q && !(p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))) return false;
    return true;
  });
  if(filtered.length === 0){
    productsEl.innerHTML = '<div class="card">No products found.</div>';
    return;
  }
  for(const p of filtered){
    const el = document.createElement('article');
    el.className = 'product-card';
    el.innerHTML = `
      <div class="product-thumb"><img src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy"></div>
      <div class="product-body">
        <h4 class="product-title">${escapeHtml(p.name)}</h4>
        <div class="product-meta">${escapeHtml(p.category)}</div>
        <div class="price">$${p.price.toFixed(2)}</div>
        <div class="actions">
          <button class="btn" data-id="${p.id}" aria-label="View ${escapeHtml(p.name)}">View</button>
          <button class="btn primary" data-add="${p.id}">Add to cart</button>
        </div>
      </div>
    `;
    // Add error handling for images
    const img = el.querySelector('img');
    if(img){
      img.addEventListener('error', function(){
        this.src = 'https://via.placeholder.com/400x300/e2e8f0/94a3b8?text=' + encodeURIComponent(escapeHtml(p.name));
        this.onerror = null; // Prevent infinite loop
      });
      img.addEventListener('load', function(){
        this.style.opacity = '1';
      });
      img.style.opacity = '0';
      img.style.transition = 'opacity 0.3s ease-in';
    }
    // view button not implemented (could open modal). Keep simple.
    el.querySelector('[data-add]')?.addEventListener('click',()=>addToCart(p.id));
    productsEl.appendChild(el);
  }
}

function addToCart(id){
  id = String(id);
  cart[id] = (cart[id]||0) + 1;
  saveCart();
  updateCartUI();
}

function saveCart(){
  try{localStorage.setItem('demo_cart', JSON.stringify(cart));}catch(e){console.error('saveCart',e)}
}

function loadCart(){
  try{const raw = localStorage.getItem('demo_cart'); if(raw) cart = JSON.parse(raw);}catch(e){console.error('loadCart',e)}
}

function updateCartUI(){
  const totalItems = Object.values(cart).reduce((s,q)=>s+q,0);
  cartCount.textContent = totalItems;
  renderCartItems();
}

function renderCartItems(){
  cartItemsEl.innerHTML = '';
  let subtotal = 0;
  const ids = Object.keys(cart);
  if(ids.length === 0){cartItemsEl.innerHTML = '<li class="card">Your cart is empty.</li>'; cartSubtotalEl.textContent = '$0.00'; return}
  for(const id of ids){
    const qty = cart[id];
    const p = products.find(x=>String(x.id) === String(id));
    if(!p) continue;
    subtotal += p.price * qty;
    const li = document.createElement('li');
    li.className = 'cart-item';
    li.innerHTML = `
      <div style="flex:1">
        <div class="ci-name">${escapeHtml(p.name)}</div>
        <div class="ci-meta">$${p.price.toFixed(2)} &times; ${qty} = <strong>$${(p.price*qty).toFixed(2)}</strong></div>
      </div>
      <div class="qty-controls">
        <button class="btn" data-dec="${p.id}">-</button>
        <div>${qty}</div>
        <button class="btn" data-inc="${p.id}">+</button>
        <button class="btn" data-rem="${p.id}">Remove</button>
      </div>
    `;
    li.querySelector('[data-inc]')?.addEventListener('click',()=>{cart[String(p.id)]++; saveCart(); updateCartUI();});
    li.querySelector('[data-dec]')?.addEventListener('click',()=>{if(cart[String(p.id)]>1){cart[String(p.id)]--; } else {delete cart[String(p.id)];} saveCart(); updateCartUI();});
    li.querySelector('[data-rem]')?.addEventListener('click',()=>{delete cart[String(p.id)]; saveCart(); updateCartUI();});
    cartItemsEl.appendChild(li);
  }
  cartSubtotalEl.textContent = `$${subtotal.toFixed(2)}`;
}

function openCart(){
  cartDrawer.hidden = false;
}
function closeCart(){
  cartDrawer.hidden = true;
}
function clearCart(){cart = {}; saveCart(); updateCartUI();}

function checkout(){
  if(Object.keys(cart).length === 0){alert('Cart is empty'); return}
  // For demo: simulate checkout
  const subtotal = Object.values(cart).reduce((s,id)=>s,0);
  // In real app you'd call a backend; here just clear cart and show simple message.
  alert('Thanks for your purchase! (Demo)');
  clearCart();
}

// helpers
function escapeHtml(s){return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c])}
function debounce(fn,ms){let t; return (...args)=>{clearTimeout(t); t=setTimeout(()=>fn(...args),ms)}}

// start
init();
