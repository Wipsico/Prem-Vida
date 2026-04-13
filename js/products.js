// Referencia base de datos establecida en firebase.js
// const db = firebase.firestore();

function toggleModal(show) {
    const modal = document.getElementById('productModal');
    show ? modal.classList.remove('hidden') : modal.classList.add('hidden');
}

function togglePricing() {
    const type = document.getElementById("pricingType").value;
    document.getElementById("manualDiv").classList.toggle("hidden", type !== "manual");
    document.getElementById("formulaDiv").classList.toggle("hidden", type !== "formula");
}

async function generateCode(company) {
    // Busca productos de la misma marca para contar
    const snapshot = await db.collection("products")
        .where("company", "==", company)
        .get();
    
    let count = snapshot.size + 1;
    let prefix = company.substring(0, 3).toUpperCase();
    return `${prefix}-${count.toString().padStart(3, "0")}`;
}

async function addProduct() {
    const name = document.getElementById("name").value;
    const company = document.getElementById("company").value;
    const stock = parseInt(document.getElementById("stock").value);
    const costPrice = parseFloat(document.getElementById("costPrice").value);
    const pricingType = document.getElementById("pricingType").value;

    if (!name || !company || isNaN(stock)) {
        alert("Faltan campos obligatorios");
        return;
    }

    let salePrice = 0;
    if (pricingType === "manual") {
        salePrice = parseFloat(document.getElementById("salePrice").value);
    } else {
        const margin = parseFloat(document.getElementById("profitMargin").value);
        salePrice = costPrice + (costPrice * margin / 100);
    }

    try {
        const code = await generateCode(company);
        await db.collection("products").add({
            name,
            code,
            company,
            stock,
            costPrice,
            salePrice,
            pricingType,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert("Producto guardado");
        toggleModal(false);
        loadProducts();
        resetForm();
    } catch (error) {
        console.error("Error al guardar:", error);
    }
}

function resetForm() {
    document.getElementById("name").value = "";
    document.getElementById("company").value = "";
    document.getElementById("stock").value = "";
    document.getElementById("costPrice").value = "";
    document.getElementById("salePrice").value = "";
    document.getElementById("profitMargin").value = "";
}

function loadProducts() {
    const tableBody = document.getElementById("inventoryTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    db.collection("products").orderBy("createdAt", "desc").get()
    .then((snapshot) => {
        snapshot.forEach((doc) => {
            const p = doc.data();
            const id = doc.id;
            
            // Colores segun nivel de stock
            const isLow = p.stock < 5;
            const stockClass = isLow ? 'bg-tertiary/10 text-tertiary' : 'bg-primary/10 text-primary';
            const stockText = isLow ? 'Low Stock' : 'In Stock';

            tableBody.innerHTML += `
                <tr class="hover:bg-surface-container transition-colors group">
                    <td class="px-8 py-5">
                        <p class="font-bold text-on-surface">${p.name}</p>
                        <p class="text-xs text-on-surface-variant">${p.company}</p>
                    </td>
                    <td class="px-6 py-5">
                        <span class="text-sm font-mono text-on-surface-variant">${p.code}</span>
                    </td>
                    <td class="px-6 py-5">
                        <div class="flex items-center gap-2">
                            <span class="px-3 py-1 ${stockClass} rounded-full text-xs font-bold">${stockText}</span>
                            <span class="text-sm text-on-surface">${p.stock} unidades</span>
                        </div>
                    </td>
                    <td class="px-6 py-5 text-right font-bold text-primary">
                        ${p.salePrice ? p.salePrice.toFixed(2) : "0.00"} Bs
                    </td>
                    <td class="px-8 py-5 text-right">
                        <button onclick="deleteProduct('${id}')" class="material-symbols-outlined text-on-surface-variant hover:text-tertiary">delete</button>
                    </td>
                </tr>
            `;
        });
    });
}

async function deleteProduct(id) {
    if (confirm("¿Eliminar este producto?")) {
        await db.collection("products").doc(id).delete();
        loadProducts();
    }
}

window.onload = loadProducts;