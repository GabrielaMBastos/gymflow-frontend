const API_URL =
  window.location.hostname.includes("localhost") ||
  window.location.hostname.includes("127.0.0.1")
    ? "http://localhost:8080/api/usuarios/login"
    : "https://gymflow-backend.up.railway.app/api/usuarios/login";


// verifica expiração do token              
function tokenExpirado(token) {
  try {
    const payloadBase64 = token.split(".")[1];
    const payload = JSON.parse(atob(payloadBase64));
    const agora = Date.now() / 1000; // segundos

    return payload.exp < agora;
  } catch (err) {
    return true; // token inválido vai tratar como expirado
  }
}


function caminhoMenu() {
  return window.location.origin.includes("localhost") ||
    window.location.origin.includes("127.0.0.1")
    ? "/src/paginas/MenuPrincipal.html"
    : "../paginas/MenuPrincipal.html";
}

// verifica token ao abrir tela
const token = localStorage.getItem("token");

if (token && !tokenExpirado(token)) {
  // token válido → vai pro menu
  window.location.href = caminhoMenu();
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

    // remove token antigo e salva o novo
    localStorage.setItem("token", data.token);

    console.log("Login bem-sucedido. Token salvo:", data.token);

    // redireciona para o menu
    window.location.href = caminhoMenu();
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
