async function cadastro(event) {
    event.preventDefault();
     
    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    // validaçoes
    if (!nome || !email || !senha) {
        mostrarPopup("Preencha todos os campos!");
        return;
    }

    if (!validarEmail(email)) {
        mostrarPopup("Email inválido!");
        return;
    }

    if (senha.length < 4) {
        mostrarPopup("A senha deve ter pelo menos 4 caracteres.");
        return;
    }

    // tenta contato com o back
    const API_URL =
    window.location.hostname.includes("localhost") ||
    window.location.hostname.includes("127.0.0.1")
      ? "http://localhost:8080/api/usuarios"
      : "https://gymflow-backend.up.railway.app/api/usuarios";

    try{
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, email, senha }),
        });


        if (!res.ok) {
            // codigo de email já existente
            if (res.status === 409) {
                mostrarPopup("Este email já está cadastrado!");
                return;
            }

            // outro tipo de erro
            const errorData = await res.json().catch(() => null);
            mostrarPopup(errorData?.error || "Erro ao cadastrar. Verifique os dados.");
            return;
        }

        // cadastro bem-sucedido
        const data = await res.json();
        mostrarPopup("Cadastro realizado com sucesso!");
        console.log("Usuário criado:", data);

    } catch (err) {
        mostrarPopup("Erro de conexão com o servidor!");
        console.error(err);
    }
}

function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.toLowerCase());
}

// popup
function mostrarPopup(msg) {
    document.getElementById("popupMensagem").innerHTML = msg;
    document.getElementById("popupErro").style.display = "flex";
}

function fecharPopup() {
    document.getElementById("popupErro").style.display = "none";
}

function viewSenha(){
  var tipo = document.getElementById("senha")
  if (tipo.type == "password") {
    tipo.type = "text";
  }else{
    tipo.type = "password";
  }
}
