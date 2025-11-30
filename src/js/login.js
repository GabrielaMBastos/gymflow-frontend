const API_URL =
    window.location.hostname.includes("localhost") ||
    window.location.hostname.includes("127.0.0.1")
      ? "http://localhost:8080/api/usuarios/login"
      : "https://gymflow-backend.up.railway.app/api/usuarios/login";

      const token = localStorage.getItem("token");
if (token) {
  // Usuário já está logado → manda pro menu
  let caminhoMenu;
  
  if (window.location.origin.includes("localhost") || 
      window.location.origin.includes("127.0.0.1")) {
    caminhoMenu = "/src/paginas/MenuPrincipal.html";
  } else {
    caminhoMenu = "../paginas/MenuPrincipal.html";
  }

  window.location.href = caminhoMenu;
}



async function login(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    if (!email || !senha) {
        mostrarPopup("Preencha todos os campos!");
        return;
    }

    if (!validarEmail(email)) {
        mostrarPopup("Email inválido!");
        return;
    }

    try {
    const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
    });

    const data = await res.json();

    if (!res.ok) {
        mostrarPopup(data.message || "Email ou senha inválidos!");
        return;
    }

    // remove apenas o token antigo se existir
    localStorage.removeItem("token");

    // salva o token
    if (data.token) {
        localStorage.setItem("token", data.token);
    }

    console.log("Login bem-sucedido. Token salvo:", data.token);

    let caminhoMenu;

    if (window.location.origin.includes("localhost") || 
        window.location.origin.includes("127.0.0.1")) {
        caminhoMenu = "/src/paginas/MenuPrincipal.html";
    } else {
        caminhoMenu = "../paginas/MenuPrincipal.html";
    }

window.location.href = caminhoMenu;


} catch (err) {
    mostrarPopup("Erro de conexão com o servidor!");
    console.error(err);
}
}

function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.toLowerCase());
}

// Popups
function abrirPopup(id) {
    document.getElementById(id).style.display = "flex";
}
function fecharPopup() {
    document.getElementById("popupErro").style.display = "none";
}
function fecharPopupSenha() {
    document.getElementById("popupSenha").style.display = "none";
}

function mostrarPopup(msg) {
    document.getElementById("popupMensagem").innerText = msg;
    abrirPopup("popupErro");
}

function viewSenha(){
  var tipo = document.getElementById("senha")
  if (tipo.type == "password") {
    tipo.type = "text";
  }else{
    tipo.type = "password";
  }
}