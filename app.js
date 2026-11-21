/* Clairva — Assistant IA quotidien */
(function () {
  "use strict";

  /* ---------- Réglages (clé API) ---------- */
  var PROVIDERS = {
    mistral: {
      url: "https://api.mistral.ai/v1/chat/completions",
      model: "mistral-small-latest"
    },
    openai: {
      url: "https://api.openai.com/v1/chat/completions",
      model: "gpt-4o-mini"
    }
  };

  var settingsModal = document.getElementById("settings-modal");
  var providerSelect = document.getElementById("provider");
  var apiKeyInput = document.getElementById("api-key");
  var settingsStatus = document.getElementById("settings-status");

  function getSettings() {
    return {
      provider: localStorage.getItem("clairva_provider") || "mistral",
      key: localStorage.getItem("clairva_key") || ""
    };
  }

  function openSettings() {
    var s = getSettings();
    providerSelect.value = s.provider;
    apiKeyInput.value = s.key;
    settingsStatus.textContent = s.key
      ? "✅ Clé actuellement enregistrée dans ce navigateur."
      : "ℹ️ Aucune clé enregistrée : les outils nécessitent une clé pour fonctionner.";
    settingsModal.classList.add("open");
  }

  document.getElementById("open-settings").addEventListener("click", openSettings);
  settingsModal.addEventListener("click", function (e) {
    if (e.target === settingsModal) settingsModal.classList.remove("open");
  });

  document.getElementById("save-key").addEventListener("click", function () {
    localStorage.setItem("clairva_provider", providerSelect.value);
    localStorage.setItem("clairva_key", apiKeyInput.value.trim());
    settingsStatus.textContent = apiKeyInput.value.trim()
      ? "✅ Clé enregistrée. Vous pouvez fermer cette fenêtre."
      : "⚠️ Aucune clé saisie.";
  });

  document.getElementById("clear-key").addEventListener("click", function () {
    localStorage.removeItem("clairva_key");
    apiKeyInput.value = "";
    settingsStatus.textContent = "🗑️ Clé supprimée.";
  });

  /* ---------- Appel à l'API ---------- */
  function callAI(messages, onChunk) {
    var s = getSettings();
    if (!s.key) {
      openSettings();
      return Promise.reject(new Error("Veuillez d'abord enregistrer votre clé API (bouton « Clé API » en haut à droite)."));
    }
    var p = PROVIDERS[s.provider];

    return fetch(p.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + s.key
      },
      body: JSON.stringify({
        model: p.model,
        messages: messages,
        stream: true,
        temperature: 0.4
      })
    }).then(function (res) {
      if (!res.ok) {
        return res.text().then(function (t) {
          var msg = t;
          try { msg = JSON.parse(t).error.message || t; } catch (e) {}
          if (res.status === 401) msg = "Clé API invalide ou expirée. Vérifiez votre clé (bouton « Clé API »).";
          if (res.status === 429) msg = "Limite de requêtes atteinte. Réessayez dans quelques instants.";
          throw new Error(msg);
        });
      }
      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      var buffer = "";

      function pump() {
        return reader.read().then(function (chunk) {
          if (chunk.done) return;
          buffer += decoder.decode(chunk.value, { stream: true });
          var lines = buffer.split("\n");
          buffer = lines.pop();
          lines.forEach(function (line) {
            line = line.trim();
            if (!line.startsWith("data:")) return;
            var data = line.slice(5).trim();
            if (data === "[DONE]") return;
            try {
              var json = JSON.parse(data);
              var delta = json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content;
              if (delta) onChunk(delta);
            } catch (e) {}
          });
          return pump();
        });
      }
      return pump();
    });
  }

  function systemPrompt(text) {
    return [{ role: "system", content: text }];
  }

  /* ---------- Affichage des résultats ---------- */
  function setResult(id, loading) {
    var el = document.getElementById(id);
    el.classList.remove("error", "empty");
    el.innerHTML = loading
      ? '<span class="spinner"></span>L\'IA est en train de travailler...'
      : "";
    return el;
  }

  function showError(id, message) {
    var el = document.getElementById(id);
    el.classList.remove("empty");
    el.classList.add("error");
    el.textContent = "❌ " + message;
  }

  function streamInto(id, messages) {
    var el = setResult(id, true);
    return callAI(messages, function (delta) {
      if (el.querySelector(".spinner")) el.innerHTML = "";
      el.textContent += delta;
    }).catch(function (err) {
      if (el.querySelector(".spinner")) el.innerHTML = "";
      showError(id, err.message);
    });
  }

  var busy = false;
  document.querySelectorAll(".run-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (busy) return;
      var tool = btn.dataset.run;

      if (tool === "resume") {
        var text = document.getElementById("resume-input").value.trim();
        if (!text) return alert("Veuillez coller un texte à résumer.");
        var length = document.getElementById("resume-length").value;
        var instruction = {
          court: "Fais un résumé très concis en 3 à 4 phrases.",
          moyen: "Fais un résumé en un paragraphe clair et fluide.",
          detaille: "Fais un résumé détaillé structuré en points clés (liste à puces)."
        }[length];
        busy = true;
        streamInto("resume-output", systemPrompt(
          "Tu es un expert en synthèse de documents. " + instruction +
          " Réponds en français, dans un style naturel, sans commentaire supplémentaire."
        ).concat([{ role: "user", content: text }])).then(function () { busy = false; }, function () { busy = false; });
      }

      if (tool === "cv") {
        var cv = document.getElementById("cv-input").value.trim();
        if (!cv) return alert("Veuillez coller le texte de votre CV.");
        busy = true;
        streamInto("cv-output", systemPrompt(
          "Tu es un expert du recrutement et de la rédaction de CV. Analyse le CV fourni et réponds en français avec cette structure : " +
          "1) Fautes d'orthographe et de grammaire corrigées (cite-les), " +
          "2) Formulations à améliorer (avant → après), " +
          "3) Points forts, " +
          "4) Suggestions concrètes pour maximiser ses chances. Sois précis et bienveillant."
        ).concat([{ role: "user", content: cv }])).then(function () { busy = false; }, function () { busy = false; });
      }

      if (tool === "traduction") {
        var source = document.getElementById("traduction-input").value.trim();
        if (!source) return alert("Veuillez saisir le texte à traduire.");
        var from = document.getElementById("traduction-from").value;
        var to = document.getElementById("traduction-to").value;
        var langSpec = from === "auto"
          ? "Traduis le texte suivant en " + to + "."
          : "Traduis le texte suivant du " + from + " vers le " + to + ".";
        busy = true;
        streamInto("traduction-output", systemPrompt(
          "Tu es un traducteur professionnel. " + langSpec +
          " Conserve le ton et le format du texte original. Donne UNIQUEMENT la traduction, sans commentaire."
        ).concat([{ role: "user", content: source }])).then(function () { busy = false; }, function () { busy = false; });
      }
    });
  });

  /* ---------- Chat ---------- */
  var chat = document.getElementById("chat");
  var chatForm = document.getElementById("chat-form");
  var chatInput = document.getElementById("chat-input");
  var chatHistory = [];

  chatForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (busy) return;
    var question = chatInput.value.trim();
    if (!question) return;

    var userMsg = document.createElement("div");
    userMsg.className = "msg user";
    userMsg.textContent = question;
    chat.appendChild(userMsg);
    chatInput.value = "";
    chat.scrollTop = chat.scrollHeight;

    var botMsg = document.createElement("div");
    botMsg.className = "msg bot";
    botMsg.innerHTML = '<span class="spinner"></span>';
    chat.appendChild(botMsg);
    chat.scrollTop = chat.scrollHeight;

    chatHistory.push({ role: "user", content: question });
    busy = true;

    callAI(systemPrompt(
      "Tu es un assistant francophone serviable et concis. " +
      "Réponds toujours en français, de façon claire et structurée."
    ).concat(chatHistory.slice(-10)), function (delta) {
      if (botMsg.querySelector(".spinner")) botMsg.innerHTML = "";
      botMsg.textContent += delta;
      chat.scrollTop = chat.scrollHeight;
    }).then(function () {
      chatHistory.push({ role: "assistant", content: botMsg.textContent });
      busy = false;
    }).catch(function (err) {
      botMsg.textContent = "❌ " + err.message;
      busy = false;
    });
  });

  /* ---------- Onglets ---------- */
  document.querySelectorAll(".tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".tab").forEach(function (t) { t.classList.remove("active"); });
      document.querySelectorAll(".panel").forEach(function (p) { p.classList.remove("active"); });
      tab.classList.add("active");
      document.getElementById("panel-" + tab.dataset.tab).classList.add("active");
    });
  });

  /* ---------- Copier ---------- */
  document.querySelectorAll(".btn-copy").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = document.getElementById(btn.dataset.copyTarget);
      var text = target.textContent.trim();
      if (!text || target.classList.contains("error")) return;
      navigator.clipboard.writeText(text).then(function () {
        var old = btn.textContent;
        btn.textContent = "Copié ✓";
        setTimeout(function () { btn.textContent = old; }, 1500);
      });
    });
  });
})();
