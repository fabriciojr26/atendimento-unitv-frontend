// capi-hook.js
(function () {
  // ATENÇÃO: Iremos substituir esta linha mais tarde pela URL real do nosso servidor na Koyeb.
  const BACKEND_URL = "URL_DO_SEU_BACKEND_DA_KOYEB_IRA_AQUI";

  function uuidv4() {
    if (crypto && typeof crypto.randomUUID === "function") return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function getCookie(name) {
    const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return m ? decodeURIComponent(m[2]) : null;
  }

  function getUTMs() {
    const keys = ["utm_source", "utm_medium", "utm_campaign"];
    const u = {};
    const qs = new URLSearchParams(location.search);
    keys.forEach((k) => {
      const v = qs.get(k) || sessionStorage.getItem(k);
      if (v) {
        u[k] = v;
        sessionStorage.setItem(k, v);
      }
    });
    const parts = [];
    if (u.utm_source) parts.push("source=" + u.utm_source);
    if (u.utm_medium) parts.push("medium=" + u.utm_medium);
    if (u.utm_campaign) parts.push("campaign=" + u.utm_campaign);
    return parts.length ? "utm: " + parts.join("|") : "";
  }

  function sendCapi(payload) {
    // Verifica se a URL do backend foi definida
    if (BACKEND_URL === "URL_DO_SEU_BACKEND_DA_KOYEB_IRA_AQUI") {
      console.warn("URL do backend ainda não configurada no capi-hook.js");
      return;
    }

    const body = JSON.stringify(payload);
    // Usamos fetch pois sendBeacon pode ser menos fiável para alguns cenários
    fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true, // Garante que a requisição continua mesmo se a página mudar
    }).catch(error => console.error('Erro ao enviar evento CAPI:', error));
  }

  document.addEventListener(
    "click",
    function (e) {
      const btn = e.target.closest("button[data-action][data-plan]");
      if (!btn) return;

      const plan = btn.getAttribute("data-plan");
      const action = btn.getAttribute("data-action");
      const eventID = uuidv4();

      // Dispara o Pixel do browser primeiro (se existir)
      if (typeof fbq === 'function') {
        try {
          fbq('trackCustom', 'WhatsAppClick', { plan, action, eventID });
          fbq('track', 'Contact');
        } catch (err) {
          console.error("Erro ao disparar fbq:", err);
        }
      }

      // Envia os dados para o nosso servidor de backend
      sendCapi({
        event_name: "WhatsAppClick",
        event_id: eventID,
        plan,
        action,
        utm: getUTMs(),
        fbp: getCookie("_fbp"),
        fbc: getCookie("_fbc"),
        fbclid: new URLSearchParams(location.search).get("fbclid")
      });
    },
    true // 'capture: true' para executar antes de outros eventos de clique
  );
})();
