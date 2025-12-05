var currentTab = 0;
let treinoId = null;
let fichaId = null;
let exerciciosCache = [];

//Encontra token e pega ID
function verificarAutenticacao() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../index.html";
    throw new Error("Usuário não autenticado");
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
  window.location.href = "../index.html";
}

showTab(currentTab);

function showTab(n) {
  var x = document.getElementsByClassName("tab");
  x[n].style.display = "block";

  document.getElementById("prevBtn").style.display = n == 0 ? "none" : "inline";
  document.getElementById("nextBtn").innerHTML =
    n == x.length - 1 ? "Submit" : "Next";

  fixStepIndicator(n);

  if (n === 2) {
    loadExercicios();
  }
}

async function nextPrev(n) {
  var x = document.getElementsByClassName("tab");

  if (n == 1) {
    const ok = await handleStepAction(currentTab);
    if (!ok) return false;
  }

  x[currentTab].style.display = "none";
  currentTab = currentTab + n;

  if (currentTab >= x.length) {
    alert("Fluxo concluído!");
    return false;
  }

  showTab(currentTab);
}

async function handleStepAction(step) {
  if (step === 0) return await cadastrarTreino();
  if (step === 1) return await cadastrarFicha();
  if (step === 2) return await cadastrarExercicioNaFicha();
  return true;
}

async function cadastrarTreino() {
  const nome = document.getElementById("treinoNome").value;
  const dataInicio = document.getElementById("dataInicio").value;
  const dataFim = document.getElementById("dataFim").value;

  const body = {usuarioId: userId, nome, dataInicio, dataFim };

  const res = await fetch(
    "https://gymflow-backend.up.railway.app/api/treinos",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    alert("Erro ao cadastrar treino");
    return false;
  }

  const data = await res.json();
  treinoId = data.id;
  return true;
}

async function cadastrarFicha() {
  const diaSemana = document.getElementById("diaSemana").value;

  const body = { treinoId, diaSemana };

  const res = await fetch("https://gymflow-backend.up.railway.app/api/fichas", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    alert("Erro ao criar ficha");
    return false;
  }

  const data = await res.json();
  fichaId = data.id;
  return true;
}

async function loadExercicios() {
  const res = await fetch(
    "https://gymflow-backend.up.railway.app/api/exercicios",
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (!res.ok) {
    alert("Erro ao carregar exercícios");
    return;
  }

  const data = await res.json();
  exerciciosCache = data.exercicios;

  const select = document.getElementById("exercicioSelect");
  select.innerHTML = '<option value="">-- Escolha um exercício --</option>';

  exerciciosCache.forEach((ex) => {
    const opt = document.createElement("option");
    opt.value = ex.id;
    opt.textContent = `${ex.nome} (${ex.grupoMuscular})`;
    select.appendChild(opt);
  });
}

document
  .getElementById("exercicioSelect")
  .addEventListener("change", function () {
    const idSelecionado = Number(this.value);
    const exercicio = exerciciosCache.find((e) => e.id === idSelecionado);

    document.getElementById("grupoMuscular").value =
      exercicio?.grupoMuscular || "";
    document.getElementById("equipamento").value =
      exercicio?.equipamento || "";
  });

async function cadastrarExercicioNaFicha() {
  const exercicioId = document.getElementById("exercicioSelect").value;

  if (!exercicioId) {
    alert("Selecione um exercício");
    return false;
  }

  const body = {
    fichaId,
    exercicioId: parseInt(exercicioId),
    carga: parseFloat(document.getElementById("carga").value),
    quantidadeDeSeries: parseInt(document.getElementById("series").value),
    minimoRepeticoes: parseInt(document.getElementById("minRep").value),
    maximoRepeticoes: parseInt(document.getElementById("maxRep").value),
    descansoEmSegundos: parseInt(document.getElementById("descanso").value),
    observacao: document.getElementById("observacao").value,
  };

  const res = await fetch(
    "https://gymflow-backend.up.railway.app/api/fichas/exercicio",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    alert("Erro ao cadastrar exercício na ficha");
    return false;
  }

  alert("Exercício cadastrado com sucesso!");
  return true;
}

function fixStepIndicator(n) {
  var x = document.getElementsByClassName("step");
  for (let i = 0; i < x.length; i++) {
    x[i].className = x[i].className.replace(" active", "");
  }
  x[n].className += " active";
}
