// config
const API_BASE_URL = window.location.hostname.includes("localhost") || window.location.hostname.includes("127.0.0.1")
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
    throw new Error("Acesso negado: usuário não autenticado.");
  }

  return token;
}

// token
function getUserIdFromToken() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.idUser;
  } catch (err) {
    console.error("Erro ao decodificar token", err);
    return null;
  }
}


//popup
function abrirPopupErro(msg) {
  document.getElementById("popupMensagem").textContent = msg;
  document.getElementById("popupErro").style.display = "flex";
}
function fecharPopup() {
  document.getElementById("popupErro").style.display = "none";
}

function abrirPopupSucesso(msg) {
  document.getElementById("popupMensagemSucesso").textContent = msg;
  document.getElementById("popupSucesso").style.display = "flex";
}
function fecharPopupSucesso() {
  document.getElementById("popupSucesso").style.display = "none";
}

// carregar user
async function carregarUsuarioAPI() {
  try {
    const token = localStorage.getItem("token");
    const userId = getUserIdFromToken();
    if (!token || !userId) return;

    const response = await fetch(`${API_BASE_URL}/usuarios?idUsuario=${userId}`, {
      method: "GET",
      headers: { 
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) return;

    const dados = await response.json();
    window.dadosUsuario = dados;

    document.getElementById("name").value = dados.nome;
    document.getElementById("email").value = dados.email;
    document.getElementById("pesoValor").value = dados.peso;
    document.getElementById("alturaValor").value = dados.altura;

    window.dataNascimentoAtual = dados.dataNascimento;

    document.getElementById("idadeValor").type = "text";
    document.getElementById("idadeValor").value = dados.idade ?? "-";
    document.getElementById("idadeValor").style.display = "inline-block";

    document.getElementById("dataNascimento").value = dados.dataNascimento;

    calcularIMC();
    desabilitarCampos();
  } catch (e) {
    console.error(e);
  }
}

// editar/salvar
function editar() {
  const sectionInfos = document.querySelector(".section-infos");
  sectionInfos.classList.add("edit-mode");

  const campos = ["name", "pesoValor", "alturaValor", "dataNascimento"];
  campos.forEach(id => {
    const campo = document.getElementById(id);
    campo.removeAttribute("readonly");
    campo.disabled = false;
  });

  const email = document.getElementById("email");
  email.setAttribute("readonly", true);
  email.disabled = true;

  document.getElementById("idadeValor").style.display = "none";
  document.getElementById("dataNascimento").style.display = "inline-block";
}

function desabilitarCampos() {
  const sectionInfos = document.querySelector(".section-infos");
  sectionInfos.classList.remove("edit-mode");

  const campos = ["name", "pesoValor", "alturaValor"];
  campos.forEach(id => {
    const campo = document.getElementById(id);
    campo.setAttribute("readonly", true);
    campo.disabled = true;
  });

  const email = document.getElementById("email");
  email.setAttribute("readonly", true);
  email.disabled = true;

  document.getElementById("dataNascimento").style.display = "none";
  document.getElementById("idadeValor").style.display = "inline-block";
}

async function salvar() {
  try {
    const token = localStorage.getItem("token");
    const userId = getUserIdFromToken();

    const dataNascimentoInput = document.getElementById("dataNascimento");
    if (dataNascimentoInput.style.display !== "none") {
      window.dataNascimentoAtual = dataNascimentoInput.value;
    }

    const body = {
      nome: document.getElementById("name").value,
      peso: parseFloat(document.getElementById("pesoValor").value),
      altura: parseFloat(document.getElementById("alturaValor").value),
      dataNascimento: window.dataNascimentoAtual
    };

    const response = await fetch(`${API_BASE_URL}/usuarios/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      abrirPopupErro("Erro ao salvar.");
      return;
    }

    abrirPopupSucesso("Salvo com sucesso!");
    await carregarUsuarioAPI();
  } catch (e) {
    console.error(e);
  }
}


// IMC
function calcularIMC() {
  const peso = parseFloat(document.getElementById("pesoValor").value);
  const altura = parseFloat(document.getElementById("alturaValor").value);

  if (!peso || !altura) return;

  const imc = peso / Math.pow(altura / 100, 2);
  document.getElementById("imcValor").textContent = imc.toFixed(1);

  let c = "";
  if (imc < 18.5) c = "Abaixo do peso";
  else if (imc < 25) c = "Normal";
  else if (imc < 30) c = "Sobrepeso";
  else c = "Obesidade";

  document.getElementById("imcClassificacao").textContent = c;
}

// sair
function sair() {
  localStorage.removeItem("token");
  window.location.href = "../index.html";
}

// metas
const listaMetas = document.getElementById("listaMetas");

const camposMeta = {
  tipo: document.getElementById("metaTipo"),
  atual: document.getElementById("metaAtual"),
  desejado: document.getElementById("metaDesejado"),
  unidade: document.getElementById("metaUnidade"),
  inicio: document.getElementById("metaInicio"),
  prazo: document.getElementById("metaPrazo")
};

// carregar metas
async function carregarMetas() {
  const token = localStorage.getItem("token");
  const userId = getUserIdFromToken();

  try {
    const res = await fetch(`${API_BASE_URL}/usuarios/${userId}/metas`, {
      headers: { 
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      listaMetas.innerHTML = "<p>Nenhuma meta cadastrada.</p>";
      return;
    }

    const data = await res.json();
    renderizarMetas(data.metas || []);

  } catch (e) {
    console.error(e);
    listaMetas.innerHTML = "<p>Erro ao carregar metas.</p>";
  }
}

// renderizar lista
function renderizarMetas(metas) {
  listaMetas.innerHTML = "";

  // Mapa de unidades para símbolos
  const unidadesSimbolo = {
    GRAMAS: "g",
    QUILOS: "kg",
    LITROS: "L",
    MILILITROS: "ml",
    REPETICOES: "x",
    PORCENTAGEM: "%",
    DIAS: "dias",
    SEMANAS: "semanas",
    MESES: "meses",
    MINUTOS: "min",
    SEGUNDOS: "s",
    HORAS: "h"
  };

  metas.forEach((meta, index) => {
    const simbolo = unidadesSimbolo[meta.unidadeDeMedida] || "";

    const card = document.createElement("div");
    card.classList.add("meta-card");

    card.innerHTML = `
      <p class="meta-card-title">Meta ${index + 1}: ${meta.tipo}</p>
      <p class="meta-card-info">
        Progresso: ${meta.atual} → ${meta.desejado}${simbolo}
      </p>

      <div class="meta-details" id="meta-${index}">
        <p><strong>Tipo:</strong> ${meta.tipo}</p>
        <p><strong>Atual:</strong> ${meta.atual}${simbolo}</p>
        <p><strong>Desejado:</strong> ${meta.desejado}${simbolo}</p>
        <p><strong>Início:</strong> ${meta.inicio}</p>
        <p><strong>Prazo:</strong> ${meta.prazo}</p>
      </div>
    `;

    card.addEventListener("click", () => {
      document.getElementById(`meta-${index}`).classList.toggle("ativa");
    });

    listaMetas.appendChild(card);
  });
}


//  cadastrar meta
async function adicionarMeta() {
  const token = localStorage.getItem("token");
  const userId = getUserIdFromToken();

  if (!camposMeta.tipo.value.trim()) return abrirPopupErro("Tipo obrigatório.");
  if (!camposMeta.atual.value) return abrirPopupErro("Informe o valor atual.");
  if (!camposMeta.desejado.value) return abrirPopupErro("Informe o desejado.");
  if (!camposMeta.unidade.value) return abrirPopupErro("Selecione unidade.");
  if (!camposMeta.inicio.value) return abrirPopupErro("Selecione início.");
  if (!camposMeta.prazo.value) return abrirPopupErro("Selecione prazo.");

  const inicioISO = new Date(camposMeta.inicio.value).toISOString().split("T")[0];
  const prazoISO = new Date(camposMeta.prazo.value).toISOString().split("T")[0];

  const body = {
    tipo: camposMeta.tipo.value,
    atual: Number(camposMeta.atual.value),
    desejado: Number(camposMeta.desejado.value),
    unidadeDeMedida: camposMeta.unidade.value,
    inicio: inicioISO,
    prazo: prazoISO
  };

  try {
    const res = await fetch(`${API_BASE_URL}/usuarios/${userId}/metas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) return abrirPopupErro("Erro ao cadastrar meta.");

    abrirPopupSucesso("Meta cadastrada!");
    limparCamposMeta();
    carregarMetas();

  } catch (e) {
    console.error(e);
    abrirPopupErro("Erro inesperado.");
  }
}

// limpar campos metas
function limparCamposMeta() {
  Object.values(camposMeta).forEach(campo => campo.value = "");
}


// eventos
document.addEventListener("DOMContentLoaded", () => {
  verificarAutenticacao();
  carregarUsuarioAPI();
  carregarMetas();

  document.getElementById("alturaValor").addEventListener("input", calcularIMC);
  document.getElementById("pesoValor").addEventListener("input", calcularIMC);

  const btnAdicionarMeta = document.getElementById("btnAdicionarMeta");
  if (btnAdicionarMeta) {
    btnAdicionarMeta.addEventListener("click", adicionarMeta);
  }
});


// menu lateral
function openNav() {
  document.getElementById("navSide").style.width = "100%";
}

function closeNav() {
  document.getElementById("navSide").style.width = "0";
}
