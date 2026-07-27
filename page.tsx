"use client";

import { useMemo, useState } from "react";

type RouteId = "rolig" | "balansert" | "opplevelse";
type ComfortId = "smart" | "komfort" | "plass";
type DetailTab = "rute" | "transport";

type Activity = {
  id: string;
  place: string;
  title: string;
  duration: string;
  age: string;
  cost: number;
};

const routes: Array<{
  id: RouteId;
  eyebrow: string;
  title: string;
  places: string;
  nights: string;
  transfers: string;
  budget: string;
  color: string;
  verdict: string;
  pace: string;
  stays: Array<{ days: string; place: string; nights: string; copy: string; tag: string }>;
  legs: Array<{ from: string; to: string; mode: string; time: string; note: string }>;
  costs: { international: number; domestic: number; hotel: number; food: number; local: number; buffer: number };
  activities: Activity[];
}> = [
  {
    id: "rolig",
    eyebrow: "Minst logistikk",
    title: "Rolig strandferie",
    places: "Bangkok · Khao Lak",
    nights: "2 + 11 netter",
    transfers: "1 innenriksfly",
    budget: "fra ca. 78 000 kr",
    color: "coral",
    verdict: "Best hvis dere vil lande ordentlig og ha flest mulig dager uten koffertpakking.",
    pace: "Lavt tempo",
    stays: [
      { days: "Dag 1–3", place: "Bangkok", nights: "2 netter", copy: "Kom dere etter flyreisen, ta én rolig elvedag og legg inn hotellbasseng midt på dagen.", tag: "Myk start" },
      { days: "Dag 3–14", place: "Khao Lak", nights: "11 netter", copy: "Velg familiehotell ved Bang Niang eller Khuk Khak, og bruk stranden som base for korte utflukter.", tag: "Fast base" },
      { days: "Dag 14", place: "Hjemreise", nights: "via Phuket", copy: "Privat bil til Phuket flyplass. Bestill god margin hvis hjemreisen går via Bangkok.", tag: "Enkel retur" },
    ],
    legs: [
      { from: "Oslo", to: "Bangkok", mode: "Langdistansefly", time: "ca. 14–17 t", note: "Regn med ett stopp med mindre dere finner direkte sesongrute." },
      { from: "Bangkok", to: "Phuket", mode: "Innenriksfly", time: "ca. 1 t 30 min", note: "Velg avgang etter frokost og unngå separat, knapp transfer samme dag." },
      { from: "Phuket", to: "Khao Lak", mode: "Privat bil", time: "ca. 1 t 15 min", note: "Bilsete bør bestilles og bekreftes på forhånd." },
      { from: "Khao Lak", to: "Phuket flyplass", mode: "Privat bil", time: "ca. 1 t 15 min", note: "Den enkleste returen med små barn og bagasje." },
    ],
    costs: { international: 34000, domestic: 5200, hotel: 20500, food: 9000, local: 2500, buffer: 4000 },
    activities: [
      { id: "r-river", place: "Bangkok", title: "Elvebåt og Wat Arun", duration: "3 timer", age: "Vognvennlig i deler", cost: 850 },
      { id: "r-aquarium", place: "Bangkok", title: "Akvarium + rolig lunsj", duration: "3–4 timer", age: "Perfekt i varmen", cost: 1500 },
      { id: "r-turtle", place: "Khao Lak", title: "Skilpaddesenter", duration: "2 timer", age: "Kort og enkelt", cost: 450 },
      { id: "r-amazon", place: "Khao Lak", title: "Little Amazon-kanotur", duration: "2–3 timer", age: "Sjekk redningsvest", cost: 1100 },
      { id: "r-phangnga", place: "Khao Lak", title: "Privat Phang Nga-båttur", duration: "5–6 timer", age: "Velg rolig sjø", cost: 3200 },
      { id: "r-cooking", place: "Khao Lak", title: "Familievennlig matkurs", duration: "3 timer", age: "Sjekk minstealder", cost: 1700 },
    ],
  },
  {
    id: "balansert",
    eyebrow: "Vår anbefaling",
    title: "Strand først, Bangkok sist",
    places: "Krabi · Koh Lanta · Bangkok",
    nights: "5 + 7 + 1 natt",
    transfers: "2 fly + 1 bil/båt",
    budget: "fra ca. 89 000 kr",
    color: "teal",
    verdict: "Videre til Krabi samme dag som dere lander, og én trygg buffernatt i Bangkok før hjemreisen.",
    pace: "Rolig variasjon",
    stays: [
      { days: "Dag 1–6", place: "Krabi / Ao Nang", nights: "5 netter", copy: "Fly videre fra Bangkok samme dag. Bruk første dag til å lande, og ta Railay når alle har sovet ut.", tag: "Rett til stranden" },
      { days: "Dag 6–13", place: "Koh Lanta", nights: "7 netter", copy: "Long Beach eller Klong Dao gir rolig strand, restauranter i nærheten og korte kvelder hjem.", tag: "Feriemodus" },
      { days: "Dag 13–14", place: "Bangkok", nights: "1 natt", copy: "Fly inn fra Krabi dagen før hjemreisen. Velg hotell med enkel forbindelse til flyplassen og få en trygg buffer.", tag: "Trygg avslutning" },
    ],
    legs: [
      { from: "Oslo", to: "Bangkok", mode: "Langdistansefly", time: "ca. 14–17 t", note: "Bestill helst videreflyet på samme billett, eller legg inn svært god margin ved separat bestilling." },
      { from: "Bangkok", to: "Krabi", mode: "Innenriksfly", time: "ca. 1 t 25 min", note: "Velg avgang fra samme flyplass som dere lander på, så dere unngår flyplassbytte i Bangkok." },
      { from: "Krabi flyplass", to: "Ao Nang", mode: "Privat bil", time: "ca. 45 min", note: "Avtal bilsete og plass til barnevogn på forhånd." },
      { from: "Ao Nang", to: "Koh Lanta", mode: "Privat minivan + bilferge", time: "ca. 2,5–3,5 t", note: "Dør-til-dør er enklere enn speedbåt med to små barn og bagasje." },
      { from: "Koh Lanta", to: "Krabi flyplass", mode: "Privat minivan", time: "ca. 2–3 t", note: "Beregn ekstra fergetid og trafikk før ettermiddagsflyet til Bangkok." },
      { from: "Krabi", to: "Bangkok", mode: "Innenriksfly", time: "ca. 1 t 25 min", note: "Én natt i Bangkok fjerner risikoen ved å koble direkte til hjemflyet." },
      { from: "Bangkok", to: "Oslo", mode: "Hjemreise", time: "ca. 14–17 t", note: "Velg hotell med enkel transport tilbake til avreiseflyplassen." },
    ],
    costs: { international: 34000, domestic: 9000, hotel: 23500, food: 10200, local: 3200, buffer: 4500 },
    activities: [
      { id: "b-river", place: "Bangkok", title: "Elvebåt og Wat Arun", duration: "3 timer", age: "Hvis flytidene passer", cost: 850 },
      { id: "b-aquarium", place: "Bangkok", title: "Akvarium + rolig lunsj", duration: "3–4 timer", age: "Hvis dere har en halvdag", cost: 1500 },
      { id: "b-railay", place: "Krabi", title: "Morgen på Railay Beach", duration: "4 timer", age: "Kort båttur", cost: 1200 },
      { id: "b-klong", place: "Krabi", title: "Mangrove og Ko Klang", duration: "4 timer", age: "Rolig tempo", cost: 1600 },
      { id: "b-oldtown", place: "Koh Lanta", title: "Old Town + ispause", duration: "2–3 timer", age: "Enkel halvdag", cost: 500 },
      { id: "b-longtail", place: "Koh Lanta", title: "Privat longtail-båt", duration: "5 timer", age: "Væravhengig", cost: 3300 },
    ],
  },
  {
    id: "opplevelse",
    eyebrow: "Mest variasjon",
    title: "By, fjell og strand",
    places: "Bangkok · Chiang Mai · Khao Lak",
    nights: "2 + 4 + 7 netter",
    transfers: "2 innenriksfly",
    budget: "fra ca. 92 000 kr",
    color: "gold",
    verdict: "For dere som vil oppleve mer av Thailand og tåler to ekstra reisedager.",
    pace: "Mest innhold",
    stays: [
      { days: "Dag 1–3", place: "Bangkok", nights: "2 netter", copy: "Myk landing, elvebåt og basseng. Spar de lange tempeldagene til en senere tur.", tag: "Storby" },
      { days: "Dag 3–7", place: "Chiang Mai", nights: "4 netter", copy: "Velg hotell i eller rett utenfor gamlebyen. Planlegg morgener ute og hvil i den varmeste tiden.", tag: "Kultur + natur" },
      { days: "Dag 7–14", place: "Khao Lak", nights: "7 netter", copy: "Avslutt med én fast strandbase og få skuldrene helt ned før hjemreise.", tag: "Rolig finale" },
    ],
    legs: [
      { from: "Oslo", to: "Bangkok", mode: "Langdistansefly", time: "ca. 14–17 t", note: "Første etappe er lik de andre alternativene." },
      { from: "Bangkok", to: "Chiang Mai", mode: "Innenriksfly", time: "ca. 1 t 15 min", note: "Mange avganger gjør tidspunktet fleksibelt." },
      { from: "Chiang Mai", to: "Phuket", mode: "Innenriksfly", time: "ca. 2 t direkte", note: "Direkteruter kan variere med sesong; unngå kort selv-transfer i Bangkok." },
      { from: "Phuket", to: "Khao Lak", mode: "Privat bil", time: "ca. 1 t 15 min", note: "Bestill bilsete og stor nok bil til vogn og kofferter." },
    ],
    costs: { international: 34000, domestic: 9800, hotel: 22500, food: 10200, local: 3200, buffer: 5000 },
    activities: [
      { id: "o-river", place: "Bangkok", title: "Elvebåt og Wat Arun", duration: "3 timer", age: "Vognvennlig i deler", cost: 850 },
      { id: "o-aquarium", place: "Bangkok", title: "Akvarium + rolig lunsj", duration: "3–4 timer", age: "Perfekt i varmen", cost: 1500 },
      { id: "o-temple", place: "Chiang Mai", title: "Doi Suthep med privat bil", duration: "4 timer", age: "Mange trapper", cost: 1200 },
      { id: "o-sticky", place: "Chiang Mai", title: "Sticky Waterfall-halvdag", duration: "4–5 timer", age: "Best for 4-åringen", cost: 1800 },
      { id: "o-market", place: "Chiang Mai", title: "Tidlig kveld på marked", duration: "2 timer", age: "Ta med bæresele", cost: 500 },
      { id: "o-turtle", place: "Khao Lak", title: "Skilpaddesenter", duration: "2 timer", age: "Kort og enkelt", cost: 450 },
    ],
  },
];

