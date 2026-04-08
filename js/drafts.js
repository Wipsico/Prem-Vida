function loadDrafts() {

  const list = document.getElementById("draftList");
  list.innerHTML = "";

  getDrafts().then((snapshot) => {

    snapshot.forEach((doc) => {

      const d = doc.data();
      const id = doc.id;

      const li = document.createElement("li");

      li.innerHTML = `
        ${d.productName} | Qty: ${d.quantity}
        <button onclick="confirmDraft('${id}')">Confirm</button>
        <button onclick="editDraft('${id}')">Edit</button>
      `;

      list.appendChild(li);
    });

  });
}

function editDraft(id) {
  window.location.href = `sales.html?draftId=${id}`;
}

window.onload = loadDrafts;