const API_URL =
  window.location.hostname.includes("localhost") ||
  window.location.hostname.includes("127.0.0.1")
    ? "http://localhost:8080/api"
    : "https://gymflow-backend.up.railway.app/api";


// autenticaçao 
const PAGE_REDIRECT =
  window.location.hostname.includes("localhost") ||
  window.location.hostname.includes("127.0.0.1")
    ? "/src/index.html"
    : "../index.html";

function verificarAutenticacao() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = PAGE_REDIRECT;
    throw new Error("Acesso negado: usuário não nao autenticado.");
  }

  return token;
}

const token = verificarAutenticacao();

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const usuario = await carregarUsuarioAPI();
    preencherCampos(usuario);
    await carregarMetasAPI();
  } catch (error) {
    console.error("Erro ao carregar dados iniciais:", error);
    mostrarPopup("Erro ao carregar dados do servidor.");
  }
});

// requisições user
async function carregarUsuarioAPI() {
  const res = await fetch(`${API_URL}/usuarios/perfil`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error("Falha ao obter usuário");
  return await res.json();
}

async function salvarUsuarioAPI(usuario) {
  const res = await fetch(`${API_URL}/usuarios/atualizar`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(usuario),
  });
  if (!res.ok) throw new Error("Falha ao salvar usuário");
  return await res.json();
}

// requisições metas
async function carregarMetasAPI() {
  const res = await fetch(`${API_URL}/metas`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error("Falha ao carregar metas");

  const metas = await res.json();
  metas.forEach(meta => criarItemMeta(meta.texto, meta.concluida, meta.id));
}

async function criarMetaAPI(texto) {
  const res = await fetch(`${API_URL}/metas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ texto, concluida: false }),
  });
  if (!res.ok) throw new Error("Erro ao criar meta");
  return await res.json();
}

async function atualizarMetaAPI(metaId, concluida) {
  const res = await fetch(`${API_URL}/metas/${metaId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ concluida }),
  });
  if (!res.ok) throw new Error("Erro ao atualizar meta");
}