const comfortLevels: Record<ComfortId, { label: string; sub: string }> = {
  smart: { label: "Smart", sub: "Enkelt, pent og praktisk" },
  komfort: { label: "Komfort", sub: "Familierom + gode flytider" },
  plass: { label: "Ekstra plass", sub: "Større rom og mer privat transport" },
};

const monthNotes: Record<string, { title: string; copy: string; tone: string }> = {
  nov: { title: "Svært god periode for Andaman-kysten", copy: "Vanligvis tørrere vær og roligere sjø. Bestill familiehotell tidlig.", tone: "good" },
  des: { title: "Høysesong og gode strandforhold", copy: "Veldig populært rundt jul og nyttår – prisanslaget bør få ekstra margin.", tone: "good" },
  jan: { title: "En av de tryggeste værmånedene", copy: "Behagelig kombinasjon av strandvær og utflukter, men høye hotellpriser.", tone: "good" },
  feb: { title: "Godt strandvær og mindre regn", copy: "Fortsatt høysesong. Koh Lanta og Khao Lak passer særlig godt.", tone: "good" },
  mar: { title: "Fortsatt fint, men varmere", copy: "Legg aktiviteter til morgenen og prioriter hotell med skyggefullt barnebasseng.", tone: "warm" },
  apr: { title: "Varmt – planlegg korte dager", copy: "Temperaturen kan bli krevende for små barn. Basseng, aircondition og pauser er viktig.", tone: "warm" },
  mai: { title: "Overgang til våtere periode", copy: "Mer usikkert båtvær på Andaman-kysten. Velg fleksible utflukter.", tone: "rain" },
  jun: { title: "Grønn sesong på Andaman-kysten", copy: "Regnbyger og grovere sjø kan forekomme. Koh Samui-siden kan være et bedre strandvalg.", tone: "rain" },
  jul: { title: "Vurder Thailandbukta i stedet", copy: "For sommerferie kan Koh Samui eller Koh Phangan gi et bedre værtreff enn Krabi/Khao Lak.", tone: "rain" },
  aug: { title: "Vurder Thailandbukta i stedet", copy: "Andaman-rutene kan fungere, men sjø og regn er mer ustabilt. Se på Samui-alternativ.", tone: "rain" },
  sep: { title: "Våteste del av Andaman-sesongen", copy: "Velg helst Thailandbukta, eller bestill fleksibelt og aksepter flere innedager.", tone: "rain" },
  okt: { title: "Skuldersesong med skiftende vær", copy: "Forholdene bedrer seg ofte mot slutten av måneden, men båtturer er væravhengige.", tone: "warm" },
};

