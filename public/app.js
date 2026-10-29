
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const state = {
  token: localStorage.getItem('moda_token'),
  products: [],
  sales: [],
  page: 'dashboard',
  editing: null,
  registerMode: false,
};

const money = (value) =>
  Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);


function toast(message, error = false) {
  const element = $('#toast');

  element.textContent = message;
  element.className = `toast${error ? ' error' : ''}`;

  clearTimeout(toast.timer);

  toast.timer = setTimeout(() => {
    element.classList.add('hidden');
  }, 3600);
}


async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(state.token
      ? { Authorization: `Bearer ${state.token}` }
      : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && state.token) {
      logout(false);
      toast('Sua sessão expirou. Entre novamente.', true);
    }

    throw new Error(
      data.message || 'Não foi possível concluir a solicitação.'
    );
  }

  return data;
}

function setAuthMode(register) {
  state.registerMode = register;

  $('#login-form').classList.toggle('hidden', register);
  $('#register-form').classList.toggle('hidden', !register);

  $('#auth-title').textContent = register
    ? 'Crie sua conta'
    : 'Acesse sua conta';

  $('#auth-subtitle').textContent = register
    ? 'Cadastre o acesso da equipe.'
    : 'Entre para continuar no painel.';

  $('#switch-label').textContent = register
    ? 'Já tem uma conta?'
    : 'Ainda não tem conta?';

  $('#switch-auth').textContent = register
    ? 'Entrar'
    : 'Cadastre-se';
}

function showApp() {
  $('#auth-screen').classList.add('hidden');
  $('#app').classList.remove('hidden');

  $('#user-email').textContent =
    localStorage.getItem('moda_email') || 'Funcionário';

  loadAll().catch((error) => toast(error.message, true));
}

function logout(show = true) {
  state.token = null;

  localStorage.removeItem('moda_token');
  localStorage.removeItem('moda_email');

  $('#app').classList.add('hidden');
  $('#auth-screen').classList.remove('hidden');

  if (show) {
    toast('Você saiu da conta.');
  }
}

$('#switch-auth').addEventListener('click', () => {
  setAuthMode(!state.registerMode);
});

$('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const form = new FormData(event.currentTarget);

  try {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: form.get('email'),
        password: form.get('password'),
      }),
    });

    state.token = data.token;

    localStorage.setItem('moda_token', data.token);
    localStorage.setItem('moda_email', form.get('email'));

    showApp();
  } catch (error) {
    toast(error.message, true);
  }
});

$('#register-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const form = new FormData(event.currentTarget);

  try {
    await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: form.get('name'),
        email: form.get('email'),
        password: form.get('password'),
      }),
    });

    toast('Conta criada! Agora entre com seu e-mail e senha.');

    setAuthMode(false);

    $('#login-form [name=email]').value = form.get('email');
  } catch (error) {
    toast(error.message, true);
  }
});

$('#logout').addEventListener('click', () => logout());

function go(page) {
  state.page = page;

  $$('.page').forEach((element) => {
    element.classList.add('hidden');
  });

  $(`#page-${page}`).classList.remove('hidden');

  $$('.nav-item').forEach((button) => {
    button.classList.toggle(
      'active',
      button.dataset.page === page
    );
  });

  const titles = {
    dashboard: 'Visão geral',
    products: 'Produtos e estoque',
    sales: 'Vendas',
  };

  $('#page-title').textContent = titles[page];

  if (page === 'products') {
    loadProducts();
  }

  if (page === 'sales') {
    loadProducts().then(renderSaleLines);
    loadSales();
  }
}

$$('.nav-item').forEach((button) => {
  button.addEventListener('click', () => {
    go(button.dataset.page);
  });
});

$$('[data-goto]').forEach((button) => {
  button.addEventListener('click', () => {
    go(button.dataset.goto);
  });
});

$('#refresh').addEventListener('click', () => {
  loadAll()
    .then(() => toast('Painel atualizado.'))
    .catch((error) => toast(error.message, true));
});

async function loadAll() {
  await Promise.all([
    loadSummary(),
    loadProducts(),
    loadSales(),
  ]);

  renderTop();
}

async function loadSummary() {
  const data = await api('/api/reports/summary');

  $('#stat-products').textContent = data.productsCount ?? 0;
  $('#stat-stock').textContent = data.unitsInStock ?? 0;
  $('#stat-low').textContent = data.productsLowStock ?? 0;
  $('#stat-revenue').textContent = money(data.totalRevenue);

  state.topItems = data.bestSellingProducts || [];

  renderTop();
}

