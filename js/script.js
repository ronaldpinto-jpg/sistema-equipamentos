/* EquipTrack: cadastro, pesquisa, filtros e persistência local. */
"use strict";

const STORAGE_KEY = "equiptrack_equipment_v1";
const SAMPLE_EQUIPMENT = [
  { id: "sample-1", name: "Notebook Dell Latitude", assetTag: "TI-001", category: "Notebook", brand: "Dell", model: "Latitude 5440", location: "Sala de TI", status: "Disponível", notes: "", createdAt: "2026-10-01T09:00:00.000Z" },
  { id: "sample-2", name: "Monitor LG UltraWide", assetTag: "TI-002", category: "Monitor", brand: "LG", model: "29WQ600", location: "Financeiro", status: "Emprestado", notes: "Emprestado para o setor financeiro.", createdAt: "2026-10-02T09:00:00.000Z" },
  { id: "sample-3", name: "Impressora HP LaserJet", assetTag: "TI-003", category: "Impressora", brand: "HP", model: "M404dn", location: "Recepção", status: "Em manutenção", notes: "Aguardando avaliação técnica.", createdAt: "2026-10-03T09:00:00.000Z" }
];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const form = $("#equipmentForm");
const toast = $("#toast");
const deleteDialog = $("#deleteDialog");
let equipment = loadEquipment();
let pendingDeleteId = null;
let toastTimer = null;

function loadEquipment() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === null ? [...SAMPLE_EQUIPMENT] : JSON.parse(saved);
  } catch (error) {
    console.error("Não foi possível carregar os equipamentos:", error);
    return [...SAMPLE_EQUIPMENT];
  }
}

function persistEquipment() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(equipment));
    return true;
  } catch (error) {
    console.error("Não foi possível salvar os equipamentos:", error);
    showToast("Não foi possível salvar. Verifique o armazenamento do navegador.");
    return false;
  }
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function statusClass(status) {
  return {
    "Disponível": "tag--available",
    "Emprestado": "tag--loaned",
    "Em manutenção": "tag--maintenance"
  }[status] || "tag--available";
}

function categoryIcon(category) {
  return ({
    "Computador": "▣", "Notebook": "▰", "Monitor": "▤",
    "Periférico": "⌨", "Rede": "⌁", "Impressora": "▧", "Outro": "▣"
  })[category] || "▣";
}

function equipmentCell(item) {
  const detail = [item.brand, item.model].filter(Boolean).join(" · ");
  return `<div class="equipment-cell">
    <span class="equipment-cell__icon" aria-hidden="true">${categoryIcon(item.category)}</span>
    <span><strong>${escapeHTML(item.name)}</strong><small>${escapeHTML(detail || item.category)}</small></span>
  </div>`;
}

function statusTag(status) {
  return `<span class="tag ${statusClass(status)}">${escapeHTML(status)}</span>`;
}

function renderStats() {
  $("#statTotal").textContent = equipment.length;
  $("#statAvailable").textContent = equipment.filter((item) => item.status === "Disponível").length;
  $("#statLoaned").textContent = equipment.filter((item) => item.status === "Emprestado").length;
  $("#statMaintenance").textContent = equipment.filter((item) => item.status === "Em manutenção").length;
}

function renderRecent() {
  const recent = [...equipment].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  $("#recentTableBody").innerHTML = recent.map((item) => `
    <tr>
      <td>${equipmentCell(item)}</td>
      <td>${escapeHTML(item.assetTag)}</td>
      <td>${escapeHTML(item.category)}</td>
      <td>${statusTag(item.status)}</td>
      <td><button class="action-button" data-edit="${escapeHTML(item.id)}" aria-label="Editar ${escapeHTML(item.name)}" title="Editar">✎</button></td>
    </tr>`).join("");
  $("#recentEmpty").hidden = recent.length > 0;
  $(".panel__heading").hidden = equipment.length === 0;
  $(".panel .table-wrap").hidden = recent.length === 0;
}

