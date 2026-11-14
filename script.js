
const langBtn = document.getElementById("langBtn");
let currentLang = "ar";

const wilayas = [
  ["01","أدرار","Adrar"],["02","الشلف","Chlef"],["03","الأغواط","Laghouat"],
  ["04","أم البواقي","Oum El Bouaghi"],["05","باتنة","Batna"],["06","بجاية","Béjaïa"],
  ["07","بسكرة","Biskra"],["08","بشار","Béchar"],["09","البليدة","Blida"],
  ["10","البويرة","Bouira"],["11","تمنراست","Tamanrasset"],["12","تبسة","Tébessa"],
  ["13","تلمسان","Tlemcen"],["14","تيارت","Tiaret"],["15","تيزي وزو","Tizi Ouzou"],
  ["16","الجزائر","Alger"],["17","الجلفة","Djelfa"],["18","جيجل","Jijel"],
  ["19","سطيف","Sétif"],["20","سعيدة","Saïda"],["21","سكيكدة","Skikda"],
  ["22","سيدي بلعباس","Sidi Bel Abbès"],["23","عنابة","Annaba"],
  ["24","قالمة","Guelma"],["25","قسنطينة","Constantine"],["26","المدية","Médéa"],
  ["27","مستغانم","Mostaganem"],["28","المسيلة","M’Sila"],["29","معسكر","Mascara"],
  ["30","ورقلة","Ouargla"],["31","وهران","Oran"],["32","البيض","El Bayadh"],
  ["33","إليزي","Illizi"],["34","برج بوعريريج","Bordj Bou Arréridj"],
  ["35","بومرداس","Boumerdès"],["36","الطارف","El Tarf"],["37","تندوف","Tindouf"],
  ["38","تسمسيلت","Tissemsilt"],["39","الوادي","El Oued"],["40","خنشلة","Khenchela"],
  ["41","سوق أهراس","Souk Ahras"],["42","تيبازة","Tipaza"],["43","ميلة","Mila"],
  ["44","عين الدفلى","Aïn Defla"],["45","النعامة","Naâma"],
  ["46","عين تموشنت","Aïn Témouchent"],["47","غرداية","Ghardaïa"],
  ["48","غليزان","Relizane"],["49","تيميمون","Timimoun"],
  ["50","برج باجي مختار","Bordj Badji Mokhtar"],["51","أولاد جلال","Ouled Djellal"],
  ["52","بني عباس","Béni Abbès"],["53","عين صالح","In Salah"],
  ["54","عين قزام","In Guezzam"],["55","تقرت","Touggourt"],
  ["56","جانت","Djanet"],["57","المغير","El M’Ghair"],["58","المنيعة","El Meniaa"]
];

const wilayaSelect = document.getElementById("wilaya");
const communeSelect = document.getElementById("commune");

let communesData = {};
let communesLoaded = false;
let communesLoading = false;
let communesLoadPromise = null;

function opt(value, ar, fr) {
  const o = document.createElement("option");
  o.value = value;
  o.dataset.ar = ar;
  o.dataset.fr = fr;
  o.textContent = currentLang === "ar" ? ar : fr;
  return o;
}

function fillWilayas() {
  wilayaSelect.innerHTML = "";
  wilayaSelect.append(opt("", "اختر الولاية", "Choisir une wilaya"));

  wilayas.forEach(w => {
    wilayaSelect.append(opt(
      w[0],
      w[0] + " — " + w[1],
      w[0] + " — " + w[2]
    ));
  });
}

