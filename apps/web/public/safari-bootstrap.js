(function () {
  "use strict";

  var startedAt = Date.now();

  function rootIsEmpty() {
    var root = document.getElementById("root");
    return !root || !root.firstElementChild;
  }

  function describe(value) {
    if (!value) return "Неизвестная ошибка";
    if (typeof value === "string") return value;
    if (value.message) return value.message;
    try {
      return String(value);
    } catch {
      return "Неизвестная ошибка";
    }
  }

  function showFailure(message) {
    if (!rootIsEmpty()) return;
    var root = document.getElementById("root");
    if (!root) return;
    root.innerHTML = "";
    var panel = document.createElement("main");
    panel.setAttribute("role", "alert");
    panel.style.cssText =
      "box-sizing:border-box;max-width:680px;margin:15vh auto;padding:28px;font:16px/1.5 -apple-system,BlinkMacSystemFont,sans-serif;color:#173247";
    var title = document.createElement("h1");
    title.style.cssText = "margin:0 0 12px;font-size:24px";
    title.textContent = "Не удалось запустить страницу";
    var details = document.createElement("p");
    details.style.cssText = "margin:0;color:#587180;white-space:pre-wrap";
    details.textContent = message;
    panel.appendChild(title);
    panel.appendChild(details);
    root.appendChild(panel);
  }

  window.addEventListener(
    "error",
    function (event) {
      var target = event.target;
      if (
        target &&
        target !== window &&
        (target.tagName === "SCRIPT" || target.tagName === "LINK")
      ) {
        showFailure("Safari не загрузил ресурс: " + (target.src || target.href || target.tagName));
        return;
      }
      showFailure(describe(event.error || event.message));
    },
    true,
  );

  window.addEventListener("unhandledrejection", function (event) {
    showFailure(describe(event.reason));
  });

  window.setTimeout(function () {
    if (!rootIsEmpty()) return;
    showFailure(
      "Код приложения не выполнился за " +
        Math.round((Date.now() - startedAt) / 1000) +
        " с. JavaScript: " +
        (typeof Promise === "function" ? "доступен" : "отключён") +
        ".",
    );
  }, 4000);
})();
