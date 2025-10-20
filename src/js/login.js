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
        // enviar dados para backend
        const res = await fetch("http://localhost:8080/api/----", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha })
        });

        if (!res.ok) {
            mostrarPopup("Email ou senha inválidos!");
            return;
        }

        const data = await res.json();
        localStorage.setItem("token", data.token); // salvar jwt no navegador

    } catch (err) {
        mostrarPopup("Erro de conexão com o servidor!");
        console.error(err);
    }
}

// redefinir senha
async function redefinirSenha(event) {
    event.preventDefault();

    const nome = document.getElementById("resetNome").value.trim();
    const email = document.getElementById("resetEmail").value.trim();
    const novaSenha = document.getElementById("novaSenha").value.trim();

    // validaçoes
    if (!nome || !email || !novaSenha) {
        mostrarPopup("Preencha todos os campos!");
        return;
    }

    if (!validarEmail(email)) {
        mostrarPopup("Email inválido!");
        return;
    }

    if (novaSenha.length < 4) {
        mostrarPopup("A senha deve ter pelo menos 4 caracteres.");
        return;
    }

    try {
        // envia os dados para o backend
        const res = await fetch("http://localhost:8080/api/----", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, email, novaSenha })
        });

        const data = await res.json();

        if (res.ok) {
            // backend confirma que o email e nome existem e a senha foi redefinida
            mostrarPopup("Senha redefinida com sucesso!");
            fecharPopupSenha();
        } else {
            // backend retornou erro - email/nome inválido 
            mostrarPopup(data.message || "Email ou nome inválidos!");
        }

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