function getFilteredEquipment() {
  const query = $("#searchInput").value.trim().toLocaleLowerCase("pt-BR");
  const status = $("#statusFilter").value;
  const category = $("#categoryFilter").value;
  return equipment.filter((item) => {
    const searchable = [item.name, item.assetTag, item.brand, item.model, item.category, item.location].join(" ").toLocaleLowerCase("pt-BR");
    return (!query || searchable.includes(query)) &&
      (!status || item.status === status) &&
      (!category || item.category === category);
  }).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

function renderEquipmentTable() {
  const filtered = getFilteredEquipment();
  $("#equipmentTableBody").innerHTML = filtered.map((item) => `
    <tr>
      <td>${equipmentCell(item)}</td>
      <td>${escapeHTML(item.assetTag)}</td>
      <td>${escapeHTML(item.category)}</td>
      <td>${escapeHTML(item.location || "Não informada")}</td>
      <td>${statusTag(item.status)}</td>
      <td><div class="action-group">
        <button class="action-button" data-edit="${escapeHTML(item.id)}" aria-label="Editar ${escapeHTML(item.name)}" title="Editar">✎</button>
        <button class="action-button" data-cycle="${escapeHTML(item.id)}" aria-label="Alterar status de ${escapeHTML(item.name)}" title="Alterar status">↻</button>
        <button class="action-button action-button--delete" data-delete="${escapeHTML(item.id)}" aria-label="Excluir ${escapeHTML(item.name)}" title="Excluir">×</button>
      </div></td>
    </tr>`).join("");
  $("#equipmentEmpty").hidden = filtered.length > 0;
  $(".table-wrap", $("#view-equipamentos"));
  $("#resultsCount").textContent = `${filtered.length} ${filtered.length === 1 ? "equipamento" : "equipamentos"}`;
}

function renderAll() {
  renderStats();
  renderRecent();
  renderEquipmentTable();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3000);
}

function navigate(view) {
  const titles = { dashboard: "Visão geral", equipamentos: "Equipamentos", cadastro: "Cadastrar equipamento" };
  $$(".page").forEach((page) => page.classList.toggle("page--active", page.id === `view-${view}`));
  $$(".nav__link").forEach((link) => link.classList.toggle("nav__link--active", link.dataset.view === view));
  $("#breadcrumbCurrent").textContent = titles[view] || titles.dashboard;
  $("#sidebar").classList.remove("is-open");
  if (view === "equipamentos") renderEquipmentTable();
  window.location.hash = view;
}

function resetForm() {
  form.reset();
  $("#equipmentId").value = "";
  $("#formTitle").textContent = "Cadastrar equipamento";
  $("#saveButton").innerHTML = "Salvar equipamento <span>→</span>";
}

function openNewForm() {
  resetForm();
  navigate("cadastro");
  $("#name").focus();
}

function editEquipment(id) {
  const item = equipment.find((entry) => entry.id === id);
  if (!item) return;
  $("#equipmentId").value = item.id;
  $("#name").value = item.name;
  $("#assetTag").value = item.assetTag;
  $("#category").value = item.category;
  $("#brand").value = item.brand || "";
  $("#model").value = item.model || "";
  $("#location").value = item.location || "";
  $("#status").value = item.status;
  $("#notes").value = item.notes || "";
  $("#formTitle").textContent = "Editar equipamento";
  $("#saveButton").innerHTML = "Salvar alterações <span>→</span>";
  navigate("cadastro");
}

function handleSubmit(event) {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const id = $("#equipmentId").value;
  const assetTag = $("#assetTag").value.trim();
  const duplicate = equipment.some((item) => item.assetTag.toLocaleLowerCase("pt-BR") === assetTag.toLocaleLowerCase("pt-BR") && item.id !== id);
  if (duplicate) {
    $("#assetTag").setCustomValidity("Já existe um equipamento com esse número de patrimônio.");
    $("#assetTag").reportValidity();
    $("#assetTag").addEventListener("input", () => $("#assetTag").setCustomValidity(""), { once: true });
    return;
  }

  const oldItem = equipment.find((item) => item.id === id);
  const item = {
    id: id || (window.crypto?.randomUUID ? crypto.randomUUID() : `equip-${Date.now()}`),
    name: $("#name").value.trim(),
    assetTag,
    category: $("#category").value,
    brand: $("#brand").value.trim(),
    model: $("#model").value.trim(),
    location: $("#location").value.trim(),
    status: $("#status").value,
    notes: $("#notes").value.trim(),
    createdAt: oldItem?.createdAt || new Date().toISOString()
  };

  const previous = [...equipment];
  if (id) equipment = equipment.map((entry) => entry.id === id ? item : entry);
  else equipment.push(item);

  if (!persistEquipment()) {
    equipment = previous;
    return;
  }
  renderAll();
  resetForm();
  navigate("equipamentos");
  showToast(id ? "Equipamento atualizado com sucesso!" : "Equipamento cadastrado com sucesso!");
}

