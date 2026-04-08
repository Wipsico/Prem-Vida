let chart;
let productList = [];
let selectedProductId = null;

function getRange() {

  const startInput = document.getElementById("startDate").value;
  const endInput = document.getElementById("endDate").value;

  let start, end;

  if (startInput && endInput) {
    start = new Date(startInput);
    end = new Date(endInput);
    end.setHours(23,59,59,999);
  } else {
    start = new Date();
    start.setHours(0,0,0,0);

    end = new Date();
    end.setHours(23,59,59,999);
  }

  return { start, end };
}

function loadSummaryAndChart() {

  const { start, end } = getRange();

  let sales = 0;
  let expenses = 0;

  firebase.firestore().collection("movements")
    .where("createdAt", ">=", start)
    .where("createdAt", "<=", end)
    .where("status", "==", "confirmed")
    .get()
    .then((snapshot) => {

      snapshot.forEach((doc) => {

        const m = doc.data();

        if (m.type === "sale") {
          sales += m.total;
        } else {
          expenses += m.total;
        }

      });

      // texto
      document.getElementById("sales").innerText = "Bs " + sales.toLocaleString('es-BO', {minimumFractionDigits: 2});
      document.getElementById("expenses").innerText = "Bs " + expenses.toLocaleString('es-BO', {minimumFractionDigits: 2});
      document.getElementById("profit").innerText = "Bs " + (sales - expenses).toLocaleString('es-BO', {minimumFractionDigits: 2});

      // gráfico
      renderChart(sales, expenses);

    });
}

function renderChart(sales, expenses) {

  const ctx = document.getElementById("chart");

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Sales", "Expenses"],
      datasets: [{
        label: "Amount",
        data: [sales, expenses]
      }]
    }
  });
}

function loadTopProducts() {

  const counts = {};

  firebase.firestore().collection("movements")
    .where("status", "==", "confirmed")
    .get()
    .then((snapshot) => {

      snapshot.forEach((doc) => {

        const m = doc.data();

        if (m.type === "sale") {
          counts[m.productName] = (counts[m.productName] || 0) + m.quantity;
        }

      });

      const list = document.getElementById("topProducts");
      list.innerHTML = "";

      Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([name, qty]) => {

          const li = document.createElement("li");
          li.innerText = `${name} - ${qty}`;

          list.appendChild(li);
        });

    });
}

function loadAlerts() {

  const list = document.getElementById("alerts");
  list.innerHTML = "";

  firebase.firestore().collection("products").get()
    .then((snapshot) => {

      snapshot.forEach((doc) => {

        const p = doc.data();

        if (p.stock < 10) {
          const li = document.createElement("li");
          li.innerText = `Low stock: ${p.name}`;
          li.style.color = "red";
          list.appendChild(li);
        }

      });

    });

  firebase.firestore().collection("orders")
    .where("status", "==", "draft")
    .get()
    .then((snapshot) => {

      snapshot.forEach((doc) => {

        const o = doc.data();

        const li = document.createElement("li");
        li.innerText = `Pending order: ${o.supplier}`;
        li.style.color = "orange";

        list.appendChild(li);

      });

    });
}

function loadHistory() {

  const list = document.getElementById("history");
  list.innerHTML = "";

  firebase.firestore().collection("movements")
    .orderBy("createdAt", "desc")
    .limit(10)
    .get()
    .then((snapshot) => {

      snapshot.forEach((doc) => {

        const m = doc.data();

        const li = document.createElement("li");
        li.innerText = `${m.productName} - ${m.quantity} - ${m.type}`;

        list.appendChild(li);

      });

    });
}

function loadAll() {
  loadSummaryAndChart();
  loadTopProducts();
  loadAlerts();
  loadHistory();
}

window.onload = loadAll;