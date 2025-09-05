// app.js — UniTV LP Fantasma v4 (Pixel ativo)
(() => {
  const PHONE_E164 = "5591982734406"; // WhatsApp E.164
  const PLAN_MESSAGES = {
    essencial: "Quero ativar o Plano R$10/mês agora. PIX ok.",
    combos: "Quero ativar um Combo (3/6/12 meses). PIX ok."
  };

  function getUTMs() {
    const params = new URLSearchParams(window.location.search);
    const keys = ["utm_source","utm_medium","utm_campaign"];
    keys.forEach(k => { if (params.get(k)) sessionStorage.setItem(k, params.get(k)); });
    const data = {}; keys.forEach(k => data[k] = sessionStorage.getItem(k) || "");
    return data;
  }

  function utmSuffix() {
    const u = getUTMs();
    const parts = [];
    if (u.utm_source) parts.push(`source=${u.utm_source}`);
    if (u.utm_medium) parts.push(`medium=${u.utm_medium}`);
    if (u.utm_campaign) parts.push(`campaign=${u.utm_campaign}`);
    return parts.length ? ` utm: ${parts.join("|")}` : "";
  }

  function buildWaLink(plan, action) {
    const base = `https://wa.me/${PHONE_E164}`;
    const msgBase = PLAN_MESSAGES[plan] || "Quero ativar agora.";
    const msg = `${msgBase}${utmSuffix()}`.trim();
    const url = `${base}?text=${encodeURIComponent(msg)}`;
    window.dataLayer.push({event: "WhatsAppClick", plan, action});
    if (typeof fbq === 'function') {
      try { fbq('trackCustom','WhatsAppClick',{plan, action}); } catch(e){}
      try { fbq('track','Contact'); } catch(e){}
    }
    return url;
  }

  const backdrop = document.getElementById("sheetBackdrop");
  let openSheet = null; let startY = null;

  function lockBody(lock) {
    document.documentElement.style.overflow = lock ? "hidden" : "";
    document.body.style.overflow = lock ? "hidden" : "";
  }
  function openDialog(sheetEl, plan) {
    if (openSheet) closeDialog(openSheet);
    openSheet = sheetEl;
    sheetEl.classList.add("open");
    backdrop.classList.add("show");
    lockBody(true);
    const focusEl = sheetEl.querySelector(".btn-primary") || sheetEl.querySelector("button");
    if (focusEl) focusEl.focus();
    window.dataLayer.push({event: "ViewPlanSheet", plan});
    if (typeof fbq === 'function') { try { fbq('trackCustom','ViewPlanSheet',{plan}); } catch(e){} }
  }
  function closeDialog(sheetEl) {
    sheetEl.classList.remove("open");
    backdrop.classList.remove("show");
    lockBody(false);
    openSheet = null;
  }

  backdrop.addEventListener("click", () => { if (openSheet) closeDialog(openSheet); });
  window.addEventListener("keydown", (e) => { if (e.key === "Escape" && openSheet) closeDialog(openSheet); });
  document.querySelectorAll(".sheet").forEach(sheet => {
    sheet.addEventListener("touchstart", (e) => { startY = e.touches[0].clientY; }, {passive:true});
    sheet.addEventListener("touchmove", (e) => {
      if (startY === null) return;
      const dy = e.touches[0].clientY - startY;
      if (dy > 40) { closeDialog(sheet); startY = null; }
    }, {passive:true});
  });

  document.getElementById("planList").addEventListener("click", (e) => {
    const btn = e.target.closest(".plan-btn");
    if (!btn) return;
    const plan = btn.dataset.plan;
    const targetId = btn.getAttribute("aria-controls");
    const sheet = document.getElementById(targetId);
    if (sheet) {
      window.dataLayer.push({event:"PlanSelected", plan});
      if (typeof fbq === 'function') { try { fbq('trackCustom','PlanSelected',{plan}); } catch(e){} }
      openDialog(sheet, plan);
    }
  });

  document.querySelectorAll(".sheet .cta-bar").forEach(bar => {
    bar.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const action = btn.dataset.action;
      const plan = btn.dataset.plan;
      const url = buildWaLink(plan, action);
      window.location.href = url;
    });
  });

  window.addEventListener("load", () => {
    document.querySelectorAll(".kick").forEach(el => { setTimeout(() => el.classList.remove("kick"), 900); });
  });
})();
