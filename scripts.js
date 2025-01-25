//var textarea = document.querySelector('textarea');
//textarea.addEventListener('keydown', autosize);
function autosize() {
  var el = this;
  var elh = $(this).outerHeight();
  setTimeout(function () {
    el.style.cssText = "height:auto;";
    el.style.cssText =
      "height:" + el.scrollHeight + "px;" + "min-height:" + elh + "px;";
  }, 0);
}
function simpleSelect() {
  "use strict";
  var selectHolder, selectClass;
  $("select").each(function () {
    if (!$(this).attr("multiple")) {
      selectClass = $(this).attr("class");
      selectHolder = '<dl class="simpleSelect ' + selectClass + '">';
      selectHolder +=
        "<dt>" + $("option", this).first().text() + "</dt><dd><ul>";
      $("option", this).each(function () {
        selectHolder +=
          '<li data="' + $(this).val() + '">' + $(this).text() + "</li>";
      });
      selectHolder += "</ul></dd></dl>";
      $(this).after(selectHolder);
      $("." + selectClass).wrapAll('<div class="selectContainer"></div>');
    } else {
      $(this).show();
    }
  });
  $(".simpleSelect dd ul li").on("click", function () {
    $(this).parents().eq(3).find("select").val($(this).attr("data"));
  });

  $(".simpleSelect dt").on("click", function () {
    if ($(this).next("dd").hasClass("open")) {
      $(this).removeClass("open").next("dd").removeClass("open");
    } else {
      $(this).addClass("open").next("dd").addClass("open");
    }
  });

  $(".simpleSelect dd ul li").on("click", function () {
    $(this).parents().eq(1).removeClass("open");
    $(this).parents().eq(2).find("dt").removeClass("open");
    $(this).parents().eq(4).find("dt").text($(this).text());
  });
}
$(document).ready(simpleSelect);

// Contenedor Typebot
const observerTarget = document.querySelector('[data-element-type="variable"]');

if (observerTarget) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (
            node.nodeType === Node.ELEMENT_NODE &&
            node.matches('[data-element-type="p"]')
          ) {
            // Palabra clave
            const messageText = node.innerText.trim();
            console.log("Nuevo mensaje detectado:", messageText);
          }
        });
      }
    });
  });

  // Detectar cambios en los hijos del contenedor
  observer.observe(observerTarget, { childList: true, subtree: true });
} else {
  console.warn("No se encontró el contenedor del chatbot.");
}

// Almacenar las áreas
let conversationHistory = {};
let globalMessageHistory = new Set(); // evitar reutilizar mensajes

const subjectImages = {
  Matematicas:
    "https://www.masscience.com/wp-content/uploads/2019/10/mat-c.png",
  Biologia: "https://cdn-icons-png.flaticon.com/512/5010/5010270.png",
  "Historia y Filosofia":
    "https://bbs.hoyolab.com/hoyowiki/picture/object/Philosophies%20of%20Resistance_icon.png",
};

// Función para agregar un área
function addSubjectArea(subject) {
  let subjectContainer = document.getElementById(subject + "-" + Date.now()); // Usar un ID único por área

  // Crear el contenedor del área
  subjectContainer = document.createElement("div");
  subjectContainer.id = subject + "-" + Date.now(); // Asegurar ID único
  subjectContainer.classList.add("subject-container");

  // Crear el label y la imagen
  const label = document.createElement("label");
  label.innerText = subject;
  label.classList.add("subject-label");

  const image = document.createElement("img");
  image.src = subjectImages[subject] || "https://via.placeholder.com/150";
  image.classList.add("subject-image");

  // Agregar elementos al contenedor
  subjectContainer.appendChild(label);
  subjectContainer.appendChild(image);

  // Agregar al contenedor principal
  document
    .getElementById("conversationContainer")
    .appendChild(subjectContainer);

  return subjectContainer;
}