function askDelete(id) {
  pendingDeleteId = id;
  if (typeof deleteDialog.showModal === "function") deleteDialog.showModal();
  else if (window.confirm("Deseja excluir este equipamento?")) deleteEquipment();
}

function deleteEquipment() {
  if (!pendingDeleteId) return;
  const previous = [...equipment];
  equipment = equipment.filter((item) => item.id !== pendingDeleteId);
  if (!persistEquipment()) {
    equipment = previous;
    return;
  }
  pendingDeleteId = null;
  deleteDialog.close();
  renderAll();
  showToast("Equipamento excluído.");
}

function cycleStatus(id) {
  const statuses = ["Disponível", "Emprestado", "Em manutenção"];
  const previous = [...equipment];
  equipment = equipment.map((item) => {
    if (item.id !== id) return item;
    return { ...item, status: statuses[(statuses.indexOf(item.status) + 1) % statuses.length] };
  });
  if (!persistEquipment()) {
    equipment = previous;
    return;
  }
  renderAll();
  showToast("Status do equipamento atualizado.");
}

document.addEventListener("click", (event) => {
  const goButton = event.target.closest("[data-go]");
  if (goButton) navigate(goButton.dataset.go);

  const navLink = event.target.closest("[data-view]");
  if (navLink) {
    event.preventDefault();
    navigate(navLink.dataset.view);
  }

  const editButton = event.target.closest("[data-edit]");
  if (editButton) editEquipment(editButton.dataset.edit);

  const deleteButton = event.target.closest("[data-delete]");
  if (deleteButton) askDelete(deleteButton.dataset.delete);

  const cycleButton = event.target.closest("[data-cycle]");
  if (cycleButton) cycleStatus(cycleButton.dataset.cycle);
});

form.addEventListener("submit", handleSubmit);
$("#cancelForm").addEventListener("click", () => { resetForm(); navigate("equipamentos"); });
$("#menuToggle").addEventListener("click", () => $("#sidebar").classList.toggle("is-open"));
$("#searchInput").addEventListener("input", renderEquipmentTable);
$("#statusFilter").addEventListener("change", renderEquipmentTable);
$("#categoryFilter").addEventListener("change", renderEquipmentTable);
$("#clearFilters").addEventListener("click", () => {
  $("#searchInput").value = "";
  $("#statusFilter").value = "";
  $("#categoryFilter").value = "";
  renderEquipmentTable();
});
$("#cancelDelete").addEventListener("click", () => { pendingDeleteId = null; deleteDialog.close(); });
$("#confirmDelete").addEventListener("click", deleteEquipment);
deleteDialog.addEventListener("click", (event) => {
  if (event.target === deleteDialog) { pendingDeleteId = null; deleteDialog.close(); }
});

window.addEventListener("hashchange", () => {
  const view = window.location.hash.slice(1);
  if (["dashboard", "equipamentos", "cadastro"].includes(view)) {
    $$(".page").forEach((page) => page.classList.toggle("page--active", page.id === `view-${view}`));
    $$(".nav__link").forEach((link) => link.classList.toggle("nav__link--active", link.dataset.view === view));
    $("#breadcrumbCurrent").textContent = ({ dashboard: "Visão geral", equipamentos: "Equipamentos", cadastro: "Cadastrar equipamento" })[view];
  }
});

const initialView = window.location.hash.slice(1);
if (["dashboard", "equipamentos", "cadastro"].includes(initialView)) navigate(initialView);
renderAll();
