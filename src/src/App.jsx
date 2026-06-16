import React, { useState, useEffect, useMemo, useRef, useContext, createContext } from "react";
import {
  Building2, Car, Watch, Gem, Briefcase, Users, MoreHorizontal,
  Search, Handshake, ArrowRight, ArrowLeft, Check, Phone, Mail,
  AtSign, MapPin, Lock, LayoutDashboard, Download, Trash2, X,
  ChevronDown, FileText, Clock, Filter, Calculator, Printer,
  Camera, Sparkles, BadgeCheck, StickyNote, Link2, ImageOff,
  Globe, CalendarDays, MessageCircle, PenLine, Scale, Shield, Eye, Megaphone, Copy
} from "lucide-react";

/* ==========================================================================
   CONFIGURATION — à personnaliser
   ========================================================================== */
const ADMIN_CODE = "teamOSC29$"; // ⚠️ Changez ce code d'accès

const NOM_ACTIVITE = "Le Comptoir d'Affaires";
const SOUS_TITRE = "Apport d'affaires & biens d'exception";

// --- Notifications e-mail (EmailJS, gratuit jusqu'à 200 mails/mois) ---
// 1. Compte sur https://www.emailjs.com → ajoutez un service (Gmail…)
// 2. Créez un modèle avec les variables {{objet}}, {{ref}}, {{type}},
//    {{categorie}}, {{titre}}, {{nom}}, {{email}}, {{telephone}}, {{details}}
// 3. Renseignez les 3 identifiants. Laissez vide pour désactiver.
const EMAILJS = { serviceId: "", templateId: "", publicKey: "" };

// Alerte automatique quand un dépôt correspond à un dossier existant
// (score de rapprochement minimal pour déclencher l'e-mail)
const SEUIL_ALERTE_RAPPROCHEMENT = 6;

// --- Outils externes (laissez vide pour masquer le bouton correspondant) ---
const CALENDLY_URL = "";        // ex. "https://calendly.com/votre-nom/15min"
const WHATSAPP_NUMERO = "";     // ex. "33612345678" (format international, sans +)
const PLAUSIBLE_DOMAIN = "";    // ex. "lecomptoirdaffaires.fr" (stats sans cookies)
const LIEN_SIGNATURE = "";      // ex. lien Yousign/DocuSign pour signer le mandat en ligne

// --- Informations légales (OBLIGATOIRES avant mise en ligne) ---
// Remplacez chaque [À COMPLÉTER] : un site sans mentions légales est illégal en France.
const INFOS_LEGALES = {
  editeur: "Nino Bodin",
  statut: "Entrepreneur individuel (micro-entrepreneur)",
  siret: "102 297 694 00014",
  adresse: "9 Rue du Calvaire, 01200 Léaz",
  email: "ninbodin@gmail.com",
  telephone: "+33 7 68 96 70 71",
  directeurPublication: "Nino Bodin",
  hebergeur: "Anthropic PBC, 548 Market Street, PMB 90375, San Francisco, CA 94104, USA — site publié via la plateforme Claude (claude.ai).",
  mediateur: "[À COMPLÉTER — nom et site du médiateur de la consommation choisi]",
  dureeConservation: "3 ans après le dernier contact",
};

// Barème de commission (tranches MARGINALES, taux en %) — modifiez librement.
const BAREME = {
  immobilier: {
    base: "du prix de vente du bien",
    minimum: 1500,
    tranches: [
      { jusqua: 150000, taux: 4 },
      { jusqua: 500000, taux: 3 },
      { jusqua: Infinity, taux: 2.5 },
    ],
  },
  automobile: {
    base: "du prix de vente du véhicule",
    minimum: 300,
    tranches: [
      { jusqua: 25000, taux: 6 },
      { jusqua: 100000, taux: 4 },
      { jusqua: Infinity, taux: 3 },
    ],
  },
  horlogerie: {
    base: "du prix de vente de la pièce",
    minimum: 250,
    tranches: [
      { jusqua: 15000, taux: 7 },
      { jusqua: 80000, taux: 5 },
      { jusqua: Infinity, taux: 3.5 },
    ],
  },
  objets: {
    base: "du prix de vente de l'objet",
    minimum: 250,
    tranches: [
      { jusqua: 20000, taux: 7 },
      { jusqua: 100000, taux: 5 },
      { jusqua: Infinity, taux: 3.5 },
    ],
  },
  services: {
    base: "du montant du contrat (1ʳᵉ année)",
    minimum: 250,
    tranches: [
      { jusqua: 20000, taux: 10 },
      { jusqua: 100000, taux: 7 },
      { jusqua: Infinity, taux: 5 },
    ],
  },
  recrutement: {
    base: "de la rémunération annuelle brute du poste",
    minimum: 800,
    tranches: [
      { jusqua: 40000, taux: 12 },
      { jusqua: 80000, taux: 10 },
      { jusqua: Infinity, taux: 8 },
    ],
  },
  autre: {
    base: "du montant de la transaction",
    minimum: 200,
    tranches: [{ jusqua: Infinity, taux: 5 }],
  },
};

const COLORS = {
  fond: "#F2F4F2",
  carte: "#FCFCFA",
  encre: "#14352B",
  vert: "#1E4D3D",
  vertClair: "#E5EDE9",
  laiton: "#B08D4F",
  laitonClair: "#F4ECDD",
  ardoise: "#5C6B66",
  ligne: "#D8DDD9",
  rouge: "#A4453A",
};

const CATEGORIES = [
  { id: "immobilier", label: "Immobilier", labelEn: "Real estate", icon: Building2, desc: "Biens de caractère, terrains, locaux", descEn: "Distinctive properties, land, premises" },
  { id: "automobile", label: "Automobile", labelEn: "Automobiles", icon: Car, desc: "Véhicules de collection ou d'exception", descEn: "Collector and exceptional vehicles" },
  { id: "horlogerie", label: "Horlogerie", labelEn: "Watches", icon: Watch, desc: "Montres et pièces rares", descEn: "Fine watches and rare pieces" },
  { id: "objets", label: "Art & objets d'exception", labelEn: "Art & exceptional objects", icon: Gem, desc: "Art, joaillerie, vins, pièces uniques", descEn: "Art, jewellery, wine, unique pieces" },
  { id: "services", label: "Services aux entreprises", labelEn: "Business services", icon: Briefcase, desc: "Prestations, fournisseurs, clients", descEn: "Services, suppliers, clients" },
  { id: "recrutement", label: "Recrutement & talents", labelEn: "Recruitment & talent", icon: Users, desc: "Profils et postes à pourvoir", descEn: "Profiles and open positions" },
  { id: "autre", label: "Autre", labelEn: "Other", icon: MoreHorizontal, desc: "Toute autre mise en relation", descEn: "Any other introduction" },
];

const STATUTS = [
  { id: "nouveau", label: "Nouveau", labelEn: "Received", bg: "#E5EDE9", fg: "#1E4D3D" },
  { id: "en_cours", label: "En cours", labelEn: "In progress", bg: "#F4ECDD", fg: "#8A6A33" },
  { id: "mis_en_relation", label: "Mis en relation", labelEn: "Introduced", bg: "#E3E9F2", fg: "#3A5276" },
  { id: "conclu", label: "Conclu", labelEn: "Closed", bg: "#1E4D3D", fg: "#FCFCFA" },
  { id: "archive", label: "Archivé", labelEn: "Archived", bg: "#E8E8E6", fg: "#5C6B66" },
];
const ETAPES_SUIVI = ["nouveau", "en_cours", "mis_en_relation", "conclu"];

const STORAGE_KEY = "depots-comptoir";

/* ==========================================================================
   LANGUE (FR / EN) — pages publiques ; l'admin et les pages légales restent en français
   ========================================================================== */
const LangContext = createContext("fr");
function useL() {
  const lang = useContext(LangContext);
  return (fr, en) => (lang === "en" ? en : fr);
}
function libelleCat(c, lang) {
  return lang === "en" ? c.labelEn : c.label;
}

/* ==========================================================================
   STOCKAGE PARTAGÉ
   ========================================================================== */
async function chargerDepots() {
  try {
    const res = await window.storage.get(STORAGE_KEY, true);
    return res ? JSON.parse(res.value) : [];
  } catch {
    return [];
  }
}
async function sauverDepots(depots) {
  try {
    await window.storage.set(STORAGE_KEY, JSON.stringify(depots), true);
    return true;
  } catch {
    return false;
  }
}
async function sauverPhotos(id, photos) {
  try {
    await window.storage.set(`photos-${id}`, JSON.stringify(photos), true);
  } catch { /* non bloquant */ }
}
async function chargerPhotos(id) {
  try {
    const res = await window.storage.get(`photos-${id}`, true);
    return res ? JSON.parse(res.value) : [];
  } catch {
    return [];
  }
}
function genererRef() {
  const annee = new Date().getFullYear();
  const code = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `REF-${annee}-${code}`;
}

/* ==========================================================================
   OUTILS : commission, montants, matching, photos, e-mail
   ========================================================================== */
const fmtEUR = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

function calculerCommission(categorieId, montant) {
  const bar = BAREME[categorieId] || BAREME.autre;
  let restant = montant;
  let plancher = 0;
  const lignes = [];
  for (const t of bar.tranches) {
    if (restant <= 0) break;
    const largeur = Math.min(restant, t.jusqua - plancher);
    if (largeur > 0) {
      lignes.push({
        de: plancher,
        a: Math.min(montant, t.jusqua),
        taux: t.taux,
        montant: (largeur * t.taux) / 100,
      });
      restant -= largeur;
      plancher = t.jusqua;
    }
  }
  let total = lignes.reduce((s, l) => s + l.montant, 0);
  const minimumApplique = total < bar.minimum;
  if (minimumApplique) total = bar.minimum;
  return { lignes, total, minimumApplique, minimum: bar.minimum, base: bar.base };
}

// Extrait les montants d'un texte libre ("15 000 – 18 000 €", "20k€"…)
function extraireMontants(texte) {
  if (!texte) return [];
  const t = texte.toLowerCase().replace(/\s/g, "").replace(/(\d+(?:[.,]\d+)?)k/g, (_, n) => String(parseFloat(n.replace(",", ".")) * 1000));
  const m = t.match(/\d{3,}(?:[.,]\d+)?/g);
  return m ? m.map((x) => parseFloat(x.replace(",", "."))).filter((x) => x >= 100) : [];
}

const STOPWORDS = new Set(["les", "des", "une", "pour", "avec", "dans", "sur", "par", "est", "etat", "tres", "tout", "tous", "plus", "que", "qui", "son", "ses", "leur", "aux", "ans", "annee", "etc", "bien", "bon", "bonne", "recherche", "propose", "vends", "vendre", "achat", "acheter", "cherche", "prix", "euros", "euro", "the", "and", "for", "with"]);
function tokeniser(texte) {
  return (texte || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((m) => m.length >= 3 && !STOPWORDS.has(m) && !/^\d+$/.test(m));
}

// Rapproche recherches et propositions d'une même catégorie
function calculerRapprochements(depots) {
  const actifs = depots.filter((d) => d.statut !== "archive" && d.statut !== "conclu");
  const recherches = actifs.filter((d) => d.type === "recherche");
  const propositions = actifs.filter((d) => d.type === "proposition");
  const paires = [];
  for (const r of recherches) {
    const motsR = new Set(tokeniser(r.titre + " " + r.description));
    const prixR = extraireMontants(r.budget);
    for (const p of propositions) {
      if (p.categorie !== r.categorie) continue;
      const motsP = tokeniser(p.titre + " " + p.description);
      const communs = [...new Set(motsP.filter((m) => motsR.has(m)))];
      let score = communs.length * 2;
      const prixP = extraireMontants(p.budget);
      let prixOk = null;
      if (prixR.length && prixP.length) {
        const okHaut = Math.min(...prixP) <= Math.max(...prixR) * 1.15;
        const okBas = Math.max(...prixP) >= Math.min(...prixR) * 0.5;
        prixOk = okHaut && okBas;
        score += prixOk ? 3 : -2;
      }
      // Réponse directe à une recherche publiée : bonus fort
      if (p.enReponseA && p.enReponseA === r.ref) score += 6;
      if (score >= 3) paires.push({ recherche: r, proposition: p, score, communs, prixOk });
    }
  }
  return paires.sort((a, b) => b.score - a.score);
}

// Compresse une image en dataURL JPEG (max 900 px, ~80 Ko)
function compresserImage(fichier) {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader();
    lecteur.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX = 900;
        const ratio = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = () => reject(new Error("Image illisible"));
      img.src = lecteur.result;
    };
    lecteur.onerror = () => reject(new Error("Lecture impossible"));
    lecteur.readAsDataURL(fichier);
  });
}

// Envoi d'e-mail générique (EmailJS) — silencieux si non configuré ou en échec
async function envoyerEmail(params) {
  if (!EMAILJS.serviceId || !EMAILJS.templateId || !EMAILJS.publicKey) return;
  try {
    await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAILJS.serviceId,
        template_id: EMAILJS.templateId,
        user_id: EMAILJS.publicKey,
        template_params: params,
      }),
    });
  } catch { /* ne bloque jamais le dépôt */ }
}

