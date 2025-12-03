// config
const API_BASE_URL =
  window.location.hostname.includes("localhost") ||
  window.location.hostname.includes("127.0.0.1")
    ? "http://localhost:8080/api"
    : "https://gymflow-backend.up.railway.app/api";

const PAGE_REDIRECT =
  window.location.hostname.includes("localhost") ||
  window.location.hostname.includes("127.0.0.1")
    ? "/src/index.html"
    : "../index.html";

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

// proteção simples da página
function protegerPagina() {
  const token = localStorage.getItem("token");
  if (!token) window.location.href = PAGE_REDIRECT;
}

async function fetchComToken(url, options = {}) {
  const token = localStorage.getItem("token");
  if (!token) {
    sair();
    return null;
  }

  options.headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  return fetch(url, options);
}

// popups
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

// carregar dados do usuário
async function carregarUsuarioAPI() {
  try {
    const userId = getUserIdFromToken();
    if (!userId) return;

    const response = await fetchComToken(`${API_BASE_URL}/usuarios?idUsuario=${userId}`);
    if (!response || !response.ok) return;

    const dados = await response.json();
    window.dadosUsuario = dados;

    document.getElementById("name").value = dados.nome;
    document.getElementById("email").value = dados.email;
    document.getElementById("pesoValor") && (document.getElementById("pesoValor").value = dados.peso);
    document.getElementById("alturaValor") && (document.getElementById("alturaValor").value = dados.altura);

    window.dataNascimentoAtual = dados.dataNascimento;

    const idadeEl = document.getElementById("idadeValor");
    if (idadeEl) {
      idadeEl.type = "text";
      idadeEl.value = dados.idade ?? "-";
      idadeEl.style.display = "inline-block";
    }

    document.getElementById("dataNascimento").value = dados.dataNascimento;

    calcularIMC();
    desabilitarCampos();
  } catch (e) {
    console.error(e);
  }
}
// editar/salvar dados
function editar() {
  const sectionInfos = document.querySelector(".section-infos");
  sectionInfos.classList.add("edit-mode");

  const campos = ["name", "pesoValor", "alturaValor", "dataNascimento"];
  campos.forEach((id) => {
    const campo = document.getElementById(id);
    if (campo) {
      campo.removeAttribute("readonly");
      campo.disabled = false;
    }
  });

  const email = document.getElementById("email");
  if (email) {
    email.setAttribute("readonly", true);
    email.disabled = true;
  }

  document.getElementById("idadeValor") && (document.getElementById("idadeValor").style.display = "none");
  document.getElementById("dataNascimento") && (document.getElementById("dataNascimento").style.display = "inline-block");
}

function desabilitarCampos() {
  const sectionInfos = document.querySelector(".section-infos");
  sectionInfos.classList.remove("edit-mode");

  const campos = ["name", "pesoValor", "alturaValor"];
  campos.forEach((id) => {
    const campo = document.getElementById(id);
    if (campo) {
      campo.setAttribute("readonly", true);
      campo.disabled = true;
    }
  });

  const email = document.getElementById("email");
  if (email) {
    email.setAttribute("readonly", true);
    email.disabled = true;
  }

  document.getElementById("dataNascimento") && (document.getElementById("dataNascimento").style.display = "none");
  document.getElementById("idadeValor") && (document.getElementById("idadeValor").style.display = "inline-block");
}

