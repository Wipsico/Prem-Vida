console.log(firebase)
// mostrar u ocultar inputs
function togglePricing() {
  const type = document.getElementById("pricingType").value;

  document.getElementById("manualDiv").style.display =
    type === "manual" ? "block" : "none";

  document.getElementById("formulaDiv").style.display =
    type === "formula" ? "block" : "none";
}


// generar Código
function generateCode(company) {
  return firebase.firestore()
    .collection("products")
    .where("company", "==", company)
    .get()
    .then((snapshot) => {

      let count = snapshot.size + 1;
      let number = count.toString().padStart(2, "0");

      return `${company}-${number}`;
    });
}


// agregar producto
function addProduct() {
 console.log("Intentando Guardar Producto...");


  const name = document.getElementById("name").value;
  const company = document.getElementById("company").value;
  const stock = parseInt(document.getElementById("stock").value);
  const costPrice = parseFloat(document.getElementById("costPrice").value);

  const pricingType = document.getElementById("pricingType").value;

  let salePrice = 0;
  let profitMargin = 0;

  if (pricingType === "manual") {
    salePrice = parseFloat(document.getElementById("salePrice").value);
  } else {
    profitMargin = parseFloat(document.getElementById("profitMargin").value);
    salePrice = costPrice + (costPrice * profitMargin / 100);
  }
  //generar codigo
  generateCode(company).then((code) => {

    firebase.firestore().collection("products").add({
      name,
      code,
      company,
      stock,
      costPrice,
      salePrice,
      pricingType,
      profitMargin,
      createdAt: new Date()
    })
    .then(() => {
       console.log("Producto guardado Correctamente");
       alert("Product Added");
      loadProducts();
    })
    .catch((error) => {
      console.error(error);
    });

  });
  if (!name || !code || !company) {
    alert("Complete all fields");
    return;
  }
  if  (isNaN(stock) || stock < 0) {
    alert("Invalid Stock");
    return; 
  }
  if (isNaN(costPrice) || costPrice <= 0) {
    alert("Invalid cost price"); 
    return;
  }
}


// mostrar productos
function loadProducts() {
  const list = document.getElementById("productList");
  list.innerHTML = "";

  firebase.firestore().collection("products").get()
    .then((snapshot) => {
      snapshot.forEach((doc) => {
        const p = doc.data();

        const li = document.createElement("li");
        li.innerText = `${p.code} | ${p.name} | ${p.company} | Stock: ${p.stock} | Sale: ${p.salePrice}`;

        list.appendChild(li);
      });
    });
}


// cargar al iniciar
window.onload = loadProducts;