function notifierNouveauDepot(depot) {
  envoyerEmail({
    objet: `Nouveau dépôt — ${depot.ref}`,
    ref: depot.ref,
    type: depot.type,
    categorie: depot.categorie,
    titre: depot.titre,
    nom: depot.nom,
    email: depot.email,
    telephone: depot.telephone,
    details: `${depot.description}\nBudget : ${depot.budget || "—"} · ${depot.localisation || "—"}`,
  });
}

function notifierRapprochement(paire) {
  envoyerEmail({
    objet: `⚡ Rapprochement détecté (score ${paire.score})`,
    ref: `${paire.recherche.ref} ↔ ${paire.proposition.ref}`,
    type: "rapprochement",
    categorie: paire.recherche.categorie,
    titre: `${paire.recherche.titre} ↔ ${paire.proposition.titre}`,
    nom: `${paire.recherche.nom} / ${paire.proposition.nom}`,
    email: "",
    telephone: "",
    details: `Mots-clés communs : ${paire.communs.join(", ") || "—"}. Prix ${paire.prixOk === true ? "compatibles" : paire.prixOk === false ? "à vérifier" : "non renseignés"}.`,
  });
}

/* ==========================================================================
   PETITS COMPOSANTS
   ========================================================================== */
function Etiquette({ children }) {
  return (
    <div style={{ color: COLORS.laiton, letterSpacing: "0.18em", fontSize: 11, fontWeight: 600, textTransform: "uppercase", fontFamily: "'Archivo', sans-serif" }}>
      {children}
    </div>
  );
}

function Champ({ label, children, optionnel }) {
  const L = useL();
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline gap-2">
        <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.encre }}>{label}</span>
        {optionnel && <span style={{ fontSize: 11, color: COLORS.ardoise }}>{L("(facultatif)", "(optional)")}</span>}
      </div>
      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: `1px solid ${COLORS.ligne}`,
  borderRadius: 6,
  background: "#FFFFFF",
  color: COLORS.encre,
  fontSize: 14,
  fontFamily: "'Archivo', sans-serif",
  outline: "none",
};

function BoutonPrincipal({ children, onClick, disabled, icone: Icone }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2"
      style={{
        background: disabled ? COLORS.ardoise : COLORS.encre,
        color: "#FCFCFA", padding: "12px 22px", borderRadius: 6, fontSize: 14, fontWeight: 600,
        opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer", border: "none",
        fontFamily: "'Archivo', sans-serif",
      }}
    >
      {children}
      {Icone && <Icone size={16} />}
    </button>
  );
}

function BoutonSecondaire({ children, onClick, icone: Icone }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2"
      style={{
        background: "transparent", color: COLORS.encre, padding: "12px 18px", borderRadius: 6,
        fontSize: 14, fontWeight: 600, border: `1px solid ${COLORS.ligne}`, cursor: "pointer",
        fontFamily: "'Archivo', sans-serif",
      }}
    >
      {Icone && <Icone size={16} />}
      {children}
    </button>
  );
}

function PastilleType({ type }) {
  const L = useL();
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 12,
      textTransform: "uppercase", letterSpacing: "0.05em",
      background: type === "recherche" ? COLORS.vertClair : COLORS.laitonClair,
      color: type === "recherche" ? COLORS.vert : "#8A6A33",
    }}>
      {type === "recherche" ? L("Recherche", "Wanted") : L("Proposition", "Offer")}
    </span>
  );
}

/* ==========================================================================
   SIMULATEUR DE COMMISSION
   ========================================================================== */
