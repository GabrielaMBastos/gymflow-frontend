let chartPizzaInstance = null;
let chartLinhaInstance = null;
let chartHorizontalInstance = null;
let chartRadarInstance = null;

// config
const API_URL =
  window.location.hostname.includes("localhost") ||
  window.location.hostname.includes("127.0.0.1")
    ? "http://localhost:8080/api"
    : "https://gymflow-backend.up.railway.app/api";

const PAGE_REDIRECT =
  window.location.hostname.includes("localhost") ||
  window.location.hostname.includes("127.0.0.1")
    ? "/src/index.html"
    : "../index.html";

// autenticação
function verificarAutenticacao() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = PAGE_REDIRECT;
    throw new Error("Acesso negado: usuário não autenticado.");
  }
  return token;
}

const token = verificarAutenticacao();

function getUserIdFromToken() {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.idUsuario || payload.idUser || payload.id;
  } catch {
    return null;
  }
}

const userId = getUserIdFromToken();
if (!userId) {
  localStorage.removeItem("token");
  window.location.href = PAGE_REDIRECT;
}

// funções gerais
function gerarCores(qtd) {
  const coresBase = [
    "#1565C0",
    "#43A047",
    "#FDD835",
    "#E53935",
    "#8E24AA",
    "#00897B",
    "#FB8C00",
  ];
  return Array.from({ length: qtd }, (_, i) => coresBase[i % coresBase.length]);
}

function mostrarMensagemCanvas(id, mensagem = "Sem dados para ser exibido") {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "16px Montserrat";
  ctx.fillStyle = "#555";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(mensagem, canvas.width / 2, canvas.height / 2);
}

// funções para buscar dados no back
async function buscarTreinosDoUsuario(userId) {
  try {
    const resp = await fetch(`${API_URL}/treinos?usuarioId=${userId}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!resp.ok) return [];
    const dados = await resp.json();
    return dados.treinos || dados.content || [];
  } catch {
    return [];
  }
}

async function buscarFichasDoTreino(idTreino) {
  try {
    const resp = await fetch(`${API_URL}/fichas?idTreino=${idTreino}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!resp.ok) return [];
    const dados = await resp.json();
    return dados.fichas || dados.content || [];
  } catch {
    return [];
  }
}

// gráfico pizza
function criarGraficoPizza(labels, valores, cores) {
  const ctx = document.getElementById("graficoPizza").getContext("2d");
  if (chartPizzaInstance) chartPizzaInstance.destroy();

  chartPizzaInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          label: "% por Grupo Muscular",
          data: valores,
          backgroundColor: cores,
          borderColor: "#fff",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "right" } },
    },
  });
}