async function salvar() {
  try {
    const userId = getUserIdFromToken();

    const dataNascimentoInput = document.getElementById("dataNascimento");
    if (dataNascimentoInput && dataNascimentoInput.style.display !== "none") {
      window.dataNascimentoAtual = dataNascimentoInput.value;
    }

    const body = {
      nome: document.getElementById("name").value,
      peso: parseFloat(document.getElementById("pesoValor")?.value || 0),
      altura: parseFloat(document.getElementById("alturaValor")?.value || 0),
      dataNascimento: window.dataNascimentoAtual,
    };

    const response = await fetchComToken(`${API_BASE_URL}/usuarios/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response || !response.ok) {
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
  const peso = parseFloat(document.getElementById("pesoValor")?.value || 0);
  const altura = parseFloat(document.getElementById("alturaValor")?.value || 0);

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

// modal criar e editar metas
const listaMetas = document.getElementById("listaMetas");
let metaEditandoId = null;

function abrirModalMeta(tipo, meta = null) {
  const modal = document.getElementById("modalMeta");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  if (tipo === "criar") {
    metaEditandoId = null;
    document.getElementById("modalMetaTitulo").textContent = "Criar Meta";
    limparCamposMeta();
    document.getElementById("btnModalMeta").textContent = "Criar Meta";
  } else if (tipo === "editar" && meta) {
    metaEditandoId = meta.id;

    document.getElementById("modalMetaTitulo").textContent = "Editar Meta";
    document.getElementById("metaId").value = meta.id;
    document.getElementById("metaTipo").value = meta.tipo;
    document.getElementById("metaAtual").value = meta.atual;
    document.getElementById("metaDesejado").value = meta.desejado;
    document.getElementById("metaUnidade").value = meta.unidadeDeMedida;
    document.getElementById("metaInicio").value = meta.inicio;
    document.getElementById("metaPrazo").value = meta.prazo;

    document.getElementById("btnModalMeta").textContent = "Salvar Alterações";
  }
}

function fecharModalMeta() {
  const modal = document.getElementById("modalMeta");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  limparCamposMeta();
  metaEditandoId = null;
}

function limparCamposMeta() {
  document.getElementById("metaId").value = "";
  document.getElementById("metaTipo").value = "";
  document.getElementById("metaAtual").value = "";
  document.getElementById("metaDesejado").value = "";
  document.getElementById("metaUnidade").value = "QUILOS";
  document.getElementById("metaInicio").value = "";
  document.getElementById("metaPrazo").value = "";
}

async function salvarModalMeta() {
  const userId = getUserIdFromToken();

  if (!document.getElementById("metaTipo").value.trim()) return abrirPopupErro("Tipo obrigatório.");
  if (!document.getElementById("metaAtual").value) return abrirPopupErro("Informe o valor atual.");
  if (!document.getElementById("metaDesejado").value) return abrirPopupErro("Informe o desejado.");
  if (!document.getElementById("metaUnidade").value) return abrirPopupErro("Selecione unidade.");
  if (!document.getElementById("metaInicio").value) return abrirPopupErro("Selecione início.");
  if (!document.getElementById("metaPrazo").value) return abrirPopupErro("Selecione prazo.");

  const body = {
    tipo: document.getElementById("metaTipo").value,
    atual: Number(document.getElementById("metaAtual").value),
    desejado: Number(document.getElementById("metaDesejado").value),
    unidadeDeMedida: document.getElementById("metaUnidade").value,
    inicio: document.getElementById("metaInicio").value,
    prazo: document.getElementById("metaPrazo").value,
  };

  try {
    let res;
    if (metaEditandoId) {
      res = await fetchComToken(`${API_BASE_URL}/usuarios/metas/${metaEditandoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res || !res.ok) return abrirPopupErro("Erro ao atualizar meta.");
      abrirPopupSucesso("Meta atualizada!");
    } else {
      res = await fetchComToken(`${API_BASE_URL}/usuarios/${userId}/metas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res || !res.ok) return abrirPopupErro("Erro ao cadastrar meta.");
      abrirPopupSucesso("Meta cadastrada!");
    }

    fecharModalMeta();
    carregarMetas();
  } catch (e) {
    console.error(e);
    abrirPopupErro("Erro inesperado.");
  }
}

async function carregarMetas() {
  const userId = getUserIdFromToken();
  if (!userId) return;

  try {
    const res = await fetchComToken(`${API_BASE_URL}/usuarios/${userId}/metas`);
    if (!res || !res.ok) {
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

function renderizarMetas(metas) {
  listaMetas.innerHTML = "";

  const unidadesSimbolo = {
    GRAMAS: "g",
    QUILOS: "kg",
    LITROS: "L",
    MILILITROS: "ml",
    REPETICOES: "reps",
    PORCENTAGEM: "%",
    DIAS: "dias",
    SEMANAS: "semanas",
    MESES: "meses",
    MINUTOS: "min",
    SEGUNDOS: "s",
    HORAS: "h",
  };

  metas.forEach((meta, index) => {
    const simbolo = unidadesSimbolo[meta.unidadeDeMedida] || "";

    const card = document.createElement("div");
    card.classList.add("meta-card");

    card.innerHTML = `
      <p class="meta-card-title">Meta ${index + 1}: ${meta.tipo}</p>
      <p class="meta-card-info">Progresso: ${meta.atual} → ${meta.desejado}${simbolo}</p>
      <div class="meta-details" id="meta-${index}">
        <p><strong>Tipo:</strong> ${meta.tipo}</p>
        <p><strong>Atual:</strong> ${meta.atual}${simbolo}</p>
        <p><strong>Desejado:</strong> ${meta.desejado}${simbolo}</p>
        <p><strong>Início:</strong> ${meta.inicio}</p>
        <p><strong>Prazo:</strong> ${meta.prazo}</p>
        <button class="btnEditarMeta"><i class="fa-solid fa-pencil"></i></button>
      </div>
    `;

    card.addEventListener("click", (e) => {
      if (e.target && e.target.classList.contains("btnEditarMeta")) return;
      document.getElementById(`meta-${index}`).classList.toggle("ativa");
    });

    listaMetas.appendChild(card);

    const btnEditar = card.querySelector(".btnEditarMeta");
    if (btnEditar) {
      btnEditar.addEventListener("click", (ev) => {
        ev.stopPropagation();
        abrirModalMeta("editar", meta);
      });
    }
  });
}

// sair
function sair() {
  localStorage.removeItem("token");
  window.location.href = "../index.html";
}

// menu lateral
function openNav() {
  document.getElementById("navSide").style.width = "100%";
}
function closeNav() {
  document.getElementById("navSide").style.width = "0";
}


document.addEventListener("DOMContentLoaded", () => {
  protegerPagina();
  carregarUsuarioAPI();
  carregarMetas();

  document.getElementById("alturaValor")?.addEventListener("input", calcularIMC);
  document.getElementById("pesoValor")?.addEventListener("input", calcularIMC);

  document.getElementById("btnModalMeta")?.addEventListener("click", salvarModalMeta);
});