function fillCommunes() {
  const code = wilayaSelect.value;
  communeSelect.innerHTML = "";

  const fallback = document.getElementById("communeFallback");

  if (!code) {
    communeSelect.append(opt(
      "",
      "اختر الولاية أولاً",
      "Choisissez d’abord la wilaya"
    ));

    communeSelect.disabled = true;
    communeSelect.required = false;

    if (fallback) {
      fallback.hidden = true;
      fallback.required = false;
      fallback.value = "";
    }
    return;
  }

  if (!communesLoaded && communesLoading) {
    communeSelect.append(opt(
      "",
      "جارٍ تحميل البلديات…",
      "Chargement des communes…"
    ));

    communeSelect.disabled = true;
    communeSelect.required = false;

    if (fallback) {
      fallback.hidden = true;
      fallback.required = false;
    }
    return;
  }

  const entry = communesData[code];

  if (entry && entry.length) {
    communeSelect.append(opt(
      "",
      "اختر البلدية",
      "Choisir une commune"
    ));

    const list = [...entry].sort((a, b) =>
      (a.local || "").localeCompare(b.local || "", "ar")
    );

    list.forEach(c => {
      communeSelect.append(opt(
        c.local || c.fr,
        c.local || c.fr,
        c.fr || c.local
      ));
    });

    communeSelect.disabled = false;
    communeSelect.required = true;

    if (fallback) {
      fallback.hidden = true;
      fallback.required = false;
      fallback.value = "";
    }
  } else {
    communeSelect.append(opt(
      "",
      "قائمة البلديات غير متاحة — أدخلها في الحقل أدناه",
      "Communes indisponibles — saisissez-la ci-dessous"
    ));

    communeSelect.disabled = true;
    communeSelect.required = false;

    if (fallback) {
      fallback.hidden = false;
      fallback.required = true;
    }
  }
}

fillWilayas();

function loadCommunesData() {
  if (communesLoaded || communesLoading) return communesLoadPromise;

  communesLoading = true;
  fillCommunes();

  communesLoadPromise = fetch(
    "https://raw.githubusercontent.com/open-admin-data/algeria-administrative-divisions/master/data/all-commune.json"
  )
    .then(r => {
      if (!r.ok) throw new Error("commune data unavailable");
      return r.json();
    })
    .then(data => {
      communesData = {};

      if (Array.isArray(data)) {
        data.forEach(c => {
          if (c.level !== 3 || !Array.isArray(c.ancestors)) return;

          const w = c.ancestors.find(a => a.level === 1);
          const match = w?.id?.match(/^DZ(\d{3})$/);

          if (!match) return;

          const code = String(Number(match[1])).padStart(2, "0");

          if (Number(code) > 58) return;

          (communesData[code] ||= []).push({
            local: c.name?.local || "",
            fr: c.name?.en || ""
          });
        });
      }

      communesLoaded = true;
      communesLoading = false;
      fillCommunes();
    })
    .catch(() => {
      communesLoading = false;
      fillCommunes();
    });

  return communesLoadPromise;
}

wilayaSelect.addEventListener("change", () => {
  fillCommunes();

  if (wilayaSelect.value && !communesLoaded) {
    loadCommunesData();
  }

  updateTotal();
});

const communeFallback = document.createElement("input");

communeFallback.id = "communeFallback";
communeFallback.name = "communeFallback";
communeFallback.maxLength = 100;
communeFallback.placeholder = "اكتب اسم البلدية";
communeFallback.hidden = true;

communeFallback.setAttribute("aria-label", "اسم البلدية");

communeSelect.parentElement.appendChild(communeFallback);

communeFallback.addEventListener("input", () => {
  communeSelect.required = !communeFallback.value.trim();
});

function setLanguage(lang) {
  currentLang = lang;

  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

  document.querySelectorAll("[data-ar][data-fr]").forEach(el => {
    el.innerHTML = el.dataset[lang];
  });

  document.querySelectorAll("[data-ar-placeholder][data-fr-placeholder]").forEach(el => {
    el.placeholder = el.dataset[lang + "Placeholder"];
  });

  langBtn.textContent = lang === "ar" ? "FR" : "AR";

  const K = lang === "ar" ? "Ar" : "Fr";
  document.querySelectorAll("[data-alt-ar]").forEach(el => { el.alt = el.dataset["alt" + K]; });
  document.querySelectorAll("[data-aria-ar]").forEach(el => el.setAttribute("aria-label", el.dataset["aria" + K]));
  document.title = lang === "ar" ? "عاشق من وراء الزمن | بدر الدين" : "Un amoureux au-delà du temps | Badr Eddine";
  try { localStorage.setItem("ashiq-lang", lang); } catch {}
  if (window.refreshErrors) refreshErrors();

  langBtn.setAttribute(
    "aria-label",
    lang === "ar" ? "Passer au français" : "التبديل إلى العربية"
  );

  document.querySelectorAll("#wilaya option,#commune option").forEach(o => {
    if (o.dataset[lang]) o.textContent = o.dataset[lang];
  });

  communeFallback.placeholder = lang === "ar"
    ? "اكتب اسم البلدية"
    : "Saisissez le nom de la commune";

  document.getElementById("menuToggle").setAttribute(
    "aria-label",
    lang === "ar" ? "فتح القائمة" : "Ouvrir le menu"
  );

  updateTotal();
}