async function buscarDadosECriarGraficoPizza() {
  mostrarMensagemCanvas("graficoPizza", "Carregando dados...");
  const treinos = await buscarTreinosDoUsuario(userId);
  if (!treinos.length) return mostrarMensagemCanvas("graficoPizza");

  const contagem = {};
  for (const treino of treinos) {
    const fichas = await buscarFichasDoTreino(treino.id);
    for (const ficha of fichas) {
      try {
        const respEx = await fetch(
          `${API_URL}/fichas/exercicio?idFicha=${ficha.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!respEx.ok) continue;
        const lista = (await respEx.json()).exerciciosDaFicha || [];
        lista.forEach((ex) => {
          const grupo = ex.grupoMuscular?.toUpperCase() || "OUTROS";
          contagem[grupo] = (contagem[grupo] || 0) + 1;
        });
      } catch {}
    }
  }

  const total = Object.values(contagem).reduce((a, b) => a + b, 0);
  if (!total) return mostrarMensagemCanvas("graficoPizza");

  criarGraficoPizza(
    Object.keys(contagem),
    Object.values(contagem).map((q) => Number(((q / total) * 100).toFixed(1))),
    gerarCores(Object.keys(contagem).length)
  );
}

// gráfico linha
function criarGraficoLinha(labels, datasets) {
  const ctx = document.getElementById("graficoLinha").getContext("2d");
  if (chartLinhaInstance) chartLinhaInstance.destroy();

  chartLinhaInstance = new Chart(ctx, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "top" } },
      scales: {
        x: { title: { display: true, text: "Data" } },
        y: { beginAtZero: true, title: { display: true, text: "Carga (kg)" } },
      },
    },
  });
}

async function buscarDadosECriarGraficoLinha() {
  mostrarMensagemCanvas("graficoLinha", "Carregando dados...");
  const treinos = await buscarTreinosDoUsuario(userId);
  if (!treinos.length) return mostrarMensagemCanvas("graficoLinha");

  const mapExNome = {};
  const seriesTotais = [];

  for (const treino of treinos) {
    const fichas = await buscarFichasDoTreino(treino.id);
    for (const ficha of fichas) {
      try {
        const respEx = await fetch(
          `${API_URL}/fichas/exercicio?idFicha=${ficha.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!respEx.ok) continue;
        const exercicios = (await respEx.json()).exerciciosDaFicha || [];
        for (const ex of exercicios) {
          mapExNome[ex.exercicioFichaId] =
            ex.nome || ex.equipamento || "Desconhecido";
          const respSeries = await fetch(
            `${API_URL}/series?exercicioFichaId=${ex.exercicioFichaId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (!respSeries.ok) continue;
          const lista = (await respSeries.json()).series || [];
          lista.forEach((s) =>
            seriesTotais.push({ ...s, exercicioFichaId: ex.exercicioFichaId })
          );
        }
      } catch {}
    }
  }

  if (!seriesTotais.length) return mostrarMensagemCanvas("graficoLinha");

  const agrupado = {};
  for (const s of seriesTotais) {
    const nome = mapExNome[s.exercicioFichaId] || "Desconhecido";
    if (!agrupado[nome]) agrupado[nome] = [];
    agrupado[nome].push({ data: s.data, carga: s.carga });
  }

  popularDropdownEquipamentos(agrupado);
  atualizarGraficoLinha(agrupado);
}

// seletor equipamento do gráfico linha
function popularDropdownEquipamentos(agrupado) {
  const dropdownContent = document.getElementById("dropdownContent");
  dropdownContent.innerHTML = "";
  Object.keys(agrupado).forEach((nome) => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = nome;
    checkbox.addEventListener("change", () => {
      const checkedBoxes = Array.from(
        dropdownContent.querySelectorAll("input:checked")
      );
      if (checkedBoxes.length > 4) {
        checkbox.checked = false;
        alert("Você pode selecionar no máximo 4 exercícios.");
        return;
      }
      atualizarGraficoLinha(agrupado);
    });
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(nome));
    dropdownContent.appendChild(label);
  });

  const btn = document.getElementById("dropdownBtn");
  btn.textContent = "Selecione até 4 exercícios ";
  const arrow = document.createElement("span");
  arrow.classList.add("arrow");
  arrow.innerHTML = "&#9662;";
  btn.appendChild(arrow);

  btn.addEventListener("click", () => {
    dropdownContent.style.display =
      dropdownContent.style.display === "block" ? "none" : "block";
  });

  document.addEventListener("click", (e) => {
    if (!btn.contains(e.target) && !dropdownContent.contains(e.target)) {
      dropdownContent.style.display = "none";
    }
  });
}

function atualizarGraficoLinha(agrupado) {
  const dropdownContent = document.getElementById("dropdownContent");
  const selecionados = Array.from(
    dropdownContent.querySelectorAll("input:checked")
  ).map((cb) => cb.value);

  const datasOrdenadas = [
    ...new Set(Object.values(agrupado).flatMap((l) => l.map((s) => s.data))),
  ].sort((a, b) => new Date(a) - new Date(b));

  const datasets = selecionados.map((nome, i) => {
    const lista = agrupado[nome];
    const valores = datasOrdenadas.map((d) => {
      const item = lista.find((x) => x.data === d);
      return item ? item.carga : null;
    });

    return {
      label: `${nome} (kg)`,
      data: valores,
      borderColor: gerarCores(selecionados.length)[i],
      backgroundColor: gerarCores(selecionados.length)[i],
      tension: 0.3,
      spanGaps: true,
    };
  });

  criarGraficoLinha(datasOrdenadas, datasets);
}

// gráfico horizontal
async function buscarDadosECriarGraficoHorizontal() {
  mostrarMensagemCanvas("graficoHorizontal", "Carregando dados...");

  const treinos = await buscarTreinosDoUsuario(userId);
  if (!treinos.length) return mostrarMensagemCanvas("graficoHorizontal");

  const volumeSemanal = {};

  try {
    for (const treino of treinos) {
      const fichas = await buscarFichasDoTreino(treino.id);

      for (const ficha of fichas) {
        const respEx = await fetch(
          `${API_URL}/fichas/exercicio?idFicha=${ficha.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!respEx.ok) continue;
        const exercicios = (await respEx.json()).exerciciosDaFicha || [];

        for (const ex of exercicios) {
          const respSeries = await fetch(
            `${API_URL}/series?exercicioFichaId=${ex.exercicioFichaId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (!respSeries.ok) continue;
          const series = (await respSeries.json()).series || [];

          for (const s of series) {
            const data = new Date(s.data);
            if (isNaN(data)) continue;

            const chaveSemana = formatarSemana(data);

            const volume = (Number(s.carga) || 0) * (Number(s.repeticoes) || 0);

            volumeSemanal[chaveSemana] =
              (volumeSemanal[chaveSemana] || 0) + volume;
          }
        }
      }
    }

    const labels = Object.keys(volumeSemanal).sort();
    const valores = labels.map((k) => Number(volumeSemanal[k].toFixed(2)));

    if (!labels.length) return mostrarMensagemCanvas("graficoHorizontal");

    criarGraficoHorizontal(labels, valores);
  } catch {
    mostrarMensagemCanvas("graficoHorizontal");
  }
}

// gráfico radar
async function buscarDadosECriarGraficoRadar() {
  mostrarMensagemCanvas("graficoRadar", "Carregando dados...");

  const treinos = await buscarTreinosDoUsuario(userId);
  if (!treinos.length) return mostrarMensagemCanvas("graficoRadar");

  const avaliacoes = [];
  const gruposMusculares = new Set();

  try {
    for (const treino of treinos) {
      const fichas = await buscarFichasDoTreino(treino.id);

      for (const ficha of fichas) {
        const respEx = await fetch(
          `${API_URL}/fichas/exercicio?idFicha=${ficha.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!respEx.ok) continue;
        const exercicios = (await respEx.json()).exerciciosDaFicha || [];

        const somaPorGrupo = {};
        const qtdPorGrupo = {};

        for (const ex of exercicios) {
          const grupo = ex.grupoMuscular?.toUpperCase() || "OUTROS";
          gruposMusculares.add(grupo);

          const respSeries = await fetch(
            `${API_URL}/series?exercicioFichaId=${ex.exercicioFichaId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (!respSeries.ok) continue;
          const series = (await respSeries.json()).series || [];

          for (const s of series) {
            const carga = Number(s.carga) || 0;

            somaPorGrupo[grupo] = (somaPorGrupo[grupo] || 0) + carga;
            qtdPorGrupo[grupo] = (qtdPorGrupo[grupo] || 0) + 1;
          }
        }

        const medias = {};
        for (const g of Object.keys(somaPorGrupo)) {
          medias[g] = somaPorGrupo[g] / (qtdPorGrupo[g] || 1);
        }

        avaliacoes.push({
          nome: ficha.nomeFicha || `Ficha ${ficha.id}`,
          grupos: medias,
        });
      }
    }

    if (!avaliacoes.length) return mostrarMensagemCanvas("graficoRadar");

    const labels = Array.from(gruposMusculares);
    const cores = gerarCores(avaliacoes.length);

    const datasets = avaliacoes.map((av, i) => ({
      label: av.nome,
      data: labels.map((g) => av.grupos[g] || 0),
      fill: true,
      backgroundColor: `${cores[i]}40`,
      borderColor: cores[i],
      pointBackgroundColor: cores[i],
      borderWidth: 2,
    }));

    criarGraficoRadar(labels, datasets);
  } catch {
    mostrarMensagemCanvas("graficoRadar");
  }
}

buscarDadosECriarGraficoPizza();
buscarDadosECriarGraficoLinha();
buscarDadosECriarGraficoHorizontal();
buscarDadosECriarGraficoRadar();

// menu lateral
window.openNav = () =>
  (document.getElementById("navSide").style.width = "100%");
window.closeNav = () => (document.getElementById("navSide").style.width = "0");
