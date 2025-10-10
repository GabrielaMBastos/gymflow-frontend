const modal = document.getElementById("textModal");
const openBtn = document.getElementById("openModalBtn");
const closeBtn = document.getElementById("closeModal");

openBtn.onclick = () => modal.style.display = "flex";
closeBtn.onclick = () => modal.style.display = "none";
window.onclick = (event) => {
  if (event.target === modal) {
    modal.style.display = "none";
  }
};

let treinoGlobalId = 0;

function inicializarArea(areaId) {
  const container = document.getElementById("treino" + areaId);

  const input = document.createElement("input");
  input.type = "text";
  input.maxLength = 30;
  input.placeholder = "Digite o nome da ficha";
  input.id = "novoTreinoNome-" + areaId;
  input.classList.add("texto-ficha")

  const btn = document.createElement("button");
  btn.textContent = "Adicionar ficha";
  btn.onclick = () => addTreino(areaId);
  btn.classList.add("topo1");

  container.appendChild(input);
  container.appendChild(btn);
}

function addTreino(areaId) {
  const input = document.getElementById("novoTreinoNome-" + areaId);
  const nome = input.value.trim();

  if (nome === "") {
    alert("Digite a ficha que deseja adicionar");
    return;
  }

  treinoGlobalId++;

  const listaTreinos = document.getElementById("listaTreinos" + areaId);

  const item = document.createElement("div");
  item.className = "treino-item";
  item.style.cursor = "pointer";

  const treino = document.createElement("div");
  treino.className = "treino";
  treino.id = "treino-" + treinoGlobalId;
  treino.innerHTML = `
    <h4>${nome}</h4>
    <div class="input-area">
      <input type="text" id="textInput-${treinoGlobalId}" maxlength="50" placeholder="Adicionar Exercício">
      <button class="botao-ficha2" onclick="addTexto(${treinoGlobalId})">Adicionar</button>
    </div>
    <div class="texto-exercicio" id="textList-${treinoGlobalId}"></div>
  `;

  item.onclick = () => {
    document.getElementById("treino-" + treinoGlobalId).scrollIntoView({ behavior: "smooth" });
  };

  const removeBtn = document.createElement("button");
  removeBtn.textContent = "Remover ficha";
  removeBtn.classList.add("botao-remover");
  removeBtn.onclick = () => {
    item.remove();
    treino.remove();
  };

  treino.appendChild(removeBtn);

  listaTreinos.appendChild(item);
  document.getElementById("treino" + areaId).appendChild(treino);

  input.value = "";
}

function addTexto(id) {
  const input = document.getElementById("textInput-" + id);
  const list = document.getElementById("textList-" + id);
  const text = input.value.trim();

  if (text === "") {
    alert("Treino não adicionado!");
    return;
  }

  const item = document.createElement("div");
  item.className = "text-item";

  const span = document.createElement("span");
  span.textContent = text;

  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-btn";
  removeBtn.textContent = " x ";
  removeBtn.classList.add("botao-remover2")
  removeBtn.onclick = () => item.remove();

  item.appendChild(span);
  item.appendChild(removeBtn);
  list.appendChild(item);

  input.value = "";
}

window.onload = () => {
  inicializarArea(1);
  inicializarArea(2);
  inicializarArea(3);
};

function toggleTreinos(id) {
  const bloco = document.getElementById(id);
  if (bloco.style.display === "none") {
    bloco.style.display = "block";
  } else {
    bloco.style.display = "none";
  }
}