// Función para agregar un mensaje a un área sin repetir
function addMessageToSubject(subject, message) {
  if (globalMessageHistory.has(message)) return; // Evitar reutilizar mensajes previos
  globalMessageHistory.add(message); // Registrar mensaje globalmente

  let subjectContainer = addSubjectArea(subject);

  // Crear un nuevo textarea para cada mensaje
  const textarea = document.createElement("textarea");
  textarea.classList.add("message");
  textarea.readOnly = true;
  textarea.rows = 10;
  textarea.value = message;

  // Agregarlo al contenedor del área
  subjectContainer.appendChild(textarea);

  // Hacer scroll al último elemento agregado
  subjectContainer.scrollIntoView({ behavior: "smooth", block: "end" });
}

// Obtener los mensajes del shadow DOM
function captureMessages() {
  // Obtener el shadow root del chatbot
  const shadowHost = document.querySelector("typebot-bubble");
  if (!shadowHost) return;

  const shadowRoot = shadowHost.shadowRoot;
  if (!shadowRoot) return;

  // Detectar áreas y registrar el contexto correcto
  const areaMentioned = shadowRoot.querySelectorAll(
    '[data-testid="guest-bubble"]'
  );
  let latestSubject = null;

  areaMentioned.forEach((el) => {
    const areaText = el.innerText.trim();

    if (areaText.includes("Profesor de matematicas")) {
      latestSubject = "Matematicas";
    } else if (areaText.includes("Profesor de biologia")) {
      latestSubject = "Biologia";
    } else if (
      areaText.includes("Profesor de historia") ||
      areaText.includes("Profesor de filosofia")
    ) {
      latestSubject = "Historia y Filosofia";
    } else if (!areaText.includes("Profesor de")) {
      // Validacion extra
      searchAndEmbedInfo(areaText); // Buscar información
    }
  });

  // Si no se detecta, no seguir
  if (!latestSubject) return;

  // Obtener mensajes
  const messages = shadowRoot.querySelectorAll(
    '[data-element-type="variable"]'
  );
  messages.forEach((el) => {
    const messageText = el.innerText.trim();

    // Si el mensaje es válido y no se ha usado antes se agrega
    if (messageText) {
      addMessageToSubject(latestSubject, messageText);
    }
  });
}

// Ejecutar la función cada cierto tiempo
setInterval(captureMessages, 1500);

const searchedTopics = new Set(); // Almacena las búsquedas ya realizadas

function searchAndEmbedInfo(query) {
  if (searchedTopics.has(query)) return; // Si ya se buscó, no hacer nada
  searchedTopics.add(query); // Marcar como buscado

  const searchContainer = document.createElement("div");
  searchContainer.classList.add("search-container");
  const api = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  console.log(api);

  fetch(api)
    .then((response) => response.json())
    .then((data) => {
      //const contenedor = document.getElementById('articulos');
      data.forEach((articulo) => {
        const nuevoArticulo = document.createElement("div");
        nuevoArticulo.textContent = articulo.titulo;
        console.log(articulo.titulo);
        //contenedor.appendChild(nuevoArticulo);
      });
    });

  /*
    const iframe = document.createElement('iframe');
  
    iframe.src = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    iframe.width = "100%";
    iframe.height = "400px";
    iframe.style.border = "none";
  
    searchContainer.appendChild(iframe);
    document.getElementById('conversationContainer').appendChild(searchContainer);
  */
  // Hacer scroll hasta la nueva información
  //searchContainer.scrollIntoView({ behavior: "smooth", block: "end" });
}

// Modal
function toggleAbout() {
  const modal = document.getElementById("aboutModal");
  modal.style.display = modal.style.display === "block" ? "none" : "block";
}

// Ocultar el modal si se hace clic fuera
document.addEventListener("click", function (event) {
  const modal = document.getElementById("aboutModal");
  const btn = document.querySelector(".about-btn");

  if (!modal.contains(event.target) && !btn.contains(event.target)) {
    modal.style.display = "none";
  }
});

document.addEventListener("click", function (event) {
  const chatbotIcon = document.querySelector(".chatbot-icon"); // Ajusta esta clase al icono real del chatbot
  const arrow = document.getElementById("arrowIndicator");

  if (chatbotIcon && chatbotIcon.contains(event.target)) {
    arrow.style.display = "none";
  }
});
