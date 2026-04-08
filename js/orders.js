
let items = [];

function addItem() {

  const product = document.getElementById("product").value;
  const quantity = parseInt(document.getElementById("quantity").value);
  const cost = parseFloat(document.getElementById("cost").value);

  if (!product || !quantity || !cost) {
    alert("Fill all fields");
    return;
  }

  items.push({ product, quantity, cost });

  renderItems();

  document.getElementById("product").value = "";
  document.getElementById("quantity").value = "";
  document.getElementById("cost").value = "";
}

function renderItems() {

  const list = document.getElementById("itemsList");
  list.innerHTML = "";

  items.forEach((item, index) => {

    const li = document.createElement("li");
    li.innerText = `${item.product} | Qty: ${item.quantity} | Cost: ${item.cost}`;

    const btn = document.createElement("button");
    btn.innerText = "X";
    btn.onclick = () => removeItem(index);

    li.appendChild(btn);

    list.appendChild(li);
  });
}

function removeItem(index) {
  items.splice(index, 1);
  renderItems();
}

function calculateTotal() {
  return items.reduce((sum, i) => sum + i.cost, 0);
}

function saveOrderDraft() {

  const supplier = document.getElementById("supplier").value;

  if (!supplier || items.length === 0) {
    alert("Complete data");
    return;
  }

  const total = calculateTotal();

  firebase.firestore().collection("orders").add({
    supplier,
    items,
    total,
    status: "draft",
    createdAt: new Date()
  })
  .then(() => {
    alert("Draft saved");
    items = [];
    renderItems();
    loadOrders();
  });
}

function confirmOrder() {

  const supplier = document.getElementById("supplier").value;

  if (!supplier || items.length === 0) {
    alert("Complete data");
    return;
  }

  const total = calculateTotal();

  firebase.firestore().collection("orders").add({
    supplier,
    items,
    total,
    status: "confirmed",
    createdAt: new Date()
  })
  .then(() => {
    alert("Order confirmed");
    items = [];
    renderItems();
    loadOrders();
  });
}

function loadOrders() {

  const list = document.getElementById("ordersList");
  list.innerHTML = "";

  console.log("Loading orders...");

  firebase.firestore().collection("orders")
    .orderBy("createdAt", "desc")
    .get()
    .then((snapshot) => {

      snapshot.forEach((doc) => {

        const o = doc.data();

        const li = document.createElement("li");

        li.innerText = `
Supplier: ${o.supplier} | Total: ${o.total} | Status: ${o.status}
        `;
        if (o.status === "draft") {
  li.style.color = "orange";
} else if (o.status === "confirmed") {
  li.style.color = "green";
}

        const subList = document.createElement("ul");

        o.items.forEach((item) => {
          const subLi = document.createElement("li");
          subLi.innerText = `${item.product} - ${item.quantity}`;
          subList.appendChild(subLi);
        });

        li.appendChild(subList);

        list.appendChild(li);
      });

    })
    .catch((error) => {
      console.error(error);
    });
}

window.onload = () => {
  loadOrders();
};