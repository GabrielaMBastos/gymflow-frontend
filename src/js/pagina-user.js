/*

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

// configuração base da api
const API_BASE_URL = "http://localhost:8080/api";
const USER_ID = 1; // trocar depois para JWT


// requisições - usuário
async function carregarUsuarioAPI() {
  const response = await fetch(`${API_BASE_URL}/usuarios/${USER_ID}`);
  if (!response.ok) throw new Error("Falha ao obter usuário");
  return await response.json();
}

async function salvarUsuarioAPI(usuario) {
  const response = await fetch(`${API_BASE_URL}/usuarios/${USER_ID}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(usuario)
  });

  if (!response.ok) throw new Error("Falha ao salvar usuário");
  return await response.json();
}


// requisições - metas
async function carregarMetasAPI() {
  const response = await fetch(`${API_BASE_URL}/usuarios/${USER_ID}/metas`);
  if (!response.ok) throw new Error("Falha ao carregar metas");

  const metas = await response.json();
  metas.forEach(meta => criarItemMeta(meta.texto, meta.concluida, meta.id));
}

async function criarMetaAPI(texto) {
  const response = await fetch(`${API_BASE_URL}/usuarios/${USER_ID}/metas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texto, concluida: false })
  });

  if (!response.ok) throw new Error("Erro ao criar meta");
  return await response.json();
}

async function atualizarMetaAPI(metaId, concluida) {
  const response = await fetch(`${API_BASE_URL}/usuarios/${USER_ID}/metas/${metaId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ concluida })
  });

  if (!response.ok) throw new Error("Erro ao atualizar meta");
}

async function deletarMetaAPI(metaId) {
  const response = await fetch(`${API_BASE_URL}/usuarios/${USER_ID}/metas/${metaId}`, {
    method: "DELETE"
  });

  if (!response.ok) throw new Error("Erro ao excluir meta");
}

function preencherCampos(usuario) {
  document.getElementById("name").value = usuario.nome || "";
  document.getElementById("email").value = usuario.email || "";
  document.getElementById("senha").value = usuario.senha || "";
  document.getElementById("idadeValor").value = usuario.idade || "";
  document.getElementById("alturaValor").value = usuario.altura || "";
  document.getElementById("pesoValor").value = usuario.peso || "";
  atualizarIMC(usuario.peso, usuario.altura);
}

function editar() {
  document.querySelector(".main-container").classList.add("edit-mode");
  ["name", "email", "senha", "idadeValor", "alturaValor", "pesoValor"].forEach(id => {
    document.getElementById(id).removeAttribute("readonly");
  });
}

async function salvar() {
  const nome = document.getElementById("name").value.trim();
  const emailInput = document.getElementById("email");
  const email = emailInput.value.trim();
  const senha = document.getElementById("senha").value.trim();
  const idade = parseInt(document.getElementById("idadeValor").value);
  const altura = parseFloat(document.getElementById("alturaValor").value);
  const peso = parseFloat(document.getElementById("pesoValor").value);

  // validações
  if (!nome) return mostrarPopup("Por favor, insira um nome válido.");
  if (!validarEmail(email)) return mostrarPopup("Por favor, insira um email válido.");
  if (!senha || senha.length < 4) return mostrarPopup("A senha deve ter pelo menos 4 caracteres.");
  if (isNaN(idade) || idade <= 0) return mostrarPopup("Por favor, insira uma idade válida.");
  if (isNaN(altura) || altura <= 0) return mostrarPopup("Por favor, insira uma altura válida (em cm).");
  if (isNaN(peso) || peso <= 0) return mostrarPopup("Por favor, insira um peso válido (em kg).");

  const usuario = { nome, email, senha, idade, altura, peso };

  try {
    await salvarUsuarioAPI(usuario);
    mostrarPopupSucesso("Dados salvos com sucesso!");
  } catch (error) {
    console.error(error);
    mostrarPopup("Erro ao salvar no servidor.");
    return;
  }

  ["name", "email", "senha", "idadeValor", "alturaValor", "pesoValor"].forEach(id => {
    document.getElementById(id).setAttribute("readonly", true);
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
  const imc = calcularIMC(peso, altura);
  const classificacao = classificarIMC(imc);
  document.getElementById("imcValor").value = imc;
  document.getElementById("imcClassificacao").value = classificacao;
}

// email 
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.toLowerCase());
}

// popup
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

// mostrar / ocultar senha 
function viewSenha(){
  var tipo = document.getElementById("senha")
  if (tipo.type == "password") {
    tipo.type = "text";
  }else{
    tipo.type = "password";
  }
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
  window.location.href = "/src/index.html";
}

*/