langBtn.addEventListener("click", () => {
  setLanguage(currentLang === "ar" ? "fr" : "ar");
});

document.getElementById("year").textContent = new Date().getFullYear();

const menuToggle = document.getElementById("menuToggle");
const nav = document.getElementById("mainNav");

menuToggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
});

nav.querySelectorAll("a").forEach(a => {
  a.addEventListener("click", () => {
    nav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

// Intro screen
window.addEventListener("load", () => {
  setTimeout(() => {
    document.getElementById("introScreen").classList.add("hide");
  }, 2600);
});

document.getElementById("introScreen").addEventListener("click", () => {
  document.getElementById("introScreen").classList.add("hide");
});

// Reveal animations
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add("visible");
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: .12 });

document.querySelectorAll(
  ".section-label,.intro-grid,.themes,.quote-frame,.secret-card,.author-copy,.author-book,.order-form"
).forEach(el => {
  el.classList.add("reveal");
  revealObserver.observe(el);
});

// Countdown
const releaseAt = new Date("2026-11-15T23:59:59+01:00").getTime();

function updateCountdown() {
  const diff = Math.max(0, releaseAt - Date.now());

  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff % 86400000 / 3600000);
  const m = Math.floor(diff % 3600000 / 60000);
  const s = Math.floor(diff % 60000 / 1000);

  for (const [id, val] of [
    ["cdDays", d],
    ["cdHours", h],
    ["cdMinutes", m],
    ["cdSeconds", s]
  ]) {
    const element = document.getElementById(id);
    if (element) element.textContent = String(val).padStart(2, "0");
  }
}

updateCountdown();
setInterval(updateCountdown, 1000);

// Price calculator
const qty = document.getElementById("quantity");
const total = document.getElementById("totalPrice");

function isAnnaba() {
  return wilayaSelect.value === "23";
}

// قواعد التوصيل:
// المنزل: 800 دج لجميع الولايات.
// مكتب الاستلام: مجاني في عنابة، و400 دج في باقي الولايات.
function getDeliveryFee(delivery) {
  if (delivery === "home") return 800;

  if (delivery === "office") {
    return isAnnaba() ? 0 : 400;
  }

  return 0;
}

// تحديث الأسعار الظاهرة بجانب خيارات التوصيل
function updateDeliveryLabels() {
  const officeInput = document.querySelector(
    'input[name="delivery"][value="office"]'
  );

  const homeInput = document.querySelector(
    'input[name="delivery"][value="home"]'
  );

  if (officeInput) {
    const small = officeInput.closest(".delivery-option")?.querySelector("small");

    if (small) {
      small.textContent = isAnnaba()
        ? (currentLang === "ar" ? "مجاني" : "Gratuit")
        : (currentLang === "ar" ? "400 دج" : "400 DA");
    }
  }

  if (homeInput) {
    const small = homeInput.closest(".delivery-option")?.querySelector("small");

    if (small) {
      small.textContent = currentLang === "ar" ? "800 دج" : "800 DA";
    }
  }
}

function updateTotal() {
  const count = Math.max(1, Math.min(20, Number(qty.value) || 1));

  const delivery = document.querySelector(
    'input[name="delivery"]:checked'
  )?.value;

  const deliveryFee = getDeliveryFee(delivery);
  const amount = count * 1400 + deliveryFee;

  updateDeliveryLabels();

  total.textContent =
    amount.toLocaleString(currentLang === "ar" ? "en-US" : "fr-FR") +
    (currentLang === "ar" ? " دج" : " DA");
}

qty.addEventListener("input", updateTotal);

document.querySelectorAll('input[name="delivery"]').forEach(el => {
  el.addEventListener("change", updateTotal);
});

updateTotal();

const form = document.getElementById("orderForm");
const feedback = document.getElementById("orderFeedback");
const dlg = document.getElementById("orderDialog");
const L = () => currentLang === "ar";
const T = (ar, fr) => (L() ? ar : fr);
const nf = n => n.toLocaleString(L() ? "en-US" : "fr-FR");
const h = (t, c, x, a = {}) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; for (const k in a) e.setAttribute(k, a[k]); return e; };
const MSG = {
  first: ["أدخل الاسم (حرفان على الأقل، دون أرقام).", "Saisissez le prénom (2 lettres minimum, sans chiffres)."],
  last: ["أدخل اللقب (حرفان على الأقل، دون أرقام).", "Saisissez le nom (2 lettres minimum, sans chiffres)."],
  phone: ["أدخل رقم هاتف جزائري صحيح، مثل 0555 12 34 56.", "Saisissez un numéro algérien valide, par ex. 0555 12 34 56."],
  qty: ["عدد النسخ يجب أن يكون بين 1 و20.", "Le nombre d’exemplaires doit être compris entre 1 et 20."],
  wilaya: ["اختر الولاية.", "Choisissez la wilaya."],
  commune: ["اختر البلدية أو أدخلها.", "Choisissez ou saisissez la commune."],
  consent: ["الموافقة مطلوبة لإرسال الطلب.", "Votre accord est nécessaire pour envoyer la commande."]
};
const nameOk = v => /^[\p{L}\p{M}][\p{L}\p{M}\s'’.\-]{1,69}$/u.test(v);
const normPhone = v => {
  const s = v.replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[\s.\-()]/g, "");
  const m = s.match(/^(?:0|\+213|00213)([567]\d{8})$/);
  return m ? "0" + m[1] : null;
};
function setErr(el, key) {
  el.setAttribute("aria-invalid", "true");
  const host = el.closest("label") || el.parentElement;
  let m = host.querySelector(".field-error");
  if (!m) { m = h("small", "field-error"); m.id = "err-" + (el.name || el.id); host.append(m); }
  m.dataset.key = key; m.textContent = MSG[key][L() ? 0 : 1];
  el.setAttribute("aria-describedby", m.id);
}
window.refreshErrors = () => document.querySelectorAll(".field-error[data-key]").forEach(m => { m.textContent = MSG[m.dataset.key][L() ? 0 : 1]; });
function clearErrors() {
  form.querySelectorAll(".field-error").forEach(m => m.remove());
  form.querySelectorAll("[aria-invalid]").forEach(el => { el.removeAttribute("aria-invalid"); el.removeAttribute("aria-describedby"); });
}
function validate() {
  clearErrors();
  let first = null;
  const bad = (el, k) => { setErr(el, k); first = first || el; };
  const E = n => form.elements[n];
  if (!nameOk(E("firstName").value.trim())) bad(E("firstName"), "first");
  if (!nameOk(E("lastName").value.trim())) bad(E("lastName"), "last");
  if (!normPhone(E("phone").value)) bad(E("phone"), "phone");
  const q = Number(qty.value);
  if (!Number.isInteger(q) || q < 1 || q > 20) bad(qty, "qty");
  if (!wilayaSelect.value) bad(wilayaSelect, "wilaya");
  else if (!communeFallback.value.trim() && !communeSelect.value) bad(communeFallback.hidden ? communeSelect : communeFallback, "commune");
  if (!E("consent").checked) bad(E("consent"), "consent");
  return first;
}
function buildOrder() {
  const E = n => form.elements[n];
  const w = wilayas.find(x => x[0] === wilayaSelect.value);
  const delivery = document.querySelector('input[name="delivery"]:checked').value;
  const quantity = Number(qty.value);
  const deliveryFee = getDeliveryFee(delivery);
  return {
    firstName: E("firstName").value.trim(), lastName: E("lastName").value.trim(),
    phone: normPhone(E("phone").value), quantity,
    wilayaCode: w[0], wilayaAr: w[1], wilaya: L() ? w[1] : w[2],
    commune: communeFallback.value.trim() || communeSelect.value,
    delivery, deliveryLabel: delivery === "home" ? T("توصيل إلى المنزل", "À domicile") : T("مكتب الاستلام", "Point relais"),
    unitPrice: 1400, deliveryFee, total: quantity * 1400 + deliveryFee
  };
}
function buildMessage(o) {
  return L()
    ? `السلام عليكم، حاب نأكد طلب الرواية «عاشق من وراء الزمن».\n\nالاسم: ${o.firstName} ${o.lastName}\nرقم الهاتف: ${o.phone}\nالولاية: ${o.wilaya}\nالبلدية: ${o.commune}\nعدد النسخ: ${o.quantity}\nطريقة الاستلام: ${o.deliveryLabel}\nسعر النسخة: ${nf(o.unitPrice)} دج\nالتوصيل: ${o.deliveryFee === 0 ? "مجاني" : nf(o.deliveryFee) + " دج"}\nالمجموع: ${nf(o.total)} دج\n\nشكراً لكم، ونتطلع إلى رحلة بين صفحات هذه الحكاية.`
    : `Bonjour, je souhaite confirmer ma commande du roman « Un amoureux au-delà du temps ».\n\nPrénom et nom : ${o.firstName} ${o.lastName}\nTéléphone : ${o.phone}\nWilaya : ${o.wilaya}\nCommune : ${o.commune}\nNombre d’exemplaires : ${o.quantity}\nMode de réception : ${o.deliveryLabel}\nPrix par exemplaire : ${nf(o.unitPrice)} DA\nFrais de livraison : ${o.deliveryFee === 0 ? "Gratuit" : nf(o.deliveryFee) + " DA"}\nTotal : ${nf(o.total)} DA\n\nMerci. Au plaisir de vous faire voyager entre les pages de cette histoire.`;
}
function showDialog(o, mode) {
  const msg = buildMessage(o), sent = mode === "sent";
  dlg.textContent = ""; dlg.dir = L() ? "rtl" : "ltr"; dlg.lang = currentLang; dlg.dataset.mode = mode;
  const th = h("div", "od-thanks");
  th.append(
    h("b", "", T("شكرًا لأنك اخترت أن تكون جزءًا من هذه الحكاية…", "Merci d’avoir choisi de faire partie de cette histoire…")),
    h("p", "", T("كل رواية تبدأ بكلمات، لكنها لا تصبح حياةً إلا حين تجد قلبًا يقرأها. لقد حجزت مكانك بين صفحات «عاشق من وراء الزمن»، ونأمل أن تجد بين سطورها شيئًا يشبهك، وذكرى تبقى معك حتى بعد أن تطوي الصفحة الأخيرة.", "Un roman commence par des mots, mais il ne prend vie que lorsqu’il trouve un cœur pour le lire. Vous avez réservé votre place entre les pages de « Un amoureux au-delà du temps ». Puissiez-vous y trouver quelque chose qui vous ressemble, et un souvenir qui vous accompagne même après la dernière page.")),
    h("b", "", T("بدر الدين ✧", "Badr Eddine ✧"))
  );
  const ta = h("textarea", "", null, { readonly: "", "aria-label": T("تفاصيل الطلب", "Détails de la commande") }); ta.value = msg;
  const status = h("p", "od-status", "", { role: "status" });
  const copy = h("button", "primary", T("نسخ تفاصيل الطلب", "Copier les détails"), { type: "button" });
  const ig = h("a", "", T("فتح Instagram ↗", "Ouvrir Instagram badr__23231 ↗"), { href: "https://www.instagram.com/badr__23231/", target: "_blank", rel: "noopener noreferrer" });
  const close = h("button", "", T("إغلاق", "Fermer"), { type: "button" });
  copy.onclick = async () => {
    try { await navigator.clipboard.writeText(msg); status.textContent = T("تم نسخ تفاصيل الطلب.", "Les détails ont été copiés."); }
    catch { ta.focus(); ta.select(); try { document.execCommand("copy"); status.textContent = T("تم نسخ التفاصيل.", "Les détails ont été copiés."); } catch { status.textContent = T("انسخ النص يدوياً من المربع.", "Copiez le texte manuellement depuis la zone."); } }
  };
  close.onclick = () => dlg.close();
  dlg.setAttribute("aria-labelledby", "dlgTitle");
  dlg.append(
    h("div", "od-star", "✧", { "aria-hidden": "true" }),
    h("h2", "", sent ? T("تم استلام طلبك", "Commande reçue") : T("تم تجهيز طلبك", "Votre commande est prête"), { id: "dlgTitle" }),
    th,
    h("p", "", sent ? T("تم إرسال طلبك. يمكنك أيضاً نسخ التفاصيل وإرسالها عبر Instagram إن رغبت.", "Votre commande a bien été envoyée. Vous pouvez aussi copier les détails et les envoyer sur Instagram.") : T("انسخ تفاصيل الطلب التالية، ثم افتح Instagram والصقها في المحادثة وأرسلها بنفسك.", "Copiez les détails ci-dessous, ouvrez Instagram, collez-les dans la conversation et envoyez le message vous-même."), { style: "text-align:center;line-height:1.8" }),
    ta, status, h("div", "od-actions"), 
  );
  dlg.querySelector(".od-actions").append(copy, ig, close);
  dlg.showModal ? dlg.showModal() : dlg.setAttribute("open", "");
}
dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
dlg.addEventListener("close", () => {
  const sent = dlg.dataset.mode === "sent";
  form.reset(); communeFallback.value = ""; clearErrors(); fillCommunes(); updateTotal();
  feedback.dataset.state = sent ? "success" : "";
  feedback.textContent = sent ? T("تم إرسال طلبك بنجاح.", "Votre commande a été envoyée avec succès.") : T("تم تجهيز الطلب. إذا لم ترسله بعد، افتح Instagram وأرسل التفاصيل.", "Commande préparée. Si vous ne l’avez pas encore envoyée, ouvrez Instagram et envoyez les détails.");
});
function showFailure(o, reason) {
  feedback.dataset.state = "error";
  feedback.textContent = reason === "offline"
    ? T("لا يوجد اتصال بالإنترنت. تحقق من الاتصال ثم أعد المحاولة.", "Aucune connexion Internet. Vérifiez votre connexion puis réessayez.")
    : T("تعذّر إرسال الطلب. بياناتك ما زالت في النموذج، يمكنك إعادة المحاولة أو إرسال الطلب عبر Instagram.", "L’envoi a échoué. Vos données sont conservées : réessayez ou envoyez la commande via Instagram.");
  const box = h("div", "fb-actions");
  const retry = h("button", "", T("إعادة المحاولة", "Réessayer"), { type: "button" });
  const viaIg = h("button", "", T("إرسال عبر Instagram", "Envoyer via Instagram"), { type: "button" });
  retry.onclick = () => (form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit", { cancelable: true })));
  viaIg.onclick = () => showDialog(o, "manual");
  box.append(retry, viaIg); feedback.append(box);
}
async function sendOrder(endpoint, o) {
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 15000);
  try {
    const res = await fetch(endpoint, {
      method: "POST", signal: ctl.signal,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ ...o, wilaya: o.wilayaCode + " — " + o.wilayaAr, language: currentLang, _subject: "طلب جديد — عاشق من وراء الزمن", _template: "table", _honey: "" })
    });
    let data = {}; try { data = await res.json(); } catch {}
    return res.ok && data.success !== false && data.success !== "false";
  } catch { return false; } finally { clearTimeout(timer); }
}
form.addEventListener("submit", async e => {
  e.preventDefault();
  feedback.dataset.state = ""; feedback.textContent = "";
  const first = validate();
  if (first) {
    feedback.dataset.state = "error";
    feedback.textContent = T("يرجى تصحيح الحقول المحددة.", "Veuillez corriger les champs signalés.");
    first.focus(); return;
  }
  const o = buildOrder();
  if (form.elements._honey && form.elements._honey.value) { showDialog(o, "sent"); return; }
  const endpoint = (window.ASHIQ_CONFIG || {}).orderEndpoint;
  if (!endpoint) { showDialog(o, "manual"); return; }
  if (navigator.onLine === false) { showFailure(o, "offline"); return; }
  const btn = form.querySelector(".submit-order"), label = btn.querySelector("span");
  const old = label.innerHTML;
  btn.disabled = true; btn.setAttribute("aria-busy", "true"); label.textContent = T("جارٍ الإرسال…", "Envoi en cours…");
  feedback.dataset.state = ""; feedback.textContent = T("جارٍ إرسال طلبك…", "Envoi de votre commande…");
  const ok = await sendOrder(endpoint, o);
  btn.disabled = false; btn.removeAttribute("aria-busy"); label.innerHTML = old; feedback.textContent = "";
  ok ? showDialog(o, "sent") : showFailure(o, "failed");
});
try { sessionStorage.setItem("ashiq-intro", "1"); } catch {}

