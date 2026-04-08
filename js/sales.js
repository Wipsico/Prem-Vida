let currentDraftId = null;
let allProducts = [];

// Cargar productos en Sales
function loadProducts() {
  const select = document.getElementById("productSelect");
  select.innerHTML = '<option value="">Select product</option>';

  firebase.firestore().collection("products").get()
    .then((snapshot) => {
      snapshot.forEach((doc) => {
        const p = doc.data();

        const option = document.createElement("option");
        option.value = doc.id;
        option.text = p.name;

        select.appendChild(option);
      });
    });
}

// Cargar Drafts
function loadDraftFromURL() {

  const params = new URLSearchParams(window.location.search);
  const draftId = params.get("draftId");

  if (!draftId) return;

  firebase.firestore().collection("movements").doc(draftId).get()
    .then((doc) => {

      const d = doc.data();

      if (!d) return;

      currentDraftId = draftId;

      document.getElementById("quantity").value = d.quantity;
      document.getElementById("type").value = d.type;
      document.getElementById("productSelect").value = d.productId;

    });
}

// Guardar/ actualiizar Drafts
async function saveDraft() {

  console.log("Click Draft");

  const productId = selectedProductId;
  const quantity = parseInt(document.getElementById("quantity").value);

  if (!productId) {
    alert("Select a product");
    return;
  }

  if (isNaN(quantity) || quantity <= 0) {
    alert("Invalid quantity");
    return;
  }

  try {

    const doc = await getProductById(productId);
    const product = doc.data();

    if (!product) {
      alert("Product not found");
      return;
    }

    // Existencia actualizada
    if (currentDraftId) {

      await updateDraft(currentDraftId, {
        productId,
        productName: product.name,
        quantity,
        total: product.salePrice * quantity,
        type: "sale",
        status: "draft",
        createdAt: new Date()
      });

      alert("Draft updated");
      return;
    }

    // Crear nuevo sino
    await saveMovement({
      productId,
      productName: product.name,
      quantity,
      total: product.salePrice * quantity,
      type: "sale",
      status: "draft",
      createdAt: new Date()
    });

    alert("Draft saved correctly");
    document.getElementById("quantity").value = "";
    window.location.href = "drafts.html";

  } catch (error) {
    console.error("ERROR COMPLETO:", error);
    alert("Revisa consola F12");
  }
}

// Confirmar Venta 
function confirmSale() {

  const productId = selectedProductId;
  const quantity = parseInt(document.getElementById("quantity").value);

  if (!productId) {
    alert("Select a product");
    return;
  }

  if (isNaN(quantity) || quantity <= 0) {
    alert("Invalid quantity");
    return;
  }

  const productRef = firebase.firestore().collection("products").doc(productId);

  productRef.get().then((doc) => {

    const product = doc.data();

    if (!product) {
      alert("Product not found");
      return;
    }

    if (product.stock <= 0) {
      alert("No stock available");
      return;
    }

    if (quantity > product.stock) {
      alert(`Only ${product.stock} available`);
      return;
    }

    const newStock = product.stock - quantity;

    return productRef.update({ stock: newStock })
      .then(() => {
        return firebase.firestore().collection("movements").add({
          productId,
          productName: product.name,
          quantity,
          type: "sale",
          total: product.salePrice * quantity,
          status: "confirmed",
          createdAt: new Date()
        });
      });

  })
  .then(() => {
    alert("Sale confirmed");
    document.getElementById("quantity").value = "";
  })
  .catch((error) => {
    console.error(error);
    alert("Error confirming sale");
  });
}
function searchProducts() {
  const query = document.getElementById("searchProduct").value.toLowerCase();
  const select = document.getElementById("productSelect");
  select.innerHTML = '<option value="">Select product</option>';

   if (!query) {
    loadProducts();
    return;
   }
   const filtered = allProducts.filter(p => p.name.toLowerCase().includes(query));
   filtered.forEach(p => {
    const option = document.createElement("option");
    option.value = p.id;
    option.text = p.name;
    select.appendChild(option);
   });
  }
function loadProductsForSearch(){
  firebase.firestore().collection("products").get()
  .then((snapshot) => {
    allProducts = [];

    snapshot.forEach((doc) => {
      allProducts.push({ id: doc.id, ...doc.data() });
    });
  });
}
function loadProducts() {
  firebase.firestore().collection("products").get()
    .then((snapshot) => {

      productsList = [];

      snapshot.forEach((doc) => {
        const p = doc.data();

        productsList.push({
          id: doc.id,
          name: p.name,
          stock: p.stock,
          price: p.salePrice
        });
      });
    });
}
function searchProducts() {
  const input = document.getElementById("searchProduct").value.toLowerCase();
  const suggestions = document.getElementById("suggestions");

  suggestions.innerHTML = "";

  if (!input) return;

  const filtered = productsList.filter(p =>
    p.name.toLowerCase().includes(input)
  );

  filtered.forEach(p => {
    const div = document.createElement("div");

    div.className = "p-2 hover:bg-gray-200 cursor-pointer";
    div.innerHTML = `
      <strong>${p.name}</strong><br>
      <small>Stock: ${p.stock} | Bs ${p.price}</small>
    `;

    div.onclick = () => selectProduct(p);

    suggestions.appendChild(div);
  });
}
function selectProduct(product) {

  selectedProductId = product.id;

  document.getElementById("searchProduct").value = product.name;

  document.getElementById("suggestions").innerHTML = "";

  // sincronizamos con select oculto
  const select = document.getElementById("productSelect");
  select.innerHTML = `<option value="${product.id}">${product.name}</option>`;
}

// Iniciador
window.onload = () => {
  loadProducts();
  loadProductsForSearch();
  loadDraftFromURL();
};
document.getElementById("productSelect").addEventListener("change", async (e) => {
  const doc = await getProductById(e.target.value);
  const p = doc.data();

  document.getElementById("stockInfo").innerText = `Stock disponible: ${p.stock}`;
});