function renderTop() {
  const items = state.topItems || [];

  $('#top-products').innerHTML = items.length
    ? items.map((item, index) => `
        <div class="top-row">
          <div class="rank">${index + 1}</div>

          <div class="top-name">
            ${esc(
              item.product?.name || `Produto #${item.productId}`
            )}

            <small>
              ${esc(item.product?.size || '')}
              ${esc(item.product?.color || '')}
            </small>
          </div>

          <div class="top-qty">
            ${item.quantitySold || 0} un.
          </div>
        </div>
      `).join('')
    : `
        <p class="muted">
          Ainda não há vendas suficientes para mostrar
          produtos mais vendidos.
        </p>
      `;
}

async function loadProducts() {
  const data = await api('/api/products');

  state.products = data.products || [];

  renderProducts();

  return state.products;
}

function renderProducts() {
  const term = ($('#product-search')?.value || '').toLowerCase();

  const products = state.products.filter((product) =>
    `${product.name} ${product.size} ${product.color} ${
      product.description || ''
    }`
      .toLowerCase()
      .includes(term)
  );

  $('#product-count').textContent =
    `${products.length} ${
      products.length === 1 ? 'produto' : 'produtos'
    }`;

  $('#products-table').innerHTML = products.length
    ? products.map((product) => `
        <tr>
          <td>
            <div class="product-cell">
              <div class="product-dot">
                ${esc((product.name || 'P').charAt(0).toUpperCase())}
              </div>

              <div>
                ${esc(product.name)}

                <small style="
                  display: block;
                  color: #9998ad;
                  font-weight: 400;
                  margin-top: 4px;
                ">
                  ${esc(product.description || '')}
                </small>
              </div>
            </div>
          </td>

          <td>${esc(product.size)}</td>
          <td>${esc(product.color)}</td>

          <td>
            <strong>${money(product.price)}</strong>
          </td>

          <td>
            <span class="pill ${
              Number(product.stock) <= 5 ? 'low' : ''
            }">
              ${product.stock} un.
            </span>
          </td>

          <td>
            <button
              class="action-btn"
              data-edit="${product.id}"
            >
              Editar
            </button>

            <button
              class="action-btn delete"
              data-delete="${product.id}"
            >
              Excluir
            </button>
          </td>
        </tr>
      `).join('')
    : `
        <tr>
          <td colspan="6" class="empty">
            Nenhum produto encontrado.
          </td>
        </tr>
      `;

  $$('[data-edit]').forEach((button) => {
    button.addEventListener('click', () => {
      editProduct(Number(button.dataset.edit));
    });
  });

  $$('[data-delete]').forEach((button) => {
    button.addEventListener('click', () => {
      deleteProduct(Number(button.dataset.delete));
    });
  });
}

$('#product-search').addEventListener('input', renderProducts);

function openProductForm(product = null) {
  state.editing = product?.id || null;

  const form = $('#product-form');

  form.reset();
  form.classList.remove('hidden');

  form.elements.id.value = product?.id || '';
  form.elements.name.value = product?.name || '';
  form.elements.size.value = product?.size || '';
  form.elements.color.value = product?.color || '';
  form.elements.price.value = product?.price || '';
  form.elements.stock.value = product?.stock ?? 0;
  form.elements.description.value = product?.description || '';

  $('#product-form-title').textContent = product
    ? 'Editar produto'
    : 'Cadastrar produto';

  form.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
}

function closeProductForm() {
  $('#product-form').classList.add('hidden');
  state.editing = null;
}

$('#show-product-form').addEventListener('click', () => {
  openProductForm();
});

$('#cancel-product').addEventListener('click', closeProductForm);
$('#cancel-product-2').addEventListener('click', closeProductForm);

function editProduct(id) {
  const product = state.products.find((item) => item.id === id);

  if (product) {
    openProductForm(product);
  }
}

$('#product-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const form = event.currentTarget;

  const payload = {
    name: form.elements.name.value.trim(),
    size: form.elements.size.value.trim(),
    color: form.elements.color.value.trim(),
    price: Number(form.elements.price.value),
    stock: Number(form.elements.stock.value),
    description: form.elements.description.value.trim() || null,
  };

  try {
    if (state.editing) {
      await api(`/api/products/${state.editing}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    } else {
      await api('/api/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    toast(
      state.editing
        ? 'Produto atualizado.'
        : 'Produto cadastrado.'
    );

    closeProductForm();

    await loadProducts();
    await loadSummary();
  } catch (error) {
    toast(error.message, true);
  }
});

async function deleteProduct(id) {
  const product = state.products.find((item) => item.id === id);

  if (!confirm(`Deseja excluir "${product?.name || 'este produto'}"?`)) {
    return;
  }

  try {
    await api(`/api/products/${id}`, {
      method: 'DELETE',
    });

    toast('Produto excluído.');

    await loadProducts();
    await loadSummary();
  } catch (error) {
    toast(error.message, true);
  }
}

