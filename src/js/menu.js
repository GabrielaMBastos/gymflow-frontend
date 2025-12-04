var currentTab = 0;
let treinoId = null;
let fichaId = null;
let exerciciosCache = [];
const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJneW1mbG93LWF1dGgtYXBpIiwic3ViIjoiYmVlZkBlbWFpbC5jb20iLCJpZFVzZXIiOjEsInJvbGUiOiJBRE1JTiIsImV4cCI6MTc2NDkwMTQwNX0.UPbxK0em22EDsGbAFUJ46UWet2Bjbsm7d99rBD1XO0M";
showTab(currentTab);

function showTab(n) {
  var x = document.getElementsByClassName("tab");
  x[n].style.display = "block";

  document.getElementById("prevBtn").style.display = n == 0 ? "none" : "inline";
  document.getElementById("nextBtn").innerHTML =
    n == x.length - 1 ? "Submit" : "Next";

  fixStepIndicator(n);

  // Ao entrar no step 3 (index 2), carrega os exercícios disponíveis
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
    // opcional: resetar form ou redirecionar
    return false;
  }

  showTab(currentTab);
}

async function handleStepAction(step) {
  if (step === 0) {
    return await cadastrarTreino();
  }
  if (step === 1) {
    return await cadastrarFicha();
  }
  if (step === 2) {
    return await cadastrarExercicioNaFicha();
  }
  return true;
}

async function cadastrarTreino() {
  const nome = document.getElementById("treinoNome").value;
  const dataInicio = document.getElementById("dataInicio").value;
  const dataFim = document.getElementById("dataFim").value;

  // TODO: aqui esta setado o usuario 1 mas no codigo deve
  // desencriptar o token para pegar o id do usuario que esta logado
  const body = { usuarioId: 1, nome, dataInicio, dataFim };

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
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
  data.exercicios.forEach((ex) => {
    const opt = document.createElement("option");
    opt.value = ex.id;
    opt.textContent = `${ex.nome} (${ex.grupoMuscular})`;
    select.appendChild(opt);
  });
}

// CODIGO PARA LISTAR CARACTERISTICAS DO EXERCICIO
document
  .getElementById("exercicioSelect")
  .addEventListener("change", function () {
    const idSelecionado = Number(this.value);

    const exercicio = exerciciosCache.find((e) => e.id === idSelecionado);

    if (exercicio) {
      document.getElementById("grupoMuscular").value =
        exercicio.grupoMuscular || "";
      document.getElementById("equipamento").value =
        exercicio.equipamento || "";
    } else {
      document.getElementById("grupoMuscular").value = "";
      document.getElementById("equipamento").value = "";
    }
  });

async function cadastrarExercicioNaFicha() {
  const exercicioId = document.getElementById("exercicioSelect").value;
  if (!exercicioId) {
    alert("Selecione um exercício");
    return false;
  }

  const carga = parseFloat(document.getElementById("carga").value);
  const quantidadeDeSeries = parseInt(document.getElementById("series").value);
  const minimoRepeticoes = parseInt(document.getElementById("minRep").value);
  const maximoRepeticoes = parseInt(document.getElementById("maxRep").value);
  const descansoEmSegundos = parseInt(
    document.getElementById("descanso").value
  );
  const observacao = document.getElementById("observacao").value;

  const body = {
    fichaId,
    exercicioId: parseInt(exercicioId),
    carga,
    quantidadeDeSeries,
    minimoRepeticoes,
    maximoRepeticoes,
    descansoEmSegundos,
    observacao,
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
  var i,
    x = document.getElementsByClassName("step");
  for (i = 0; i < x.length; i++) {
    x[i].className = x[i].className.replace(" active", "");
  }
  x[n].className += " active";
}
