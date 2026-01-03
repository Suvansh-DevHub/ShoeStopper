document.addEventListener('DOMContentLoaded', () => {

  /* ================= MENU & NAV ================= */
  let menu = document.querySelector('#menu-bar');
  let navbar = document.querySelector('.navbar');

  if (menu && navbar) {
    menu.onclick = () => {
      menu.classList.toggle('fa-times');
      navbar.classList.toggle('active');
    };

    window.onscroll = () => {
      menu.classList.remove('fa-times');
      navbar.classList.remove('active');
    };
  }

  /* ================= HOME SLIDER ================= */
  let slides = document.querySelectorAll('.slide-container');
  let index = 0;

  window.next = function () {
    if (!slides.length) return;
    slides[index].classList.remove('active');
    index = (index + 1) % slides.length;
    slides[index].classList.add('active');
  };

  window.prev = function () {
    if (!slides.length) return;
    slides[index].classList.remove('active');
    index = (index - 1 + slides.length) % slides.length;
    slides[index].classList.add('active');
  };

  /* ================= FEATURED IMAGE SWITCH ================= */
  document.querySelectorAll('.featured-image-1').forEach(img => {
    img.onclick = () => document.querySelector('.big-image-1').src = img.src;
  });
  document.querySelectorAll('.featured-image-2').forEach(img => {
    img.onclick = () => document.querySelector('.big-image-2').src = img.src;
  });
  document.querySelectorAll('.featured-image-3').forEach(img => {
    img.onclick = () => document.querySelector('.big-image-3').src = img.src;
  });

  /* ================= TOAST ================= */
  function showToast(message, duration = 3000) {
    let toast = document.querySelector('.site-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'site-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = message;
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), duration);
  }

  /* ================= NEWSLETTER ================= */
  (function () {
    const form = document.querySelector('.newsletter form');
    if (!form) return;

    form.onsubmit = e => {
      e.preventDefault();
      const email = form.querySelector('input[type="email"]').value.trim();
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!re.test(email)) {
        showToast('❌ Please enter a valid email');
        return;
      }

      const subs = JSON.parse(localStorage.getItem('subscriptions') || '[]');
      if (!subs.includes(email)) subs.push(email);
      localStorage.setItem('subscriptions', JSON.stringify(subs));

      showToast('✅ Subscribed successfully');
      form.reset();
    };
  })();

  /* ================= UTIL: CART STORAGE ================= */
  function getCart() {
    return JSON.parse(localStorage.getItem('cart') || '[]');
  }
  function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  /* ================= FIND PRICE BY TITLE (fallback) ================= */
  function findPriceByTitle(title) {
    if (!title) return 0;
    // strip color suffix like " (Red)"
    const base = title.replace(/\s*\(.*\)$/, '').trim().toLowerCase();

    // search product boxes and featured and home slides
    const candidates = [
      ...document.querySelectorAll('.products .box'),
      ...document.querySelectorAll('.featured .row'),
      ...document.querySelectorAll('.home .slide')
    ];

    for (const cand of candidates) {
      const h = cand.querySelector('h3')?.innerText?.trim()?.toLowerCase() || '';
      if (!h) continue;
      // if cand title equals or contains base, accept
      if (h === base || h.includes(base) || base.includes(h)) {
        // try data-price on any btn inside cand
        const btn = cand.querySelector('.btn[data-price]');
        if (btn && btn.dataset.price) {
          const p = parseFloat(btn.dataset.price);
          if (!isNaN(p) && p > 0) return p;
        }
        // try .price element
        const priceEl = cand.querySelector('.price');
        if (priceEl) {
          const m = priceEl.innerText.match(/(\d+(\.\d+)?)/);
          if (m) {
            const p = parseFloat(m[0]);
            if (!isNaN(p) && p > 0) return p;
          }
        }
        // try image data attributes or other btns
        const anyBtn = cand.querySelector('.btn');
        if (anyBtn && anyBtn.dataset.price) {
          const p = parseFloat(anyBtn.dataset.price);
          if (!isNaN(p) && p > 0) return p;
        }
      }
    }
    return 0;
  }

  /* On load: fix any cart items with price 0 by trying to find price in DOM */
  (function sanitizeCartOnLoad() {
    const cart = getCart();
    let changed = false;
    for (let item of cart) {
      if (!item.price || Number(item.price) === 0) {
        const p = findPriceByTitle(item.title);
        if (p && p > 0) {
          item.price = p;
          changed = true;
        }
      }
    }
    if (changed) saveCart(cart);
  })();

  /* ================= ADD TO CART ================= */
  (function () {
    const buttons = document.querySelectorAll(
      '.products .btn, .featured .btn, .home .btn'
    );

    function readProductInfo(btn) {
      const content = btn.closest('.content') || btn.closest('.slide') || btn.closest('.box') || document;

      let title = content?.querySelector('h3')?.innerText?.trim() || 'Product';
      const color = btn.dataset.color;
      if (color && !title.toLowerCase().includes(color.toLowerCase())) title += ` (${color})`;

      // price resolution: btn[data-price] first, then .price in content, then fallback 0
      let price = 0;
      if (btn.dataset.price) {
        price = parseFloat(btn.dataset.price) || 0;
      } else {
        const priceEl = content?.querySelector('.price');
        if (priceEl) {
          const m = priceEl.innerText.match(/(\d+(\.\d+)?)/);
          price = m ? parseFloat(m[0]) : 0;
        }
      }

      return { title, price };
    }

    buttons.forEach(btn => {
      btn.onclick = e => {
        e.preventDefault();
        const info = readProductInfo(btn);
        const cart = getCart();

        const existing = cart.find(i => i.title === info.title);
        if (existing) existing.qty++;
        else cart.push({ ...info, qty: 1 });

        saveCart(cart);
        const totalQty = cart.reduce((s, i) => s + i.qty, 0);
        showToast(`🛒 ${info.title} added • Items: ${totalQty}`);
      };
    });
  })();

  /* ================= CART MODAL ================= */
  const cartIcon = document.querySelector('.cart-icon');
  const cartModal = document.getElementById('cart-modal');
  const cartItemsBox = document.querySelector('.cart-items');
  const cartTotalBox = document.querySelector('.cart-total');
  const clearCartBtn = document.querySelector('.clear-cart');
  const closeCartBtn = document.querySelector('.close-cart');

  function renderCart() {
    const cart = getCart();
    if (!cartItemsBox || !cartTotalBox) return;
    cartItemsBox.innerHTML = '';
    let total = 0;

    if (!cart.length) {
      cartItemsBox.innerHTML = '<p>Your cart is empty.</p>';
      cartTotalBox.innerHTML = '';
      return;
    }

    cart.forEach(item => {
      // ensure numeric price
      const price = Number(item.price) || 0;
      const itemTotal = price * (Number(item.qty) || 1);
      total += itemTotal;

      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <span>${item.title} (x${item.qty})</span>
        <span>$${itemTotal.toFixed(2)}</span>
      `;
      cartItemsBox.appendChild(div);
    });

    cartTotalBox.innerHTML = `Total: $${total.toFixed(2)}`;
  }

  cartIcon && (cartIcon.onclick = e => {
    e.preventDefault();
    renderCart();
    if (cartModal) cartModal.style.display = 'flex';
  });

  closeCartBtn && (closeCartBtn.onclick = () => {
    if (cartModal) cartModal.style.display = 'none';
  });

  cartModal && (cartModal.onclick = e => {
    if (e.target === cartModal) cartModal.style.display = 'none';
  });

  clearCartBtn && (clearCartBtn.onclick = () => {
    localStorage.removeItem('cart');
    renderCart();
    showToast('🧹 Cart cleared');
  });

/* ================= PRODUCT ICON ACTIONS + WISHLIST ================= */
function getWishlist() {
  return JSON.parse(localStorage.getItem('wishlist') || '[]');
}
function saveWishlist(wl) {
  localStorage.setItem('wishlist', JSON.stringify(wl));
}

function renderWishlist() {
  const wishlistBox = document.querySelector('.wishlist-items');
  const wishlistTotalBox = document.querySelector('.wishlist-total');
  if (!wishlistBox || !wishlistTotalBox) return;
  wishlistBox.innerHTML = '';
  let total = 0;
  const wl = getWishlist();
  if (!wl.length) {
    wishlistBox.innerHTML = '<p>Your wishlist is empty.</p>';
    wishlistTotalBox.innerHTML = '';
    return;
  }
  wl.forEach(item => {
    const price = Number(item.price) || 0;
    total += price;
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <span>${item.title}</span>
      <span>${price ? ('$' + price.toFixed(2)) : ''}</span>
    `;
    wishlistBox.appendChild(div);
  });
  wishlistTotalBox.innerHTML = `Items: ${wl.length} • Approx total: $${total.toFixed(2)}`;
}

