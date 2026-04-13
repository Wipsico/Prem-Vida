if (typeof window.db === 'undefined') {
    window.db = firebase.firestore();
}

function getProductById(productId) {
    return db.collection("products").doc(productId).get();
}

function updateStock(productId, newStock) {
    return db.collection("products").doc(productId).update({
        stock: newStock
    });
}

function saveMovement(data) {
    return db.collection("movements").add(data)
        .catch((error) => {
            db.collection("logs").add({
                message: error.message,
                date: new Date()
            });
            alert("Error al guardar el movimiento");
            throw error;
        });
}

function getDraftById(draftId) {
    return db.collection("movements").doc(draftId).get();
}

function updateDraft(draftId, data) {
    return db.collection("movements").doc(draftId).update(data);
}

function getDrafts() {
    return db.collection("movements").where("status", "==", "draft").get();
}

function confirmDraft(draftId) {
    getDraftById(draftId).then(async (doc) => {
        const d = doc.data();

        if (!d) {
            alert("Borrador no encontrado");
            return;
        }

        if (d.status === "confirmed") {
            alert("Este borrador ya fue confirmado");
            return;
        }

        const productDoc = await getProductById(d.productId);
        const product = productDoc.data();

        if (!product) {
            alert("Producto no encontrado");
            return;
        }

        if (product.stock < d.quantity) {
            alert("Stock insuficiente");
            return;
        }

        const newStock = product.stock - d.quantity;

        await updateStock(d.productId, newStock);

        await updateDraft(draftId, {
            status: "confirmed",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("Borrador confirmado con éxito");

        if (typeof loadDrafts === 'function') loadDrafts();
        if (typeof loadExpenses === 'function') loadExpenses();
    });
}