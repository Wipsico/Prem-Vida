let chart;

// Configuración de vida útil para activos
const ASSET_CONFIG = {
    electronica: { life: 5 },
    muebles: { life: 10 },
    maquinaria: { life: 8 }
};

// Obtener rango de fechas
function getRange() {
    const startInput = document.getElementById("startDate")?.value;
    const endInput = document.getElementById("endDate")?.value;
    let start, end;

    if (startInput && endInput) {
        start = new Date(startInput + 'T00:00:00');
        end = new Date(endInput + 'T23:59:59');
    } else {
        start = new Date();
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setHours(23, 59, 59, 999);
    }
    return { start, end };
}

// 1. CARGAR RESUMEN Y GRÁFICO
window.loadSummaryAndChart = function() {
    const { start, end } = getRange();
    
    firebase.firestore().collection("movements")
        .where("createdAt", ">=", start)
        .where("createdAt", "<=", end)
        .onSnapshot((snapshot) => {
            let sales = 0;
            let expenses = 0;

            snapshot.forEach((doc) => {
                const m = doc.data();
                if (m.status === "confirmed") {
                    const total = Number(m.total || 0);
                    if (m.type === "sale") {
                        sales += total;
                    } else if (m.type === "expense" || m.type === "purchase") {
                        expenses += total;
                    }
                }
            });

            // Actualizar los IDs exactos de tu HTML
            const salesEl = document.getElementById("totalSales");
            const expensesEl = document.getElementById("totalExpenses");

            if (salesEl) salesEl.innerText = "Bs " + sales.toLocaleString('es-BO', {minimumFractionDigits: 2});
            if (expensesEl) expensesEl.innerText = "Bs " + expenses.toLocaleString('es-BO', {minimumFractionDigits: 2});

            renderChart(sales, expenses);
        });
}

// Renderizar Gráfico
function renderChart(sales, expenses) {
    const ctx = document.getElementById("salesChart"); // ID corregido según tu HTML
    if (!ctx) return;
    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Ventas", "Gastos"],
            datasets: [{
                data: [sales, expenses],
                backgroundColor: ["#3f6754", "#ef4444"],
                borderRadius: 12,
                barThickness: 50
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

// 2. TOP PRODUCTOS
window.loadTopProducts = function() {
    const counts = {};
    firebase.firestore().collection("movements")
        .where("type", "==", "sale")
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                const m = doc.data();
                counts[m.productName] = (counts[m.productName] || 0) + (Number(m.quantity) || 0);
            });
            const list = document.getElementById("topProducts");
            if (list) {
                list.innerHTML = Object.entries(counts)
                    .sort((a,b)=>b[1]-a[1])
                    .slice(0,5)
                    .map(([name, qty]) => `
                        <li class="flex justify-between text-sm bg-gray-50 p-2 rounded-lg mb-2">
                            <span class="font-medium text-emerald-900">${name}</span> 
                            <span class="font-bold text-emerald-700">${qty} und.</span>
                        </li>`).join('');
            }
        });
}

// 3. ALERTAS DE STOCK
window.loadAlerts = function() {
    firebase.firestore().collection("products").onSnapshot(snapshot => {
        const list = document.getElementById("alerts");
        const badge = document.getElementById("stockAlertCount"); // ID corregido según tu HTML
        let count = 0;
        if (list) list.innerHTML = "";

        snapshot.forEach(doc => {
            const p = doc.data();
            const stock = Number(p.stock) || 0;
            if (stock < 10) {
                count++;
                if (list) {
                    list.innerHTML += `
                    <li class="flex items-center justify-between text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 mb-2">
                        <span class="text-xs font-bold">${p.name || p.nombre}</span>
                        <span class="font-black text-xs">${stock}</span>
                    </li>`;
                }
            }
        });
        if (badge) badge.innerText = count;
    });
}