// attach handlers for each product box
document.querySelectorAll('.products .box').forEach(box => {
  const title = box.querySelector('.content h3')?.innerText || 'Product';
  const imgSrc = box.querySelector('img')?.src || '';
  // price try from .price or btn[data-price]
  let price = 0;
  const priceEl = box.querySelector('.content .price');
  if (priceEl) {
    const m = priceEl.innerText.match(/(\d+(\.\d+)?)/);
    price = m ? parseFloat(m[0]) : 0;
  } else {
    const btn = box.querySelector('.btn[data-price]');
    if (btn && btn.dataset.price) price = parseFloat(btn.dataset.price) || 0;
  }

  const heart = box.querySelector('.fa-heart');
  heart?.addEventListener('click', e => {
    e.preventDefault();
    const wl = getWishlist();
    // avoid duplicates by title
    if (!wl.find(i => i.title === title)) {
      wl.push({ title, image: imgSrc, price: price || 0 });
      saveWishlist(wl);
      showToast(`❤️ "${title}" added to wishlist`);
    } else {
      showToast(`ℹ️ "${title}" already in wishlist`);
    }
  });

  const share = box.querySelector('.fa-share');
  share?.addEventListener('click', async e => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('🔗 Product link copied!');
    } catch {
      showToast('❌ Copy failed');
    }
  });
});

