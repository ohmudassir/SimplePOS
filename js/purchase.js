const fs = require('fs');
const path = require('path');

const companyPath = path.join(__dirname, '../data/companies.json');
const stockPath = path.join(__dirname, '../data/stock.json');
const purchasesPath = path.join(__dirname, '../data/purchases.json');

const companySelect = document.getElementById('companySelect');
const tableBody = document.getElementById('tableBody');

let currentCompany = '';
let predefinedItems = [];

loadCompanies();
addRow();

function loadCompanies() {
  if (fs.existsSync(companyPath)) {
    const companies = JSON.parse(fs.readFileSync(companyPath));
    companySelect.innerHTML = '';
    companies.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      companySelect.appendChild(opt);
    });
    currentCompany = companies[0];
    companySelect.value = currentCompany;
    loadPredefinedItems();
  }
}

companySelect.addEventListener('change', () => {
  currentCompany = companySelect.value;
  loadPredefinedItems();
});

function loadPredefinedItems() {
  predefinedItems = [];
  if (fs.existsSync(stockPath)) {
    const stock = JSON.parse(fs.readFileSync(stockPath));
    if (stock[currentCompany]) {
      predefinedItems = Object.keys(stock[currentCompany]);
    }
  }

  document.querySelectorAll('.item-select').forEach(select => {
    updateDropdownOptions(select);
  });
}

function updateDropdownOptions(select) {
  select.innerHTML = `<option value="">-- Select --</option>`;
  predefinedItems.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item;
    opt.textContent = item;
    select.appendChild(opt);
  });
}

function addRow() {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td><select class="item-select"></select></td>
    <td><input type="text" class="item-name" placeholder="New item name" /></td>
    <td><input type="number" class="qty" min="1" /></td>
    <td><input type="number" class="price" min="1" /></td>
    <td><input type="number" class="margin" value="10" /></td>
    <td><input type="date" class="date" /></td>
    <td><button onclick="removeRow(this)">❌</button></td>
  `;
  tableBody.appendChild(row);

  const select = row.querySelector('.item-select');
  updateDropdownOptions(select);
}

function removeRow(btn) {
  btn.parentElement.parentElement.remove();
}

function addCompany() {
  const newCompany = document.getElementById('newCompanyInput').value.trim();
  if (!newCompany) return alert("Company name required");

  let companies = [];
  if (fs.existsSync(companyPath)) {
    companies = JSON.parse(fs.readFileSync(companyPath));
  }

  if (!companies.includes(newCompany)) {
    companies.push(newCompany);
    fs.writeFileSync(companyPath, JSON.stringify(companies, null, 2));
    loadCompanies();
    companySelect.value = newCompany;
    currentCompany = newCompany;
    loadPredefinedItems();
    alert("Company added ✅");
  } else {
    alert("Company already exists!");
  }

  document.getElementById('newCompanyInput').value = '';
}

function saveAll() {
  const rows = document.querySelectorAll('#tableBody tr');
  if (rows.length === 0) return;

  let purchases = fs.existsSync(purchasesPath) ? JSON.parse(fs.readFileSync(purchasesPath)) : [];
  let stock = fs.existsSync(stockPath) ? JSON.parse(fs.readFileSync(stockPath)) : {};
  if (!stock[currentCompany]) stock[currentCompany] = {};

  rows.forEach(row => {
    const selectedItem = row.querySelector('.item-select').value;
    const newItem = row.querySelector('.item-name').value.trim();
    const itemName = selectedItem || newItem;
    const qty = parseInt(row.querySelector('.qty').value);
    const price = parseFloat(row.querySelector('.price').value);
    const margin = parseFloat(row.querySelector('.margin').value) / 100;
    const date = row.querySelector('.date').value;

    if (!itemName || !qty || !price || !date) return;

    // Save to purchases.json
    purchases.push({ company: currentCompany, item: itemName, qty, price, margin, date });

    // Update stock
    if (!stock[currentCompany][itemName]) {
      stock[currentCompany][itemName] = {
        quantity: qty,
        latestPurchasePrice: price,
        retailMargin: margin
      };
    } else {
      stock[currentCompany][itemName].quantity += qty;
      stock[currentCompany][itemName].latestPurchasePrice = price;
      stock[currentCompany][itemName].retailMargin = margin;
    }
  });

  fs.writeFileSync(purchasesPath, JSON.stringify(purchases, null, 2));
  fs.writeFileSync(stockPath, JSON.stringify(stock, null, 2));

  document.getElementById('statusMsg').innerText = "✅ All purchases saved successfully!";
  tableBody.innerHTML = '';
  addRow();
}
