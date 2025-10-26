function gerarCores(qtd) {
  const cores = [];
  for (let i = 0; i < qtd; i++) {
    let cor = Math.floor(Math.random() * 16777215).toString(16);
    cor = cor.padStart(6, '0');
    cores.push('#' + cor);
  }
  return cores;
}


// grafico pizza
async function buscarDadosECriarGraficoPizza() {
  try {
    const userId = localStorage.getItem("USER_ID"); 
    const resposta = await fetch(`https://gymflow-backend.up.railway.app/api/exercicios?userId=${userId}`);
    const dadosApi = await resposta.json();

    const contagem = {};
    dadosApi.exercicios.forEach(item => {
      const grupo = item.grupoMuscular;
      contagem[grupo] = (contagem[grupo] || 0) + 1;
    });

    const total = Object.values(contagem).reduce((a, b) => a + b, 0);
    const labels = Object.keys(contagem);
    const valores = Object.values(contagem).map(qtd => Number(((qtd / total) * 100).toFixed(1)));
    const cores = gerarCores(labels.length);

    criarGraficoPizza(labels, valores, cores);
  } catch (erro) {
    console.error('Erro ao buscar os dados do gráfico de pizza:', erro);
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
async function buscarDadosECriarGraficoLinha() {
  try {
    const userId = localStorage.getItem("USER_ID"); 
    const resposta = await fetch(`https://gymflow-backend.up.railway.app/api/....?userId=${userId}`);
    const dadosApi = await resposta.json();

    const porExercicio = {};
    dadosApi.series.forEach(item => {
      if (!porExercicio[item.exercicio]) {
        porExercicio[item.exercicio] = [];
      }
      porExercicio[item.exercicio].push({ data: item.data, carga: item.carga });
    });

    const todasAsDatas = [...new Set(dadosApi.map(item => item.data))].sort();

    const cores = gerarCores(Object.keys(porExercicio).length);
    const datasets = Object.entries(porExercicio).map(([exercicio, dados], i) => {
      const valores = todasAsDatas.map(data => {
        const registro = dados.find(d => d.data === data);
        return registro ? registro.carga : null;
      });

      return {
        label: `${exercicio} (kg)`,
        data: valores,
        borderColor: cores[i],
        backgroundColor: cores[i],
        tension: 0.3,
        spanGaps: true
      };
    });

    criarGraficoLinha(todasAsDatas, datasets);
  } catch (erro) {
    console.error('Erro ao buscar os dados do gráfico de evolução:', erro);
  }
}

function criarGraficoLinha(labels, datasets) {
  const ctx = document.getElementById("graficoLinha").getContext("2d");

  new Chart(ctx, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Evolução de Carga",
          font: { size: 20 }
        },
        legend: { position: "top" },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y} kg`;
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Data"
          }
        },
        y: {
          title: {
            display: true,
            text: "Carga (kg)"
          },
          beginAtZero: true
        }
      }
    }
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
