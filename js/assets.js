const CONFIG = {
    electronica: { life: 5, icon: 'devices' },
    muebles: { life: 10, icon: 'chair' },
    maquinaria: { life: 8, icon: 'settings' }
};

function loadAssets() {
    const table = document.getElementById('assetsTableBody');
    if (!table) return;

    db.collection("assets").orderBy("date", "desc").get()
        .then((querySnapshot) => {
            const assetsList = [];
            querySnapshot.forEach((doc) => {
                assetsList.push({ id: doc.id, ...doc.data() });
            });
            renderTable(assetsList);
        })
        .catch((error) => console.error("Error al cargar:", error));
}

function handleSave() {
    const name = document.getElementById('assetName').value;
    const category = document.getElementById('assetCategory').value;
    const cost = parseFloat(document.getElementById('assetCost').value);
    const date = document.getElementById('assetDate').value;

    if (!name || isNaN(cost) || !date) {
        alert("⚠️ Por favor, completa todos los campos correctamente.");
        return;
    }

    db.collection("assets").add({
        name: name,
        category: category,
        cost: cost,
        date: date,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        document.getElementById('assetName').value = '';
        document.getElementById('assetCost').value = '';
        loadAssets();
    })
    .catch((error) => console.error("Error al guardar:", error));
}

function renderTable(data) {
    const table = document.getElementById('assetsTableBody');
    let totalIn = 0, totalCur = 0, totalLo = 0;
    table.innerHTML = '';

    data.forEach(item => {
        // Aseguramos que el costo sea número antes de operar
        const itemCost = Number(item.cost) || 0;
        const status = calculateDepreciation(itemCost, item.date, item.category);
        
        totalIn += itemCost;
        totalCur += Number(status.current) || 0;
        totalLo += Number(status.loss) || 0;

        table.innerHTML += `
            <tr class="hover:bg-emerald-50/30 border-b border-emerald-50">
                <td class="px-6 py-4 flex items-center gap-3">
                    <span class="material-symbols-outlined text-gray-300">${status.icon}</span>
                    <div>
                        <p class="font-bold text-emerald-950 text-sm">${item.name}</p>
                        <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest">${item.category}</p>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                        <div class="w-16 bg-gray-100 h-1 rounded-full overflow-hidden">
                            <div class="bg-[#3f6754] h-full" style="width: ${status.health}%"></div>
                        </div>
                        <span class="text-[10px] font-bold text-gray-400">${status.health}%</span>
                    </div>
                </td>
                <td class="px-6 py-4 text-right text-xs text-gray-500 font-medium">Bs. ${itemCost.toLocaleString()}</td>
                <td class="px-6 py-4 text-right font-black text-emerald-800 text-sm">Bs. ${status.current.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td class="px-6 py-4 text-right">
                    <button onclick="deleteAsset('${item.id}')" class="text-red-300 hover:text-red-500 transition-colors">
                        <span class="material-symbols-outlined text-sm">delete</span>
                    </button>
                </td>
            </tr>
        `;
    });

    // Actualizar los cuadros de arriba con seguridad
    document.getElementById('totalInitial').textContent = `Bs. ${totalIn.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    document.getElementById('totalCurrent').textContent = `Bs. ${totalCur.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    document.getElementById('totalLoss').textContent = `Bs. ${totalLo.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
}

function calculateDepreciation(cost, date, category) {
    const today = new Date();
    const purchaseDate = new Date(date);
    
    // Si la fecha es inválida, devolvemos el costo original sin depreciar para evitar el NaN
    if (isNaN(purchaseDate.getTime())) {
        return { current: cost, health: 100, loss: 0, icon: 'help' };
    }

    const lifeYears = CONFIG[category]?.life || 10;
    // Calculamos años transcurridos
    let age = (today - purchaseDate) / (1000 * 60 * 60 * 24 * 365.25);
    if (age < 0) age = 0;
    
    const residual = cost * 0.10; // Valor de rescate (10%)
    const annualDep = (cost - residual) / lifeYears;
    let current = cost - (annualDep * age);
    
    // El valor no puede ser menor al residual
    if (current < residual) current = residual;

    return {
        current: current,
        health: Math.max(0, Math.min(100, 100 - (age / lifeYears * 100))).toFixed(0),
        loss: (cost - current),
        icon: CONFIG[category]?.icon || 'inventory_2'
    };
}

function deleteAsset(id) {
    if (confirm("¿Eliminar este activo?")) {
        db.collection("assets").doc(id).delete().then(() => loadAssets());
    }
}
function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(63, 103, 84); // Color #3f6754
    doc.text("PREM VIDA - REPORTE DE ACTIVOS FIJOS", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha de reporte: ${new Date().toLocaleDateString()}`, 14, 28);

    const totalIni = document.getElementById('totalInitial').textContent;
    const totalCur = document.getElementById('totalCurrent').textContent;
    doc.text(`Inversión Total: ${totalIni}  |  Valor Actual: ${totalCur}`, 14, 35);

    const columns = ["Descripción", "Categoría", "Fecha Compra", "Costo (Bs)", "Valor Actual (Bs)"];
    const rows = [];


    const tableBody = document.getElementById('assetsTableBody');
    const trs = tableBody.querySelectorAll('tr');

    trs.forEach(tr => {
        const tds = tr.querySelectorAll('td');
        const row = [
            tds[0].querySelector('p.font-bold').innerText, // Nombre
            tds[0].querySelector('p.text-\\[9px\\]').innerText, // Categoría
            tds[2].innerText, // Costo Original
            tds[3].innerText, // Valor Actual
        ];
        // Nota: Ajustamos el orden según los datos capturados
        rows.push([row[0], row[1], "Registrado", row[2], row[3]]);
    });

    doc.autoTable({
        head: [columns],
        body: rows,
        startY: 45,
        theme: 'grid',
        headStyles: { fillColor: [63, 103, 84] }, // Verde Prem Vida
        styles: { fontSize: 8 },
    });

    doc.save("Reporte_Activos_PremVida.pdf");
}

window.onload = loadAssets;