async function loadSales() {
  try {
    const data = await api('/api/sales');

    state.sales = data.sales || [];

    $('#sales-count').textContent =
      `${state.sales.length} vendas`;

    $('#sales-table').innerHTML = state.sales.length
      ? state.sales.map((sale) => {
          const count = (sale.items || []).reduce(
            (total, item) => total + Number(item.quantity || 0),
            0
          );

          return `
            <tr>
              <td>
                <strong>#${sale.id}</strong>
              </td>

              <td>
                ${new Date(sale.createdAt).toLocaleString('pt-BR')}
              </td>

              <td>
                ${esc(sale.seller?.name || 'Funcionário')}
              </td>

              <td>${count} un.</td>

              <td>
                <strong>${money(sale.totalAmount)}</strong>
              </td>
            </tr>
          `;
        }).join('')
      : `
          <tr>
            <td colspan="5" class="empty">
              Nenhuma venda registrada ainda.
            </td>
          </tr>
        `;
  } catch (error) {
    $('#sales-table').innerHTML = `
      <tr>
        <td colspan="5" class="empty">
          ${esc(error.message)}
        </td>
      </tr>
    `;
  }
}

$('#show-sale-form').addEventListener('click', async () => {
  await loadProducts();

  $('#sale-form').classList.remove('hidden');

  if (!$('#sale-lines').children.length) {
    renderSaleLines();
  }

  $('#sale-form').scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
});

$('#cancel-sale').addEventListener('click', () => {
  $('#sale-form').classList.add('hidden');
});

$('#add-sale-line').addEventListener('click', () => {
  addSaleLine();
});

function renderSaleLines() {
  if (!$('#sale-lines')) {
    return;
  }

  $('#sale-lines').innerHTML = '';

  addSaleLine();
  updateSaleTotal();
}

function addSaleLine() {
  const wrapper = document.createElement('div');

  wrapper.className = 'sale-line';

  const options = state.products
    .filter((product) => Number(product.stock) > 0)
    .map((product) => `
      <option
        value="${product.id}"
        data-price="${product.price}"
        data-stock="${product.stock}"
      >
        ${esc(product.name)} ·
        ${esc(product.size)} /
        ${esc(product.color)} ·
        ${product.stock} em estoque
      </option>
    `)
    .join('');

  wrapper.innerHTML = `
    <label>
      Produto

      <select class="sale-product" required>
        ${
          options ||
          '<option value="">Nenhum produto com estoque</option>'
        }
      </select>
    </label>

    <label>
      Qtd.

      <input
        class="sale-qty"
        type="number"
        min="1"
        value="1"
        required
      >
    </label>

    <label>
      Subtotal

      <input
        class="sale-subtotal"
        readonly
        value="R$ 0,00"
      >
    </label>

    <button
      class="remove-line"
      type="button"
      title="Remover item"
    >
      ✕
    </button>
  `;

  $('#sale-lines').append(wrapper);

  $('.sale-product', wrapper).addEventListener('change', () => {
    const option = $('.sale-product', wrapper).selectedOptions[0];

    $('.sale-qty', wrapper).max = option?.dataset.stock || 1;

    updateSaleTotal();
  });

  $('.sale-qty', wrapper).addEventListener('input', () => {
    const option = $('.sale-product', wrapper).selectedOptions[0];

    if (
      option &&
      Number($('.sale-qty', wrapper).value) >
        Number(option.dataset.stock)
    ) {
      $('.sale-qty', wrapper).value = option.dataset.stock;
    }

    updateSaleTotal();
  });

  $('.remove-line', wrapper).addEventListener('click', () => {
    wrapper.remove();
    updateSaleTotal();
  });

  if (!state.products.some((product) => Number(product.stock) > 0)) {
    $('.sale-product', wrapper).disabled = true;
  }

  updateSaleTotal();
}

function updateSaleTotal() {
  let total = 0;

  $$('.sale-line').forEach((line) => {
    const option = $('.sale-product', line).selectedOptions[0];

    const price = Number(option?.dataset.price || 0);
    const quantity = Number($('.sale-qty', line).value || 0);

    const subtotal = price * quantity;

    total += subtotal;

    $('.sale-subtotal', line).value = money(subtotal);
  });

  $('#sale-total').textContent = money(total);
}

$('#sale-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const items = $$('.sale-line')
    .map((line) => ({
      productId: Number($('.sale-product', line).value),
      quantity: Number($('.sale-qty', line).value),
    }))
    .filter((item) => item.productId && item.quantity > 0);

  if (!items.length) {
    toast('Adicione pelo menos um produto com estoque.', true);
    return;
  }

  try {
    await api('/api/sales', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });

    toast('Venda registrada e estoque atualizado!');

    $('#sale-form').classList.add('hidden');
    $('#sale-lines').innerHTML = '';

    await loadAll();

    if (state.page === 'sales') {
      renderSaleLines();
    }
  } catch (error) {
    toast(error.message, true);
  }
});

if (state.token) {
  showApp();
} else {
  setAuthMode(false);
}