// header wishlist icon open modal
const wishlistIcon = document.querySelector('.wishlist-icon');
const wishlistModal = document.getElementById('wishlist-modal');
const clearWishlistBtn = document.querySelector('.clear-wishlist');
const closeWishlistBtn = document.querySelector('.close-wishlist');

wishlistIcon && (wishlistIcon.onclick = e => {
  e.preventDefault();
  renderWishlist();
  if (wishlistModal) wishlistModal.style.display = 'flex';
});

closeWishlistBtn && (closeWishlistBtn.onclick = () => {
  if (wishlistModal) wishlistModal.style.display = 'none';
});

wishlistModal && (wishlistModal.onclick = e => {
  if (e.target === wishlistModal) wishlistModal.style.display = 'none';
});

clearWishlistBtn && (clearWishlistBtn.onclick = () => {
  localStorage.removeItem('wishlist');
  renderWishlist();
  showToast('🧹 Wishlist cleared');
});


  /* ================= QUICK VIEW (EYE ICON) ================= */
  const qvModal = document.getElementById('quick-view-modal');
  const qvImg = document.getElementById('qv-image');
  const qvTitle = document.getElementById('qv-title');
  const qvPrice = document.getElementById('qv-price');
  const qvClose = document.querySelector('.qv-close');

  document.querySelectorAll('.products .box .fa-eye, .products .box .icons .fa-eye').forEach(eye => {
    eye.addEventListener('click', e => {
      e.preventDefault();
      const box = eye.closest('.box');
      if (!box) return;

      qvImg.src = box.querySelector('img')?.src || '';
      qvTitle.innerText = box.querySelector('.content h3')?.innerText || '';

      // try to show a clean price
      const priceEl = box.querySelector('.content .price');
      if (priceEl) {
        qvPrice.innerText = priceEl.innerText.trim();
      } else {
        // fallback: try buttons with data-price
        const btn = box.querySelector('.btn[data-price]');
        if (btn && btn.dataset.price) qvPrice.innerText = `$${parseFloat(btn.dataset.price).toFixed(2)}`;
        else qvPrice.innerText = '';
      }

      if (qvModal) qvModal.style.display = 'flex';
    });
  });

  qvClose && (qvClose.onclick = () => {
    if (qvModal) qvModal.style.display = 'none';
  });

  qvModal && (qvModal.onclick = e => {
    if (e.target === qvModal) qvModal.style.display = 'none';
  });


/* ================= USER AUTH (MODAL + DROPDOWN) ================= */
const userIcon = document.querySelector('.user-icon');
const userWrapper = document.querySelector('.user-wrapper');
const userModal = document.getElementById('user-modal');
const userForm = document.getElementById('user-form');
const closeUserBtn = document.querySelector('.close-user');
const dropdown = document.querySelector('.user-dropdown');
const logoutLink = document.querySelector('.user-logout');

function isLoggedIn() {
  return !!localStorage.getItem('user');
}

// icon click
userIcon && (userIcon.onclick = e => {
  e.preventDefault();
  if (isLoggedIn()) {
    dropdown.style.display =
      dropdown.style.display === 'block' ? 'none' : 'block';
  } else {
    userModal.style.display = 'flex';
  }
});

// login
userForm && (userForm.onsubmit = e => {
  e.preventDefault();
  const name = document.getElementById('user-name').value.trim();
  const email = document.getElementById('user-email').value.trim();

  if (!name || !email) {
    showToast('❌ Please fill all details');
    return;
  }

  localStorage.setItem('user', JSON.stringify({ name, email }));
  showToast(`👋 Welcome, ${name}`);
  userModal.style.display = 'none';
  updateUserUI();
});

// close modal
closeUserBtn && (closeUserBtn.onclick = () => {
  userModal.style.display = 'none';
});

// logout (from dropdown)
logoutLink && (logoutLink.onclick = e => {
  e.preventDefault();
  localStorage.removeItem('user');
  dropdown.style.display = 'none';
  showToast('👋 Logged out');
  updateUserUI();
});

// click outside → close dropdown
document.addEventListener('click', e => {
  if (
    dropdown &&
    userWrapper &&
    !userWrapper.contains(e.target)
  ) {
    dropdown.style.display = 'none';
  }
});

function updateUserUI() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!userIcon || !userWrapper) return;

  if (user) {
    userWrapper.classList.add('logged');

    // avatar pill bana do
    userIcon.className = 'user-avatar';
    userIcon.setAttribute('href', '#');

    // 👉 POORA NAAM DIKHANA
    userIcon.textContent = user.name;

  } else {
    userWrapper.classList.remove('logged');

    // wapas normal icon
    userIcon.className = 'fas fa-user user-icon';
    userIcon.textContent = '';
  }
}



// on load
updateUserUI();




  
  // initial render sanitize & update (safety)
  renderCart();

});
