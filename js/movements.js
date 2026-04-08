function getProductById(productId) {
  return firebase.firestore()
    .collection("products")
    .doc(productId)
    .get();
}

function updateStock(productId, newStock) {
  return firebase.firestore()
    .collection("products")
    .doc(productId)
    .update({
      stock: newStock
    });
}

function saveMovement(data) {
  return firebase.firestore()
    .collection("movements")
    .add(data)
    .catch((error) => {

      firebase.firestore().collection("logs").add({
        message: error.message,
        date: new Date()
      });

      alert("Error saving movement");
      throw error;
    });
}

function getDraftById(draftId) {
  return firebase.firestore()
    .collection("movements")
    .doc(draftId)
    .get();
}

function updateDraft(draftId, data) {
  return firebase.firestore()
    .collection("movements")
    .doc(draftId)
    .update(data);
}

function getDrafts() {
  return firebase.firestore()
    .collection("movements")
    .where("status", "==", "draft")
    .get();
}

function confirmDraft(draftId) {

  getDraftById(draftId).then(async (doc) => {

    const d = doc.data();

    if (!d) {
      alert("Draft not found");
      return;
    }

    if (d.status === "confirmed") {
      alert("This draft is already confirmed");
      return;
    }

    const productDoc = await getProductById(d.productId);
    const product = productDoc.data();

    if (!product) {
      alert("Product not found");
      return;
    }

    if (product.stock < d.quantity) {
      alert("Not enough stock");
      return;
    }

    const newStock = product.stock - d.quantity;

    await updateStock(d.productId, newStock);

    await updateDraft(draftId, {
      status: "confirmed",
      createdAt: new Date()
    });

    alert("Draft confirmed successfully");

    loadDrafts();
  });
}