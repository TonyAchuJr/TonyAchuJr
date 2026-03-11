const defaultProducts = [
  { id: 'P1001', name: 'Wireless Earbuds', category: 'Electronics', price: 59, online: true, store: true, storeName: 'SoundHub', storeAddress: '12 Main Street' },
  { id: 'P1002', name: 'Air Fryer', category: 'Home', price: 120, online: true, store: true, storeName: 'Kitchen World', storeAddress: '44 Lake Avenue' },
  { id: 'P1003', name: 'Organic Rice 5kg', category: 'Grocery', price: 18, online: true, store: true, storeName: 'Fresh Mart', storeAddress: '88 Market Road' },
  { id: 'P1004', name: 'Running Shoes', category: 'Fashion', price: 72, online: true, store: false, storeName: 'N/A', storeAddress: 'N/A' }
];

const users = JSON.parse(localStorage.getItem('users') || '[]');
const products = JSON.parse(localStorage.getItem('products') || JSON.stringify(defaultProducts));
let currentRole = 'buyer';
let currentUser = null;
let selectedProductId = null;

const byId = (id) => document.getElementById(id);
const authMessage = byId('authMessage');
const sessionInfo = byId('sessionInfo');
const sellerPanel = byId('sellerPanel');

function saveState() {
  localStorage.setItem('users', JSON.stringify(users));
  localStorage.setItem('products', JSON.stringify(products));
}

function generateUserId() {
  const seed = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 900 + 100);
  return `U${seed}${rand}`;
}

function setRole(role) {
  currentRole = role;
  document.querySelectorAll('.tab').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.target === role);
  });
  byId('loginTitle').textContent = `${role[0].toUpperCase() + role.slice(1)} Login`;
}

function renderProducts() {
  const query = byId('searchInput').value.toLowerCase().trim();
  const category = byId('categoryFilter').value;
  const availability = byId('availabilityFilter').value;

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(query);
    const matchesCategory = category === 'all' || p.category === category;
    const matchesAvailability = availability === 'all' || (availability === 'online' ? p.online : p.store);
    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const list = byId('productList');
  list.innerHTML = '';

  if (!filtered.length) {
    list.innerHTML = '<div class="card-block">No products found for your search/filter.</div>';
    return;
  }

  filtered.forEach((p) => {
    const card = document.createElement('article');
    card.className = `product-card ${selectedProductId === p.id ? 'selected' : ''}`;
    card.innerHTML = `
      <strong>${p.name}</strong> <span class="badge">${p.category}</span>
      <div>Price: $${p.price}</div>
      <div>Online: ${p.online ? 'Yes' : 'No'} | In Store: ${p.store ? 'Yes' : 'No'}</div>
      <div>Store: ${p.storeName}</div>
      <div>Address: ${p.storeAddress}</div>
    `;
    card.addEventListener('click', () => {
      selectedProductId = p.id;
      renderProducts();
    });
    list.appendChild(card);
  });
}

byId('registerForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const username = byId('regUsername').value.trim();
  const password = byId('regPassword').value;
  const role = byId('regRole').value;
  const storeName = byId('regStoreName').value.trim();
  const storeAddress = byId('regStoreAddress').value.trim();

  if (!username || !password) return;
  if (role === 'seller' && (!storeName || !storeAddress)) {
    authMessage.textContent = 'Seller registration requires store name and address.';
    return;
  }

  const user = { id: generateUserId(), username, password, role, storeName, storeAddress };
  users.push(user);
  saveState();

  authMessage.textContent = `Registered! Unique user ID: ${user.id}`;
  byId('registerForm').reset();
  document.querySelectorAll('.seller-only').forEach((el) => el.classList.add('hidden'));
});

byId('regRole').addEventListener('change', (e) => {
  const isSeller = e.target.value === 'seller';
  document.querySelectorAll('.seller-only').forEach((el) => el.classList.toggle('hidden', !isSeller));
});

byId('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const username = byId('loginUsername').value.trim();
  const password = byId('loginPassword').value;

  const match = users.find((u) => u.username === username && u.password === password && u.role === currentRole);
  if (!match) {
    authMessage.textContent = `Invalid credentials for ${currentRole} account.`;
    return;
  }

  currentUser = match;
  sessionInfo.textContent = `Logged in as ${match.username} (${match.role}) | User ID: ${match.id}`;
  authMessage.textContent = 'Login successful.';
  sellerPanel.classList.toggle('visible', currentUser.role === 'seller');

  if (currentUser.role === 'seller') {
    byId('sellerStoreName').value = currentUser.storeName || '';
    byId('sellerStoreAddress').value = currentUser.storeAddress || '';
  }
});

byId('sellerProductForm').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!currentUser || currentUser.role !== 'seller') {
    authMessage.textContent = 'Please login with a seller account first.';
    return;
  }

  const newProduct = {
    id: `P${Math.floor(Math.random() * 9000 + 1000)}`,
    name: byId('sellerProductName').value.trim(),
    category: byId('sellerCategory').value,
    price: Number(byId('sellerPrice').value),
    online: byId('sellerOnline').value === 'yes',
    store: byId('sellerStore').value === 'yes',
    storeName: byId('sellerStoreName').value.trim(),
    storeAddress: byId('sellerStoreAddress').value.trim()
  };

  products.push(newProduct);
  saveState();
  renderProducts();
  byId('sellerProductForm').reset();
  authMessage.textContent = 'Product listed successfully.';
});

byId('buyOnlineBtn').addEventListener('click', () => {
  const product = products.find((p) => p.id === selectedProductId);
  if (!product) {
    authMessage.textContent = 'Select a product first.';
    return;
  }
  if (!product.online) {
    authMessage.textContent = 'This product is not available for online purchase.';
    return;
  }
  authMessage.textContent = `Order placed for ${product.name}. Estimated delivery: 2-3 days.`;
});

byId('nearMeBtn').addEventListener('click', () => {
  const product = products.find((p) => p.id === selectedProductId);
  const panel = byId('nearMeResults');

  if (!product) {
    panel.innerHTML = 'Select a product, then click "Check Available Near Me".';
    return;
  }

  if (!product.store) {
    panel.innerHTML = `<strong>${product.name}</strong> is not available in nearby stores right now.`;
    return;
  }

  panel.innerHTML = `
    <h3>Nearby Store Availability</h3>
    <p><strong>${product.name}</strong> is available at:</p>
    <p><strong>${product.storeName}</strong>, ${product.storeAddress}</p>
    <p>You can visit this store directly and buy it without waiting for delivery.</p>
  `;
});

[ 'searchInput', 'categoryFilter', 'availabilityFilter' ].forEach((id) => {
  byId(id).addEventListener('input', renderProducts);
  byId(id).addEventListener('change', renderProducts);
});

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => setRole(tab.dataset.target));
});

renderProducts();
