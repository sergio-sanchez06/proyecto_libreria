// ─── modal.js — funciones globales de feedback ───────────────────────────────

/**
 * Muestra el modal de éxito o error.
 * @param {"success"|"error"} tipo
 * @param {string} mensaje
 */
function showModal(tipo, mensaje) {
  const config = {
    success: {
      icon: "✅",
      title: "Operación exitosa",
      headerClass: "bg-success-subtle",
    },
    error: {
      icon: "❌",
      title: "Ha ocurrido un error",
      headerClass: "bg-danger-subtle",
    },
  };

  const cfg = config[tipo] ?? config.error;
  const modalEl = document.getElementById("feedbackModal");
  const header = document.getElementById("feedbackModalHeader");

  // Limpiar clases previas
  header.classList.remove("bg-success-subtle", "bg-danger-subtle");
  header.classList.add(cfg.headerClass);

  document.getElementById("modalIcon").textContent = cfg.icon;
  document.getElementById("modalTitle").textContent = cfg.title;
  document.getElementById("modalMessage").textContent = mensaje;

  const modalBootstrap = bootstrap.Modal.getOrCreateInstance(modalEl);
  modalBootstrap.show();
}

/**
 * Muestra el modal de confirmación antes de ejecutar una acción destructiva.
 * @param {string}   mensaje    — texto descriptivo de lo que se va a borrar
 * @param {Function} onConfirm  — función a ejecutar si el usuario confirma
 */
function showConfirm(mensaje, onConfirm) {
  const modalEl = document.getElementById("confirmModal");
  const btnEl = document.getElementById("confirmActionBtn");

  document.getElementById("confirmMessage").textContent = mensaje;

  // Clonar el botón para eliminar listeners acumulados de llamadas anteriores
  const newBtn = btnEl.cloneNode(true);
  btnEl.parentNode.replaceChild(newBtn, btnEl);

  newBtn.addEventListener("click", () => {
    bootstrap.Modal.getInstance(modalEl)?.hide();
    onConfirm();
  });

  bootstrap.Modal.getOrCreate(modalEl).show();
}