// Interactive 3D hardcover: drag, arrow keys, or view buttons
(() => {
  const st = document.getElementById("bookStage"), bk = document.getElementById("book3d");
  if (!st || !bk) return;
  const still = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const V = { front: 24, spine: 90, back: 156 };
  const btns = [...document.querySelectorAll(".book-views button")];
  const status = document.getElementById("bookStatus");
  let ry = V.front, ty = ry, rx = 4, tx = 4, idle = !still, drag = null, t0 = performance.now();
  const mark = () => btns.forEach(b => b.setAttribute("aria-pressed", String(Math.abs((((ty - V[b.dataset.view]) % 360) + 540) % 360 - 180) < 25)));
  const go = (a) => { idle = false; ty = a + 360 * Math.round((ty - a) / 360); tx = 4; if (still) { ry = ty; rx = tx; } mark(); };
  btns.forEach(b => b.addEventListener("click", () => { go(V[b.dataset.view]); if (status) status.textContent = b.textContent.trim(); }));
  st.addEventListener("pointerdown", e => { drag = { x: e.clientX, y: e.clientY, ty, tx }; idle = false; st.setPointerCapture(e.pointerId); });
  st.addEventListener("pointermove", e => { if (!drag) return; ty = drag.ty + (e.clientX - drag.x) * .5; tx = Math.max(-10, Math.min(16, drag.tx - (e.clientY - drag.y) * .15)); if (still) { ry = ty; rx = tx; } });
  const end = () => { drag = null; mark(); };
  st.addEventListener("pointerup", end); st.addEventListener("pointercancel", end);
  st.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") { go(ty - 20); e.preventDefault(); }
    else if (e.key === "ArrowRight") { go(ty + 20); e.preventDefault(); }
    else if (e.key === "Home") { go(V.front); e.preventDefault(); }
  });
  (function frame(t) {
    requestAnimationFrame(frame);
    ry += (ty - ry) * .1; rx += (tx - rx) * .1;
    const sway = idle ? Math.sin((t - t0) / 1600) * 5 : 0;
    bk.style.transform = `rotateX(${rx}deg) rotateY(${ry + sway}deg)`;
  })(t0);
  mark();
})();

