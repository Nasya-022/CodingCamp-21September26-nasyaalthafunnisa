// ===== VARIABEL GLOBAL =====
let transactions = [];
let budgetLimit = 0;
let expenseChart = null;

// ===== SAAT HALAMAN DIMUAT =====
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    renderAll();
    setupEventListeners();
});

// ===== SETUP EVENT LISTENERS =====
function setupEventListeners() {
    // Form submit
    document.getElementById('transactionForm').addEventListener('submit', addTransaction);

    // Delete transaction (event delegation)
    document.getElementById('transactionList').addEventListener('click', deleteTransaction);

    // Sort change
    document.getElementById('sortBy').addEventListener('change', renderTransactionList);

    // Set budget limit
    document.getElementById('setLimitBtn').addEventListener('click', setBudgetLimit);

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
}

// ===== TAMBAH TRANSAKSI =====
function addTransaction(e) {
    e.preventDefault();

    const name = document.getElementById('itemName').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;

    // Validasi
    if (!name || isNaN(amount) || amount <= 0 || !category) {
        alert('Mohon isi semua field dengan benar!');
        return;
    }

    const transaction = {
        id: Date.now(), // ID unik dari timestamp
        name: name,
        amount: amount,
        category: category,
        date: new Date().toISOString()
    };

    transactions.push(transaction);
    saveToLocalStorage();
    renderAll();

    // Reset form
    document.getElementById('transactionForm').reset();
}

// ===== HAPUS TRANSAKSI =====
function deleteTransaction(e) {
    if (e.target.classList.contains('btn-delete')) {
        const id = parseInt(e.target.dataset.id);
        transactions = transactions.filter(t => t.id !== id);
        saveToLocalStorage();
        renderAll();
    }
}

// ===== SET BUDGET LIMIT (Optional Challenge 3) =====
function setBudgetLimit() {
    const limitInput = document.getElementById('budgetLimit');
    budgetLimit = parseFloat(limitInput.value);

    if (isNaN(budgetLimit) || budgetLimit <= 0) {
        alert('Masukkan limit yang valid!');
        return;
    }

    localStorage.setItem('budgetLimit', budgetLimit);
    checkLimitWarning();
}

// ===== CEK PERINGATAN LIMIT =====
function checkLimitWarning() {
    const total = calculateTotal();
    const warningEl = document.getElementById('limitWarning');

    if (budgetLimit > 0 && total > budgetLimit) {
        warningEl.classList.remove('hidden');
    } else {
        warningEl.classList.add('hidden');
    }
}

// ===== HITUNG TOTAL =====
function calculateTotal() {
    return transactions.reduce((sum, t) => sum + t.amount, 0);
}

// ===== SORT TRANSAKSI (Optional Challenge 2) =====
function getSortedTransactions() {
    const sortBy = document.getElementById('sortBy').value;
    const sorted = [...transactions]; // Copy array agar tidak mengubah original

    switch (sortBy) {
        case 'newest':
            return sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
        case 'oldest':
            return sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
        case 'amount-high':
            return sorted.sort((a, b) => b.amount - a.amount);
        case 'amount-low':
            return sorted.sort((a, b) => a.amount - b.amount);
        case 'category':
            return sorted.sort((a, b) => a.category.localeCompare(b.category));
        default:
            return sorted;
    }
}

// ===== RENDER SEMUA =====
function renderAll() {
    renderTotalBalance();
    renderTransactionList();
    renderChart();
    checkLimitWarning();
}

// ===== RENDER TOTAL BALANCE =====
function renderTotalBalance() {
    const total = calculateTotal();
    document.getElementById('totalBalance').textContent = `$${total.toFixed(2)}`;
}

// ===== RENDER DAFTAR TRANSAKSI =====
function renderTransactionList() {
    const listEl = document.getElementById('transactionList');
    const emptyMsg = document.getElementById('emptyMessage');
    const sorted = getSortedTransactions();

    listEl.innerHTML = '';

    if (sorted.length === 0) {
        emptyMsg.classList.remove('hidden');
    } else {
        emptyMsg.classList.add('hidden');
        sorted.forEach(t => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="transaction-info">
                    <div class="transaction-name">${escapeHtml(t.name)}</div>
                    <div class="transaction-amount">$${t.amount.toFixed(2)}</div>
                    <span class="transaction-category">${t.category}</span>
                </div>
                <button class="btn-delete" data-id="${t.id}">Delete</button>
            `;
            listEl.appendChild(li);
        });
    }
}

// ===== RENDER CHART =====
function renderChart() {
    const ctx = document.getElementById('expenseChart').getContext('2d');

    // Hitung total per kategori
    const categoryTotals = { Food: 0, Transport: 0, Fun: 0 };
    transactions.forEach(t => {
        if (categoryTotals[t.category] !== undefined) {
            categoryTotals[t.category] += t.amount;
        }
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    const colors = ['#2ecc71', '#3498db', '#e67e22']; // Hijau, Biru, Orange

    // Hapus chart lama jika ada
    if (expenseChart) {
        expenseChart.destroy();
    }

    // Buat chart baru
    expenseChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// ===== DARK/LIGHT MODE (Optional Challenge 1) =====
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const btn = document.getElementById('themeToggle');

    if (document.body.classList.contains('dark-mode')) {
        btn.textContent = '☀️ Light Mode';
        localStorage.setItem('theme', 'dark');
    } else {
        btn.textContent = '🌙 Dark Mode';
        localStorage.setItem('theme', 'light');
    }
}

// Load theme saat startup
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('themeToggle').textContent = '️ Light Mode';
    }
}

// ===== LOCAL STORAGE =====
function saveToLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('transactions');
    if (saved) {
        transactions = JSON.parse(saved);
    }

    const savedLimit = localStorage.getItem('budgetLimit');
    if (savedLimit) {
        budgetLimit = parseFloat(savedLimit);
        document.getElementById('budgetLimit').value = budgetLimit;
    }

    loadTheme();
}

// ===== HELPER: Escape HTML untuk keamanan =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}