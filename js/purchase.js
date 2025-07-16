const fs = require('fs');
const path = require('path');

// File paths
const companyPath = path.join(__dirname, '../data/companies.json');
const stockPath = path.join(__dirname, '../data/stock.json');
const purchasesPath = path.join(__dirname, '../data/purchases.json');

// DOM elements
const companySelect = document.getElementById('companySelect');
const tableBody = document.getElementById('tableBody');

let currentCompany = '';
let predefinedItems = [];

// Load initial data
loadCompanies();
addRow();

// Load all companies
function loadCompanies() {
  try {
    if (!fs.existsSync(companyPath)) {
      fs.writeFileSync(companyPath, JSON.stringify([], null, 2));
    }

    const companies = JSON.parse(fs.readFileSync(companyPath, 'utf-8'));

    companySelect.innerHTML = '';
    companies.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      companySelect.appendChild(opt);
    });

    if (companies.length > 0) {
      currentCompany = companies[0];
      companySelect.value = currentCompany;
      loadPredefinedItems();
    }
  } catch (err) {
    console.error("❌ Error loading companies:", err);
    alert("Failed to load companies.json.");
  }
}

// When company changes
companySelect.addEventListener('change', () => {
  currentCompany = companySelect.value;
  loadPredefinedItems();
});

// Load stock items for selected company
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

// Update dropdown for predefined items
function updateDropdownOptions(select) {
  select.innerHTML = `<option value="">-- Select --</option>`;
  predefinedItems.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item;
    opt.textContent = item;
    select.appendChild(opt);
  });
}

// Add row to table
function addRow() {
  const row = document.createElement('tr');
  const today = new Date().toISOString().split("T")[0];

  row.innerHTML = `
    <td><select class="item-select"></select></td>
    <td><input type="text" class="item-name" placeholder="New item name" /></td>
    <td><input type="number" class="qty" min="1" /></td>
    <td><input type="number" class="price" min="1" /></td>
    <td><input type="number" class="margin" value="10" /></td>
    <td><input type="date" class="date" value="${today}" /></td>
    <td><button onclick="removeRow(this)">❌</button></td>
  `;

  tableBody.appendChild(row);
  updateDropdownOptions(row.querySelector('.item-select'));
}

// Remove row
function removeRow(btn) {
  btn.closest('tr').remove();
}

// Save all purchase entries
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

    // Save to purchases
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

  document.getElementById('statusMsg').innerText = "✅ All purchases saved!";
  tableBody.innerHTML = '';
  addRow();
}
