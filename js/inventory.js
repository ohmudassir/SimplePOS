const fs = require('fs');
const path = require('path');

const stockPath = path.join(__dirname, '../data/stock.json');
const container = document.getElementById('inventoryContainer');

if (fs.existsSync(stockPath)) {
  const stock = JSON.parse(fs.readFileSync(stockPath, 'utf-8'));

  Object.keys(stock).forEach(company => {
    const section = document.createElement('div');
    section.className = 'company-section';

    const title = document.createElement('div');
    title.className = 'company-title';
    title.textContent = company;
    section.appendChild(title);

    const table = document.createElement('table');
    table.innerHTML = `
      <thead>
        <tr>
          <th>Item</th>
          <th>Quantity</th>
          <th>Purchase Price (PKR)</th>
          <th>Margin %</th>
          <th>Retail Price (PKR)</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    const items = stock[company];
    Object.keys(items).forEach(item => {
      const data = items[item];
      const row = document.createElement('tr');
      const retailPrice = (data.latestPurchasePrice * (1 + data.retailMargin)).toFixed(2);

      row.innerHTML = `
        <td>${item}</td>
        <td>${data.quantity}</td>
        <td>${data.latestPurchasePrice}</td>
        <td>${(data.retailMargin * 100).toFixed(0)}%</td>
        <td>${retailPrice}</td>
      `;
      tbody.appendChild(row);
    });

    section.appendChild(table);
    container.appendChild(section);
  });
} else {
  container.innerHTML = `<p style="text-align:center; color: red;">No stock data found.</p>`;
}
