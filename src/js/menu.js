const BASE_URL = "https://gymflow-backend.up.railway.app/api";

let currentTab = 0;
document.addEventListener("DOMContentLoaded", () => {
  showTab(currentTab);
});

function showTab(n) {
  const tabs = document.getElementsByClassName("tab");

  tabs[n].style.display = "block";

  document.getElementById("prevBtn").style.display = (n === 0 ? "none" : "inline");
  document.getElementById("nextBtn").innerHTML = (n === tabs.length - 1 ? "Enviar" : "Próximo");

  fixStepIndicator(n);
}

function nextPrev(n) {
  const tabs = document.getElementsByClassName("tab");

  if (n === 1 && !validateForm()) return false;

  tabs[currentTab].style.display = "none";
  currentTab += n;

  if (currentTab >= tabs.length) {
    enviarFichaParaAPI();
    return false;
  }

  showTab(currentTab);
}

function validateForm() {
  let valid = true;
  const inputs = document.getElementsByClassName("tab")[currentTab]
    .getElementsByTagName("input");

  for (let input of inputs) {
    input.classList.remove("invalid");

    if (input.value.trim() === "") {
      input.classList.add("invalid");
      valid = false;
    }
  }

  if (valid) {
    document.getElementsByClassName("step")[currentTab].classList.add("finish");
  }

  return valid;
}

function fixStepIndicator(n) {
  const steps = document.getElementsByClassName("step");
  for (let step of steps) step.classList.remove("active");
  steps[n].classList.add("active");
}

async function enviarFichaParaAPI() {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Token não encontrado. Faça login novamente.");
    return;
  }

  const tabs = document.getElementsByClassName("tab");

  // Captura dos valores
  const fichaNome = tabs[0].querySelectorAll("input")[0].value;
  const dataInicio = tabs[0].querySelectorAll("input")[1].value;
  const dataFim = tabs[0].querySelectorAll("input")[2].value;
  const diaSemana = tabs[1].querySelectorAll("input")[0].value;

  const exercicioNome = tabs[2].querySelectorAll("input")[0].value;
  const grupoMuscular = tabs[2].querySelectorAll("input")[1].value;
  const equipamento = tabs[2].querySelectorAll("input")[2].value;

  const serieData = tabs[3].querySelectorAll("input")[0].value;
  const carga = Number(tabs[3].querySelectorAll("input")[1].value);
  const repeticoes = Number(tabs[3].querySelectorAll("input")[2].value);

  try {
    /************ 1) Criar Ficha ************/
    const fichaResp = await fetch(`${BASE_URL}/fichas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        nomeFicha: fichaNome,
        dataCriacao: dataInicio,
        dataFinal: dataFim,
        diaSemana: diaSemana,
      }),
    });

    if (!fichaResp.ok) throw new Error("Erro ao criar ficha");

    const ficha = await fichaResp.json();
    const idFicha = ficha.idFicha || ficha.id;

    /************ 2) Criar Exercício ************/
    const exercicioResp = await fetch(`${BASE_URL}/fichas/exercicio`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        idFicha: idFicha,
        nome: exercicioNome,
        grupoMuscular: grupoMuscular,
        equipamento: equipamento,
      }),
    });

    if (!exercicioResp.ok) throw new Error("Erro ao criar exercício");

    const exercicio = await exercicioResp.json();
    const exercicioFichaId = exercicio.exercicioFichaId || exercicio.id;

    /************ 3) Criar Série ************/
    const serieResp = await fetch(`${BASE_URL}/series`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        exercicioFichaId: exercicioFichaId,
        data: serieData,
        carga: carga,
        repeticoes: repeticoes,
        tempoTreinoMin: 30,
      }),
    });

    if (!serieResp.ok) throw new Error("Erro ao criar série");

    alert("Ficha cadastrada com sucesso!");
    window.location.reload();

  } catch (erro) {
    console.error("Erro ao enviar dados:", erro);
    alert("Erro ao registrar ficha. Verifique o console.");
  }
}

function openNav() {
  document.getElementById("navSide").style.width = "250px";
}

function closeNav() {
  document.getElementById("navSide").style.width = "0";
}