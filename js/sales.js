let cart = []; 
let allProducts = [];
let selectedPaymentMethod = 'CASH';

document.addEventListener("DOMContentLoaded", async () => {
    await loadProducts();
    setupEventListeners();
});

async function loadProducts() {
    try {
        const snapshot = await db.collection("products").get();
        allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error cargando productos:", error);
    }
}

function setupEventListeners() {
    const searchInput = document.getElementById('productSearchInput');
    if (!searchInput) return;

    searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const query = e.target.value.toLowerCase().trim();
            if (!query) return;

            const product = allProducts.find(p => 
                (p.code && p.code.toLowerCase() === query) || 
                (p.name && p.name.toLowerCase().includes(query))
            );
            
            if (product) {
                addToCart(product);
                e.target.value = ""; 
            } else {
                alert("Producto no encontrado");
            }
        }
    });
}

function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.quantity += 1;
    } else {
        // Usamos salePrice o price dependiendo de cómo lo tengas en tu DB
        cart.push({ ...product, quantity: 1 });
    }
    renderCart();
}

function renderCart() {
    const container = document.getElementById("cartContainer");
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="text-center py-20 opacity-20">
                <span class="material-symbols-outlined text-7xl">shopping_basket</span>
                <p class="font-bold mt-4">El carrito está vacío</p>
            </div>`;
        calculateTotals();
        return;
    }

    container.innerHTML = cart.map((item, index) => `
        <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-emerald-50 flex items-center justify-between group transition-all hover:shadow-md">
            <div class="flex items-center gap-6">
                <div class="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#3f6754]">
                    <span class="material-symbols-outlined text-3xl">eco</span>
                </div>
                <div>
                    <h4 class="font-black text-[#3f6754] text-lg">${item.name}</h4>
                    <p class="text-[10px] font-bold text-emerald-800/30 uppercase tracking-widest">${item.id}</p>
                </div>
            </div>
            
            <div class="flex items-center gap-12">
                <div class="flex items-center bg-emerald-50 rounded-xl p-1">
                    <button onclick="updateQuantity(${index}, ${item.quantity - 1})" class="w-8 h-8 flex items-center justify-center text-[#3f6754] hover:bg-white rounded-lg transition-all">-</button>
                    <input type="number" value="${item.quantity}" onchange="updateQuantity(${index}, this.value)" class="w-12 bg-transparent border-none text-center font-black text-[#3f6754] focus:ring-0">
                    <button onclick="updateQuantity(${index}, ${item.quantity + 1})" class="w-8 h-8 flex items-center justify-center text-[#3f6754] hover:bg-white rounded-lg transition-all">+</button>
                </div>
                
                <div class="text-right min-w-[100px]">
                    <p class="text-[10px] font-bold text-gray-300 uppercase">Subtotal</p>
                    <p class="font-black text-[#3f6754]">Bs ${( (item.salePrice || 0) * item.quantity).toFixed(2)}</p>
                </div>

                <button onclick="removeFromCart(${index})" class="text-red-200 hover:text-red-500 transition-colors">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </div>
        </div>
    `).join('');

    calculateTotals();
}

function calculateTotals() {
    const total = cart.reduce((sum, item) => sum + ((item.salePrice || 0) * item.quantity), 0);
    const display = document.getElementById("finalTotalDisplay");
    if (display) display.innerText = total.toFixed(2);
}

function updateQuantity(index, val) {
    const newQty = parseInt(val);
    if (newQty <= 0) {
        removeFromCart(index);
    } else {
        cart[index].quantity = newQty;
        renderCart();
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
}

// ESTAS SON LAS QUE LLAMA TU HTML
async function confirmSale() {
    if (cart.length === 0) return alert("Carrito vacío");

    try {
        const batch = db.batch();
        const movementRef = db.collection("movements").doc();
        const dateValue = document.getElementById('transactionDate').value;

        const saleData = {
            items: cart,
            total: cart.reduce((sum, item) => sum + ((item.salePrice || 0) * item.quantity), 0),
            status: "confirmed",
            type: "sale",
            paymentMethod: selectedPaymentMethod,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            date: dateValue
        };

        batch.set(movementRef, saleData);

        cart.forEach(item => {
            const pRef = db.collection("products").doc(item.id);
            batch.update(pRef, { stock: firebase.firestore.FieldValue.increment(-item.quantity) });
        });

        await batch.commit();
        alert("¡Venta realizada!");
        location.reload();
    } catch (e) {
        console.error(e);
        alert("Error al vender");
    }
}

async function saveAsDraft() {
    if (cart.length === 0) return alert("Añade productos primero");

    try {
        const dateValue = document.getElementById('transactionDate').value;
        const draftData = {
            items: cart,
            total: cart.reduce((sum, item) => sum + ((item.salePrice || 0) * item.quantity), 0),
            status: "draft",
            type: "sale",
            paymentMethod: selectedPaymentMethod,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            date: dateValue
        };

        await db.collection("movements").add(draftData);
        alert("Borrador guardado");
        location.reload();
    } catch (e) {
        console.error(e);
    }
}