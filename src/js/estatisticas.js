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

let modoGrafico = "carga";
let chartInstance = null;


// grafico pizza - Proporção por grupo muscular
async function buscarDadosECriarGraficoPizza() {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("Token não encontrado. Faça login novamente.");
      return;
    }

    // decodifica o token JWT
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

    // busca todas as fichas do user
    const respostaFichas = await fetch(`${BASE_URL}/fichas`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!respostaFichas.ok) {
      throw new Error(`Erro ao buscar fichas: ${respostaFichas.status}`);
    }

    const textoFichas = await respostaFichas.text();
    if (!textoFichas) {
      console.warn("⚠ Nenhuma ficha retornada do servidor.");
      return;
    }

    const dadosFichas = JSON.parse(textoFichas);
    const fichas =
      dadosFichas.fichas ||
      dadosFichas.content ||
      (Array.isArray(dadosFichas) ? dadosFichas : []);

    if (!Array.isArray(fichas) || fichas.length === 0) {
      console.warn("Nenhuma ficha encontrada para o usuário.");
      return;
    }

    const contagem = {};

    //  em cada ficha busca os exercícios e agrupa por grupo muscular
    for (const ficha of fichas) {
      const fichaId = ficha.idFicha || ficha.id;

      const respostaExercicios = await fetch(
        `${BASE_URL}/fichas/exercicio?idFicha=${fichaId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!respostaExercicios.ok) {
        console.warn(`Erro ao buscar exercícios da ficha ${fichaId}`);
        continue;
      }

      const textoEx = await respostaExercicios.text();
      if (!textoEx) continue;

      const dadosEx = JSON.parse(textoEx);
      const listaExercicios = dadosEx.exerciciosDaFicha || dadosEx || [];

      listaExercicios.forEach((ex) => {
        const grupo = ex.grupoMuscular?.toUpperCase() || "OUTROS";
        contagem[grupo] = (contagem[grupo] || 0) + 1;
      });
    }

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
      datasets: [
        {
          label: "Proporção por Grupo Muscular",
          data: valores,
          backgroundColor: cores,
          borderWidth: 1,
        },
      ],
    },
    options: {
      maintainAspectRatio: true,
      responsive: true,
      plugins: {
        legend: { position: "right" },
        title: {
          display: true,
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.label}: ${context.parsed}%`;
            },
          },
        },
      },
    },
  });
}


// grafico de linha - evolução de carga
async function buscarDadosECriarGraficoLinha() {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Token não encontrado. Faça login novamente.");
      return;
    }

    // busca todas as fichas do user 
    const respostaFichas = await fetch(`${BASE_URL}/fichas`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!respostaFichas.ok) throw new Error("Erro ao buscar fichas.");

    const textoFichas = await respostaFichas.text();
    if (!textoFichas) {
      console.warn(" Nenhuma ficha retornada do servidor.");
      return;
    }

    const dadosFichas = JSON.parse(textoFichas);
    const fichas = dadosFichas.fichas || dadosFichas || [];

    const exercicioMap = {};

    // em cada ficha busca os exercícios
    for (const ficha of fichas) {
      const respostaEx = await fetch(
        `${BASE_URL}/fichas/exercicio?idFicha=${ficha.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!respostaEx.ok) continue;

      const textoEx = await respostaEx.text();
      if (!textoEx) continue;

      const dadosEx = JSON.parse(textoEx);

      // mapeia cada exercício com seu nome/equipamento
      for (const ex of dadosEx.exerciciosDaFicha || []) {
        exercicioMap[ex.exercicioFichaId] =
          ex.nome || ex.equipamento || "Desconhecido";
      }
    }

    const seriesTotais = [];

    // em cada exercício busca suas séries registradas
    for (const exercicioId in exercicioMap) {
      const respostaSeries = await fetch(
        `${BASE_URL}/series?exercicioFichaId=${exercicioId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (respostaSeries.status === 204) continue;
      if (!respostaSeries.ok) continue;

      const texto = await respostaSeries.text();
      if (!texto) continue;

      let series = [];
      try {
        const json = JSON.parse(texto);
        if (Array.isArray(json)) {
          series = json;
        } else if (json.series) {
          series = json.series;
        } else if (json.content) {
          series = json.content;
        }
      } catch (e) {
        console.warn(
          ` Resposta inválida para exercicioFichaId=${exercicioId}`,
          e
        );
        continue;
      }

      if (Array.isArray(series) && series.length > 0) {
        const idNum = Number(exercicioId);
        const seriesComId = series.map((s) => ({
          ...s,
          exercicioFichaId: idNum,
        }));
        seriesTotais.push(...seriesComId);
      }
    }

    // caso não existam séries registradas
    if (seriesTotais.length === 0) {
      console.warn("Nenhuma série encontrada para exibir no gráfico.");

      const canvas = document.getElementById("graficoLinha");
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = "16px Arial";
        ctx.fillText("Sem dados para exibir no gráfico", 50, 50);
      }

      return;
    }

    // agrupa as séries por equipamento
    const agrupado = {};
    for (const s of seriesTotais) {
      const equipamento = exercicioMap[s.exercicioFichaId] || "Desconhecido";
      if (!agrupado[equipamento]) agrupado[equipamento] = [];
      agrupado[equipamento].push({
        data: s.data,
        carga: s.carga,
      });
    }

    // lista de todas as datas
    const todasAsDatas = [
      ...new Set(seriesTotais.map((s) => s.data)),
    ].sort((a, b) => new Date(a) - new Date(b));
 
    const cores = gerarCores(Object.keys(agrupado).length);
    const datasets = Object.entries(agrupado).map(([equipamento, lista], i) => {
      const valores = todasAsDatas.map((data) => {
        const serie = lista.find((s) => s.data === data);
        return serie ? serie.carga : null;
      });

      return {
        label: `${equipamento} (kg)`,
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

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
        },
        legend: { position: "top" },
        tooltip: {
          callbacks: {
            label: (context) => `${context.dataset.label}: ${context.parsed.y} kg`,
          },
        },
      },
      scales: {
        x: { title: { display: true, text: "Data" } },
        y: {
          title: { display: true, text: "Carga (kg)" },
          beginAtZero: true,
        },
      },
    },
  });
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