// Golden dust (hero only, paused when off-screen)
(() => {
  const c = document.getElementById("dust");
  if (!c || matchMedia("(prefers-reduced-motion:reduce)").matches) return;
  const x = c.getContext("2d"); let W, H, P = [], on = true;
  const rs = () => { W = c.width = c.offsetWidth; H = c.height = c.offsetHeight; P = Array.from({ length: Math.min(46, W / 22 | 0) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.4 + .4, v: Math.random() * .25 + .08, a: Math.random() * 6.28 })); };
  rs(); addEventListener("resize", rs);
  new IntersectionObserver(e => { on = e[0].isIntersecting; }).observe(c);
  (function f(t) {
    requestAnimationFrame(f);
    if (!on || document.hidden) return;
    x.clearRect(0, 0, W, H);
    for (const p of P) {
      p.y -= p.v; p.x += Math.sin(t / 2500 + p.a) * .2;
      if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
      x.globalAlpha = .25 + .35 * Math.sin(t / 900 + p.a) ** 2; x.fillStyle = "#e8cb91";
      x.beginPath(); x.arc(p.x, p.y, p.r, 0, 6.283); x.fill();
    }
  })(0);
})();

try { if (localStorage.getItem("ashiq-lang") === "fr") setLanguage("fr"); } catch {}