const selectedByDefault = [
  "r-river", "r-aquarium", "r-turtle",
  "b-river", "b-railay", "b-oldtown",
  "o-river", "o-temple", "o-market",
];

const formatNok = (value: number) => `${Math.round(value / 100) * 100}`.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " kr";

export default function Home() {
  const [routeId, setRouteId] = useState<RouteId>("balansert");
  const [detailTab, setDetailTab] = useState<DetailTab>("rute");
  const [comfort, setComfort] = useState<ComfortId>("komfort");
  const [includeFlights, setIncludeFlights] = useState(true);
  const [month, setMonth] = useState("");
  const [selectedActivities, setSelectedActivities] = useState<string[]>(selectedByDefault);

  const route = routes.find((item) => item.id === routeId) ?? routes[1];
  const activitySpend = route.activities
    .filter((activity) => selectedActivities.includes(activity.id))
    .reduce((sum, activity) => sum + activity.cost, 0);

  const budget = useMemo(() => {
    const factors = {
      smart: { international: .96, domestic: .92, hotel: .72, food: .8, local: .82, activities: .88, buffer: .8 },
      komfort: { international: 1, domestic: 1, hotel: 1, food: 1, local: 1, activities: 1, buffer: 1 },
      plass: { international: 1.1, domestic: 1.08, hotel: 1.42, food: 1.18, local: 1.3, activities: 1.16, buffer: 1.2 },
    }[comfort];
    const rows = [
      { key: "international", label: "Fly Oslo–Thailand", amount: includeFlights ? route.costs.international * factors.international : 0 },
      { key: "domestic", label: "Innenriksfly og transfer", amount: route.costs.domestic * factors.domestic },
      { key: "hotel", label: "Overnatting", amount: route.costs.hotel * factors.hotel },
      { key: "food", label: "Mat og drikke", amount: route.costs.food * factors.food },
      { key: "local", label: "Lokal transport", amount: route.costs.local * factors.local },
      { key: "activities", label: "Valgte aktiviteter", amount: (2200 + activitySpend) * factors.activities },
      { key: "buffer", label: "Buffer", amount: route.costs.buffer * factors.buffer },
    ];
    return { rows, total: rows.reduce((sum, row) => sum + row.amount, 0) };
  }, [activitySpend, comfort, includeFlights, route]);

  const chooseRoute = (id: RouteId) => {
    setRouteId(id);
    setDetailTab("rute");
    requestAnimationFrame(() => document.getElementById("rutedetalj")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const toggleActivity = (id: string) => {
    setSelectedActivities((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#topp" aria-label="Thailand-planlegger, til toppen">
          <span className="brand-mark" aria-hidden="true">T</span>
          <span>Thailand med små barn</span>
        </a>
        <nav aria-label="Hovednavigasjon">
          <a className="quiet-link" href="#sammenlign">Ruter</a>
          <a className="quiet-link" href="#planlegg">Budsjett</a>
        </nav>
      </header>

      <section className="hero" id="topp">
        <div className="sun sun-one" aria-hidden="true" />
        <div className="sun sun-two" aria-hidden="true" />
        <div className="hero-copy">
          <p className="kicker"><span>14 dager</span><span>2 voksne</span><span>Barn 2 + 4 år</span></p>
          <h1>Thailand, i et tempo som<br />hele familien liker.</h1>
          <p className="lede">
            Sammenlign tre gjennomførbare ruter, se hva transporten faktisk innebærer
            og juster budsjettet uten å åpne femten faner.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#sammenlign">Sammenlign alternativer <span aria-hidden="true">↘</span></a>
            <p><strong>God standard</strong><br />med rom for bassengdager</p>
          </div>
        </div>

        <div className="route-sketch" aria-label="Eksempelrute fra Krabi via Koh Lanta til Bangkok">
          <div className="passport-stamp">FAMILY<br /><b>THAILAND</b><br />14 DAYS</div>
          <div className="sketch-label sketch-start"><span>01</span> Krabi</div>
          <div className="sketch-line line-one" />
          <div className="sketch-plane" aria-hidden="true">✦</div>
          <div className="sketch-label sketch-mid"><span>02</span> Koh Lanta</div>
          <div className="sketch-line line-two" />
          <div className="sketch-label sketch-end"><span>03</span> Bangkok</div>
          <div className="palm" aria-hidden="true">⌇</div>
        </div>
      </section>

      <section className="comparison" id="sammenlign">
        <div className="comparison-intro">
          <div>
            <p className="section-number">01 / VELG TEMPO</p>
            <h2>Tre gode ferier.<br />Tre ulike rytmer.</h2>
          </div>
          <p className="section-note">
            Prisene er et realistisk førsteanslag for hele familien, inkludert fly fra Oslo.
            Velg en rute for å åpne detaljene.
          </p>
        </div>

        <div className="route-grid" aria-label="Reiseruter">
          {routes.map((item, index) => (
            <article className={`route-card ${item.color} ${routeId === item.id ? "selected" : ""}`} key={item.id}>
              <div className="card-topline">
                <span>{item.eyebrow}</span>
                <span aria-hidden="true">0{index + 1}</span>
              </div>
              <h3>{item.title}</h3>
              <p className="places">{item.places}</p>
              <dl>
                <div><dt>Fordeling</dt><dd>{item.nights}</dd></div>
                <div><dt>Transport</dt><dd>{item.transfers}</dd></div>
                <div><dt>Totalbudsjett</dt><dd>{item.budget}</dd></div>
              </dl>
              <button type="button" aria-pressed={routeId === item.id} onClick={() => chooseRoute(item.id)}>
                {routeId === item.id ? "Valgt rute" : "Se hele ruten"} <span aria-hidden="true">{routeId === item.id ? "✓" : "→"}</span>
              </button>
            </article>
          ))}
        </div>

        <div className="route-detail" id="rutedetalj">
          <div className="detail-heading">
            <div>
              <p className="detail-overline">{route.eyebrow} · {route.pace}</p>
              <h2>{route.title}</h2>
              <p>{route.verdict}</p>
            </div>
            <div className="segmented-control" aria-label="Visning">
              <button className={detailTab === "rute" ? "active" : ""} aria-pressed={detailTab === "rute"} onClick={() => setDetailTab("rute")}>Reiserute</button>
              <button className={detailTab === "transport" ? "active" : ""} aria-pressed={detailTab === "transport"} onClick={() => setDetailTab("transport")}>Transport</button>
            </div>
          </div>

          {detailTab === "rute" ? (
            <div className="timeline">
              {route.stays.map((stay, index) => (
                <article className="timeline-stop" key={stay.place}>
                  <div className="stop-index">0{index + 1}</div>
                  <div className="stop-content">
                    <div className="stop-meta"><span>{stay.days}</span><span>{stay.nights}</span></div>
                    <h3>{stay.place}</h3>
                    <p>{stay.copy}</p>
                    <span className="stop-tag">{stay.tag}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="transport-list">
              {route.legs.map((leg, index) => (
                <article className="transport-leg" key={`${leg.from}-${leg.to}`}>
                  <span className="leg-number">0{index + 1}</span>
                  <div className="leg-route"><b>{leg.from}</b><span aria-hidden="true">→</span><b>{leg.to}</b></div>
                  <div><span className="mini-label">{leg.mode}</span><strong>{leg.time}</strong></div>
                  <p>{leg.note}</p>
                </article>
              ))}
              <div className="family-tip"><strong>Familietips</strong><p>Bestill privat bil på de lengste landstrekningene. Det koster mer, men reduserer venting, bilbytter og stress med vogn og bagasje.</p></div>
            </div>
          )}
        </div>
      </section>

      <section className="planner" id="planlegg">
        <div className="planner-head">
          <div>
            <p className="section-number light">02 / GJØR DEN TIL DERES</p>
            <h2>Se hva ferien<br />faktisk vil koste.</h2>
          </div>
          <div className="month-picker">
            <label htmlFor="travel-month">Når vil dere reise?</label>
            <select id="travel-month" value={month} onChange={(event) => setMonth(event.target.value)}>
              <option value="">Velg måned</option>
              <option value="jan">Januar</option><option value="feb">Februar</option><option value="mar">Mars</option>
              <option value="apr">April</option><option value="mai">Mai</option><option value="jun">Juni</option>
              <option value="jul">Juli</option><option value="aug">August</option><option value="sep">September</option>
              <option value="okt">Oktober</option><option value="nov">November</option><option value="des">Desember</option>
            </select>
            {month && (
              <div className={`month-note ${monthNotes[month].tone}`}>
                <strong>{monthNotes[month].title}</strong>
                <p>{monthNotes[month].copy}</p>
              </div>
            )}
          </div>
        </div>

        <div className="planner-grid">
          <div className="budget-panel">
            <div className="panel-title">
              <div><span>Valgt rute</span><strong>{route.places}</strong></div>
              <span className="total-label">Familien totalt</span>
            </div>

            <fieldset className="comfort-options">
              <legend>Komfortnivå</legend>
              {(Object.keys(comfortLevels) as ComfortId[]).map((id) => (
                <label className={comfort === id ? "checked" : ""} key={id}>
                  <input type="radio" name="comfort" value={id} checked={comfort === id} onChange={() => setComfort(id)} />
                  <span><strong>{comfortLevels[id].label}</strong><small>{comfortLevels[id].sub}</small></span>
                </label>
              ))}
            </fieldset>

            <label className="flight-toggle">
              <input type="checkbox" checked={includeFlights} onChange={(event) => setIncludeFlights(event.target.checked)} />
              <span className="toggle-track" aria-hidden="true"><span /></span>
              Ta med fly fra Oslo
            </label>

            <div className="budget-total" aria-live="polite">
              <span>Planleggingsbudsjett</span>
              <strong>{formatNok(budget.total)}</strong>
              <small>ca. {formatNok(budget.total / 14)} per feriedag</small>
            </div>

            <div className="budget-breakdown">
              {budget.rows.filter((row) => row.amount > 0).map((row) => (
                <div className="budget-row" key={row.key}>
                  <div><span>{row.label}</span><strong>{formatNok(row.amount)}</strong></div>
                  <div className="budget-bar"><span style={{ width: `${Math.max(6, (row.amount / Math.max(...budget.rows.map((item) => item.amount))) * 100)}%` }} /></div>
                </div>
              ))}
            </div>
            <p className="estimate-note">Planleggingsestimat, ikke pristilbud. Fly og hotell varierer mye med dato, romtype og hvor tidlig dere bestiller.</p>
          </div>

          <div className="activity-panel">
            <div className="panel-title">
              <div><span>Aktiviteter</span><strong>Velg – uten å fylle alle dager</strong></div>
              <span className="activity-count">{route.activities.filter((item) => selectedActivities.includes(item.id)).length} valgt</span>
            </div>
            <p className="activity-intro">En god rytme med små barn er én aktivitet, én hviledag. Kryss av det dere liker – budsjettet oppdateres til venstre.</p>
            <div className="activity-list">
              {route.activities.map((activity) => {
                const selected = selectedActivities.includes(activity.id);
                return (
                  <label className={`activity-item ${selected ? "selected" : ""}`} key={activity.id}>
                    <input type="checkbox" checked={selected} onChange={() => toggleActivity(activity.id)} />
                    <span className="custom-check" aria-hidden="true">{selected ? "✓" : "+"}</span>
                    <span className="activity-copy">
                      <small>{activity.place} · {activity.duration}</small>
                      <strong>{activity.title}</strong>
                      <em>{activity.age}</em>
                    </span>
                    <b>ca. {formatNok(activity.cost)}</b>
                  </label>
                );
              })}
            </div>
            <div className="activity-rule"><span>Vår tommelfingerregel</span><strong>La minst 5 av 14 dager være helt åpne.</strong></div>
          </div>
        </div>

        <footer>
          <div>
            <span className="footer-mark">T</span>
            <p><strong>Et godt førsteutkast.</strong><br />Sjekk flytider, åpningstider, vær og aldersgrenser før bestilling.</p>
          </div>
          <div className="sources">
            <span>Nyttige offisielle kilder</span>
            <a href="https://www.tourismthailand.org/Plan-Your-Trip/Weather" target="_blank" rel="noreferrer">Vær og sesong ↗</a>
            <a href="https://www.tourismthailand.org/Destinations/Koh-Lanta" target="_blank" rel="noreferrer">Koh Lanta ↗</a>
            <a href="https://www.tourismthailand.org/Destinations/Provinces/Krabi/344" target="_blank" rel="noreferrer">Krabi ↗</a>
          </div>
        </footer>
      </section>
    </main>
  );
}
