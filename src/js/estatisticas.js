function gerarCores(qtd) {
  const cores = [];
  for (let i = 0; i < qtd; i++) {
    let cor = Math.floor(Math.random() * 16777215).toString(16);
    cor = cor.padStart(6, '0');
    cores.push('#' + cor);
  }
  return cores;
}

const BASE_URL =
  window.location.hostname.includes("localhost") ||
  window.location.hostname.includes("127.0.0.1")
    ? "http://localhost:8080/api"
    : "https://gymflow-backend.up.railway.app/api";

// grafico pizza
async function buscarDadosECriarGraficoPizza() {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("Token não encontrado. Faça login novamente.");
      return;
    }

    // decodificar o token JWT
    let userId;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      userId = payload.idUsuario || payload.idUser || payload.id;
    } catch (e) {
      console.error("Erro ao decodificar o token:", e);
      return;
    }

    if (!userId) {
      console.error("ID do usuário não encontrado!");
      return;
    }

    // buscar fichas do user
    const respostaFichas = await fetch(`${BASE_URL}/fichas`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,               
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!respostaFichas.ok) {
      throw new Error(`Erro ao buscar fichas: ${respostaFichas.status}`);
    }

    const dadosFichas = await respostaFichas.json();

    const fichas =
      dadosFichas.fichas ||
      dadosFichas.content ||
      (Array.isArray(dadosFichas) ? dadosFichas : []);

    if (!Array.isArray(fichas) || fichas.length === 0) {
      console.warn("Nenhuma ficha encontrada para o usuário.");
      return;
    }

    // buscar exercícios de cada ficha
    const contagem = {};

    for (const ficha of fichas) {
      const fichaId = ficha.idFicha || ficha.id;

      const respostaExercicios = await fetch(
        `${BASE_URL}/fichas/exercicio?idFicha=${fichaId}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
          },
        }
      );

      if (!respostaExercicios.ok) {
        console.warn(`Erro ao buscar exercícios da ficha ${fichaId}`);
        continue;
      }

      const dadosEx = await respostaExercicios.json();
      const listaExercicios = dadosEx.exerciciosDaFicha || dadosEx || [];

      // contar grupos musculares
      listaExercicios.forEach((ex) => {
        const grupo = ex.grupoMuscular?.toUpperCase() || "OUTROS";
        contagem[grupo] = (contagem[grupo] || 0) + 1;
      });
    }

    // calcular percentuais
    const total = Object.values(contagem).reduce((a, b) => a + b, 0);
    if (total === 0) {
      console.warn("Nenhum exercício encontrado nas fichas.");
      return;
    }

    const labels = Object.keys(contagem);
    const valores = Object.values(contagem).map((qtd) =>
      Number(((qtd / total) * 100).toFixed(1))
    );
    const cores = gerarCores(labels.length);

    criarGraficoPizza(labels, valores, cores);

  } catch (erro) {
    console.error(" Erro ao buscar os dados do gráfico de pizza:", erro);
  }
}


function criarGraficoPizza(labels, valores, cores) {
  const ctx = document.getElementById("graficoPizza").getContext("2d");

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [{
        label: "Proporção por Grupo Muscular",
        data: valores,
        backgroundColor: cores,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "right" },
        title: { 
          display: true, 
          text: "Proporção por Grupo Muscular (%)",
          font: { size: 20 }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.label}: ${context.parsed}%`;
            }
          }
        }
      }
    }
  });
}

// grafico linha
let modoGrafico = "carga"; // alterna entre carga e repeticoes
let chartInstance = null; 

async function buscarDadosECriarGraficoLinha() {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Token não encontrado. Faça login novamente.");
      return;
    }

    // busca fichas do user
    const respostaFichas = await fetch(`${BASE_URL}/fichas`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!respostaFichas.ok) throw new Error("Erro ao buscar fichas.");

    const dadosFichas = await respostaFichas.json();
    const fichas = dadosFichas.fichas || dadosFichas || [];

    const exercicioMap = {};

    // pega os exercícios das fichas
    for (const ficha of fichas) {
      const respostaEx = await fetch(`${BASE_URL}/fichas/exercicio?idFicha=${ficha.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!respostaEx.ok) continue;
      const dadosEx = await respostaEx.json();
      for (const ex of dadosEx.exerciciosDaFicha || []) {
        exercicioMap[ex.exercicioFichaId] = ex.equipamento;
      }
    }

    // busca series (data, carga, repetições)
    const respostaSeries = await fetch(`${BASE_URL}/series`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!respostaSeries.ok) throw new Error("Erro ao buscar séries.");
    const series = await respostaSeries.json();

    // agrupa por equipamento
    const agrupado = {};
    for (const s of series) {
      const equipamento = exercicioMap[s.exercicioFichaId] || "Desconhecido";
      if (!agrupado[equipamento]) agrupado[equipamento] = [];
      agrupado[equipamento].push({
        data: s.data,
        carga: s.carga,
        repeticoes: s.repeticoes,
      });
    }

    // ordena por data e 
    const todasAsDatas = [
      ...new Set(series.map((s) => s.data)),
    ].sort((a, b) => new Date(a) - new Date(b));

    const cores = gerarCores(Object.keys(agrupado).length);
    const datasets = Object.entries(agrupado).map(([equipamento, lista], i) => {
      const valores = todasAsDatas.map((data) => {
        const serie = lista.find((s) => s.data === data);
        return serie ? serie[modoGrafico] : null;
      });

      return {
        label: `${equipamento} (${modoGrafico === "carga" ? "kg" : "reps"})`,
        data: valores,
        borderColor: cores[i],
        backgroundColor: cores[i],
        tension: 0.3,
        spanGaps: true,
      };
    });

    criarGraficoLinha(todasAsDatas, datasets);
  } catch (erro) {
    console.error("Erro ao buscar dados do gráfico:", erro);
  }
}

function criarGraficoLinha(labels, datasets) {
  const ctx = document.getElementById("graficoLinha").getContext("2d");

  if (chartInstance) {
    chartInstance.destroy(); // destrói o gráfico anterior
  }

  chartInstance = new Chart(ctx, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text:
            modoGrafico === "carga"
              ? "Evolução de Carga (kg)"
              : "Evolução de Repetições",
          font: { size: 20 },
        },
        legend: { position: "top" },
        tooltip: {
          callbacks: {
            label: (context) =>
              `${context.dataset.label}: ${context.parsed.y} ${
                modoGrafico === "carga" ? "kg" : "reps"
              }`,
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: "Data" },
        },
        y: {
          title: {
            display: true,
            text: modoGrafico === "carga" ? "Carga (kg)" : "Repetições",
          },
          beginAtZero: true,
        },
      },
    },
  });
}

// alterna entre carga e repetições
function atualizarGrafico(novoModo) {
  modoGrafico = novoModo;
  buscarDadosECriarGraficoLinha();
}


buscarDadosECriarGraficoPizza();        
buscarDadosECriarGraficoLinha();   


// menu lateral
window.openNav = function() {
  document.getElementById("navSide").style.width = "100%";
};

window.closeNav = function() {
  document.getElementById("navSide").style.width = "0";
};
