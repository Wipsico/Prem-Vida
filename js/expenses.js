if (typeof window.db === 'undefined') {
    window.db = firebase.firestore();
}

// Función para renderizar las filas en la tabla
const renderExpenseRows = (snapshot) => {
    const tableBody = document.getElementById('expensesTableBody');
    const totalDisplay = document.getElementById('totalMonthlyExpenses');
    
    if (!tableBody) return;

    let totalMonth = 0;
    let htmlContent = "";

    if (snapshot.empty) {
        tableBody.innerHTML = `<tr><td colspan="3" class="py-10 text-center text-gray-400 text-xs italic">No hay gastos registrados</td></tr>`;
        if (totalDisplay) totalDisplay.innerText = "Bs 0.00";
        return;
    }

    snapshot.forEach((doc) => {
        const data = doc.data();
        totalMonth += (data.total || 0);
        
        // Formateo de fecha
        const dateStr = data.createdAt ? data.createdAt.toDate().toLocaleDateString('es-BO', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        }) : 'Reciente';

        htmlContent += `
            <tr class="expense-row transition-all border-b border-emerald-50/50 group">
                <td class="px-6 py-5">
                    <div class="font-bold text-emerald-900 group-hover:text-[#3f6754] transition-colors">${data.productName}</div>
                    <div class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">${dateStr}</div>
                </td>
                <td class="px-6 py-5">
                    <span class="px-3 py-1 rounded-full bg-emerald-100 text-[#3f6754] text-[10px] font-black uppercase tracking-tighter">
                        ${data.category}
                    </span>
                </td>
                <td class="px-6 py-5 text-right font-black text-red-500/80">
                    Bs ${(data.total || 0).toLocaleString('es-BO', {minimumFractionDigits: 2})}
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = htmlContent;
    if (totalDisplay) {
        totalDisplay.innerText = `Bs ${totalMonth.toLocaleString('es-BO', {minimumFractionDigits: 2})}`;
    }
};

// Carga en tiempo real con protección de índices
window.loadExpenses = function() {
    console.log("Iniciando escucha de gastos...");
    
    // Intento con orden (Requiere índice en Firebase)
    db.collection("movements")
        .where("type", "==", "expense")
        .orderBy("createdAt", "desc")
        .onSnapshot(renderExpenseRows, (error) => {
            if (error.code === 'failed-precondition') {
                console.warn("Índice no listo. Cargando sin orden...");
                // Fallback: Carga sin orden si el índice falla
                db.collection("movements")
                    .where("type", "==", "expense")
                    .onSnapshot(renderExpenseRows);
            } else {
                console.error("Error en Firestore:", error);
            }
        });
};

// Función para guardar el gasto
window.saveExpense = async function() {
    const elDesc = document.getElementById('expenseDesc');
    const elCat = document.getElementById('expenseCat');
    const elAmount = document.getElementById('expenseAmount');
    const elDate = document.getElementById('expenseDate');

    if (!elDesc || !elAmount) return;

    const desc = elDesc.value.trim();
    const cat = elCat.value;
    const amount = parseFloat(elAmount.value);
    const dateValue = elDate && elDate.value ? new Date(elDate.value + 'T12:00:00') : new Date();

    if (!desc || isNaN(amount)) {
        alert("Por favor completa los campos");
        return;
    }

    const data = {
        productName: desc,
        category: cat,
        total: amount,
        type: "expense",
        status: "confirmed",
        createdAt: firebase.firestore.Timestamp.fromDate(dateValue)
    };

    try {
        // Usa la función de movements.js
        if (typeof saveMovement === 'function') {
            await saveMovement(data);
        } else {
            await db.collection("movements").add(data);
        }
        
        elDesc.value = "";
        elAmount.value = "";
        console.log("Registro exitoso");
    } catch (e) {
        console.error("Error al guardar:", e);
    }
};

// Inicializar al cargar el documento
document.addEventListener('DOMContentLoaded', window.loadExpenses);