async function deletarMetaAPI(metaId) {
  const res = await fetch(`${API_URL}/metas/${metaId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error("Erro ao excluir meta");
}


function preencherCampos(usuario) {
  document.getElementById("name").value = usuario.nome || "";
  document.getElementById("email").value = usuario.email || "";
  document.getElementById("idadeValor").value = usuario.idade || "";
  document.getElementById("alturaValor").value = usuario.altura || "";
  document.getElementById("pesoValor").value = usuario.peso || "";
  atualizarIMC(usuario.peso, usuario.altura);
}

function editar() {
  document.querySelector(".main-container").classList.add("edit-mode");
  ["name", "email", "idadeValor", "alturaValor", "pesoValor"].forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.removeAttribute("readonly");
      input.style.pointerEvents = "auto";
      input.style.backgroundColor = "white";
      input.style.cursor = "text";
    }
  });
}

async function salvar() {
  const nome = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const idade = parseInt(document.getElementById("idadeValor").value);
  const altura = parseFloat(document.getElementById("alturaValor").value);
  const peso = parseFloat(document.getElementById("pesoValor").value);

  if (!nome) return mostrarPopup("Por favor, insira um nome válido.");
  if (!validarEmail(email)) return mostrarPopup("Por favor, insira um email válido.");
  if (isNaN(idade) || idade <= 0) return mostrarPopup("Por favor, insira uma idade válida.");
  if (isNaN(altura) || altura <= 0) return mostrarPopup("Por favor, insira uma altura válida.");
  if (isNaN(peso) || peso <= 0) return mostrarPopup("Por favor, insira um peso válido.");

  const usuario = { nome, email, idade, altura, peso };

  try {
    await salvarUsuarioAPI(usuario);
    mostrarPopupSucesso("Dados salvos com sucesso!");
  } catch (error) {
    console.error(error);
    mostrarPopup("Erro ao salvar no servidor.");
    return;
  }

  ["name", "email", "idadeValor", "alturaValor", "pesoValor"].forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.setAttribute("readonly", true);
      input.style.pointerEvents = "none";
      input.style.backgroundColor = "transparent";
      input.style.cursor = "default";
    }
  });
  document.querySelector(".main-container").classList.remove("edit-mode");
  atualizarIMC(peso, altura);
}

// imc
function calcularIMC(peso, altura) {
  if (!peso || !altura) return "--";
  return (peso / ((altura / 100) ** 2)).toFixed(2);
}

function classificarIMC(imc) {
  if (imc === "--") return "--";
  imc = parseFloat(imc);
  if (imc < 18.5) return "Baixo peso";
  if (imc < 25) return "Normal";
  if (imc < 30) return "Sobrepeso";
  if (imc < 35) return "Obesidade I";
  if (imc < 40) return "Obesidade II";
  return "Obesidade III";
}

function atualizarIMC(peso, altura) {
  // calcula se os campos tiverem valores válidos
  if (!peso || !altura || isNaN(peso) || isNaN(altura) || peso <= 0 || altura <= 0) {
    document.getElementById("imcValor").textContent = "";
    document.getElementById("imcClassificacao").textContent = "";
    return;
  }

  const imc = calcularIMC(peso, altura);
  const classificacao = classificarIMC(imc);
  document.getElementById("imcValor").textContent = imc;
  document.getElementById("imcClassificacao").textContent = classificacao;
}

function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.toLowerCase());
}

function mostrarPopup(mensagem) {
  document.getElementById("popupMensagem").innerText = mensagem;
  document.getElementById("popupErro").style.display = "flex";
}
function fecharPopup() {
  document.getElementById("popupErro").style.display = "none";
}
function mostrarPopupSucesso(mensagem) {
  document.getElementById("popupMensagemSucesso").innerText = mensagem;
  document.getElementById("popupSucesso").style.display = "flex";
}
function fecharPopupSucesso() {
  document.getElementById("popupSucesso").style.display = "none";
}

// metas
const inputMeta = document.getElementById("novaMeta");
const btnAdicionarMeta = document.getElementById("adicionarMeta");
const listaMetas = document.getElementById("listaMetas");

btnAdicionarMeta.addEventListener("click", async () => {
  const texto = inputMeta.value.trim();
  if (texto === "") {
    mostrarPopup("Digite uma meta válida!");
    return;
  }

  try {
    const novaMeta = await criarMetaAPI(texto);
    criarItemMeta(novaMeta.texto, novaMeta.concluida, novaMeta.id);
    inputMeta.value = "";
  } catch (error) {
    console.error(error);
    mostrarPopup("Erro ao adicionar meta.");
  }
});

function criarItemMeta(texto, concluida = false, metaId = null) {
  const item = document.createElement("div");
  item.classList.add("meta-item");
  item.dataset.metaId = metaId;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = concluida;

  const span = document.createElement("span");
  span.innerText = texto;
  if (concluida) span.classList.add("concluida");

  checkbox.addEventListener("change", async () => {
    span.classList.toggle("concluida", checkbox.checked);
    try {
      await atualizarMetaAPI(metaId, checkbox.checked);
    } catch (error) {
      mostrarPopup("Erro ao atualizar meta.");
    }
  });

  const botaoRemover = document.createElement("i");
  botaoRemover.className = "fa-solid fa-trash";
  botaoRemover.addEventListener("click", async () => {
    try {
      await deletarMetaAPI(metaId);
      item.remove();
    } catch (error) {
      mostrarPopup("Erro ao excluir meta.");
    }
  });

  item.appendChild(checkbox);
  item.appendChild(span);
  item.appendChild(botaoRemover);
  listaMetas.appendChild(item);
}




// menu lateral
function openNav() {
  document.getElementById("navSide").style.width = "100%";
}

function closeNav() {
  document.getElementById("navSide").style.width = "0";
}

// sair
function sair() {

  localStorage.removeItem("token");
  window.location.href = "../index.html";
}

