document.addEventListener("DOMContentLoaded", function () {
  const btn = document.getElementById("btn-read-more");
  const wrapper = document.querySelector(".description-wrapper");
  const content = document.querySelector(".description-content");
  const overlay = document.querySelector(".read-more-overlay");
  const textSpan = btn.querySelector(".btn-text");
  const icon = btn.querySelector("i");

  // Altura máxima cuando está cerrado
  const closedHeight = 120;

  // 1. Verificar si el texto es suficientemente largo para necesitar el botón
  if (content.scrollHeight > closedHeight) {
    btn.style.display = "inline-block"; // Mostrar el botón solo si es necesario
  } else {
    wrapper.style.maxHeight = "none"; // Si es corto, que se vea todo
    overlay.style.display = "none"; // Quitar el degradado
  }

  btn.addEventListener("click", function () {
    // Comprobamos si está expandido viendo el estilo actual
    const isExpanded = wrapper.style.maxHeight === "2000px";

    if (isExpanded) {
      // CERRAREstado:
      wrapper.style.maxHeight = closedHeight + "px";
      overlay.style.opacity = "1";
      textSpan.textContent = "Ver más";
      icon.style.transform = "rotate(0deg)";

      // Scroll suave arriba para no perder de vista la sección
      wrapper.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else {
      // ABRIR
      wrapper.style.maxHeight = "2000px";
      overlay.style.opacity = "0";
      textSpan.textContent = "Ver menos";
      icon.style.transform = "rotate(180deg)";
    }
  });

  // Aseguramos transición del icono
  icon.style.transition = "transform 0.3s ease";

  function toggleEditReview(reviewId) {
    const displayDiv = document.getElementById("review-display-" + reviewId);
    const formDiv = document.getElementById("review-edit-form-" + reviewId);
    if (formDiv.style.display === "none") {
      formDiv.style.display = "block";
      displayDiv.style.display = "none";
    } else {
      formDiv.style.display = "none";
      displayDiv.style.display = "block";
    }
  }
});