function Simulateur({ retour }) {
  const L = useL();
  const lang = useContext(LangContext);
  const [categorie, setCategorie] = useState("automobile");
  const [montantTexte, setMontantTexte] = useState("");
  const montant = useMemo(() => {
    const v = extraireMontants(montantTexte);
    return v.length ? Math.max(...v) : 0;
  }, [montantTexte]);
  const devis = useMemo(() => (montant > 0 ? calculerCommission(categorie, montant) : null), [categorie, montant]);
  const cat = CATEGORIES.find((c) => c.id === categorie);

  return (
    <div className="px-4 py-10 md:py-14">
      <div className="mx-auto" style={{ maxWidth: 680 }}>
        <div style={{ background: COLORS.carte, border: `1px solid ${COLORS.ligne}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 30px rgba(20,53,43,0.07)" }}>
          <div className="px-6 py-4" style={{ borderBottom: `1px dashed ${COLORS.laiton}` }}>
            <div className="flex items-center gap-2">
              <Calculator size={18} color={COLORS.laiton} />
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, color: COLORS.encre }}>
                {L("Simulateur de commission", "Commission simulator")}
              </div>
            </div>
            <div style={{ fontSize: 12, color: COLORS.ardoise }}>
              {L("Devis indicatif et gratuit — vous ne payez que si l'affaire aboutit.", "Free indicative quote — you only pay if the deal closes.")}
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <Champ label={L("Catégorie", "Category")}>
                <select style={inputStyle} value={categorie} onChange={(e) => setCategorie(e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{libelleCat(c, lang)}</option>)}
                </select>
              </Champ>
              <Champ label={L("Montant estimé de la transaction", "Estimated transaction amount")}>
                <input style={inputStyle} value={montantTexte} onChange={(e) => setMontantTexte(e.target.value)}
                  placeholder={L("Ex. : 35 000 €", "e.g. €35,000")} inputMode="numeric" />
              </Champ>
            </div>

            {devis && (
              <div className="mt-6">
                <div style={{ fontSize: 12.5, color: COLORS.ardoise, marginBottom: 8 }}>
                  {L("Calcul", "Calculation")} ({devis.base}) {L("pour", "for")} {fmtEUR(montant)} :
                </div>
                <div style={{ border: `1px solid ${COLORS.ligne}`, borderRadius: 8, overflow: "hidden" }}>
                  {devis.lignes.map((l, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2" style={{ borderBottom: `1px solid ${COLORS.ligne}`, fontSize: 13.5, background: i % 2 ? "#F7F8F6" : "#FFFFFF" }}>
                      <span style={{ color: COLORS.encre }}>
                        {L("Tranche", "Bracket")} {fmtEUR(l.de)} → {fmtEUR(l.a)} <span style={{ color: COLORS.ardoise }}>· {l.taux} %</span>
                      </span>
                      <span style={{ fontWeight: 600, color: COLORS.encre }}>{fmtEUR(l.montant)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-4 py-3" style={{ background: COLORS.encre }}>
                    <span style={{ color: "#B9C6BF", fontSize: 13 }}>
                      {L("Commission estimée", "Estimated commission")} {devis.minimumApplique && <em>{L("(minimum forfaitaire appliqué)", "(flat minimum applied)")}</em>}
                    </span>
                    <span style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: COLORS.laiton }}>{fmtEUR(devis.total)}</span>
                  </div>
                </div>
                <p className="mt-3" style={{ fontSize: 12, color: COLORS.ardoise, lineHeight: 1.5 }}>
                  {L(
                    `Estimation indicative, hors taxes, pour la catégorie « ${cat ? cat.label : ""} ». Le montant définitif est fixé d'un commun accord dans le mandat d'apport d'affaires, et n'est dû qu'en cas de mise en relation aboutie. Minimum forfaitaire : ${fmtEUR(devis.minimum)}.`,
                    `Indicative estimate, excluding tax, for the “${cat ? cat.labelEn : ""}” category. The final amount is agreed in the business-introduction mandate and is only due if the introduction leads to a closed deal. Flat minimum: ${fmtEUR(devis.minimum)}.`
                  )}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 no-print">
                  <BoutonSecondaire onClick={() => window.print()} icone={Printer}>
                    {L("Imprimer / enregistrer le devis (PDF)", "Print / save the quote (PDF)")}
                  </BoutonSecondaire>
                </div>
              </div>
            )}
            {!devis && (
              <p className="mt-5" style={{ fontSize: 13, color: COLORS.ardoise }}>
                {L("Indiquez un montant pour voir le détail du calcul, tranche par tranche.", "Enter an amount to see the bracket-by-bracket calculation.")}
              </p>
            )}
          </div>
        </div>
        <div className="mt-5 no-print">
          <BoutonSecondaire onClick={retour} icone={ArrowLeft}>{L("Retour à l'accueil", "Back to home")}</BoutonSecondaire>
        </div>

        {/* Version imprimable du devis */}
        {devis && (
          <div className="print-only" style={{ fontFamily: "'Archivo', sans-serif", color: "#111" }}>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24 }}>{NOM_ACTIVITE}</h1>
            <p style={{ fontSize: 12 }}>{SOUS_TITRE} — Devis indicatif de commission</p>
            <hr />
            <p style={{ fontSize: 13 }}>Date : {new Date().toLocaleDateString("fr-FR")}</p>
            <p style={{ fontSize: 13 }}>Catégorie : {cat ? cat.label : ""} · Montant de la transaction : {fmtEUR(montant)}</p>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 10 }}>
              <tbody>
                {devis.lignes.map((l, i) => (
                  <tr key={i}>
                    <td style={{ border: "1px solid #999", padding: 6 }}>Tranche {fmtEUR(l.de)} → {fmtEUR(l.a)} ({l.taux} %)</td>
                    <td style={{ border: "1px solid #999", padding: 6, textAlign: "right" }}>{fmtEUR(l.montant)}</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ border: "1px solid #999", padding: 6, fontWeight: 700 }}>Commission estimée (HT)</td>
                  <td style={{ border: "1px solid #999", padding: 6, textAlign: "right", fontWeight: 700 }}>{fmtEUR(devis.total)}</td>
                </tr>
              </tbody>
            </table>
            <p style={{ fontSize: 11, marginTop: 10 }}>
              Estimation indicative, hors taxes, non contractuelle. La commission définitive est fixée dans le
              mandat d'apport d'affaires et n'est due qu'en cas d'affaire aboutie.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   SUIVI PAR RÉFÉRENCE
   ========================================================================== */
function Suivi({ retour }) {
  const L = useL();
  const lang = useContext(LangContext);
  const [ref, setRef] = useState("");
  const [resultat, setResultat] = useState(null);
  const [chargement, setChargement] = useState(false);

  const chercher = async () => {
    const q = ref.trim().toUpperCase();
    if (!q) return;
    setChargement(true);
    const depots = await chargerDepots();
    const d = depots.find((x) => x.ref.toUpperCase() === q);
    setResultat(d || "introuvable");
    setChargement(false);
  };

  const indexStatut = resultat && resultat !== "introuvable" ? ETAPES_SUIVI.indexOf(resultat.statut) : -1;

  return (
    <div className="px-4 py-10 md:py-14">
      <div className="mx-auto" style={{ maxWidth: 560 }}>
        <div style={{ background: COLORS.carte, border: `1px solid ${COLORS.ligne}`, borderRadius: 12, padding: 28 }}>
          <div className="flex items-center gap-2">
            <Link2 size={18} color={COLORS.laiton} />
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: COLORS.encre, fontWeight: 600 }}>
              {L("Suivre mon dossier", "Track my file")}
            </h2>
          </div>
          <p className="mt-1" style={{ fontSize: 13, color: COLORS.ardoise }}>
            {L("Entrez la référence reçue lors de votre dépôt (ex. REF-2026-A4KX).", "Enter the reference you received when submitting (e.g. REF-2026-A4KX).")}
          </p>
          <div className="mt-4 flex gap-2">
            <input style={inputStyle} value={ref} onChange={(e) => { setRef(e.target.value); setResultat(null); }}
              onKeyDown={(e) => e.key === "Enter" && chercher()} placeholder="REF-2026-…" />
            <BoutonPrincipal onClick={chercher} icone={Search}>{chargement ? "…" : L("Voir", "View")}</BoutonPrincipal>
          </div>

          {resultat === "introuvable" && (
            <p className="mt-4" style={{ fontSize: 13, color: COLORS.rouge }}>
              {L("Aucun dossier ne correspond à cette référence. Vérifiez l'orthographe exacte.", "No file matches this reference. Check the exact spelling.")}
            </p>
          )}

          {resultat && resultat !== "introuvable" && (
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, color: COLORS.laiton }}>{resultat.ref}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.encre }}>{resultat.titre}</div>
                  <div style={{ fontSize: 12, color: COLORS.ardoise }}>
                    {L("Déposé le", "Submitted on")} {new Date(resultat.date).toLocaleDateString(lang === "en" ? "en-GB" : "fr-FR")}
                  </div>
                </div>
                <PastilleType type={resultat.type} />
              </div>

              {resultat.statut === "archive" ? (
                <p className="mt-5" style={{ fontSize: 13.5, color: COLORS.ardoise }}>
                  {L("Ce dossier est clôturé. Contactez-moi si vous souhaitez le réactiver.", "This file is closed. Contact me if you wish to reopen it.")}
                </p>
              ) : (
                <div className="mt-6 space-y-0">
                  {ETAPES_SUIVI.map((s, i) => {
                    const st = STATUTS.find((x) => x.id === s);
                    const atteint = i <= indexStatut;
                    const actuel = i === indexStatut;
                    return (
                      <div key={s} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="flex items-center justify-center" style={{
                            width: 26, height: 26, borderRadius: "50%",
                            background: atteint ? COLORS.encre : "#E4E7E4",
                            color: atteint ? "#FCFCFA" : COLORS.ardoise,
                            border: actuel ? `2px solid ${COLORS.laiton}` : "none",
                          }}>
                            {atteint ? <Check size={13} /> : <span style={{ fontSize: 11, fontWeight: 700 }}>{i + 1}</span>}
                          </div>
                          {i < ETAPES_SUIVI.length - 1 && (
                            <div style={{ width: 2, height: 26, background: i < indexStatut ? COLORS.encre : "#E4E7E4" }} />
                          )}
                        </div>
                        <div style={{ paddingTop: 3 }}>
                          <div style={{ fontSize: 14, fontWeight: actuel ? 700 : 500, color: atteint ? COLORS.encre : COLORS.ardoise }}>
                            {lang === "en" ? st.labelEn : st.label}
                          </div>
                          {actuel && (
                            <div style={{ fontSize: 12, color: COLORS.ardoise }}>
                              {s === "nouveau" && L("Votre dépôt a bien été reçu, il sera étudié sous 48 h ouvrées.", "Your submission has been received and will be reviewed within 2 working days.")}
                              {s === "en_cours" && L("Je prospecte activement pour trouver la bonne contrepartie.", "I am actively searching for the right counterpart.")}
                              {s === "mis_en_relation" && L("Une contrepartie a été identifiée, la mise en relation est faite.", "A counterpart has been identified and the introduction has been made.")}
                              {s === "conclu" && L("Affaire conclue — merci de votre confiance !", "Deal closed — thank you for your trust!")}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="mt-5">
          <BoutonSecondaire onClick={retour} icone={ArrowLeft}>{L("Retour à l'accueil", "Back to home")}</BoutonSecondaire>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   RECHERCHES EN COURS (page publique, anonymisée)
   ========================================================================== */
function RecherchesEnCours({ retour, repondre }) {
  const L = useL();
  const lang = useContext(LangContext);
  const [recherches, setRecherches] = useState(null);

  useEffect(() => {
    (async () => {
      const depots = await chargerDepots();
      setRecherches(
        depots.filter((d) => d.type === "recherche" && d.publierRecherche && (d.statut === "nouveau" || d.statut === "en_cours"))
      );
    })();
  }, []);

  return (
    <div className="px-4 py-10 md:py-14">
      <div className="mx-auto" style={{ maxWidth: 880 }}>
        <Etiquette>{L("Recherches en cours", "Active searches")}</Etiquette>
        <h2 className="mt-2" style={{ fontFamily: "'Fraunces', serif", fontSize: 30, color: COLORS.encre, fontWeight: 600 }}>
          {L("Vous possédez peut-être ce que quelqu'un cherche", "You may own what someone is looking for")}
        </h2>
        <p className="mt-2" style={{ fontSize: 14.5, color: COLORS.ardoise, maxWidth: 620, lineHeight: 1.6 }}>
          {L(
            "Voici, de façon anonyme, les recherches actives de mes clients. Si vous détenez le bien ou la solution, répondez : je vous mets en relation.",
            "Here, anonymously, are my clients' active searches. If you own the item or the solution, respond and I will make the introduction."
          )}
        </p>

        {recherches === null && <p className="mt-8" style={{ color: COLORS.ardoise, fontSize: 14 }}>{L("Chargement…", "Loading…")}</p>}
        {recherches && recherches.length === 0 && (
          <div className="mt-8" style={{ padding: "40px 0", color: COLORS.ardoise, fontSize: 14 }}>
            {L("Aucune recherche publiée pour le moment. Revenez bientôt, ou déposez la vôtre !", "No published searches right now. Come back soon, or submit your own!")}
          </div>
        )}

        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {recherches && recherches.map((r) => {
            const cat = CATEGORIES.find((c) => c.id === r.categorie);
            return (
              <div key={r.id} style={{ background: COLORS.carte, border: `1px solid ${COLORS.ligne}`, borderRadius: 10, padding: 18 }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2" style={{ fontSize: 12.5, fontWeight: 700, color: COLORS.encre }}>
                    {cat && <cat.icon size={15} color={COLORS.laiton} />} {cat ? libelleCat(cat, lang) : ""}
                  </span>
                  <span style={{ fontFamily: "'Fraunces', serif", fontSize: 12.5, fontWeight: 700, color: COLORS.laiton }}>{r.ref}</span>
                </div>
                <div className="mt-2" style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, color: COLORS.encre }}>{r.titre}</div>
                <div className="mt-1" style={{ fontSize: 13, color: COLORS.ardoise }}>
                  {[r.budget && `${L("Budget", "Budget")} : ${r.budget}`, r.localisation, r.delai].filter(Boolean).join(" · ")}
                </div>
                <div className="mt-4">
                  <BoutonPrincipal onClick={() => repondre(r)} icone={ArrowRight}>
                    {L("Je peux proposer cela", "I can offer this")}
                  </BoutonPrincipal>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8">
          <BoutonSecondaire onClick={retour} icone={ArrowLeft}>{L("Retour à l'accueil", "Back to home")}</BoutonSecondaire>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   PAGE D'ACCUEIL
   ========================================================================== */
function Accueil({ ouvrirDepot, allerSimulateur, allerSuivi, allerRecherches }) {
  const L = useL();
  const lang = useContext(LangContext);
  const [references, setReferences] = useState([]);
  const [nbRecherchesPubliees, setNbRecherchesPubliees] = useState(0);

  useEffect(() => {
    (async () => {
      const depots = await chargerDepots();
      setReferences(depots.filter((d) => d.temoignage && d.statut === "conclu").slice(0, 6));
      setNbRecherchesPubliees(depots.filter((d) => d.type === "recherche" && d.publierRecherche && (d.statut === "nouveau" || d.statut === "en_cours")).length);
    })();
  }, []);

  return (
    <div>
      {/* Héro */}
      <section className="px-6 pt-16 pb-12 md:pt-24 md:pb-16">
        <div className="mx-auto" style={{ maxWidth: 980 }}>
          <Etiquette>{L("Mise en relation confidentielle", "Confidential introductions")}</Etiquette>
          <h1 className="mt-4" style={{
            fontFamily: "'Fraunces', serif", fontSize: "clamp(34px, 5.5vw, 58px)",
            lineHeight: 1.08, color: COLORS.encre, fontWeight: 600, maxWidth: 720,
          }}>
            {L("Vous cherchez. Vous proposez.", "You search. You offer.")}{" "}
            <em style={{ color: COLORS.laiton, fontStyle: "italic" }}>{L("Je mets en relation.", "I make the introduction.")}</em>
          </h1>
          <p className="mt-5" style={{ color: COLORS.ardoise, fontSize: 17, lineHeight: 1.6, maxWidth: 620 }}>
            {L(
              "Entreprises et particuliers : déposez votre recherche ou votre proposition — bien d'exception, service, client, talent. Je m'occupe de trouver la bonne contrepartie, en toute discrétion.",
              "Businesses and individuals: submit your search or your offer — exceptional items, services, clients, talent. I find the right counterpart, with full discretion."
            )}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <BoutonPrincipal onClick={() => ouvrirDepot("recherche")} icone={ArrowRight}>{L("Déposer une recherche", "Submit a search")}</BoutonPrincipal>
            <BoutonSecondaire onClick={() => ouvrirDepot("proposition")} icone={ArrowRight}>{L("Déposer une proposition", "Submit an offer")}</BoutonSecondaire>
            <BoutonSecondaire onClick={allerSimulateur} icone={Calculator}>{L("Simuler ma commission", "Simulate my commission")}</BoutonSecondaire>
            {CALENDLY_URL && (
              <BoutonSecondaire onClick={() => window.open(CALENDLY_URL, "_blank")} icone={CalendarDays}>
                {L("Réserver un appel", "Book a call")}
              </BoutonSecondaire>
            )}
          </div>
        </div>
      </section>

      {/* Bandeau recherches en cours */}
      {nbRecherchesPubliees > 0 && (
        <section className="px-6 pb-2">
          <div className="mx-auto" style={{ maxWidth: 980 }}>
            <button onClick={allerRecherches} className="flex w-full flex-wrap items-center gap-3 text-left" style={{
              background: COLORS.laitonClair, border: `1px solid ${COLORS.laiton}`, borderRadius: 10, padding: "14px 18px", cursor: "pointer",
            }}>
              <Megaphone size={18} color={COLORS.laiton} />
              <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.encre }}>
                {nbRecherchesPubliees} {L(`recherche${nbRecherchesPubliees > 1 ? "s" : ""} active${nbRecherchesPubliees > 1 ? "s" : ""} en ce moment`, `active search${nbRecherchesPubliees > 1 ? "es" : ""} right now`)}
              </span>
              <span style={{ fontSize: 13, color: COLORS.ardoise }}>
                {L("— vous détenez peut-être ce que quelqu'un cherche.", "— you may own what someone is looking for.")}
              </span>
              <ArrowRight size={16} color={COLORS.encre} style={{ marginLeft: "auto" }} />
            </button>
          </div>
        </section>
      )}

      {/* Comment ça marche */}
      <section className="mt-10 px-6 py-12" style={{ background: COLORS.encre }}>
        <div className="mx-auto" style={{ maxWidth: 980 }}>
          <Etiquette>{L("Comment ça marche", "How it works")}</Etiquette>
          <div className="mt-6 grid gap-8 md:grid-cols-3">
            {[
              { icone: FileText, titre: L("Vous déposez", "You submit"), texte: L("Recherche ou proposition : décrivez votre besoin, vos conditions et vos coordonnées en quelques minutes. Photos bienvenues.", "Search or offer: describe your need, your terms and your contact details in minutes. Photos welcome.") },
              { icone: Search, titre: L("Je prospecte", "I prospect"), texte: L("J'active mon réseau et mes outils pour identifier la contrepartie idéale, sans rien publier publiquement.", "I activate my network and tools to identify the ideal counterpart, without publishing anything publicly.") },
              { icone: Handshake, titre: L("Je vous mets en relation", "I introduce you"), texte: L("Une fois la correspondance trouvée, je vous présente l'un à l'autre. Vous suivez votre dossier en ligne avec votre référence.", "Once the match is found, I introduce you to each other. You track your file online with your reference.") },
            ].map((e, i) => (
              <div key={i}>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center" style={{ width: 38, height: 38, borderRadius: "50%", border: `1px solid ${COLORS.laiton}` }}>
                    <e.icone size={17} color={COLORS.laiton} />
                  </div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, color: "#FCFCFA", fontWeight: 600 }}>{e.titre}</div>
                </div>
                <p className="mt-3" style={{ color: "#B9C6BF", fontSize: 14, lineHeight: 1.6 }}>{e.texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Catégories */}
      <section className="px-6 py-14">
        <div className="mx-auto" style={{ maxWidth: 980 }}>
          <Etiquette>{L("Domaines d'intervention", "Areas of expertise")}</Etiquette>
          <h2 className="mt-3" style={{ fontFamily: "'Fraunces', serif", fontSize: 30, color: COLORS.encre, fontWeight: 600 }}>
            {L("Du bien d'exception au besoin d'entreprise", "From exceptional items to business needs")}
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.filter((c) => c.id !== "autre").map((c) => (
              <button key={c.id} onClick={() => ouvrirDepot(null, c.id)} className="text-left"
                style={{ background: COLORS.carte, border: `1px solid ${COLORS.ligne}`, borderRadius: 10, padding: 20, cursor: "pointer" }}>
                <c.icon size={22} color={COLORS.laiton} />
                <div className="mt-3" style={{ fontFamily: "'Fraunces', serif", fontSize: 18, color: COLORS.encre, fontWeight: 600 }}>{libelleCat(c, lang)}</div>
                <div className="mt-1" style={{ fontSize: 13, color: COLORS.ardoise }}>{lang === "en" ? c.descEn : c.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Références conclues (anonymisées) */}
      {references.length > 0 && (
        <section className="px-6 pb-14">
          <div className="mx-auto" style={{ maxWidth: 980 }}>
            <Etiquette>{L("Mises en relation conclues", "Closed introductions")}</Etiquette>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {references.map((r) => {
                const cat = CATEGORIES.find((c) => c.id === r.categorie);
                const jours = r.dateConclusion
                  ? Math.max(1, Math.round((new Date(r.dateConclusion) - new Date(r.date)) / 86400000))
                  : null;
                return (
                  <div key={r.id} className="flex items-start gap-3" style={{ background: COLORS.carte, border: `1px solid ${COLORS.ligne}`, borderRadius: 10, padding: 16 }}>
                    <BadgeCheck size={18} color={COLORS.laiton} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.encre }}>
                        {r.type === "recherche" ? L("Recherche aboutie", "Search fulfilled") : L("Vente conclue", "Sale closed")} · {cat ? libelleCat(cat, lang) : ""}
                      </div>
                      <div style={{ fontSize: 12.5, color: COLORS.ardoise }}>
                        {r.localisation || "France"}{jours ? ` · ${L(`conclue en ${jours} jour${jours > 1 ? "s" : ""}`, `closed in ${jours} day${jours > 1 ? "s" : ""}`)}` : ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-3" style={{ fontSize: 12, color: COLORS.ardoise }}>
              {L("Références publiées avec l'accord des parties, sans aucune donnée nominative.", "References published with the parties' consent, with no personal data.")}
            </p>
          </div>
        </section>
      )}

      {/* Engagements + suivi */}
      <section className="px-6 pb-16">
        <div className="mx-auto grid gap-4 md:grid-cols-3" style={{ maxWidth: 980 }}>
          {[
            { t: L("Confidentialité", "Confidentiality"), d: L("Vos coordonnées ne sont jamais publiées. Elles servent uniquement à vous recontacter.", "Your contact details are never published. They are only used to get back to you.") },
            { t: L("Sans engagement", "No commitment"), d: L("Le dépôt est gratuit. Ma rémunération n'intervient qu'en cas de mise en relation aboutie — simulez-la en amont.", "Submitting is free. I am only paid if the introduction succeeds — simulate it upfront.") },
            { t: L("Suivi transparent", "Transparent tracking"), d: L("Chaque dépôt reçoit une référence : suivez l'avancement de votre dossier en ligne à tout moment.", "Each submission receives a reference: track your file's progress online at any time.") },
          ].map((e, i) => (
            <div key={i} style={{ borderTop: `2px solid ${COLORS.laiton}`, paddingTop: 14 }}>
              <div style={{ fontWeight: 700, color: COLORS.encre, fontSize: 15 }}>{e.t}</div>
              <p className="mt-1" style={{ fontSize: 13, color: COLORS.ardoise, lineHeight: 1.6 }}>{e.d}</p>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-8" style={{ maxWidth: 980 }}>
          <button onClick={allerSuivi} className="inline-flex items-center gap-2" style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.vert, fontSize: 14, fontWeight: 600, textDecoration: "underline" }}>
            <Link2 size={15} /> {L("Vous avez déjà déposé ? Suivez votre dossier avec votre référence", "Already submitted? Track your file with your reference")}
          </button>
        </div>
      </section>
    </div>
  );
}

/* ==========================================================================
   FORMULAIRE DE DÉPÔT (le "bordereau")
   ========================================================================== */
const FORM_VIDE = {
  type: "", profil: "", categorie: "", titre: "", description: "",
  budget: "", localisation: "", delai: "", conditions: "",
  nom: "", societe: "", email: "", telephone: "", reseaux: "",
  preferenceContact: "email", consentement: false,
};

function Depot({ preType, preCategorie, enReponseA, onTermine, onAnnuler }) {
  const L = useL();
  const lang = useContext(LangContext);
  const [etape, setEtape] = useState(0);
  const [f, setF] = useState({ ...FORM_VIDE, type: preType || "", categorie: preCategorie || "" });
  const [photos, setPhotos] = useState([]);
  const [erreurPhoto, setErreurPhoto] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  const inputPhoto = useRef(null);

  const maj = (champ, valeur) => setF((p) => ({ ...p, [champ]: valeur }));
  const etapes = [L("Type", "Type"), L("Catégorie", "Category"), L("Détails", "Details"), L("Contact", "Contact"), L("Récapitulatif", "Summary")];

  const ajouterPhotos = async (fichiers) => {
    setErreurPhoto("");
    const restants = 3 - photos.length;
    const liste = Array.from(fichiers).slice(0, restants);
    if (Array.from(fichiers).length > restants) setErreurPhoto(L("3 photos maximum.", "Maximum 3 photos."));
    for (const fichier of liste) {
      if (!fichier.type.startsWith("image/")) continue;
      try {
        const data = await compresserImage(fichier);
        setPhotos((p) => [...p, data]);
      } catch {
        setErreurPhoto(L("Une photo n'a pas pu être lue.", "One photo could not be read."));
      }
    }
    if (inputPhoto.current) inputPhoto.current.value = "";
  };

  const peutContinuer = () => {
    if (etape === 0) return f.type && f.profil;
    if (etape === 1) return f.categorie;
    if (etape === 2) return f.titre.trim() && f.description.trim();
    if (etape === 3) {
      const emailOk = /\S+@\S+\.\S+/.test(f.email);
      return f.nom.trim() && (emailOk || f.telephone.trim().length >= 6);
    }
    if (etape === 4) return f.consentement;
    return true;
  };

  const envoyer = async () => {
    setEnvoiEnCours(true);
    setErreur("");
    const depot = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      ref: genererRef(),
      date: new Date().toISOString(),
      statut: "nouveau",
      noteAdmin: "",
      temoignage: false,
      publierRecherche: false,
      dateConclusion: null,
      nbPhotos: photos.length,
      enReponseA: enReponseA || null,
      ...f,
    };
    const existants = await chargerDepots();
    const ok = await sauverDepots([depot, ...existants]);
    if (ok && photos.length) await sauverPhotos(depot.id, photos);
    if (ok) {
      notifierNouveauDepot(depot);
      // Alerte automatique de rapprochement
      const paires = calculerRapprochements([depot, ...existants]).filter(
        (p) => (p.recherche.id === depot.id || p.proposition.id === depot.id) && p.score >= SEUIL_ALERTE_RAPPROCHEMENT
      );
      if (paires.length) notifierRapprochement(paires[0]);
    }
    setEnvoiEnCours(false);
    if (ok) onTermine(depot);
    else setErreur(L("L'enregistrement a échoué. Vérifiez votre connexion puis réessayez.", "Saving failed. Check your connection and try again."));
  };

  const cat = CATEGORIES.find((c) => c.id === f.categorie);

  const estimation = useMemo(() => {
    const montants = extraireMontants(f.budget);
    if (!montants.length || !f.categorie) return null;
    return { montant: Math.max(...montants), devis: calculerCommission(f.categorie, Math.max(...montants)) };
  }, [f.budget, f.categorie]);

  return (
    <div className="px-4 py-10 md:py-14">
      <div className="mx-auto" style={{ maxWidth: 720 }}>
        {/* Fil d'étapes */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {etapes.map((e, i) => (
            <div key={e} className="flex items-center gap-2">
              <div className="flex items-center justify-center" style={{
                width: 24, height: 24, borderRadius: "50%", fontSize: 12, fontWeight: 700,
                background: i < etape ? COLORS.encre : i === etape ? COLORS.laiton : "#E4E7E4",
                color: i <= etape ? "#FCFCFA" : COLORS.ardoise,
              }}>
                {i < etape ? <Check size={13} /> : i + 1}
              </div>
              <span style={{ fontSize: 12, color: i === etape ? COLORS.encre : COLORS.ardoise, fontWeight: i === etape ? 700 : 400 }}>{e}</span>
              {i < etapes.length - 1 && <div style={{ width: 16, height: 1, background: COLORS.ligne }} />}
            </div>
          ))}
        </div>

        {/* Bandeau "en réponse à une recherche" */}
        {enReponseA && (
          <div className="mb-4 flex items-center gap-2" style={{ background: COLORS.laitonClair, border: `1px solid ${COLORS.laiton}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: COLORS.encre }}>
            <Megaphone size={15} color={COLORS.laiton} />
            {L(`Vous répondez à la recherche ${enReponseA}.`, `You are responding to search ${enReponseA}.`)}
          </div>
        )}

        {/* Bordereau */}
        <div style={{ background: COLORS.carte, border: `1px solid ${COLORS.ligne}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 30px rgba(20,53,43,0.07)" }}>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px dashed ${COLORS.laiton}` }}>
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, color: COLORS.encre }}>{L("Bordereau de dépôt", "Submission form")}</div>
              <div style={{ fontSize: 12, color: COLORS.ardoise }}>{NOM_ACTIVITE} — {L("confidentiel", "confidential")}</div>
            </div>
            <button onClick={onAnnuler} style={{ color: COLORS.ardoise, cursor: "pointer", background: "none", border: "none" }} aria-label={L("Fermer", "Close")}>
              <X size={18} />
            </button>
          </div>

          <div className="p-6 md:p-8">
            {/* ÉTAPE 0 — Type & profil */}
            {etape === 0 && (
              <div className="space-y-7">
                <div>
                  <Etiquette>{L("Vous souhaitez…", "You would like to…")}</Etiquette>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {[
                      { id: "recherche", titre: L("Déposer une recherche", "Submit a search"), desc: L("Je cherche un bien, un service, un client ou un talent.", "I am looking for an item, a service, a client or talent."), icone: Search },
                      { id: "proposition", titre: L("Déposer une proposition", "Submit an offer"), desc: L("Je propose un bien, un service ou une opportunité.", "I am offering an item, a service or an opportunity."), icone: Handshake },
                    ].map((o) => (
                      <button key={o.id} onClick={() => maj("type", o.id)} className="text-left" style={{
                        padding: 16, borderRadius: 8, cursor: "pointer",
                        border: `2px solid ${f.type === o.id ? COLORS.encre : COLORS.ligne}`,
                        background: f.type === o.id ? COLORS.vertClair : "#FFFFFF",
                      }}>
                        <o.icone size={18} color={COLORS.laiton} />
                        <div className="mt-2" style={{ fontWeight: 700, fontSize: 14, color: COLORS.encre }}>{o.titre}</div>
                        <div style={{ fontSize: 12.5, color: COLORS.ardoise, marginTop: 2 }}>{o.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Etiquette>{L("Vous êtes…", "You are…")}</Etiquette>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {[
                      { id: "particulier", titre: L("Un particulier", "An individual") },
                      { id: "entreprise", titre: L("Une entreprise / un professionnel", "A business / professional") },
                    ].map((o) => (
                      <button key={o.id} onClick={() => maj("profil", o.id)} style={{
                        padding: "14px 16px", borderRadius: 8, cursor: "pointer", textAlign: "left",
                        fontWeight: 700, fontSize: 14, color: COLORS.encre,
                        border: `2px solid ${f.profil === o.id ? COLORS.encre : COLORS.ligne}`,
                        background: f.profil === o.id ? COLORS.vertClair : "#FFFFFF",
                      }}>
                        {o.titre}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ÉTAPE 1 — Catégorie */}
            {etape === 1 && (
              <div>
                <Etiquette>{L("Dans quel domaine ?", "In which area?")}</Etiquette>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {CATEGORIES.map((c) => (
                    <button key={c.id} onClick={() => maj("categorie", c.id)} className="flex items-start gap-3 text-left" style={{
                      padding: 14, borderRadius: 8, cursor: "pointer",
                      border: `2px solid ${f.categorie === c.id ? COLORS.encre : COLORS.ligne}`,
                      background: f.categorie === c.id ? COLORS.vertClair : "#FFFFFF",
                    }}>
                      <c.icon size={18} color={COLORS.laiton} style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.encre }}>{libelleCat(c, lang)}</div>
                        <div style={{ fontSize: 12, color: COLORS.ardoise }}>{lang === "en" ? c.descEn : c.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ÉTAPE 2 — Détails + photos */}
            {etape === 2 && (
              <div className="space-y-5">
                <Champ label={f.type === "recherche" ? L("Que recherchez-vous ? (titre court)", "What are you looking for? (short title)") : L("Que proposez-vous ? (titre court)", "What are you offering? (short title)")}>
                  <input style={inputStyle} value={f.titre} onChange={(e) => maj("titre", e.target.value)}
                    placeholder={f.type === "recherche" ? L("Ex. : Rolex Submariner 2018-2022, état neuf", "e.g. Rolex Submariner 2018-2022, mint condition") : L("Ex. : Porsche 911 (993) Carrera, 1995, 120 000 km", "e.g. Porsche 911 (993) Carrera, 1995, 120,000 km")}
                    maxLength={120} />
                </Champ>
                <Champ label={L("Description détaillée", "Detailed description")}>
                  <textarea style={{ ...inputStyle, minHeight: 120, resize: "vertical" }} value={f.description}
                    onChange={(e) => maj("description", e.target.value)}
                    placeholder={L("Caractéristiques, état, historique, exigences particulières… Plus c'est précis, plus la mise en relation est rapide.", "Specifications, condition, history, particular requirements… The more precise, the faster the introduction.")} />
                </Champ>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Champ label={f.type === "recherche" ? L("Budget envisagé", "Intended budget") : L("Prix souhaité", "Asking price")} optionnel>
                    <input style={inputStyle} value={f.budget} onChange={(e) => maj("budget", e.target.value)} placeholder={L("Ex. : 15 000 – 18 000 €", "e.g. €15,000 – €18,000")} />
                  </Champ>
                  <Champ label={L("Localisation", "Location")} optionnel>
                    <input style={inputStyle} value={f.localisation} onChange={(e) => maj("localisation", e.target.value)} placeholder={L("Ex. : Bretagne, France entière…", "e.g. Brittany, all of France…")} />
                  </Champ>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Champ label={L("Délai / échéance", "Timeframe / deadline")} optionnel>
                    <input style={inputStyle} value={f.delai} onChange={(e) => maj("delai", e.target.value)} placeholder={L("Ex. : sous 3 mois, pas pressé…", "e.g. within 3 months, no rush…")} />
                  </Champ>
                  <Champ label={L("Conditions particulières", "Special conditions")} optionnel>
                    <input style={inputStyle} value={f.conditions} onChange={(e) => maj("conditions", e.target.value)} placeholder={L("Ex. : facture, expertise, paiement comptant…", "e.g. invoice, appraisal, cash payment…")} />
                  </Champ>
                </div>

                {/* Photos */}
                <div>
                  <div className="mb-1 flex items-baseline gap-2">
                    <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.encre }}>{L("Photos (3 max)", "Photos (max 3)")}</span>
                    <span style={{ fontSize: 11, color: COLORS.ardoise }}>{L("(facultatif — recommandé pour les propositions)", "(optional — recommended for offers)")}</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {photos.map((p, i) => (
                      <div key={i} className="relative" style={{ width: 90, height: 90 }}>
                        <img src={p} alt={`Photo ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8, border: `1px solid ${COLORS.ligne}` }} />
                        <button onClick={() => setPhotos(photos.filter((_, j) => j !== i))} aria-label={L("Retirer la photo", "Remove photo")} style={{
                          position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%",
                          background: COLORS.encre, color: "#fff", border: "none", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                    {photos.length < 3 && (
                      <button onClick={() => inputPhoto.current && inputPhoto.current.click()} style={{
                        width: 90, height: 90, borderRadius: 8, border: `2px dashed ${COLORS.ligne}`,
                        background: "#FFFFFF", cursor: "pointer", color: COLORS.ardoise,
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 11,
                      }}>
                        <Camera size={18} /> {L("Ajouter", "Add")}
                      </button>
                    )}
                    <input ref={inputPhoto} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => ajouterPhotos(e.target.files)} />
                  </div>
                  {erreurPhoto && <p className="mt-1" style={{ fontSize: 12, color: COLORS.rouge }}>{erreurPhoto}</p>}
                  <p className="mt-1" style={{ fontSize: 11.5, color: COLORS.ardoise }}>
                    {L("Les photos sont compressées automatiquement et restent confidentielles.", "Photos are compressed automatically and remain confidential.")}
                  </p>
                </div>
              </div>
            )}

            {/* ÉTAPE 3 — Contact */}
            {etape === 3 && (
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Champ label={L("Nom / prénom", "Full name")}>
                    <input style={inputStyle} value={f.nom} onChange={(e) => maj("nom", e.target.value)} placeholder={L("Votre nom", "Your name")} />
                  </Champ>
                  {f.profil === "entreprise" && (
                    <Champ label={L("Société", "Company")} optionnel>
                      <input style={inputStyle} value={f.societe} onChange={(e) => maj("societe", e.target.value)} placeholder={L("Nom de l'entreprise", "Company name")} />
                    </Champ>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Champ label="E-mail">
                    <input style={inputStyle} type="email" value={f.email} onChange={(e) => maj("email", e.target.value)} placeholder={L("vous@exemple.fr", "you@example.com")} />
                  </Champ>
                  <Champ label={L("Téléphone", "Phone")}>
                    <input style={inputStyle} type="tel" value={f.telephone} onChange={(e) => maj("telephone", e.target.value)} placeholder="06 12 34 56 78" />
                  </Champ>
                </div>
                <Champ label={L("Réseaux sociaux / autre moyen de contact", "Social media / other contact method")} optionnel>
                  <input style={inputStyle} value={f.reseaux} onChange={(e) => maj("reseaux", e.target.value)} placeholder={L("LinkedIn, Instagram, WhatsApp…", "LinkedIn, Instagram, WhatsApp…")} />
                </Champ>
                <Champ label={L("Comment préférez-vous être contacté ?", "How would you prefer to be contacted?")}>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "email", label: "E-mail", icone: Mail },
                      { id: "telephone", label: L("Téléphone", "Phone"), icone: Phone },
                      { id: "reseaux", label: L("Réseaux sociaux", "Social media"), icone: AtSign },
                    ].map((o) => (
                      <button key={o.id} onClick={() => maj("preferenceContact", o.id)} className="inline-flex items-center gap-2" style={{
                        padding: "8px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer",
                        border: `1.5px solid ${f.preferenceContact === o.id ? COLORS.encre : COLORS.ligne}`,
                        background: f.preferenceContact === o.id ? COLORS.vertClair : "#FFFFFF",
                        color: COLORS.encre,
                      }}>
                        <o.icone size={14} /> {o.label}
                      </button>
                    ))}
                  </div>
                </Champ>
                <p style={{ fontSize: 12, color: COLORS.ardoise }}>{L("Indiquez au moins un e-mail valide ou un numéro de téléphone.", "Provide at least a valid e-mail or a phone number.")}</p>
              </div>
            )}

            {/* ÉTAPE 4 — Récapitulatif + estimation */}
            {etape === 4 && (
              <div>
                <Etiquette>{L("Vérifiez votre dépôt", "Review your submission")}</Etiquette>
                <div className="mt-4 space-y-3" style={{ fontSize: 14 }}>
                  {[
                    [L("Type", "Type"), f.type === "recherche" ? L("Recherche", "Search") : L("Proposition", "Offer")],
                    [L("Profil", "Profile"), f.profil === "particulier" ? L("Particulier", "Individual") : L("Entreprise", "Business")],
                    [L("Catégorie", "Category"), cat ? libelleCat(cat, lang) : ""],
                    [L("Titre", "Title"), f.titre],
                    [L("Description", "Description"), f.description],
                    [L("Budget / prix", "Budget / price"), f.budget],
                    [L("Localisation", "Location"), f.localisation],
                    [L("Délai", "Timeframe"), f.delai],
                    [L("Conditions", "Conditions"), f.conditions],
                    [L("Photos", "Photos"), photos.length ? L(`${photos.length} photo${photos.length > 1 ? "s" : ""} jointe${photos.length > 1 ? "s" : ""}`, `${photos.length} photo${photos.length > 1 ? "s" : ""} attached`) : ""],
                    [L("Contact", "Contact"), [f.nom, f.societe, f.email, f.telephone, f.reseaux].filter(Boolean).join(" · ")],
                  ]
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <div key={k} className="grid gap-1 sm:grid-cols-4">
                        <div style={{ color: COLORS.ardoise, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{k}</div>
                        <div className="sm:col-span-3" style={{ color: COLORS.encre, whiteSpace: "pre-wrap" }}>{v}</div>
                      </div>
                    ))}
                </div>

                {estimation && (
                  <div className="mt-5 flex items-start gap-3" style={{ background: COLORS.laitonClair, border: `1px solid ${COLORS.laiton}`, borderRadius: 8, padding: "12px 16px" }}>
                    <Calculator size={17} color={COLORS.laiton} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ fontSize: 13, color: COLORS.encre, lineHeight: 1.5 }}>
                      {L(
                        <><strong>Commission indicative si l'affaire aboutit :</strong> {fmtEUR(estimation.devis.total)} HT (sur une base de {fmtEUR(estimation.montant)}). Rien n'est dû tant que la mise en relation n'a pas abouti.</>,
                        <><strong>Indicative commission if the deal closes:</strong> {fmtEUR(estimation.devis.total)} excl. tax (based on {fmtEUR(estimation.montant)}). Nothing is due until the introduction succeeds.</>
                      )}
                    </div>
                  </div>
                )}

                <label className="mt-6 flex items-start gap-3" style={{ cursor: "pointer" }}>
                  <input type="checkbox" checked={f.consentement} onChange={(e) => maj("consentement", e.target.checked)} style={{ marginTop: 3, width: 16, height: 16 }} />
                  <span style={{ fontSize: 13, color: COLORS.ardoise, lineHeight: 1.5 }}>
                    {L(
                      "J'accepte que mes informations soient traitées dans le cadre de cette mise en relation, conformément à la politique de confidentialité. Elles ne seront ni publiées, ni transmises sans mon accord, et je peux en demander la suppression à tout moment.",
                      "I agree to my information being processed for this introduction, in accordance with the privacy policy. It will not be published or shared without my consent, and I may request its deletion at any time."
                    )}
                  </span>
                </label>
                {erreur && <p className="mt-3" style={{ color: COLORS.rouge, fontSize: 13 }}>{erreur}</p>}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: `1px solid ${COLORS.ligne}`, background: "#F7F8F6" }}>
            {etape > 0 ? (
              <BoutonSecondaire onClick={() => setEtape(etape - 1)} icone={ArrowLeft}>{L("Retour", "Back")}</BoutonSecondaire>
            ) : (
              <BoutonSecondaire onClick={onAnnuler}>{L("Annuler", "Cancel")}</BoutonSecondaire>
            )}
            {etape < 4 ? (
              <BoutonPrincipal onClick={() => setEtape(etape + 1)} disabled={!peutContinuer()} icone={ArrowRight}>{L("Continuer", "Continue")}</BoutonPrincipal>
            ) : (
              <BoutonPrincipal onClick={envoyer} disabled={!peutContinuer() || envoiEnCours} icone={Check}>
                {envoiEnCours ? L("Envoi…", "Sending…") : L("Envoyer mon dépôt", "Send my submission")}
              </BoutonPrincipal>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   CONFIRMATION + MANDAT IMPRIMABLE
   ========================================================================== */
function Confirmation({ depot, retourAccueil, allerSuivi }) {
  const L = useL();
  const [copie, setCopie] = useState(false);
  const copierRef = async () => {
    try {
      await navigator.clipboard.writeText(depot.ref);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch { /* presse-papiers indisponible */ }
  };
  const cat = CATEGORIES.find((c) => c.id === depot.categorie);
  const estimation = useMemo(() => {
    const montants = extraireMontants(depot.budget);
    if (!montants.length) return null;
    return { montant: Math.max(...montants), devis: calculerCommission(depot.categorie, Math.max(...montants)) };
  }, [depot]);

  return (
    <div className="px-4 py-16">
      <div className="mx-auto text-center" style={{ maxWidth: 560 }}>
        <div className="mx-auto flex items-center justify-center" style={{ width: 56, height: 56, borderRadius: "50%", background: COLORS.vertClair }}>
          <Check size={26} color={COLORS.vert} />
        </div>
        <h2 className="mt-5" style={{ fontFamily: "'Fraunces', serif", fontSize: 30, color: COLORS.encre, fontWeight: 600 }}>
          {L("Dépôt bien reçu", "Submission received")}
        </h2>
        <p className="mt-3" style={{ color: COLORS.ardoise, fontSize: 15, lineHeight: 1.6 }}>
          {L(
            `Votre ${depot.type === "recherche" ? "recherche" : "proposition"} a été enregistrée. Conservez votre référence : elle vous permet de suivre votre dossier en ligne.`,
            `Your ${depot.type === "recherche" ? "search" : "offer"} has been recorded. Keep your reference: it lets you track your file online.`
          )}
        </p>
        <div className="mx-auto mt-6 inline-block" style={{ border: `1px dashed ${COLORS.laiton}`, borderRadius: 8, padding: "14px 28px", background: COLORS.laitonClair }}>
          <div style={{ fontSize: 11, color: COLORS.ardoise, letterSpacing: "0.15em", textTransform: "uppercase" }}>{L("Votre référence", "Your reference")}</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, color: COLORS.encre, letterSpacing: "0.04em" }}>{depot.ref}</div>
        </div>
        <div className="mt-3 no-print">
          <button onClick={copierRef} className="inline-flex items-center gap-1" style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.vert, fontSize: 13, fontWeight: 600, textDecoration: "underline" }}>
            {copie ? <Check size={14} /> : <Copy size={14} />} {copie ? L("Référence copiée !", "Reference copied!") : L("Copier ma référence", "Copy my reference")}
          </button>
        </div>
        <p className="mt-5" style={{ fontSize: 13, color: COLORS.ardoise }}>{L("Premier retour sous 48 h ouvrées.", "First response within 2 working days.")}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3 no-print">
          <BoutonPrincipal onClick={() => window.print()} icone={Printer}>{L("Imprimer mon mandat (PDF)", "Print my mandate (PDF)")}</BoutonPrincipal>
          {LIEN_SIGNATURE && (
            <BoutonSecondaire onClick={() => window.open(LIEN_SIGNATURE, "_blank")} icone={PenLine}>
              {L("Signer le mandat en ligne", "Sign the mandate online")}
            </BoutonSecondaire>
          )}
          {CALENDLY_URL && (
            <BoutonSecondaire onClick={() => window.open(CALENDLY_URL, "_blank")} icone={CalendarDays}>
              {L("Réserver un appel de 15 min", "Book a 15-min call")}
            </BoutonSecondaire>
          )}
          <BoutonSecondaire onClick={allerSuivi} icone={Link2}>{L("Suivre mon dossier", "Track my file")}</BoutonSecondaire>
          <BoutonSecondaire onClick={retourAccueil}>{L("Retour à l'accueil", "Back to home")}</BoutonSecondaire>
        </div>
      </div>

      {/* Mandat imprimable */}
      <div className="print-only" style={{ fontFamily: "'Archivo', sans-serif", color: "#111" }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, marginBottom: 0 }}>{NOM_ACTIVITE}</h1>
        <p style={{ fontSize: 11, marginTop: 2 }}>{SOUS_TITRE} — {INFOS_LEGALES.editeur}, {INFOS_LEGALES.statut}, SIRET {INFOS_LEGALES.siret}</p>
        <h2 style={{ fontSize: 16, marginTop: 18 }}>Mandat d'apport d'affaires — {depot.ref}</h2>
        <p style={{ fontSize: 12 }}>
          Entre le mandant ci-dessous et l'apporteur d'affaires ({NOM_ACTIVITE}), il est convenu que
          l'apporteur recherche une contrepartie pour l'objet décrit ci-dessous. Sa rémunération n'est due
          qu'en cas de mise en relation aboutissant à la conclusion de l'affaire.
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginTop: 8 }}>
          <tbody>
            {[
              ["Référence", depot.ref],
              ["Date du dépôt", new Date(depot.date).toLocaleDateString("fr-FR")],
              ["Mandant", `${depot.nom}${depot.societe ? " — " + depot.societe : ""} (${depot.profil})`],
              ["Coordonnées", [depot.email, depot.telephone, depot.reseaux].filter(Boolean).join(" · ")],
              ["Objet", `${depot.type === "recherche" ? "Recherche" : "Proposition"} · ${cat ? cat.label : ""}`],
              ["Désignation", depot.titre],
              ["Description", depot.description],
              ["Budget / prix", depot.budget || "—"],
              ["Localisation", depot.localisation || "—"],
              ["Délai", depot.delai || "—"],
              ["Conditions", depot.conditions || "—"],
              ["Commission indicative", estimation ? `${fmtEUR(estimation.devis.total)} HT (base ${fmtEUR(estimation.montant)}) — à confirmer d'un commun accord` : "À définir d'un commun accord"],
            ].map(([k, v]) => (
              <tr key={k}>
                <td style={{ border: "1px solid #999", padding: 6, width: "30%", fontWeight: 700 }}>{k}</td>
                <td style={{ border: "1px solid #999", padding: 6 }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: "flex", gap: 40, marginTop: 30, fontSize: 12 }}>
          <div style={{ flex: 1 }}>
            <p>Le mandant</p>
            <p style={{ marginTop: 50, borderTop: "1px solid #999", paddingTop: 4 }}>Signature, précédée de « lu et approuvé »</p>
          </div>
          <div style={{ flex: 1 }}>
            <p>L'apporteur d'affaires</p>
            <p style={{ marginTop: 50, borderTop: "1px solid #999", paddingTop: 4 }}>Signature</p>
          </div>
        </div>
        <p style={{ fontSize: 10, marginTop: 16 }}>
          Document pré-rempli à titre indicatif, à compléter et valider entre les parties. Données traitées
          de façon confidentielle conformément à la politique de confidentialité du site, jamais publiées.
        </p>
      </div>
    </div>
  );
}

/* ==========================================================================
   PAGES JURIDIQUES (en français — site édité en France)
   ========================================================================== */
function CadreLegal({ titre, icone: Icone, retour, children }) {
  return (
    <div className="px-4 py-10 md:py-14">
      <div className="mx-auto" style={{ maxWidth: 760 }}>
        <div style={{ background: COLORS.carte, border: `1px solid ${COLORS.ligne}`, borderRadius: 12, padding: "32px 32px 36px" }}>
          <div className="flex items-center gap-2">
            <Icone size={19} color={COLORS.laiton} />
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, color: COLORS.encre, fontWeight: 600 }}>{titre}</h1>
          </div>
          <div className="legal mt-5" style={{ fontSize: 14, color: COLORS.encre, lineHeight: 1.7 }}>
            {children}
          </div>
        </div>
        <div className="mt-5">
          <BoutonSecondaire onClick={retour} icone={ArrowLeft}>Retour à l'accueil</BoutonSecondaire>
        </div>
      </div>
    </div>
  );
}

function H2L({ children }) {
  return <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, color: COLORS.encre, marginTop: 22, marginBottom: 6 }}>{children}</h2>;
}

function MentionsLegales({ retour }) {
  return (
    <CadreLegal titre="Mentions légales" icone={Scale} retour={retour}>
      <p style={{ fontSize: 12.5, color: COLORS.ardoise }}>
        Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN).
      </p>
      <H2L>Éditeur du site</H2L>
      <p>
        {INFOS_LEGALES.editeur}, {INFOS_LEGALES.statut}<br />
        SIRET : {INFOS_LEGALES.siret}<br />
        Adresse : {INFOS_LEGALES.adresse}<br />
        E-mail : {INFOS_LEGALES.email} · Téléphone : {INFOS_LEGALES.telephone}<br />
        Directeur de la publication : {INFOS_LEGALES.directeurPublication}
      </p>
      <H2L>Hébergement</H2L>
      <p>{INFOS_LEGALES.hebergeur}</p>
      <H2L>Activité</H2L>
      <p>
        {NOM_ACTIVITE} exerce une activité d'apport d'affaires : la mise en relation d'acheteurs et de
        vendeurs, de prestataires et de clients. L'éditeur n'est partie à aucune des transactions conclues
        entre les personnes mises en relation et n'agit ni comme agent immobilier, ni comme intermédiaire
        financier, ni comme commissaire-priseur.
      </p>
      <H2L>Propriété intellectuelle</H2L>
      <p>
        L'ensemble des contenus du site (textes, identité visuelle, structure) est la propriété de l'éditeur,
        sauf mention contraire. Toute reproduction non autorisée est interdite.
      </p>
      <H2L>Médiation de la consommation</H2L>
      <p>
        Conformément aux articles L.612-1 et suivants du Code de la consommation, tout consommateur a le
        droit de recourir gratuitement à un médiateur de la consommation. Médiateur désigné : {INFOS_LEGALES.mediateur}.
        Plateforme européenne de règlement en ligne des litiges : https://ec.europa.eu/consumers/odr
      </p>
      <H2L>Contact</H2L>
      <p>Pour toute question relative au site : {INFOS_LEGALES.email}</p>
    </CadreLegal>
  );
}

function Confidentialite({ retour }) {
  return (
    <CadreLegal titre="Politique de confidentialité" icone={Shield} retour={retour}>
      <p style={{ fontSize: 12.5, color: COLORS.ardoise }}>
        Conforme au Règlement général sur la protection des données (RGPD, règlement UE 2016/679) et à la loi
        Informatique et Libertés. Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}.
      </p>
      <H2L>Responsable de traitement</H2L>
      <p>{INFOS_LEGALES.editeur}, {INFOS_LEGALES.adresse} — {INFOS_LEGALES.email}</p>
      <H2L>Données collectées</H2L>
      <p>
        Lorsque vous déposez une recherche ou une proposition, nous collectons : votre identité (nom, prénom,
        société le cas échéant), vos coordonnées (e-mail, téléphone, réseaux sociaux si renseignés), le
        contenu de votre dépôt (description, budget, localisation, conditions) et les photos que vous joignez
        volontairement. Aucune donnée n'est collectée à votre insu.
      </p>
      <H2L>Finalité et base légale</H2L>
      <p>
        Ces données servent exclusivement à instruire votre demande de mise en relation et à vous recontacter.
        Le traitement repose sur votre consentement (case cochée lors du dépôt) et sur l'exécution de mesures
        précontractuelles à votre demande (article 6.1.a et 6.1.b du RGPD).
      </p>
      <H2L>Destinataires</H2L>
      <p>
        Vos données ne sont jamais publiées ni vendues. Elles ne sont accessibles qu'à l'éditeur du site.
        Vos coordonnées ne sont transmises à une contrepartie potentielle qu'avec votre accord préalable,
        au moment de la mise en relation. Les recherches publiées sur la page « Recherches en cours » et les
        références de la page d'accueil sont anonymisées (aucun nom, aucune coordonnée) et ne sont publiées
        qu'avec votre accord.
      </p>
      <H2L>Durée de conservation</H2L>
      <p>
        Vos données sont conservées pendant la durée de traitement de votre dossier, puis au maximum
        {" "}{INFOS_LEGALES.dureeConservation}, avant suppression définitive.
      </p>
      <H2L>Vos droits</H2L>
      <p>
        Vous disposez d'un droit d'accès, de rectification, d'effacement, d'opposition, de limitation du
        traitement et de portabilité de vos données. Pour les exercer, écrivez à {INFOS_LEGALES.email} en
        précisant votre référence de dépôt. Vous pouvez également retirer votre consentement à tout moment
        et introduire une réclamation auprès de la CNIL (www.cnil.fr).
      </p>
      <H2L>Cookies et mesure d'audience</H2L>
      <p>
        Ce site ne dépose aucun cookie publicitaire ni traceur nécessitant un consentement. Si une mesure
        d'audience est active, elle utilise une solution sans cookie et sans collecte de données personnelles
        (statistiques agrégées et anonymes).
      </p>
      <H2L>Sécurité</H2L>
      <p>
        Les données sont stockées de manière sécurisée et ne sont accessibles que via un accès protégé.
        Malgré nos précautions, aucun système n'étant infaillible, nous vous invitons à ne pas inclure
        d'informations sensibles inutiles dans vos descriptions.
      </p>
    </CadreLegal>
  );
}

function CGU({ retour }) {
  return (
    <CadreLegal titre="Conditions générales d'utilisation" icone={FileText} retour={retour}>
      <H2L>1. Objet</H2L>
      <p>
        Les présentes CGU encadrent l'utilisation du site {NOM_ACTIVITE}, qui permet de déposer des
        recherches et des propositions en vue d'une mise en relation par l'éditeur, apporteur d'affaires
        indépendant. L'utilisation du site vaut acceptation des présentes CGU.
      </p>
      <H2L>2. Rôle de l'éditeur</H2L>
      <p>
        L'éditeur agit exclusivement comme intermédiaire de mise en relation. Il n'est partie à aucune
        transaction, ne garantit ni la conclusion d'une affaire, ni la qualité, la conformité ou
        l'authenticité des biens et services proposés par les utilisateurs, qui demeurent seuls responsables
        de leurs déclarations et de leurs engagements réciproques.
      </p>
      <H2L>3. Gratuité du dépôt et rémunération</H2L>
      <p>
        Le dépôt d'une recherche ou d'une proposition est gratuit et sans engagement. La rémunération de
        l'éditeur (commission d'apport d'affaires) n'est due qu'en cas de mise en relation aboutissant à la
        conclusion d'une affaire, et fait l'objet d'un mandat écrit signé entre les parties préalablement à
        la mise en relation. Le simulateur de commission fournit une estimation indicative et non
        contractuelle.
      </p>
      <H2L>4. Obligations de l'utilisateur</H2L>
      <p>
        L'utilisateur s'engage à fournir des informations exactes, à être propriétaire des biens proposés ou
        dûment habilité à les proposer, et à ne déposer aucun contenu illicite, contrefaisant, volé, ou
        contraire à l'ordre public. L'éditeur se réserve le droit de supprimer tout dépôt sans préavis et de
        refuser toute mise en relation.
      </p>
      <H2L>5. Secteurs réglementés</H2L>
      <p>
        Certaines opérations relèvent de professions réglementées. En particulier, les transactions
        immobilières sont encadrées par la loi n° 70-9 du 2 janvier 1970 (« loi Hoguet ») : pour ces
        opérations, l'éditeur se limite à orienter les utilisateurs vers des professionnels titulaires de la
        carte professionnelle requise, et n'accomplit aucun acte d'entremise immobilière réservé. De même,
        l'éditeur ne fournit aucun conseil financier, juridique ou en investissement.
      </p>
      <H2L>6. Responsabilité</H2L>
      <p>
        L'éditeur met en œuvre des moyens raisonnables pour assurer la disponibilité du site, sans garantie
        d'absence d'interruption. Il ne saurait être tenu responsable des litiges entre utilisateurs mis en
        relation, ni des dommages résultant des transactions conclues entre eux.
      </p>
      <H2L>7. Données personnelles</H2L>
      <p>Le traitement des données est décrit dans la politique de confidentialité, qui fait partie intégrante des présentes CGU.</p>
      <H2L>8. Droit applicable</H2L>
      <p>
        Les présentes CGU sont soumises au droit français. En cas de litige et à défaut de résolution
        amiable, le consommateur peut saisir gratuitement le médiateur de la consommation désigné dans les
        mentions légales. À défaut, les tribunaux français seront compétents.
      </p>
    </CadreLegal>
  );
}

/* ==========================================================================
   ESPACE DE GESTION (ADMIN — en français)
   ========================================================================== */
function PhotosDepot({ id, nb }) {
  const [photos, setPhotos] = useState(null);
  useEffect(() => {
    let actif = true;
    if (nb > 0) chargerPhotos(id).then((p) => actif && setPhotos(p));
    else setPhotos([]);
    return () => { actif = false; };
  }, [id, nb]);

  if (!nb) return null;
  if (photos === null) return <div style={{ fontSize: 12, color: COLORS.ardoise }}>Chargement des photos…</div>;
  if (!photos.length) return <div className="inline-flex items-center gap-1" style={{ fontSize: 12, color: COLORS.ardoise }}><ImageOff size={13} /> Photos indisponibles</div>;
  return (
    <div className="flex flex-wrap gap-2">
      {photos.map((p, i) => (
        <img key={i} src={p} alt={`Photo ${i + 1}`} style={{ width: 110, height: 110, objectFit: "cover", borderRadius: 8, border: `1px solid ${COLORS.ligne}` }} />
      ))}
    </div>
  );
}

function Admin({ retour }) {
  const [authentifie, setAuthentifie] = useState(false);
  const [code, setCode] = useState("");
  const [erreurCode, setErreurCode] = useState(false);
  const [depots, setDepots] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [onglet, setOnglet] = useState("depots");
  const [filtreType, setFiltreType] = useState("tous");
  const [filtreCat, setFiltreCat] = useState("toutes");
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [recherche, setRecherche] = useState("");
  const [ouvert, setOuvert] = useState(null);

  useEffect(() => {
    if (!authentifie) return;
    (async () => {
      setChargement(true);
      setDepots(await chargerDepots());
      setChargement(false);
    })();
  }, [authentifie]);

  const majDepot = async (id, modif) => {
    const maj = depots.map((d) => (d.id === id ? { ...d, ...modif } : d));
    setDepots(maj);
    await sauverDepots(maj);
  };

  const changerStatut = (d, statut) => {
    const modif = { statut };
    if (statut === "conclu" && !d.dateConclusion) modif.dateConclusion = new Date().toISOString();
    majDepot(d.id, modif);
  };

  const supprimer = async (id) => {
    const d = depots.find((x) => x.id === id);
    if (!window.confirm(`Supprimer définitivement le dépôt ${d ? d.ref : ""} ? Cette action est irréversible.`)) return;
    const maj = depots.filter((x) => x.id !== id);
    setDepots(maj);
    setOuvert(null);
    await sauverDepots(maj);
    try { await window.storage.delete(`photos-${id}`, true); } catch { /* pas de photos */ }
  };

  const exporterCSV = () => {
    const colonnes = ["ref", "date", "type", "profil", "categorie", "titre", "description", "budget", "localisation", "delai", "conditions", "nom", "societe", "email", "telephone", "reseaux", "preferenceContact", "statut", "noteAdmin", "enReponseA"];
    const echapper = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lignes = [colonnes.join(";"), ...depots.map((d) => colonnes.map((c) => echapper(d[c])).join(";"))];
    const blob = new Blob(["\uFEFF" + lignes.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `depots-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtres = useMemo(() => {
    const q = recherche.toLowerCase();
    return depots.filter((d) => {
      if (filtreType !== "tous" && d.type !== filtreType) return false;
      if (filtreCat !== "toutes" && d.categorie !== filtreCat) return false;
      if (filtreStatut !== "tous" && d.statut !== filtreStatut) return false;
      if (q && ![d.ref, d.titre, d.description, d.nom, d.societe, d.email, d.telephone, d.localisation].join(" ").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [depots, filtreType, filtreCat, filtreStatut, recherche]);

  const rapprochements = useMemo(() => calculerRapprochements(depots), [depots]);

  const stats = useMemo(() => ({
    total: depots.length,
    nouveaux: depots.filter((d) => d.statut === "nouveau").length,
    recherches: depots.filter((d) => d.type === "recherche").length,
    propositions: depots.filter((d) => d.type === "proposition").length,
  }), [depots]);

  if (!authentifie) {
    return (
      <div className="px-4 py-20">
        <div className="mx-auto" style={{ maxWidth: 380 }}>
          <div style={{ background: COLORS.carte, border: `1px solid ${COLORS.ligne}`, borderRadius: 12, padding: 28 }}>
            <Lock size={20} color={COLORS.laiton} />
            <h2 className="mt-3" style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: COLORS.encre, fontWeight: 600 }}>Espace de gestion</h2>
            <p className="mt-1" style={{ fontSize: 13, color: COLORS.ardoise }}>Réservé à l'administrateur du site.</p>
            <input
              style={{ ...inputStyle, marginTop: 16 }}
              type="password"
              value={code}
              onChange={(e) => { setCode(e.target.value); setErreurCode(false); }}
              onKeyDown={(e) => e.key === "Enter" && (code === ADMIN_CODE ? setAuthentifie(true) : setErreurCode(true))}
              placeholder="Code d'accès"
            />
            {erreurCode && <p className="mt-2" style={{ color: COLORS.rouge, fontSize: 13 }}>Code incorrect.</p>}
            <div className="mt-4 flex gap-2">
              <BoutonPrincipal onClick={() => (code === ADMIN_CODE ? setAuthentifie(true) : setErreurCode(true))}>Entrer</BoutonPrincipal>
              <BoutonSecondaire onClick={retour}>Retour</BoutonSecondaire>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectStyle = { ...inputStyle, width: "auto", padding: "8px 10px", fontSize: 13 };

  return (
    <div className="px-4 py-8 md:px-6">
      <div className="mx-auto" style={{ maxWidth: 1080 }}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Etiquette>Espace de gestion</Etiquette>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, color: COLORS.encre, fontWeight: 600 }}>Tableau de bord</h2>
          </div>
          <div className="flex gap-2">
            <BoutonSecondaire onClick={exporterCSV} icone={Download}>Exporter CSV</BoutonSecondaire>
            <BoutonSecondaire onClick={retour}>Quitter</BoutonSecondaire>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Total", stats.total],
            ["Nouveaux", stats.nouveaux],
            ["Recherches", stats.recherches],
            ["Propositions", stats.propositions],
          ].map(([l, v]) => (
            <div key={l} style={{ background: COLORS.carte, border: `1px solid ${COLORS.ligne}`, borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 12, color: COLORS.ardoise, textTransform: "uppercase", letterSpacing: "0.08em" }}>{l}</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, color: COLORS.encre }}>{v}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-1" style={{ borderBottom: `1px solid ${COLORS.ligne}` }}>
          {[
            { id: "depots", label: `Dépôts (${depots.length})`, icone: FileText },
            { id: "rapprochements", label: `Rapprochements (${rapprochements.length})`, icone: Sparkles },
          ].map((o) => (
            <button key={o.id} onClick={() => setOnglet(o.id)} className="inline-flex items-center gap-2" style={{
              padding: "10px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer",
              background: "none", border: "none",
              color: onglet === o.id ? COLORS.encre : COLORS.ardoise,
              borderBottom: onglet === o.id ? `2px solid ${COLORS.laiton}` : "2px solid transparent",
              marginBottom: -1,
            }}>
              <o.icone size={15} /> {o.label}
            </button>
          ))}
        </div>

        {/* ===== ONGLET RAPPROCHEMENTS ===== */}
        {onglet === "rapprochements" && (
          <div className="mt-5 space-y-3">
            <p style={{ fontSize: 13, color: COLORS.ardoise }}>
              Recherches et propositions actives d'une même catégorie qui partagent des mots-clés
              (et une fourchette de prix compatible quand elle est renseignée). Une alerte e-mail est
              envoyée automatiquement quand un dépôt atteint un score de {SEUIL_ALERTE_RAPPROCHEMENT} ou plus.
            </p>
            {rapprochements.length === 0 && (
              <div className="text-center" style={{ padding: "40px 0", color: COLORS.ardoise, fontSize: 14 }}>
                Aucun rapprochement détecté pour l'instant. Ils apparaîtront dès qu'une recherche et une
                proposition se ressembleront.
              </div>
            )}
            {rapprochements.map((r, i) => {
              const cat = CATEGORIES.find((c) => c.id === r.recherche.categorie);
              return (
                <div key={i} style={{ background: COLORS.carte, border: `1px solid ${COLORS.laiton}`, borderRadius: 10, padding: 16 }}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Sparkles size={15} color={COLORS.laiton} />
                    {cat && <span style={{ fontSize: 12.5, fontWeight: 700, color: COLORS.encre }}>{cat.label}</span>}
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: COLORS.laitonClair, color: "#8A6A33" }}>
                      Score {r.score}
                    </span>
                    {r.prixOk === true && <span style={{ fontSize: 11, color: COLORS.vert, fontWeight: 700 }}>Prix compatibles</span>}
                    {r.prixOk === false && <span style={{ fontSize: 11, color: COLORS.rouge, fontWeight: 700 }}>Écart de prix</span>}
                    {r.proposition.enReponseA === r.recherche.ref && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: COLORS.vertClair, color: COLORS.vert }}>
                        Réponse directe
                      </span>
                    )}
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {[r.recherche, r.proposition].map((d) => (
                      <div key={d.id} style={{ border: `1px solid ${COLORS.ligne}`, borderRadius: 8, padding: 12 }}>
                        <div className="flex items-center justify-between gap-2">
                          <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 13, color: COLORS.laiton }}>{d.ref}</span>
                          <PastilleType type={d.type} />
                        </div>
                        <div className="mt-1" style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.encre }}>{d.titre}</div>
                        <div style={{ fontSize: 12, color: COLORS.ardoise }}>
                          {d.nom}{d.budget ? ` · ${d.budget}` : ""}{d.localisation ? ` · ${d.localisation}` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                  {r.communs.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      <span style={{ fontSize: 11.5, color: COLORS.ardoise }}>Mots-clés communs :</span>
                      {r.communs.slice(0, 8).map((m) => (
                        <span key={m} style={{ fontSize: 11.5, padding: "2px 8px", borderRadius: 10, background: COLORS.vertClair, color: COLORS.vert, fontWeight: 600 }}>{m}</span>
                      ))}
                    </div>
                  )}
                  <div className="mt-3">
                    <BoutonSecondaire onClick={() => { setOnglet("depots"); setOuvert(r.recherche.id); }} icone={Eye}>
                      Ouvrir les dossiers
                    </BoutonSecondaire>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ===== ONGLET DÉPÔTS ===== */}
        {onglet === "depots" && (
          <>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Filter size={15} color={COLORS.ardoise} />
              <select style={selectStyle} value={filtreType} onChange={(e) => setFiltreType(e.target.value)}>
                <option value="tous">Tous types</option>
                <option value="recherche">Recherches</option>
                <option value="proposition">Propositions</option>
              </select>
              <select style={selectStyle} value={filtreCat} onChange={(e) => setFiltreCat(e.target.value)}>
                <option value="toutes">Toutes catégories</option>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              <select style={selectStyle} value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)}>
                <option value="tous">Tous statuts</option>
                {STATUTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <div className="relative flex-1" style={{ minWidth: 200 }}>
                <Search size={15} color={COLORS.ardoise} style={{ position: "absolute", left: 10, top: 10 }} />
                <input style={{ ...inputStyle, paddingLeft: 32, fontSize: 13 }} value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher (réf., nom, titre…)" />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {chargement && <p style={{ color: COLORS.ardoise, fontSize: 14 }}>Chargement…</p>}
              {!chargement && filtres.length === 0 && (
                <div className="text-center" style={{ padding: "48px 0", color: COLORS.ardoise, fontSize: 14 }}>
                  Aucun dépôt ne correspond à ces critères. Les nouveaux dépôts des visiteurs apparaîtront ici.
                </div>
              )}
              {filtres.map((d) => {
                const cat = CATEGORIES.find((c) => c.id === d.categorie);
                const statut = STATUTS.find((s) => s.id === d.statut) || STATUTS[0];
                const estOuvert = ouvert === d.id;
                return (
                  <div key={d.id} style={{ background: COLORS.carte, border: `1px solid ${COLORS.ligne}`, borderRadius: 10, overflow: "hidden" }}>
                    <button
                      onClick={() => setOuvert(estOuvert ? null : d.id)}
                      className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left"
                      style={{ background: "none", border: "none", cursor: "pointer" }}
                    >
                      <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 14, color: COLORS.laiton, minWidth: 120 }}>{d.ref}</span>
                      <PastilleType type={d.type} />
                      {cat && (
                        <span className="inline-flex items-center gap-1" style={{ fontSize: 12, color: COLORS.ardoise }}>
                          <cat.icon size={13} /> {cat.label}
                        </span>
                      )}
                      {d.nbPhotos > 0 && (
                        <span className="inline-flex items-center gap-1" style={{ fontSize: 12, color: COLORS.ardoise }}>
                          <Camera size={13} /> {d.nbPhotos}
                        </span>
                      )}
                      {d.publierRecherche && d.type === "recherche" && (
                        <span className="inline-flex items-center gap-1" style={{ fontSize: 11, fontWeight: 700, color: COLORS.vert }}>
                          <Megaphone size={12} /> Publiée
                        </span>
                      )}
                      <span className="flex-1" style={{ fontSize: 14, fontWeight: 600, color: COLORS.encre, minWidth: 150 }}>{d.titre}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 12, background: statut.bg, color: statut.fg }}>{statut.label}</span>
                      <span style={{ fontSize: 12, color: COLORS.ardoise }}>{new Date(d.date).toLocaleDateString("fr-FR")}</span>
                      <ChevronDown size={16} color={COLORS.ardoise} style={{ transform: estOuvert ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
                    </button>

                    {estOuvert && (
                      <div className="px-4 pb-4" style={{ borderTop: `1px dashed ${COLORS.ligne}` }}>
                        {d.enReponseA && (
                          <div className="mt-3 inline-flex items-center gap-2" style={{ fontSize: 12.5, fontWeight: 700, color: COLORS.vert, background: COLORS.vertClair, borderRadius: 8, padding: "6px 12px" }}>
                            <Megaphone size={13} /> En réponse à la recherche {d.enReponseA}
                          </div>
                        )}
                        <div className="mt-3 grid gap-4 md:grid-cols-2">
                          <div className="space-y-2" style={{ fontSize: 13.5, color: COLORS.encre }}>
                            <div style={{ whiteSpace: "pre-wrap" }}><strong>Description :</strong> {d.description}</div>
                            {d.budget && <div><strong>Budget / prix :</strong> {d.budget}</div>}
                            {d.localisation && <div className="inline-flex items-center gap-1"><MapPin size={13} color={COLORS.laiton} /> {d.localisation}</div>}
                            {d.delai && <div className="inline-flex items-center gap-1" style={{ marginLeft: 12 }}><Clock size={13} color={COLORS.laiton} /> {d.delai}</div>}
                            {d.conditions && <div><strong>Conditions :</strong> {d.conditions}</div>}
                            <PhotosDepot id={d.id} nb={d.nbPhotos || 0} />
                          </div>
                          <div className="space-y-2" style={{ fontSize: 13.5, color: COLORS.encre }}>
                            <div><strong>{d.nom}</strong>{d.societe ? ` — ${d.societe}` : ""} ({d.profil === "particulier" ? "particulier" : "entreprise"})</div>
                            {d.email && <div className="flex items-center gap-2"><Mail size={13} color={COLORS.laiton} /><a href={`mailto:${d.email}`} style={{ color: COLORS.vert, textDecoration: "underline" }}>{d.email}</a></div>}
                            {d.telephone && <div className="flex items-center gap-2"><Phone size={13} color={COLORS.laiton} /><a href={`tel:${d.telephone}`} style={{ color: COLORS.vert, textDecoration: "underline" }}>{d.telephone}</a></div>}
                            {d.reseaux && <div className="flex items-center gap-2"><AtSign size={13} color={COLORS.laiton} />{d.reseaux}</div>}
                            <div style={{ fontSize: 12, color: COLORS.ardoise }}>
                              Préférence : {d.preferenceContact === "email" ? "e-mail" : d.preferenceContact === "telephone" ? "téléphone" : "réseaux sociaux"}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.ardoise }}>Statut :</span>
                          {STATUTS.map((s) => (
                            <button key={s.id} onClick={() => changerStatut(d, s.id)} style={{
                              fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 14, cursor: "pointer",
                              background: d.statut === s.id ? s.bg : "#FFFFFF",
                              color: d.statut === s.id ? s.fg : COLORS.ardoise,
                              border: `1.5px solid ${d.statut === s.id ? "transparent" : COLORS.ligne}`,
                            }}>
                              {s.label}
                            </button>
                          ))}
                        </div>

                        {d.type === "recherche" && (d.statut === "nouveau" || d.statut === "en_cours") && (
                          <label className="mt-3 flex items-center gap-2" style={{ cursor: "pointer" }}>
                            <input type="checkbox" checked={!!d.publierRecherche} onChange={(e) => majDepot(d.id, { publierRecherche: e.target.checked })} style={{ width: 15, height: 15 }} />
                            <span className="inline-flex items-center gap-1" style={{ fontSize: 13, color: COLORS.encre }}>
                              <Megaphone size={14} color={COLORS.laiton} />
                              Publier cette recherche (anonymisée) sur la page « Recherches en cours » — titre, budget et localisation uniquement, jamais les coordonnées
                            </span>
                          </label>
                        )}

                        {d.statut === "conclu" && (
                          <label className="mt-3 flex items-center gap-2" style={{ cursor: "pointer" }}>
                            <input type="checkbox" checked={!!d.temoignage} onChange={(e) => majDepot(d.id, { temoignage: e.target.checked })} style={{ width: 15, height: 15 }} />
                            <span className="inline-flex items-center gap-1" style={{ fontSize: 13, color: COLORS.encre }}>
                              <BadgeCheck size={14} color={COLORS.laiton} />
                              Publier comme référence anonymisée sur la page d'accueil (catégorie + région + durée, sans aucun nom)
                            </span>
                          </label>
                        )}

                        <div className="mt-3">
                          <div className="mb-1 flex items-center gap-1" style={{ fontSize: 12, fontWeight: 700, color: COLORS.ardoise }}>
                            <StickyNote size={13} /> Note privée (visible uniquement ici)
                          </div>
                          <textarea
                            style={{ ...inputStyle, minHeight: 60, fontSize: 13 }}
                            value={d.noteAdmin}
                            onChange={(e) => majDepot(d.id, { noteAdmin: e.target.value })}
                            placeholder="Vos remarques, suivi des contacts, contreparties potentielles…"
                          />
                        </div>

                        <div className="mt-3 flex justify-end">
                          <button onClick={() => supprimer(d.id)} className="inline-flex items-center gap-1" style={{ fontSize: 12.5, color: COLORS.rouge, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                            <Trash2 size={14} /> Supprimer ce dépôt
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   APPLICATION
   ========================================================================== */
export default function App() {
  const [vue, setVue] = useState("accueil"); // accueil | depot | confirmation | simulateur | suivi | recherches | mentions | confidentialite | cgu | admin
  const [lang, setLang] = useState("fr");
  const [preType, setPreType] = useState(null);
  const [preCategorie, setPreCategorie] = useState(null);
  const [enReponseA, setEnReponseA] = useState(null);
  const [dernierDepot, setDernierDepot] = useState(null);

  const L = (fr, en) => (lang === "en" ? en : fr);

  // Statistiques de visite sans cookies (Plausible) — actif uniquement si configuré
  useEffect(() => {
    document.title = `${NOM_ACTIVITE} — ${SOUS_TITRE}`;
    if (!PLAUSIBLE_DOMAIN || document.getElementById("plausible-script")) return;
    const s = document.createElement("script");
    s.id = "plausible-script";
    s.defer = true;
    s.setAttribute("data-domain", PLAUSIBLE_DOMAIN);
    s.src = "https://plausible.io/js/script.js";
    document.head.appendChild(s);
  }, []);

  const ouvrirDepot = (type = null, categorie = null, reponseRef = null) => {
    setPreType(type);
    setPreCategorie(categorie);
    setEnReponseA(reponseRef);
    setVue("depot");
    window.scrollTo(0, 0);
  };
  const aller = (v) => { setVue(v); window.scrollTo(0, 0); };

  const lienNav = (label, icone, cible) => {
    const Icone = icone;
    return (
      <button onClick={() => aller(cible)} className="inline-flex items-center gap-1" style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.encre, fontSize: 13.5, fontWeight: 600, padding: "8px 8px" }}>
        <Icone size={15} color={COLORS.laiton} /> {label}
      </button>
    );
  };

  return (
    <LangContext.Provider value={lang}>
      <div style={{ minHeight: "100vh", background: COLORS.fond, fontFamily: "'Archivo', sans-serif" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,600&family=Archivo:wght@400;500;600;700&display=swap');
          * { box-sizing: border-box; }
          input:focus, textarea:focus, select:focus { border-color: ${COLORS.laiton} !important; box-shadow: 0 0 0 3px ${COLORS.laitonClair}; }
          button { transition: opacity .15s ease, background .15s ease, border-color .15s ease; }
          button:hover:not(:disabled) { opacity: .92; }
          button:focus-visible { outline: 2px solid ${COLORS.laiton}; outline-offset: 2px; }
          .print-only { display: none; }
          @media print {
            body * { visibility: hidden; }
            .print-only, .print-only * { visibility: visible; display: block; }
            .print-only { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; }
            .print-only table, .print-only tr, .print-only td, .print-only tbody { display: revert; visibility: visible; }
            .no-print { display: none !important; }
          }
          @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
        `}</style>

        {/* Barre de navigation */}
        <header className="no-print flex flex-wrap items-center justify-between gap-3 px-5 py-4 md:px-8" style={{ borderBottom: `1px solid ${COLORS.ligne}`, background: COLORS.carte }}>
          <button onClick={() => aller("accueil")} className="text-left" style={{ background: "none", border: "none", cursor: "pointer" }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 700, color: COLORS.encre }}>{NOM_ACTIVITE}</div>
            <div style={{ fontSize: 10.5, color: COLORS.laiton, letterSpacing: "0.14em", textTransform: "uppercase" }}>{SOUS_TITRE}</div>
          </button>
          <nav className="flex flex-wrap items-center gap-1">
            {lienNav(L("Recherches", "Searches"), Megaphone, "recherches")}
            {lienNav(L("Simulateur", "Simulator"), Calculator, "simulateur")}
            {lienNav(L("Suivi", "Tracking"), Link2, "suivi")}
            <button onClick={() => setLang(lang === "fr" ? "en" : "fr")} className="inline-flex items-center gap-1"
              style={{ background: "none", border: `1px solid ${COLORS.ligne}`, borderRadius: 6, padding: "8px 10px", cursor: "pointer", color: COLORS.encre, fontSize: 12.5, fontWeight: 700 }}
              aria-label={L("Switch to English", "Passer en français")}>
              <Globe size={14} color={COLORS.laiton} /> {lang === "fr" ? "EN" : "FR"}
            </button>
            {vue !== "depot" && <BoutonPrincipal onClick={() => ouvrirDepot()}>{L("Déposer", "Submit")}</BoutonPrincipal>}
            <button onClick={() => aller("admin")} title="Espace de gestion" aria-label="Espace de gestion"
              style={{ background: "none", border: `1px solid ${COLORS.ligne}`, borderRadius: 6, padding: 10, cursor: "pointer", color: COLORS.ardoise }}>
              <LayoutDashboard size={16} />
            </button>
          </nav>
        </header>

        {vue === "accueil" && (
          <Accueil
            ouvrirDepot={ouvrirDepot}
            allerSimulateur={() => aller("simulateur")}
            allerSuivi={() => aller("suivi")}
            allerRecherches={() => aller("recherches")}
          />
        )}
        {vue === "depot" && (
          <Depot
            preType={preType}
            preCategorie={preCategorie}
            enReponseA={enReponseA}
            onTermine={(d) => { setDernierDepot(d); aller("confirmation"); }}
            onAnnuler={() => aller("accueil")}
          />
        )}
        {vue === "confirmation" && dernierDepot && (
          <Confirmation depot={dernierDepot} retourAccueil={() => aller("accueil")} allerSuivi={() => aller("suivi")} />
        )}
        {vue === "simulateur" && <Simulateur retour={() => aller("accueil")} />}
        {vue === "suivi" && <Suivi retour={() => aller("accueil")} />}
        {vue === "recherches" && (
          <RecherchesEnCours
            retour={() => aller("accueil")}
            repondre={(r) => ouvrirDepot("proposition", r.categorie, r.ref)}
          />
        )}
        {vue === "mentions" && <MentionsLegales retour={() => aller("accueil")} />}
        {vue === "confidentialite" && <Confidentialite retour={() => aller("accueil")} />}
        {vue === "cgu" && <CGU retour={() => aller("accueil")} />}
        {vue === "admin" && <Admin retour={() => aller("accueil")} />}

        {/* Bouton WhatsApp flottant */}
        {WHATSAPP_NUMERO && vue !== "admin" && (
          <a
            href={`https://wa.me/${WHATSAPP_NUMERO}`}
            target="_blank"
            rel="noopener noreferrer"
            className="no-print"
            aria-label="WhatsApp"
            style={{
              position: "fixed", bottom: 22, right: 22, width: 52, height: 52, borderRadius: "50%",
              background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 6px 20px rgba(0,0,0,0.2)", zIndex: 50,
            }}
          >
            <MessageCircle size={26} color="#FFFFFF" />
          </a>
        )}

        {/* Pied de page */}
        <footer className="no-print px-6 py-8 text-center" style={{ borderTop: `1px solid ${COLORS.ligne}`, color: COLORS.ardoise, fontSize: 12.5 }}>
          <div>
            {NOM_ACTIVITE} — {SOUS_TITRE}. {L("Dépôt gratuit et confidentiel · Vos données ne sont jamais publiées.", "Free, confidential submissions · Your data is never published.")}
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-2" style={{ fontSize: 12 }}>
            <button onClick={() => aller("mentions")} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.ardoise, textDecoration: "underline", fontSize: 12 }}>
              Mentions légales
            </button>
            <span>·</span>
            <button onClick={() => aller("confidentialite")} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.ardoise, textDecoration: "underline", fontSize: 12 }}>
              Politique de confidentialité
            </button>
            <span>·</span>
            <button onClick={() => aller("cgu")} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.ardoise, textDecoration: "underline", fontSize: 12 }}>
              CGU
            </button>
          </div>
          <div className="mt-2" style={{ fontSize: 11.5 }}>© {new Date().getFullYear()} {INFOS_LEGALES.editeur} — SIRET {INFOS_LEGALES.siret}</div>
        </footer>
      </div>
    </LangContext.Provider>
  );
}

