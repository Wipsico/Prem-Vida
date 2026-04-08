// loginUser -> iniciar sesión
function loginUser() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      alert("Succesfully Login, Have a Nice Day!");
      window.location.href = "dashboard.html";
    })
    .catch((error) => {
      alert(error.message);
    });
}