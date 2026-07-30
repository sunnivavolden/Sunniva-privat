"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import "leaflet/dist/leaflet.css";
import "./src-index.css";

type RouteId = "rolig" | "balansert" | "opplevelse";
type ComfortId = "smart" | "komfort" | "plass";
type DetailTab = "rute" | "transport";
type HotelPlace = "krabi" | "lanta";
type MapPlace = HotelPlace | "bangkok";
type ActivityCategory = "strand" | "båt" | "natur" | "dyr" | "kultur" | "inne";
type ActivityDuration = "kort" | "halvdag" | "heldag";
type MapCategory = "hotell" | "aktivitet" | "strand" | "mat" | "transport";
type SharedStayId = string;
type VillaMode = "shared" | "nearby-homes" | "family-villas";
type MainView = "overview" | "route" | "stays" | "budget" | "packing" | "tips";
type StayView = "hotels" | "airbnb";
type TravelerKind = "adult" | "child";
type TravelerGender = "female" | "male" | "other";
type PackingBag = "checked" | "cabin";
type PackingTraveler = { id: number; name: string; kind: TravelerKind; gender: TravelerGender; age: number };
type PackingCategory = "clothes" | "shoes" | "training" | "swim" | "toiletries" | "sleep" | "health" | "documents" | "flight" | "tech" | "practical";
type PackingItem = { id: string; label: string; reason?: string; category: PackingCategory };
type DestinationTip = {
  title: string;
  icon: string;
  summary: string;
  items: Array<{ name: string; verdict: "best" | "good" | "skip" | "practical"; text: string; link?: string }>;
};

type Activity = {
  id: string;
  place: string;
  title: string;
  duration: string;
  age: string;
  cost: number;
  category: ActivityCategory;
  durationGroup: ActivityDuration;
  minAge: number;
};

const activityVisuals: Record<string, string> = {
  "Elvebåt og Wat Arun": "/wat-arun-new.jpg",
  "Morgen på Railay Beach": "/railay-beach.jpg",
  "Etisk elefantreservat uten riding": "/asian-elephant-thailand.jpg",
  "Emerald Pool tidlig morgen": "/emerald-pool-new.jpg",
  "Old Town + ispause": "/lanta-old-town.jpg",
  "Klong Dao stranddag": "/klong-dao-beach.jpg",
  "Doi Suthep med privat bil": "/doi-suthep.jpg",
};

const destinationTips: Record<HotelPlace, {
  label: string;
  intro: string;
  familyVerdict: string;
  categories: DestinationTip[];
}> = {
  krabi: {
    label: "Krabi / Ao Nang",
    intro: "Fem netter med enkel tilgang til restauranter, butikker og korte utflukter. Bruk Ao Nang som praktisk base, men velg selve stranddagene med litt omtanke.",
    familyVerdict: "Ao Nang er den enkleste basen. Legg utflukter til morgenen, kom tilbake før den sterkeste varmen og behold minst to helt åpne basseng-/stranddager.",
    categories: [
      {
        title: "Strender med barn", icon: "≈",
        summary: "Hvor dere får den enkleste og roligste stranddagen.",
        items: [
          { name: "Nopparat Thara", verdict: "best", text: "Det mest praktiske valget nær Ao Nang for en rolig halvdag. Langgrunn ved lavvann og mer plass enn på Ao Nang Beach. Ta badesko; bunnen kan være ujevn." },
          { name: "Railay West tidlig", verdict: "good", text: "Vakker strand og kort longtailtur. Dra etter frokost og reis tilbake før barna er utslitte. Bæresele er enklere enn vogn ved av- og påstigning." },
          { name: "Ao Nang Beach", verdict: "practical", text: "Best til solnedgang, en kort lekestopp eller for å ta båt videre. Ikke nødvendigvis den beste heldagsstranden når det er travelt." },
          { name: "Phra Nang midt på dagen", verdict: "skip", text: "Flott, men kan bli svært tett med dagsbesøkende og har lite enkel logistikk med små barn. Velg tidlig morgen hvis dere vil dit." },
        ],
      },
      {
        title: "Mat som fungerer", icon: "⌁",
        summary: "Enklere måltider uten at hele kvelden går til restaurantbesøket.",
        items: [
          { name: "Ao Nang sentrum", verdict: "best", text: "Størst utvalg av thai, pizza, pasta, smoothie, pannekaker og enkel barnemat. Velg steder noen minutter fra den mest trafikkerte strandstripen." },
          { name: "Tidlig middag", verdict: "good", text: "Spis gjerne rundt 17–18 før køene og før barna blir for slitne. Be om «not spicy»; «mild» kan fortsatt være sterkt." },
          { name: "Nattmarked som smaksrunde", verdict: "practical", text: "Del flere småretter og ha en trygg favoritt i reserve. Ta med våtservietter og kontanter, og bruk bæresele hvis det er tett." },
          { name: "Lang middag på Railay", verdict: "skip", text: "Kan bli unødvendig krevende når dere også må rekke båt tilbake. Hold Railay til strand og lunsj." },
        ],
      },
      {
        title: "Når det regner eller er for varmt", icon: "☂",
        summary: "Plan B som ikke føles som en bortkastet feriedag.",
        items: [
          { name: "Basseng + lang lunsj", verdict: "best", text: "Den beste planen ved korte tropiske byger. Ikke flytt hele dagsprogrammet før dere ser om regnet faktisk varer." },
          { name: "Krabi Town", verdict: "good", text: "Kafé, kjøpesenter eller marked kan kombineres til en rolig halvdag. Privat bil er enklest med vogn og barn." },
          { name: "Hotellaktivitet / lekerom", verdict: "practical", text: "Sjekk på forhånd om hotellet har skyggefullt barnebasseng, lekerom eller barneklubb – det er mer verdt enn mange ekstra romfasiliteter." },
          { name: "Båttur i ustabilt vær", verdict: "skip", text: "Ikke la en forhåndsbetalt tur presse dere ut på grov sjø. Spør operatøren konkret om bølger, returmulighet og redningsvest i riktig barnestørrelse." },
        ],
      },
      {
        title: "Butikk, apotek og lege", icon: "+",
        summary: "Det praktiske sikkerhetsnettet rundt Ao Nang.",
        items: [
          { name: "7-Eleven / Family Mart-typen butikker", verdict: "practical", text: "Bra for vann, melk, yoghurt, snacks, våtservietter og småting. Kjøp større bleiepakker og barnemat i et større supermarked når dere har bil." },
          { name: "Lokalt apotek", verdict: "practical", text: "Det finnes mange apotek i Ao Nang. Vis virkestoff og dose, ikke bare norsk merkenavn. Ta med faste medisiner hjemmefra i originalemballasje." },
          { name: "Wattanapat Hospital Ao Nang", verdict: "good", text: "Privat sykehus i Ao Nang-området og et naturlig førstevalg når dere trenger vurdering raskt. Lagre kartlenken før reisen.", link: "https://aonanghospital.com/en/" },
          { name: "Krabi Hospital", verdict: "practical", text: "Provinsens offentlige sykehus i Krabi Town. Ved akutt fare: ring 1669 og kontakt reiseforsikringens alarmsentral.", link: "https://www.krabihospital.go.th/" },
        ],
      },
      {
        title: "Småbarnslogistikk", icon: "◇",
        summary: "Detaljene som avgjør om dagen blir lett eller tung.",
        items: [
          { name: "Vogn + bæresele", verdict: "best", text: "Ta begge. Vogn fungerer i Ao Nang og på resortet; bæresele er klart enklere til longtailbåt, Railay og ujevne fortau." },
          { name: "Privat bil med bekreftet bilsete", verdict: "good", text: "Be om bilde eller skriftlig bekreftelse på setetype. «Child seat available» sier lite om størrelse og montering." },
          { name: "Morgen ute, pause 12–15", verdict: "best", text: "Planlegg én hovedting før lunsj. Skygge, aircondition eller soving midt på dagen gjør at også kvelden fungerer." },
          { name: "Tiger Cave Temple med 2- og 4-åring", verdict: "skip", text: "Den lange, bratte trappen er ikke et familiehøydepunkt i varme. Velg en enklere natur- eller tempelopplevelse." },
        ],
      },
    ],
  },
  lanta: {
    label: "Koh Lanta",
    intro: "Syv netter med lavere tempo, lange strender og korte hverdager. Riktig område betyr mer enn å bo på det mest spektakulære hotellet.",
    familyVerdict: "Klong Dao er enklest med små barn; Long Beach gir litt mer restaurantliv. Unngå å bo langt sør hvis dere vil ha korte turer til butikk, lege og middag.",
    categories: [
      {
        title: "Strender med barn", icon: "≈",
        summary: "De beste basene når barna er 2 og 4 år.",
        items: [
          { name: "Klong Dao", verdict: "best", text: "Førstevalget for små barn: lang, bred strand, ofte roligere vann i høysesongen og mange restauranter i enkel avstand. Sjekk tidevann og dagsforhold." },
          { name: "Long Beach / Phra Ae", verdict: "good", text: "Flott strand og mer variasjon i mat og bosteder. Noen partier blir raskere dype enn Klong Dao, så velg strandavsnitt og hotellbasseng med omtanke." },
          { name: "Khlong Nin", verdict: "practical", text: "Hyggelig og roligere, men gir lengre transport til Saladan og flere tjenester. Passer best hvis dere primært vil være på resortet." },
          { name: "Avsides strender helt sør", verdict: "skip", text: "Vakre, men svingete veier og lang avstand til butikker og helsehjelp gjør dem mindre praktiske som base med små barn." },
        ],
      },
      {
        title: "Mat og enkle kvelder", icon: "⌁",
        summary: "Slik unngår dere lang transport bare for å spise.",
        items: [
          { name: "Restaurant i gangavstand", verdict: "best", text: "Prioriter dette ved valg av bolig. En fem minutters spasertur til flere middagsvalg er mer verdt enn en litt finere villa langt unna." },
          { name: "Strandrestaurant før solnedgang", verdict: "good", text: "Kom tidlig, la barna leke i sanden og bestill før rushet. Ha lykt på mobilen eller liten reiselampe til mørke strandstier hjem." },
          { name: "Saladan for variasjon", verdict: "practical", text: "Passer til innkjøp, kafé og middag samme dag. Kombiner ærender, så dere ikke bruker flere feriedager på transport." },
          { name: "Daglig restaurantjakt med taxi", verdict: "skip", text: "Blir fort dyrt og slitsomt. Velg område først, og bruk heller én eller to kvelder på noe spesielt." },
        ],
      },
      {
        title: "Rolige opplevelser", icon: "☼",
        summary: "Utflukter som tåler småbarnstempo.",
        items: [
          { name: "Lanta Old Town + ispause", verdict: "good", text: "Fin 2–3 timers tur med hus på påler, små butikker og lunsj. Dra om morgenen og ikke gjør det til en heldag." },
          { name: "Lanta Animal Welfare", verdict: "good", text: "Aktuelt for dyreglade barn, men avklar besøkstype, tidspunkt og aldersregler direkte før dere drar.", link: "https://lantaanimalwelfare.com/" },
          { name: "Privat longtail på rolig dag", verdict: "practical", text: "Velg kortere, privat tur med skygge, toalettplan og redningsvester som faktisk passer barna. Avlys hvis sjøen er urolig." },
          { name: "Fire Islands heldag i speedbåt", verdict: "skip", text: "Mange stopp, mye motorstøy, sol og begrenset fleksibilitet. Vent til barna er større eller velg en kortere privat tur." },
        ],
      },
      {
        title: "Når det regner eller blir for varmt", icon: "☂",
        summary: "Koh Lanta har færre inneaktiviteter – hotellet må gjøre mer av jobben.",
        items: [
          { name: "Godt resort som plan B", verdict: "best", text: "Skyggefullt basseng, overbygd terrasse og rom med litt plass er ekstra viktig på Koh Lanta. Dette er deres viktigste regnværsforsikring." },
          { name: "Matkurs for familien", verdict: "good", text: "Kan fungere for 4-åringen hvis kurset er kort og fleksibelt. Spør om 2-åringen kan være med uten å delta fullt." },
          { name: "Kafé + massasje på skift", verdict: "practical", text: "En voksen tar barna på kafé eller tilbake til hotellet mens den andre får massasje; bytt neste dag." },
          { name: "Lang kjøretur i kraftig regn", verdict: "skip", text: "Veiene kan bli glatte og sikten dårlig. Flytt heller planen enn å presse gjennom en sørøytur." },
        ],
      },
      {
        title: "Butikk, apotek og lege", icon: "+",
        summary: "Planlegg litt mer enn i Ao Nang.",
        items: [
          { name: "Saladan / nord på øya", verdict: "best", text: "Her er tettest utvalg av større butikker, apotek, minibanker og transport. Gjør et hovedinnkjøp når dere ankommer." },
          { name: "Bleier og kjent barnemat", verdict: "practical", text: "Vanlige merker finnes ofte, men størrelse og utvalg varierer. Ta nok til de første dagene og ha favorittmat til kritiske situasjoner." },
          { name: "Koh Lanta Hospital", verdict: "good", text: "Øyas offentlige sykehus for akutte og vanlige medisinske behov. Mer alvorlige tilfeller kan kreve videre transport til Krabi.", link: "https://kohlantahospital.moph.go.th/" },
          { name: "Reiseforsikringens alarmsentral", verdict: "practical", text: "Lagre nummer og forsikringsbevis offline. Ved akutt fare ring 1669 først; ved behandling som kan bli kostbar, kontakt alarmsentralen tidlig." },
        ],
      },
      {
        title: "Ting vi ville unngått", icon: "!",
        summary: "Ikke farlig i seg selv – bare dårlig bytte mellom opplevelse og stress.",
        items: [
          { name: "Scooter med barn", verdict: "skip", text: "Ikke bruk scooter som familietransport. Bestill bil, songthaew eller privat sjåfør, og avklar bilsete når det er mulig." },
          { name: "For mange heldager", verdict: "skip", text: "Syv netter trenger ikke syv planer. Velg maks to ordentlige utflukter og la resten være strand, basseng og korte kvelder." },
          { name: "Aper med mat i hånden", verdict: "skip", text: "Hold avstand, pakk bort mat og ikke la barna nærme seg. Dyrebitt eller klor skal vurderes medisinsk raskt." },
          { name: "Barfot etter mørkets frembrudd", verdict: "practical", text: "Bruk sandaler på stier og strandkanter når det er mørkt, og ha en liten lykt tilgjengelig." },
        ],
      },
    ],
  },
};

// Keep a single asset revision so browsers do not reuse an older, incomplete
// deployment where the page loaded before its bundled photos were available.
const imageUrl = (path: string) => {
  const publicPath = path.replace(/^\//, "");
  const shareablePath = /\.(jpe?g|png)$/i.test(publicPath)
    ? `${publicPath}.svg`
    : publicPath;
  return `${import.meta.env.BASE_URL}${shareablePath}?v=35`;
};

function activityImage(activity: Activity) {
  const path = activityVisuals[activity.title];
  return path ? imageUrl(path) : undefined;
}

const activityHighlights: Record<ActivityCategory, string> = {
  strand: "Rolig familiedag",
  båt: "Turens høydepunkt",
  natur: "Ut i det grønne",
  dyr: "Minne for barna",
  kultur: "Litt lokal stemning",
  inne: "God plan B",
};

type Hotel = {
  id: string;
  place: HotelPlace;
  name: string;
  stars: 4 | 5;
  area: string;
  beach: string;
  family: string;
  room: string;
  pools: string;
  price: "€€" | "€€€" | "€€€€";
  best: string;
  watch: string;
  url: string;
  pick?: string;
};

type SharedStay = {
  id: SharedStayId;
  place: HotelPlace;
  name: string;
  area: string;
  guests: number;
  bedrooms: number;
  baths: string;
  rating: string;
  setup: string;
  childNote: string;
  nightlyEstimate: [number, number];
  nights: number;
  url: string;
  image?: string;
  flexibleUnits?: boolean;
};

const sharedStays: SharedStay[] = [
  {
    id: "ao-nang-calm-pool",
    place: "krabi",
    name: "Ao Nang Villa med privat basseng",
    area: "Ao Nang",
    guests: 6,
    bedrooms: 3,
    baths: "3 bad",
    rating: "4,71 · 17 anmeldelser",
    setup: "Rolig, privat villa med tre likeverdige soverom og eget basseng.",
    childNote: "God størrelse for én familie eller to små familier. Ca. 8 minutter til Ao Nang Beach.",
    nightlyEstimate: [2400, 3900],
    nights: 5,
    url: "https://www.airbnb.com/rooms/1319994058739733193",
    image: "https://a0.muscache.com/im/pictures/hosting/Hosting-1319994058739733193/original/b9737712-ca41-4e1f-b468-76c9ca15640b.jpeg?im_w=720",
  },
  {
    id: "funta-pool-8",
    place: "krabi",
    name: "Pool Villa 8P",
    area: "Ao Nang",
    guests: 8,
    bedrooms: 4,
    baths: "2 bad",
    rating: "5,00 · 11 anmeldelser",
    setup: "Thai trevilla med basseng, grillplass, ni sengeplasser og gratis shuttle til stranden.",
    childNote: "Et godt tofamiliersalternativ. Fire kilometer til Ao Nang Beach, men shuttle er inkludert.",
    nightlyEstimate: [2900, 4600],
    nights: 5,
    url: "https://www.airbnb.com/rooms/31679844",
    image: "https://a0.muscache.com/im/pictures/9430844a-7f19-4b9e-b5c8-38744bdbd5c6.jpg?im_w=720",
  },
  {
    id: "inspire-pool-10",
    place: "krabi",
    name: "Inspire Pool Villa Ao Nang",
    area: "Ao Nang",
    guests: 10,
    bedrooms: 3,
    baths: "2 bad",
    rating: "4,85 · 27 anmeldelser",
    setup: "Moderne villa med privat saltvannsbasseng, stor uteplass og seks senger.",
    childNote: "Fin for to familier som vil ha mye fellesareal. Butikker ligger 5–10 minutter unna med bil.",
    nightlyEstimate: [3400, 5400],
    nights: 5,
    url: "https://www.airbnb.com/rooms/1003561870122003962",
  },
  {
    id: "ao-nang-modern-8",
    place: "krabi",
    name: "4 BDR Private Pool Villa",
    area: "Ao Nang",
    guests: 8,
    bedrooms: 4,
    baths: "3 bad",
    rating: "4,89 · 9 anmeldelser",
    setup: "Ny, moderne villa med fire soverom, privat basseng og fullt kjøkken.",
    childNote: "Praktisk for to familier: 7-Eleven ved siden av og fem minutters kjøring til stranden.",
    nightlyEstimate: [3200, 5200],
    nights: 5,
    url: "https://www.airbnb.com/rooms/1603854107946589712",
  },
  {
    id: "sea-eagle",
    place: "krabi",
    name: "Sea Eagle Triple House",
    area: "Ao Nang",
    guests: 14,
    bedrooms: 7,
    baths: "7,5 bad",
    rating: "4,94 · 50 anmeldelser",
    setup: "Hele villaen, privat basseng og eget bad til nesten alle rom.",
    childNote: "Egen grunn del i bassenget. Sentralt, men ikke direkte på stranden.",
    nightlyEstimate: [5500, 8000],
    nights: 5,
    url: "https://www.airbnb.com/rooms/1309887487487681433",
    image: "https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTMwOTg4NzQ4NzQ4NzY4MTQzMw%3D%3D/original/210988f7-8f83-4ed2-863b-dfa29f2e82d7.jpeg?im_w=720",
  },
  {
    id: "melina",
    place: "krabi",
    name: "Melina’s Monkey House",
    area: "Khao Thong, Krabi",
    guests: 18,
    bedrooms: 7,
    baths: "6 bad",
    rating: "4,72 · 29 anmeldelser",
    setup: "Strandeiendom med flere bygninger, stort basseng, hage og personale.",
    childNote: "Svært god plass for barna, men ca. 30 minutter fra Ao Nang.",
    nightlyEstimate: [7000, 10500],
    nights: 5,
    url: "https://www.airbnb.com/rooms/20838549",
  },
  {
    id: "malee-pool-6",
    place: "lanta",
    name: "Luxury Pool Villa ved Long Beach",
    area: "Malee Seaview, Long Beach",
    guests: 6,
    bedrooms: 3,
    baths: "2 bad",
    rating: "4,77 · 139 anmeldelser",
    setup: "Romslig familievilla i et velorganisert anlegg, med basseng delt med én nabovilla.",
    childNote: "Babyseng og barnestol er inkludert. Under 100 meter til stranden uten vei å krysse.",
    nightlyEstimate: [2500, 4100],
    nights: 7,
    url: "https://www.airbnb.com/rooms/6171164",
    flexibleUnits: true,
  },
  {
    id: "malee-a1",
    place: "lanta",
    name: "Malee Beach Villa A1",
    area: "Long Beach, Koh Lanta",
    guests: 10,
    bedrooms: 5,
    baths: "3 bad",
    rating: "4,76 · 58 anmeldelser",
    setup: "Strandvilla med privat basseng, fem soverom og restauranter i gangavstand.",
    childNote: "Sterk beliggenhet for familier. For større grupper må den kombineres med en nabovilla.",
    nightlyEstimate: [4500, 7000],
    nights: 7,
    url: "https://www.airbnb.com/rooms/12684964",
    image: "https://a0.muscache.com/im/pictures/hosting/Hosting-12684964/original/1bcde4fe-462c-4547-8bf8-6d5d4458c802.jpeg?im_w=720",
  },
  {
    id: "serena-4br",
    place: "lanta",
    name: "Villa Serena · 4 soverom",
    area: "Klong Khong, Koh Lanta",
    guests: 8,
    bedrooms: 4,
    baths: "4,5 bad",
    rating: "4,42 · 59 anmeldelser",
    setup: "Stor sjøutsiktsvilla med privat infinitybasseng og eget bad til alle soverom.",
    childNote: "God plass for to familier og restauranter i gangavstand. Strøm betales i tillegg.",
    nightlyEstimate: [3200, 5000],
    nights: 7,
    url: "https://www.airbnb.com/rooms/13567544",
  },
  {
    id: "serena",
    place: "lanta",
    name: "Villa Serena",
    area: "Klong Khong, Koh Lanta",
    guests: 12,
    bedrooms: 6,
    baths: "5 bad",
    rating: "4,63 · 16 anmeldelser",
    setup: "Stor villa og separat leilighet, to private basseng og sjøutsikt.",
    childNote: "God for 3 mindre familier. Elektrisitet betales i tillegg.",
    nightlyEstimate: [5200, 7800],
    nights: 7,
    url: "https://www.airbnb.com/rooms/15881265",
    image: "https://a0.muscache.com/im/pictures/prohost-api/Hosting-15881265/original/59195920-6d2f-420c-b8b7-04085b11333f.jpeg?im_w=720",
  },
  {
    id: "manao-2",
    place: "lanta",
    name: "Manao Pool Villa 2",
    area: "Klong Khong, Koh Lanta",
    guests: 8,
    bedrooms: 4,
    baths: "2 bad",
    rating: "4,86 · 49 anmeldelser",
    setup: "Privat bassengvilla i et kompleks med 46 villaer, fem minutters gange fra stranden.",
    childNote: "Svært aktuell for to familier eller som én av flere naboenheter. Strøm betales i tillegg.",
    nightlyEstimate: [2900, 4600],
    nights: 7,
    url: "https://www.airbnb.com/rooms/52994633",
    flexibleUnits: true,
  },
  {
    id: "manao-11",
    place: "lanta",
    name: "Manao Pool Villa 11",
    area: "Klong Khong, Koh Lanta",
    guests: 10,
    bedrooms: 5,
    baths: "2 bad",
    rating: "4,84 · 44 anmeldelser",
    setup: "Fem soverom, privat basseng og takterrasse i samme store Manao-kompleks.",
    childNote: "Blandingen av dobbeltrom, enkeltsenger og køyesenger passer godt for to barnefamilier.",
    nightlyEstimate: [3500, 5500],
    nights: 7,
    url: "https://www.airbnb.com/rooms/51806908",
    flexibleUnits: true,
  },
  {
    id: "manao-pair",
    place: "lanta",
    name: "2–3 Manao-villaer i samme område",
    area: "Klong Khong, Koh Lanta",
    guests: 24,
    bedrooms: 12,
    baths: "6 bad totalt ved 3 villaer",
    rating: "Eksempelvilla: 4,96 · 45 anmeldelser",
    setup: "Separate 4-roms villaer med hvert sitt basseng, i samme villakompleks.",
    childNote: "Mer privatliv per familie og skalerbar kapasitet. Bekreft at 2–3 naboenheter er ledige.",
    nightlyEstimate: [7000, 15000],
    nights: 7,
    url: "https://www.airbnb.com/rooms/556896919357996759",
    flexibleUnits: true,
  },
];

const hotelVisuals: Record<string, string> = {
  "dusit-krabi": "/dusit-krabi.jpg",
  "lanta-sand": "/lanta-sand.jpg",
};

const hotelFallbackVisuals: Record<HotelPlace, string> = {
  krabi: "/resort-family.jpg",
  lanta: "/tropical-resort.jpg",
};

const navItems: Array<{ view: MainView; label: string; icon: string }> = [
  { view: "overview", label: "Oversikt", icon: "⌂" },
  { view: "route", label: "Reise", icon: "↗" },
  { view: "stays", label: "Bosteder", icon: "◇" },
  { view: "budget", label: "Budsjett", icon: "₭" },
  { view: "packing", label: "Pakking", icon: "✓" },
  { view: "tips", label: "Lokale tips", icon: "☼" },
];

const hotels: Hotel[] = [
  {
    id: "holiday-ao-nang",
    place: "krabi",
    name: "Holiday Ao Nang Beach Resort",
    stars: 4,
    area: "Nopparat Thara, Ao Nang",
    beach: "Ca. 50 m – kun veien imellom",
    family: "Barnebasseng, sklier, lekeplass og kids club",
    room: "Familierom 44 m²; kids suite 75 m² med køyeseng",
    pools: "3 basseng + 3 vannsklier",
    price: "€€",
    best: "Enklest totalpakke med små barn",
    watch: "Kids club er oppgitt for 7–12 år; de minste må følges.",
    url: "https://www.holidayresortkrabi.com/",
    pick: "Vårt valg i Ao Nang",
  },
  {
    id: "panan-krabi",
    place: "krabi",
    name: "Panan Krabi Resort",
    stars: 4,
    area: "Sentrale Ao Nang",
    beach: "Ca. 8–10 minutters gange til Ao Nang Beach",
    family: "Eget barnebasseng med vannlek og familievennlige aktiviteter",
    room: "Familierom og stor familiesuite for 2 voksne + 2 barn",
    pools: "Hovedbasseng, barnebasseng og takbasseng",
    price: "€€",
    best: "Mye hotell og svært sentral beliggenhet for pengene",
    watch: "Ikke direkte på stranden; dette er først og fremst et godt basehotell i Ao Nang.",
    url: "https://panankrabiresort.com/",
    pick: "Svært god verdi",
  },
  {
    id: "dusit-krabi",
    place: "krabi",
    name: "Dusit Thani Krabi Beach Resort",
    stars: 5,
    area: "Klong Muang",
    beach: "Direkte på rolig sandstrand",
    family: "Kids club med aktiviteter; barn under 5 med voksen",
    room: "Deluxe-rom og suiter; bekreft plass til to barn",
    pools: "2 strandnære basseng",
    price: "€€€",
    best: "Best strand og klassisk resortfølelse",
    watch: "Ca. 20–25 min fra Ao Nang; mindre å gå til utenfor hotellet.",
    url: "https://www.dusit.com/dusitthani-krabibeachresort/",
  },
  {
    id: "centara-ao-nang",
    place: "krabi",
    name: "Centara Ao Nang Beach Resort & Spa",
    stars: 4,
    area: "Ao Nang Beach",
    beach: "Direkte ved stranden, samtidig nær Ao Nang sentrum",
    family: "Kids club og egne familieresidenser med køyeseng",
    room: "Family Residence 52 m² for 2 voksne + 2 barn",
    pools: "Strandbasseng + hovedbasseng",
    price: "€€€",
    best: "Best kombinasjon av strand, familierom og sentral beliggenhet",
    watch: "Kan koste mer enn andre firestjernershoteller i Ao Nang; sammenlign familiepris, ikke bare rompris.",
    url: "https://www.centarahotelsresorts.com/centara/cnk",
    pick: "Sterk totalpakke",
  },
  {
    id: "centara-grand-krabi",
    place: "krabi",
    name: "Centara Grand Beach Resort & Villas",
    stars: 5,
    area: "Pai Plong Bay, ved Ao Nang",
    beach: "Direkte på privat bukt",
    family: "Barneklubb, barnebasseng og store familierom",
    room: "Rom, familieresidens og villaer",
    pools: "Stort hovedbasseng + barnebasseng",
    price: "€€€€",
    best: "Mest spektakulær beliggenhet",
    watch: "Adkomst hovedsakelig med hotellbåt; mindre praktisk med vogn og små barn.",
    url: "https://www.centarahotelsresorts.com/centaragrand/ckbr",
  },
  {
    id: "lanta-sand",
    place: "lanta",
    name: "Lanta Sand Resort & Spa",
    stars: 4,
    area: "Long Beach",
    beach: "Direkte på Long Beach",
    family: "Familievennlig, barnebasseng og enkel strandhverdag",
    room: "Family Plunge Pool-rom og større villaalternativer",
    pools: "Flere basseng, inkludert ved stranden",
    price: "€€",
    best: "Beste kombinasjon av strand, pris og beliggenhet",
    watch: "Mindre luksuriøst og polert enn femstjernersalternativene.",
    url: "https://www.lantasand.com/",
    pick: "Vårt valg på Koh Lanta",
  },
  {
    id: "long-beach-chalet",
    place: "lanta",
    name: "Long Beach Chalet",
    stars: 4,
    area: "Long Beach",
    beach: "Direkte på en bred del av Long Beach",
    family: "Rolig, oversiktlig resort med strand, basseng og hage",
    room: "Frittstående chaleter og større paviljongrom; bekreft kapasitet for to barn",
    pools: "Basseng ved havet + roligere lagunebasseng",
    price: "€€",
    best: "Boutique-følelse og svært god strand til moderat pris",
    watch: "Mindre klassisk barneresort enn Holiday og Lanta Sand; romkapasiteten varierer.",
    url: "https://www.longbeachchalet.net/",
    pick: "Beste boutique-verdi",
  },
  {
    id: "avani-lanta",
    place: "lanta",
    name: "Avani+ Koh Lanta Krabi Resort",
    stars: 5,
    area: "Kaw Kwang, nord på øya",
    beach: "Egen liten bukt og strand",
    family: "AvaniKids, familieaktiviteter og romslige suiter",
    room: "Familierom, suiter og pool villas",
    pools: "Hovedbasseng + private bassengvalg",
    price: "€€€",
    best: "Moderne femstjerners familiekomfort",
    watch: "Stranden er mindre enn Long Beach og ikke like god for lange strandturer.",
    url: "https://www.avanihotels.com/en/koh-lanta-krabi",
  },
  {
    id: "rawi-warin",
    place: "lanta",
    name: "Rawi Warin Resort & Spa",
    stars: 5,
    area: "Klong Tob, midt på Koh Lanta",
    beach: "Direkte ved Klong Tob Beach",
    family: "Store grøntområder, flere basseng og familievennlige romvalg",
    room: "Rom med to queen-senger, connecting rooms og 2-bedroom suites",
    pools: "Flere basseng, inkludert infinity- og barnevennlige områder",
    price: "€€€",
    best: "Femstjerners resortfølelse uten Pimalai-prisen",
    watch: "Kupert og stort anlegg; noen rom ligger et stykke fra stranden.",
    url: "https://rawiwarin.com/en/",
    pick: "God 5-stjerners verdi",
  },
  {
    id: "pimalai",
    place: "lanta",
    name: "Pimalai Resort & Spa",
    stars: 5,
    area: "Kantiang Bay, sør på øya",
    beach: "Direkte på vakre Kantiang Bay",
    family: "Familieaktiviteter, strandutstyr og store suiter/villaer",
    room: "Suiter og villaer; flere med separat soverom",
    pools: "2 infinitybasseng + private bassengvillaer",
    price: "€€€€",
    best: "Klart mest eksklusivt",
    watch: "Langt sør og høyt prisnivå; mindre praktisk for restauranter andre steder.",
    url: "https://pimalai.com/",
  },
];

type MapPoint = {
  id: string;
  category: MapCategory;
  place: MapPlace;
  title: string;
  subtitle: string;
  detail?: string;
  coordinates: [number, number];
};

const mapVisuals: Record<string, string> = {
  railay: "/railay-beach.jpg",
  nopparat: "/hero-krabi.jpg",
  "aonang-landmark": "/ao-nang-market.jpg",
  "aonang-pier": "/krabi-longtail.jpg",
  elephant: "/asian-elephant-thailand.jpg",
  emerald: "/emerald-pool-new.jpg",
  "klong-dao": "/klong-dao-beach.jpg",
  "long-beach": "/koh-lanta-sunset.jpg",
  "old-town": "/lanta-old-town.jpg",
  "saladan-pier": "/krabi-longtail.jpg",
  "lanta-animal": "/lanta-animal-welfare.jpg",
  "wat-arun": "/wat-arun-new.jpg",
  "chao-phraya": "/wat-arun-new.jpg",
  "children-museum": "/children-museum.jpg",
  "mu-ko-lanta": "/mu-ko-lanta.jpg",
  "tiger-cave": "/tiger-cave-temple.jpg",
};

const hotelCoordinates: Record<string, [number, number]> = {
  "holiday-ao-nang": [98.8131, 8.0463],
  "panan-krabi": [98.8242, 8.0334],
  "dusit-krabi": [98.7478, 8.0638],
  "centara-ao-nang": [98.825257, 8.029002],
  "centara-grand-krabi": [98.8247, 8.0234],
  "lanta-sand": [99.0438, 7.6022],
  "long-beach-chalet": [99.0418, 7.5902],
  "avani-lanta": [99.0317, 7.6514],
  "rawi-warin": [99.04501, 7.55153],
  pimalai: [99.0502, 7.4985],
  "hyatt-bkk": [100.7501, 13.6900],
};

const mapPoints: MapPoint[] = [
  { id: "railay", category: "strand", place: "krabi", title: "Railay Beach", subtitle: "Kort longtail-tur · turens strandhøydepunkt", detail: "Dra tidlig for roligere strand og enklere båttur med små barn.", coordinates: [98.8370, 8.0116] },
  { id: "nopparat", category: "strand", place: "krabi", title: "Nopparat Thara", subtitle: "Rolig strand for en enkel familiedag", coordinates: [98.8077, 8.0435] },
  { id: "aonang-landmark", category: "mat", place: "krabi", title: "Ao Nang Landmark Night Market", subtitle: "Uformell middag · mange valg for barn", coordinates: [98.8092, 8.0478] },
  { id: "aonang-pier", category: "transport", place: "krabi", title: "Nopparat Thara Pier", subtitle: "Utgangspunkt for flere båtturer", coordinates: [98.8020, 8.0553] },
  { id: "elephant", category: "aktivitet", place: "krabi", title: "Elefantreservat", subtitle: "Velg etisk aktør uten riding · ca. halvdag", coordinates: [98.7878, 8.1188] },
  { id: "emerald", category: "aktivitet", place: "krabi", title: "Emerald Pool", subtitle: "Tidlig start anbefales · lengre dagstur", detail: "Kombiner naturstien og bading, men ta med bæremeis fremfor barnevogn.", coordinates: [99.2685, 7.9248] },
  { id: "tiger-cave", category: "aktivitet", place: "krabi", title: "Tiger Cave Temple", subtitle: "Tempelområde nær Krabi by", detail: "Tempelområdet ved foten passer familien; de 1 260 trappetrinnene til toppen er ikke småbarnsvennlige.", coordinates: [98.9247, 8.1263] },
  { id: "hot-springs", category: "aktivitet", place: "krabi", title: "Klong Thom Hot Springs", subtitle: "Varme naturbasseng · kan kombineres med Emerald Pool", detail: "Best som tidlig dagstur. Vannet kan være svært varmt for små barn.", coordinates: [99.2038, 7.9290] },
  { id: "klong-dao", category: "strand", place: "lanta", title: "Klong Dao Beach", subtitle: "Grunt vann · svært barnevennlig", coordinates: [99.0362, 7.6386] },
  { id: "long-beach", category: "strand", place: "lanta", title: "Long Beach", subtitle: "Lang, rolig strand med enkle solnedgangsmiddager", coordinates: [99.0410, 7.5957] },
  { id: "old-town", category: "aktivitet", place: "lanta", title: "Lanta Old Town", subtitle: "Kort halvdag med lunsj og ispause", coordinates: [99.0930, 7.5337] },
  { id: "saladan", category: "mat", place: "lanta", title: "Saladan", subtitle: "Restauranter, butikker og kveldsliv i rolig format", coordinates: [99.0418, 7.6497] },
  { id: "saladan-pier", category: "transport", place: "lanta", title: "Saladan Pier", subtitle: "Båtforbindelser og transferpunkt", coordinates: [99.0401, 7.6525] },
  { id: "lanta-animal", category: "aktivitet", place: "lanta", title: "Lanta Animal Welfare", subtitle: "Besøkssenter · fint for dyreglade barn", coordinates: [99.0597, 7.5901] },
  { id: "mu-ko-lanta", category: "aktivitet", place: "lanta", title: "Mu Ko Lanta nasjonalpark", subtitle: "Fyr, strand og utsikt helt sør på øya", detail: "Fin halvdagstur med bil. Hold mat og løse ting unna apene.", coordinates: [99.0542, 7.4941] },
  { id: "klong-jark", category: "aktivitet", place: "lanta", title: "Khlong Chak-fossen", subtitle: "Kort jungeltur · best etter regntiden", detail: "Stien kan være gjørmete og er ikke egnet for barnevogn.", coordinates: [99.0702, 7.5115] },
  { id: "wat-arun", category: "aktivitet", place: "bangkok", title: "Wat Arun", subtitle: "Tempel ved elven · lett å kombinere med elvebåt", detail: "En kort og visuelt spennende kulturopplevelse. Bruk klær som dekker skuldre og knær.", coordinates: [100.4889, 13.7437] },
  { id: "sea-life", category: "aktivitet", place: "bangkok", title: "SEA LIFE Bangkok Ocean World", subtitle: "Akvarium under Siam Paragon · god plan B i varmen", detail: "Sentralt, innendørs og enkelt med barn i alle aldre. Beregn omtrent 2–3 timer.", coordinates: [100.5352, 13.7462] },
  { id: "iconsiam", category: "mat", place: "bangkok", title: "ICONSIAM", subtitle: "Mat, shopping og elveutsikt under samme tak", detail: "Praktisk med barn: klimaanlegg, mange matvalg og enkel tilgang med båt.", coordinates: [100.5101, 13.7264] },
  { id: "lumpini-park", category: "aktivitet", place: "bangkok", title: "Lumphini Park", subtitle: "Grønn pause med lekeplass og god plass", detail: "Best tidlig morgen eller sen ettermiddag når temperaturen er lavere.", coordinates: [100.5417, 13.7305] },
  { id: "chao-phraya", category: "transport", place: "bangkok", title: "Chao Phraya elvebåt", subtitle: "Både transport og opplevelse", detail: "En enkel måte å se byen på og komme mellom Wat Arun, ICONSIAM og sentrum.", coordinates: [100.5107, 13.7277] },
  { id: "children-museum", category: "aktivitet", place: "bangkok", title: "Children’s Discovery Museum", subtitle: "Interaktiv lek og vannområde ved Chatuchak", detail: "Et familievennlig avbrekk for små barn. Kontroller åpningstider før besøket.", coordinates: [100.5504, 13.8022] },
];

const mapCategoryLabels: Record<MapCategory, string> = {
  hotell: "Hoteller",
  aktivitet: "Aktiviteter",
  strand: "Strender",
  mat: "Mat",
  transport: "Transport",
};

const bangkokMapHotel: MapPoint = {
  id: "hyatt-bkk",
  category: "hotell",
  place: "bangkok",
  title: "Hyatt Regency Bangkok Suvarnabhumi Airport",
  subtitle: "Offisielt flyplasshotell · gratis transfer · basseng · fleksibelt 24-timersopphold",
  detail: "Et praktisk valg for buffernatten før hjemreisen. Airport Rail Link gir forbindelse til sentrum.",
  coordinates: hotelCoordinates["hyatt-bkk"],
};

const mapHotelOptions: MapPoint[] = [
  ...hotels.map((hotel) => ({
    id: hotel.id,
    category: "hotell" as const,
    place: hotel.place,
    title: hotel.name,
    subtitle: `${hotel.stars} stjerner · ${hotel.beach}`,
    detail: hotel.best,
    coordinates: hotelCoordinates[hotel.id],
  })),
  bangkokMapHotel,
];

function NearbyMap({ selectedHotelId, onSelectHotel }: { selectedHotelId: string; onSelectHotel: (id: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LeafletMarker[]>([]);
  const [categories, setCategories] = useState<MapCategory[]>(["hotell", "aktivitet", "strand", "mat", "transport"]);
  const [activePoint, setActivePoint] = useState<MapPoint | null>(null);
  const [mapError, setMapError] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const selectedHotel = mapHotelOptions.find((hotel) => hotel.id === selectedHotelId) ?? mapHotelOptions[0];

  const points = useMemo<MapPoint[]>(() => [
    ...mapHotelOptions,
    ...mapPoints,
  ], []);

  useEffect(() => {
    let cancelled = false;
    if (!containerRef.current || mapRef.current) return;

    void import("leaflet").then((leafletModule) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const L = leafletModule.default;
      const [lng, lat] = selectedHotel.coordinates;
      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: false,
      }).setView([lat, lng], selectedHotel.place === "bangkok" ? 11 : selectedHotel.place === "krabi" ? 11 : 12);

      // Use a label-free base map so Thai place names never leak through from
      // the tile provider. All useful labels are rendered by the app in
      // English below, which keeps the map consistent across browsers.
      const tiles = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        attribution: "© OpenStreetMap contributors · © CARTO",
        maxZoom: 19,
      });
      tiles.on("tileerror", () => setMapError(true));
      tiles.on("tileload", () => setMapError(false));
      tiles.addTo(map);
      mapRef.current = map;
      setMapReady(true);
      window.setTimeout(() => map.invalidateSize(), 50);
    }).catch(() => setMapError(true));

    return () => {
      cancelled = true;
      setMapReady(false);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    void import("leaflet").then((leafletModule) => {
      const L = leafletModule.default;
      points.filter((point) => categories.includes(point.category)).forEach((point) => {
        const symbol = point.category === "hotell" ? "H" : point.category === "strand" ? "≈" : point.category === "mat" ? "M" : point.category === "transport" ? "→" : "●";
        const icon = L.divIcon({
          className: "",
          html: `<button type="button" class="map-marker map-marker-${point.category}${point.id === selectedHotelId ? " selected" : ""}" aria-label="${point.title.replaceAll('"', "&quot;")}"><span>${symbol}</span></button>`,
          iconSize: [43, 43],
          iconAnchor: [21, 43],
        });
        const [lng, lat] = point.coordinates;
        const marker = L.marker([lat, lng], { icon }).addTo(map);
        marker.bindTooltip(`<strong>${point.title}</strong><br><span>${mapCategoryLabels[point.category]}</span>`, {
          permanent: true,
          direction: "right",
          offset: [14, -20],
          className: "map-place-label",
        });
        marker.on("click", () => {
          setActivePoint(point);
          if (point.category === "hotell") onSelectHotel(point.id);
        });
        markersRef.current.push(marker);
      });
    }).catch(() => setMapError(true));
  }, [categories, mapReady, onSelectHotel, points, selectedHotelId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const [lng, lat] = selectedHotel.coordinates;
    map.flyTo([lat, lng], selectedHotel.place === "bangkok" ? 11 : selectedHotel.place === "krabi" ? 12 : 13, { duration: .9 });
    setActivePoint(selectedHotel);
  }, [mapReady, selectedHotel.id, selectedHotel.place, selectedHotelId]);

  const toggleCategory = (category: MapCategory) => {
    setCategories((current) => current.includes(category) ? current.filter((item) => item !== category) : [...current, category]);
  };

  const activePointImage = activePoint
    ? activePoint.category === "hotell"
      ? hotelVisuals[activePoint.id]
      : mapVisuals[activePoint.id]
    : undefined;

  return (
    <section className="nearby-map" aria-labelledby="kart-tittel">
      <div className="nearby-map-copy">
        <div>
          <p className="section-number">03 / UTFORSK OMRÅDENE</p>
          <h2 id="kart-tittel">Hva finnes<br />rundt hotellet?</h2>
        </div>
        <p className="section-note">Velg et hotell, filtrer kartet og trykk på et navngitt sted. Da får du bilde, kort informasjon og lenke til Google Maps.</p>
      </div>
      <div className="map-hotel-picker" aria-label="Velg hotell som utgangspunkt">
        {mapHotelOptions.map((hotel) => (
          <button type="button" className={hotel.id === selectedHotelId ? "active" : ""} onClick={() => onSelectHotel(hotel.id)} key={hotel.id}>
            <span>{hotel.place === "krabi" ? "Krabi" : hotel.place === "lanta" ? "Koh Lanta" : "Bangkok"}</span>
            {hotel.title}
          </button>
        ))}
      </div>
      <div className="map-shell">
        <div className="map-toolbar" aria-label="Kartfiltre">
          {(Object.keys(mapCategoryLabels) as MapCategory[]).map((category) => (
            <button type="button" className={categories.includes(category) ? "active" : ""} aria-pressed={categories.includes(category)} onClick={() => toggleCategory(category)} key={category}>
              <i className={`legend-dot legend-${category}`} aria-hidden="true" />
              {mapCategoryLabels[category]}
            </button>
          ))}
        </div>
        <div className="map-canvas" ref={containerRef} aria-label={`Kart rundt ${selectedHotel.title}`} />
        {mapError && (
          <div className="map-fallback" role="status">
            <strong>Kartet kunne ikke lastes akkurat nå</strong>
            <p>Du kan fortsatt åpne området rundt valgt hotell i Google Maps.</p>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedHotel.title + ", Thailand")}`} target="_blank" rel="noreferrer">
              Åpne kartet
            </a>
          </div>
        )}
        <div className={`map-info-card ${activePoint ? "visible" : ""}`} aria-live="polite">
          {activePoint && (
            <>
              {activePointImage && (
                <img
                  className="map-info-image"
                  src={imageUrl(activePointImage)}
                  alt={`${activePoint.title} i Thailand`}
                />
              )}
              <div className="map-info-copy">
                <button type="button" className="map-card-close" aria-label="Lukk informasjonskort" onClick={() => setActivePoint(null)}>×</button>
                <span>{mapCategoryLabels[activePoint.category]} · {activePoint.place === "krabi" ? "Krabi" : activePoint.place === "lanta" ? "Koh Lanta" : "Bangkok"}</span>
                <strong>{activePoint.title}</strong>
                <p>{activePoint.subtitle}</p>
                {activePoint.detail && <small>{activePoint.detail}</small>}
                <a className="map-card-link" href={`https://www.google.com/maps/search/?api=1&query=${activePoint.coordinates[1]},${activePoint.coordinates[0]}`} target="_blank" rel="noreferrer">Åpne i Google Maps ↗</a>
              </div>
            </>
          )}
        </div>
      </div>
      <p className="map-note">Stedsnavnene i kartet er lagt inn på engelsk. Kontroller åpningstider, hentepunkt og faktisk reisetid før bestilling.</p>
    </section>
  );
}

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
      { id: "r-river", place: "Bangkok", title: "Elvebåt og Wat Arun", duration: "3 timer", age: "Vognvennlig i deler", cost: 850, category: "kultur", durationGroup: "halvdag", minAge: 0 },
      { id: "r-aquarium", place: "Bangkok", title: "SEA LIFE Bangkok Ocean World", duration: "3–4 timer", age: "Perfekt i varmen", cost: 1500, category: "inne", durationGroup: "halvdag", minAge: 0 },
      { id: "r-play", place: "Bangkok", title: "Innendørs lekeland og lunsj", duration: "2–3 timer", age: "God jetlag-dag", cost: 900, category: "inne", durationGroup: "kort", minAge: 1 },
      { id: "r-turtle", place: "Khao Lak", title: "Skilpaddesenter", duration: "2 timer", age: "Kort og enkelt", cost: 450, category: "dyr", durationGroup: "kort", minAge: 0 },
      { id: "r-amazon", place: "Khao Lak", title: "Little Amazon-kanotur", duration: "2–3 timer", age: "Sjekk redningsvest", cost: 1100, category: "natur", durationGroup: "halvdag", minAge: 2 },
      { id: "r-phangnga", place: "Khao Lak", title: "Privat Phang Nga-båttur", duration: "5–6 timer", age: "Velg rolig sjø", cost: 3200, category: "båt", durationGroup: "heldag", minAge: 3 },
      { id: "r-cooking", place: "Khao Lak", title: "Familievennlig matkurs", duration: "3 timer", age: "Morsomst fra ca. 4 år", cost: 1700, category: "kultur", durationGroup: "halvdag", minAge: 4 },
      { id: "r-beach", place: "Khao Lak", title: "Stranddag med longtail-piknik", duration: "4 timer", age: "Rolig og fleksibelt", cost: 800, category: "strand", durationGroup: "halvdag", minAge: 0 },
      { id: "r-waterfall", place: "Khao Lak", title: "Sai Rung-fossen og ispause", duration: "2–3 timer", age: "Bæresele for de minste", cost: 650, category: "natur", durationGroup: "kort", minAge: 2 },
    ],
  },
  {
    id: "balansert",
    eyebrow: "Vår anbefaling",
    title: "Strand først, Bangkok sist",
    places: "Krabi · Koh Lanta · Bangkok",
    nights: "5 + 7 + 1 natt",
    transfers: "5 fly + 1 bil/båt",
    budget: "fra ca. 105 000 kr",
    color: "teal",
    verdict: "Kjevik–København–Krabi på utreisen, og en lang mellomlanding med overnatting i Bangkok på hjemreisen.",
    pace: "Rolig variasjon",
    stays: [
      { days: "Dag 1–6", place: "Krabi / Ao Nang", nights: "5 netter", copy: "Fly Kjevik–København og videre direkte til Krabi. Bruk første dag til å lande, og ta Railay når alle har sovet ut.", tag: "Rett til stranden" },
      { days: "Dag 6–13", place: "Koh Lanta", nights: "7 netter", copy: "Long Beach eller Klong Dao gir rolig strand, restauranter i nærheten og korte kvelder hjem.", tag: "Feriemodus" },
      { days: "Dag 13–14", place: "Bangkok flyplass", nights: "1 natt", copy: "Kveldsfly fra Krabi gir 13 t 05 min på Bangkok lufthavn. Overnatt ved flyplassen før langdistanseflyet kl. 12:35.", tag: "Overnatting i mellomlandingen" },
    ],
    legs: [
      { from: "Kjevik (KRS)", to: "København (CPH)", mode: "Fly · utreise", time: "14:55–15:50 · 55 min", note: "Første etappe fra Kristiansand. Dere har 8 timer i København før neste fly." },
      { from: "København (CPH)", to: "Krabi (KBV)", mode: "Direktefly · utreise", time: "23:50–17:00 (+1) · 11 t 10 min", note: "Direkte nattfly til Krabi. Ankomst kl. 17:00 lokal tid dagen etter." },
      { from: "Krabi flyplass", to: "Ao Nang", mode: "Privat bil", time: "ca. 45 min", note: "Avtal bilsete og plass til barnevogn på forhånd." },
      { from: "Ao Nang", to: "Koh Lanta", mode: "Privat minivan + bilferge", time: "ca. 2,5–3,5 t", note: "Dør-til-dør er enklere enn speedbåt med to små barn og bagasje." },
      { from: "Koh Lanta", to: "Krabi flyplass", mode: "Privat minivan", time: "ca. 2–3 t", note: "Beregn ekstra fergetid og trafikk før ettermiddagsflyet til Bangkok." },
      { from: "Krabi (KBV)", to: "Bangkok (BKK)", mode: "Fly · hjemreise", time: "22:00–23:30 · 1 t 30 min", note: "Bangkok Airways PG264. Deretter 13 t 05 min mellom flygningene – passende for overnatting ved flyplassen." },
      { from: "Bangkok (BKK)", to: "København (CPH)", mode: "Langdistansefly · hjemreise", time: "12:35–19:05 · 12 t 30 min", note: "SAS SK974, Airbus A350-900. Etter ankomst er det 4 timer til Kjevik-flyet." },
      { from: "København (CPH)", to: "Kjevik (KRS)", mode: "Fly · hjemreise", time: "23:05–00:00 (+1) · 55 min", note: "SAS SK2988, operert av CityJet. Dere lander på Kjevik ved midnatt." },
    ],
    costs: { international: 53470, domestic: 5000, hotel: 30000, food: 10200, local: 3200, buffer: 4500 },
    activities: [
      { id: "b-river", place: "Bangkok", title: "Elvebåt og Wat Arun", duration: "3 timer", age: "Hvis flytidene passer", cost: 850, category: "kultur", durationGroup: "halvdag", minAge: 0 },
      { id: "b-aquarium", place: "Bangkok", title: "SEA LIFE Bangkok Ocean World", duration: "3–4 timer", age: "Hvis dere har en halvdag", cost: 1500, category: "inne", durationGroup: "halvdag", minAge: 0 },
      { id: "b-railay", place: "Krabi", title: "Morgen på Railay Beach", duration: "4 timer", age: "Kort båttur", cost: 1200, category: "strand", durationGroup: "halvdag", minAge: 0 },
      { id: "b-klong", place: "Krabi", title: "Mangrove og Ko Klang", duration: "4 timer", age: "Rolig tempo", cost: 1600, category: "natur", durationGroup: "halvdag", minAge: 2 },
      { id: "b-elephant", place: "Krabi", title: "Etisk elefantreservat uten riding", duration: "3 timer", age: "Velg liten gruppe", cost: 2600, category: "dyr", durationGroup: "halvdag", minAge: 3 },
      { id: "b-emerald", place: "Krabi", title: "Emerald Pool tidlig morgen", duration: "5 timer", age: "Bæresele for de minste", cost: 1900, category: "natur", durationGroup: "heldag", minAge: 3 },
      { id: "b-oldtown", place: "Koh Lanta", title: "Old Town + ispause", duration: "2–3 timer", age: "Enkel halvdag", cost: 500, category: "kultur", durationGroup: "kort", minAge: 0 },
      { id: "b-longtail", place: "Koh Lanta", title: "Privat longtail-båt", duration: "5 timer", age: "Væravhengig", cost: 3300, category: "båt", durationGroup: "heldag", minAge: 3 },
      { id: "b-beach", place: "Koh Lanta", title: "Klong Dao stranddag", duration: "Fleksibelt", age: "Grunt vann og god plass", cost: 500, category: "strand", durationGroup: "kort", minAge: 0 },
      { id: "b-cooking", place: "Koh Lanta", title: "Familievennlig matkurs", duration: "3 timer", age: "Morsomst fra ca. 4 år", cost: 1800, category: "kultur", durationGroup: "halvdag", minAge: 4 },
      { id: "b-play", place: "Krabi", title: "Lekekafé og rolig lunsj", duration: "2 timer", age: "Fin regnværsplan", cost: 600, category: "inne", durationGroup: "kort", minAge: 1 },
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
      { id: "o-river", place: "Bangkok", title: "Elvebåt og Wat Arun", duration: "3 timer", age: "Vognvennlig i deler", cost: 850, category: "kultur", durationGroup: "halvdag", minAge: 0 },
      { id: "o-aquarium", place: "Bangkok", title: "SEA LIFE Bangkok Ocean World", duration: "3–4 timer", age: "Perfekt i varmen", cost: 1500, category: "inne", durationGroup: "halvdag", minAge: 0 },
      { id: "o-temple", place: "Chiang Mai", title: "Doi Suthep med privat bil", duration: "4 timer", age: "Mange trapper", cost: 1200, category: "kultur", durationGroup: "halvdag", minAge: 2 },
      { id: "o-sticky", place: "Chiang Mai", title: "Sticky Waterfall-halvdag", duration: "4–5 timer", age: "Best fra ca. 4 år", cost: 1800, category: "natur", durationGroup: "heldag", minAge: 4 },
      { id: "o-market", place: "Chiang Mai", title: "Tidlig kveld på marked", duration: "2 timer", age: "Ta med bæresele", cost: 500, category: "kultur", durationGroup: "kort", minAge: 0 },
      { id: "o-elephant", place: "Chiang Mai", title: "Etisk elefantreservat uten riding", duration: "5 timer", age: "Velg barnevennlig opplegg", cost: 2900, category: "dyr", durationGroup: "heldag", minAge: 3 },
      { id: "o-craft", place: "Chiang Mai", title: "Kreativt verksted for familien", duration: "2 timer", age: "Rolig innendørsaktivitet", cost: 900, category: "inne", durationGroup: "kort", minAge: 2 },
      { id: "o-turtle", place: "Khao Lak", title: "Skilpaddesenter", duration: "2 timer", age: "Kort og enkelt", cost: 450, category: "dyr", durationGroup: "kort", minAge: 0 },
      { id: "o-beach", place: "Khao Lak", title: "Rolig stranddag med piknik", duration: "Fleksibelt", age: "Passer alle aldre", cost: 600, category: "strand", durationGroup: "kort", minAge: 0 },
      { id: "o-boat", place: "Khao Lak", title: "Privat Phang Nga-båttur", duration: "5–6 timer", age: "Velg rolig sjø", cost: 3200, category: "båt", durationGroup: "heldag", minAge: 3 },
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
const splitAmount = (amount: number, shares: Array<[string, number]>) =>
  shares.map(([label, share]) => ({ label, amount: amount * share }));
const categoryLabels: Record<ActivityCategory, string> = {
  strand: "Strand",
  båt: "Båt",
  natur: "Natur",
  dyr: "Dyr",
  kultur: "Kultur",
  inne: "Innendørs",
};

const packingBase: Record<PackingBag, PackingItem[]> = {
  checked: [
    { id: "tshirts", label: "5–7 T-skjorter eller topper", reason: "Pustende stoff tørker raskt og er mest behagelig i varmen.", category: "clothes" },
    { id: "shorts", label: "3–5 shorts", category: "clothes" },
    { id: "light-trousers", label: "1–2 lette bukser", reason: "Nyttig mot sol, mygg og ved tempelbesøk.", category: "clothes" },
    { id: "sweater", label: "1 tynn genser eller cardigan", category: "clothes" },
    { id: "underwear", label: "7–9 undertøy", reason: "Pakk for omtrent én uke og planlegg én vask underveis.", category: "clothes" },
    { id: "socks", label: "3–5 par sokker", category: "clothes" },
    { id: "sleepwear", label: "2 lette pysjamaser / nattøy", category: "sleep" },
    { id: "restaurant-outfit", label: "1–2 lette antrekk til restaurant", category: "clothes" },
    { id: "swimwear", label: "2–3 sett badetøy", reason: "Da rekker ett sett å tørke mens et annet brukes.", category: "swim" },
    { id: "rashguard", label: "UV-trøye", reason: "Særlig nyttig på lange strand- og båtdager.", category: "swim" },
    { id: "sun-hat", label: "Solhatt eller caps", category: "swim" },
    { id: "sunglasses", label: "Solbriller", category: "swim" },
    { id: "beach-bag", label: "Sammenleggbar strandveske", category: "swim" },
    { id: "sandals", label: "Sandaler eller slippers", category: "shoes" },
    { id: "walking-shoes", label: "Lette gåsko / joggesko", category: "shoes" },
    { id: "training-clothes", label: "2–3 sett løpetøy / treningstøy", reason: "For morgentur, hotellgym eller en aktiv utflukt. Teknisk tøy kan skylles og tørker raskt.", category: "training" },
    { id: "training-socks", label: "3–4 par trenings- eller løpesokker", category: "training" },
    { id: "running-shoes", label: "Løpesko eller treningssko", reason: "Pakk dem du allerede vet fungerer – varme og fuktighet er en dårlig anledning til å gå inn nye sko.", category: "training" },
    { id: "training-bottle", label: "Løpebelte eller liten drikkeflaske", reason: "Varmen og luftfuktigheten gjør korte turer mer væskekrevende enn hjemme.", category: "training" },
    { id: "haircare", label: "Sjampo, balsam, hårbørste og hårprodukter", category: "toiletries" },
    { id: "deodorant", label: "Deodorant", category: "toiletries" },
    { id: "skincare", label: "Hudpleie og leppepomade", category: "toiletries" },
    { id: "sunscreen", label: "Solkrem til kropp og ansikt", reason: "Ta med nok av variantene dere vet at huden tåler.", category: "health" },
    { id: "aftersun", label: "Aftersun eller fuktighetskrem", category: "health" },
    { id: "mosquito", label: "Myggmiddel", category: "health" },
    { id: "first-aid", label: "Lite reiseapotek", reason: "Plaster, sårvask, smertestillende og det dere vanligvis trenger.", category: "health" },
    { id: "rain", label: "Lett regnponcho", category: "practical" },
    { id: "laundry-bag", label: "Pose til skittentøy", category: "practical" },
    { id: "packing-cubes", label: "Pakkeposer / packing cubes", category: "practical" },
    { id: "daypack", label: "Liten dagstursekk", category: "practical" },
    { id: "adapter", label: "Reiseadapter og ekstra ladere", category: "tech" },
    { id: "sports-watch-charger", label: "Treningsklokke / pulsklokke og lader", category: "training" },
  ],
  cabin: [
    { id: "passport", label: "Pass", reason: "Kontroller gyldighet og innreisekrav nærmere avreise.", category: "documents" },
    { id: "tickets", label: "Flybilletter, hotell og transfer offline", category: "documents" },
    { id: "insurance", label: "Reiseforsikring og alarmsentral", category: "documents" },
    { id: "bankcards", label: "Bankkort og litt reservebetaling", reason: "Fordel kortene mellom to voksne.", category: "documents" },
    { id: "medication", label: "Faste medisiner i originalemballasje", reason: "Nok til hele reisen, pluss margin. Må ikke sjekkes inn.", category: "health" },
    { id: "small-health-kit", label: "Smertestillende, plaster og nødvendigheter til flydøgnet", category: "health" },
    { id: "change", label: "Ett komplett klesskift", reason: "Også nyttig dersom innsjekket bagasje blir forsinket.", category: "clothes" },
    { id: "underwear-cabin", label: "Ekstra undertøy og sokker", category: "clothes" },
    { id: "warm-layer", label: "Tynn genser til flyet", category: "clothes" },
    { id: "compression", label: "Eventuelle støttestrømper", category: "flight" },
    { id: "phone", label: "Telefon og ladekabel", category: "tech" },
    { id: "powerbank", label: "Powerbank", reason: "Skal normalt ligge i håndbagasjen, ikke i innsjekket koffert.", category: "tech" },
    { id: "headphones", label: "Hodetelefoner", category: "tech" },
    { id: "downloads", label: "Nedlastede filmer, bøker og musikk", category: "tech" },
    { id: "snacks", label: "Snacks til flyreisen", category: "flight" },
    { id: "water-bottle", label: "Tom drikkeflaske", category: "flight" },
    { id: "running-light", label: "Liten refleks eller løpelys", reason: "Tidlig morgen er ofte best for løping i Thailand, men det kan fortsatt være mørkt og trafikken er uvant.", category: "training" },
    { id: "neck-pillow", label: "Nakkepute ved behov", category: "flight" },
    { id: "sleep-mask", label: "Sovemaske og ørepropper", category: "sleep" },
    { id: "toothbrush-cabin", label: "Tannbørste, tanntråd og liten tannkrem", reason: "Pakk hele tannsettet her, så det ikke telles én gang til i kofferten.", category: "toiletries" },
    { id: "wipes", label: "Våtservietter og hånddesinfeksjon", category: "toiletries" },
    { id: "valuables", label: "Smykker og andre verdisaker", reason: "Legg aldri viktige verdisaker i innsjekket bagasje.", category: "documents" },
  ],
};

const packingChildBase: Record<PackingBag, PackingItem[]> = {
  checked: [
    { id: "child-light-trousers", label: "1–2 lette langbukser", reason: "Beskytter mot sol, mygg og sterk aircondition.", category: "clothes" },
    { id: "child-sweater", label: "1 tynn genser", category: "clothes" },
    { id: "child-sleepwear", label: "2 lette pysjamaser", category: "sleep" },
    { id: "child-swimwear", label: "2–3 sett badetøy", reason: "Da kan ett sett tørke mens et annet brukes.", category: "swim" },
    { id: "child-rashguard", label: "2 UV-trøyer", reason: "Gjør solbeskyttelsen enklere på strand- og båtdager.", category: "swim" },
    { id: "child-sun-hat", label: "Solhatt eller caps med god skygge", category: "swim" },
    { id: "child-sunglasses", label: "Solbriller som sitter godt", category: "swim" },
    { id: "child-sandals", label: "Sandaler som tåler vann", category: "shoes" },
    { id: "child-walking-shoes", label: "Lette joggesko", category: "shoes" },
    { id: "child-haircare", label: "Hårbørste, strikker og mild sjampo ved behov", category: "toiletries" },
    { id: "child-sunscreen", label: "Barnesolkrem dere vet at huden tåler", reason: "Ta med nok til de første dagene; kjente produkter reduserer risikoen for hudreaksjoner.", category: "health" },
    { id: "child-mosquito", label: "Alderstilpasset myggmiddel", reason: "Kontroller aldersgrensen på produktet.", category: "health" },
    { id: "child-first-aid", label: "Felles barneapotek", reason: "Pakkes én gang per familie: febertermometer, plaster og det dere normalt bruker – dosert for barnas alder og vekt.", category: "health" },
    { id: "child-rain", label: "Lett regnponcho", category: "practical" },
    { id: "child-laundry-bag", label: "Pose til vått og skittent tøy", category: "practical" },
  ],
  cabin: [
    { id: "child-passport", label: "Barnets pass", reason: "Oppbevares av en voksen og kontrolleres mot gjeldende innreisekrav.", category: "documents" },
    { id: "child-documents", label: "Billetter, forsikring og eventuelle samtykkedokumenter offline", category: "documents" },
    { id: "child-medication-cabin", label: "Faste medisiner i originalemballasje", reason: "Nok til hele reisen, pluss margin. Skal ikke ligge i innsjekket bagasje.", category: "health" },
    { id: "child-warm-layer", label: "Tynn genser og sokker til flyet", category: "clothes" },
    { id: "child-snacks", label: "Kjente snacks og mat til flydøgnet", category: "flight" },
    { id: "child-water-bottle", label: "Tom drikkeflaske", category: "flight" },
    { id: "child-entertainment-basic", label: "Rolige aktiviteter tilpasset alderen", category: "flight" },
    { id: "child-toothbrush-cabin", label: "Barnets tannbørste og vanlige tannkrem", reason: "Pakkes i håndbagasjen og telles derfor ikke i kofferten.", category: "toiletries" },
    { id: "child-wipes", label: "Våtservietter og poser til søl eller vått tøy", category: "toiletries" },
  ],
};

const packingCategoryLabels: Record<PackingCategory, { label: string; icon: string }> = {
  clothes: { label: "Klær", icon: "◌" },
  shoes: { label: "Sko", icon: "◇" },
  training: { label: "Trening & løpetur", icon: "↗" },
  swim: { label: "Bad, strand & sol", icon: "☼" },
  toiletries: { label: "Hygiene & toalettmappe", icon: "✦" },
  sleep: { label: "Søvn & komfort", icon: "☾" },
  health: { label: "Helse & medisiner", icon: "+" },
  documents: { label: "Dokumenter & verdisaker", icon: "▣" },
  flight: { label: "Mat & komfort på flyet", icon: "→" },
  tech: { label: "Elektronikk", icon: "⌁" },
  practical: { label: "Praktisk utstyr", icon: "□" },
};

function personalizedPacking(traveler: PackingTraveler, bag: PackingBag): PackingItem[] {
  // Barn og voksne må starte med ulike grunnlister. En voksenliste med
  // barnepunkter lagt oppå gir irrelevante forslag som deodorant til småbarn.
  const items = [...(traveler.kind === "child" ? packingChildBase[bag] : packingBase[bag])];
  const add = (id: string, label: string, category: PackingCategory, reason?: string) => items.push({ id, label, reason, category });
  if (traveler.kind === "child") {
    if (traveler.age === 0) {
      if (bag === "checked") {
        add("infant-diapers", "Bleier og badebleier til de første dagene", "toiletries", "Beregn vanlig døgnforbruk pluss ekstra margin. Resten kan vanligvis kjøpes lokalt.");
        add("infant-changing", "Stellemappe, sinksalve og mild vask", "toiletries");
        add("infant-clothes", "8–12 bodyer og 6–8 lette underdeler", "clothes", "Spedbarn trenger flere reserveplagg i varme og på lange reisedøgn.");
        add("infant-sleepwear", "3–4 lette pysjamaser", "sleep");
        add("infant-sleep", "Sovepose, smokker og kjent sovestøtte", "sleep");
        add("infant-stroller", "Reisetrille med solskjerm, regntrekk og myggnett", "practical");
        add("infant-carrier", "Bæresele eller bæresjal", "practical", "Praktisk på flyplass, båt, trapper og steder der vogn er vanskelig.");
        add("infant-bibs", "6–8 gulpekluter og smekker", "clothes");
        add("infant-feeding-checked", "Flasker, flaskebørste og utstyr til mating", "toiletries", "Tilpass etter amming, morsmelkerstatning eller fast føde.");
        add("infant-sterilising", "Reiseløsning for rengjøring/sterilisering", "toiletries", "Bare hvis dere bruker flasker eller pumpeutstyr.");
      } else {
        add("infant-diaper-cabin", "Bleier til hele flydøgnet + minst 4 ekstra", "toiletries");
        add("infant-change-cabin", "4 komplette skift + ekstra klær til en voksen", "clothes", "Søl og lekkasjer rammer ofte også den som holder barnet.");
        add("infant-feeding-cabin", "Melk/mat til reisen + forsinkelsesmargin", "flight");
        add("infant-bottles-cabin", "Rene flasker, smokker og gulpekluter", "flight");
        add("infant-changing-cabin", "Våtservietter, stelleunderlag og poser til skittentøy", "toiletries");
        add("infant-comfort-cabin", "Kjent koseklut, smokk og sovestøtte", "sleep");
        add("infant-medicine-cabin", "Nødvendige medisiner og doseringsutstyr", "health", "Oppbevares hos en voksen og tilpasses barnets behov.");
        add("infant-blanket-cabin", "Lett teppe eller stor muslinklut", "sleep");
        add("infant-toys-cabin", "2–3 små, stille leker", "flight");
      }
    } else if (traveler.age <= 2) {
      if (bag === "checked") {
        add("diapers", "Bleier og badebleier til de første dagene", "toiletries", "Resten kan vanligvis kjøpes lokalt.");
        add("sleep", "Sovepose, smokk og kjent sovestøtte", "sleep");
        add("stroller", "Reisetrille, regntrekk og myggnett", "practical");
        add("baby-clothes", "8–10 bodyer / lette overdeler", "clothes");
        add("baby-bottoms", "5–7 shorts eller lette bukser", "clothes");
        add("baby-bibs", "4–6 smekker", "clothes");
      } else {
        add("diaper-kit", "Bleier, våtservietter, poser og stelleunderlag", "toiletries");
        add("baby-food", "Barnemat/melk og ekstra mellommåltider", "flight");
        add("two-changes", "2–3 komplette klesskift", "clothes");
        add("comfort", "Smokk, koseklut eller annen kjent sovestøtte", "sleep", "Velg det barnet faktisk bruker; dette er ett samlet punkt.");
      }
    } else if (traveler.age <= 5) {
      if (bag === "checked") {
        add("child-tshirts", "7–9 T-skjorter / topper", "clothes");
        add("child-shorts", "5–7 shorts / lette underdeler", "clothes");
        add("child-underwear", "8–10 undertøy", "clothes");
        add("float-aid", "Egen flytevest eller svømmehjelp", "swim");
        add("night-light", "Lite nattlys", "sleep");
        add("favorite-toy", "Én kjent leke eller bok", "sleep");
      } else {
        add("two-changes", "2–3 komplette klesskift", "clothes", "Små barn søler oftere og kan bli våte på reisen.");
        add("activities", "Klistremerker, tegnesaker og små aktiviteter", "flight");
        add("comfort", "Kosebamse eller annen sovestøtte", "sleep");
      }
    } else if (traveler.age <= 12) {
      if (bag === "checked") {
        add("school-clothes", "7 T-skjorter, 4–5 shorts og 8 undertøy", "clothes");
        add("water-shoes", "Badesko eller sportssandaler", "shoes");
      }
      else {
        add("school-change", "1 komplett klesskift", "clothes", "Nyttig ved søl eller forsinket bagasje.");
        add("entertainment", "Nedlastet underholdning og egne hodetelefoner", "tech");
        add("small-bag", "Liten sekk barnet kan bære selv", "practical");
        add("school-comfort", "Kosegjenstand eller reisepute ved behov", "sleep");
      }
    } else {
      if (bag === "checked") {
        add("teen-clothes", "6–8 T-skjorter/topper, 4–5 shorts og undertøy for én uke", "clothes");
        add("activity-shoes", "Sko og klær til trening eller utflukter", "shoes");
        add("teen-deodorant", "Deodorant og personlige hygieneprodukter", "toiletries");
      }
      else {
        add("teen-change", "1 komplett klesskift", "clothes", "Nyttig dersom innsjekket bagasje blir forsinket.");
        add("own-tech", "Egen elektronikk, ladere og hodetelefoner", "tech");
        add("teen-toiletries", "Personlige hygieneartikler for reisedøgnet", "toiletries");
      }
    }
  } else {
    if (traveler.age >= 60) {
      if (bag === "checked") add("supportive-shoes", "Ekstra gode gåsko", "shoes");
      else add("prescription-copy", "Medisinliste/reseptkopi og ekstra medisiner", "health");
    } else if (traveler.age <= 25) {
      if (bag === "checked") add("going-out", "Et ekstra lett antrekk til restaurant eller kveld", "clothes");
      else add("tech-backup", "Ekstra ladekabel og nedlastet underholdning", "tech");
    }
    if (traveler.gender === "female") {
      if (bag === "checked") {
        add("dresses", "1–3 kjoler eller skjørt ved behov", "clothes");
        add("bras", "2–4 BH-er / topper", "clothes");
        add("period-products", "Foretrukne menstruasjonsprodukter", "toiletries");
        add("sports-bra", "1–2 sports-BH-er / treningstopper ved trening", "training");
      } else add("hair-ties", "Hårstrikk og små hygieneartikler", "toiletries");
    }
    if (traveler.gender === "male" && bag === "checked") {
      add("shirts", "1–2 skjorter / penere overdeler", "clothes");
      add("grooming", "Barberutstyr ved behov", "toiletries");
    }
  }
  // Sikkerhetsnett mot overlappende personaliseringsregler.
  return items.filter((item, index, all) =>
    all.findIndex((candidate) => candidate.id === item.id) === index
  );
}

export default function Home() {
  const [mainView, setMainView] = useState<MainView>("overview");
  const [stayView, setStayView] = useState<StayView>("hotels");
  const [tipsPlace, setTipsPlace] = useState<HotelPlace>("krabi");
  const routeId: RouteId = "balansert";
  const [detailTab, setDetailTab] = useState<DetailTab>("rute");
  const [comfort, setComfort] = useState<ComfortId>("komfort");
  const [includeFlights, setIncludeFlights] = useState(true);
  const [month, setMonth] = useState("");
  const [selectedActivities, setSelectedActivities] = useState<string[]>(selectedByDefault);
  const [hotelPlace, setHotelPlace] = useState<HotelPlace>("krabi");
  const [shortlist, setShortlist] = useState<string[]>(["holiday-ao-nang", "dusit-krabi"]);
  const [mapHotelId, setMapHotelId] = useState("holiday-ao-nang");
  const [adultCount, setAdultCount] = useState(2);
  const [childAges, setChildAges] = useState<number[]>([2, 4]);
  const [sharedStay, setSharedStay] = useState(false);
  const [villaMode, setVillaMode] = useState<VillaMode>("shared");
  const [familyCount, setFamilyCount] = useState(3);
  const [groupAdults, setGroupAdults] = useState(8);
  const [groupChildren, setGroupChildren] = useState(7);
  const [activityCategories, setActivityCategories] = useState<ActivityCategory[]>([]);
  const [activityPlace, setActivityPlace] = useState("alle");
  const [activityDuration, setActivityDuration] = useState<"alle" | ActivityDuration>("alle");
  const [suitableForAll, setSuitableForAll] = useState(true);
  const [packingTravelers, setPackingTravelers] = useState<PackingTraveler[]>([
    { id: 1, name: "Voksen 1", kind: "adult", gender: "female", age: 30 },
    { id: 2, name: "Voksen 2", kind: "adult", gender: "male", age: 40 },
    { id: 3, name: "Barn 1", kind: "child", gender: "male", age: 4 },
    { id: 4, name: "Barn 2", kind: "child", gender: "female", age: 2 },
  ]);
  const [activePackingTraveler, setActivePackingTraveler] = useState(1);
  const [packingChecks, setPackingChecks] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem("thailand-packing-checks") ?? "{}"); }
    catch { return {}; }
  });
  const route = routes.find((item) => item.id === routeId) ?? routes[0];
  const childCount = childAges.length;
  const adultLabel = `${adultCount} ${adultCount === 1 ? "voksen" : "voksne"}`;
  const childLabel = `${childCount} ${childCount === 1 ? "barn" : "barn"}`;
  const familyLabel = childCount === 0 ? adultLabel : adultCount === 0 ? childLabel : `${adultLabel} + ${childLabel}`;
  const youngestAge = childCount ? Math.min(...childAges) : 99;
  const ageWeight = childAges.reduce((sum, age) => sum + (age < 2 ? .18 : age < 6 ? .55 : .78), 0);
  const peopleWeight = adultCount + ageWeight;
  const baselinePeopleWeight = 3.1;
  const travelerCount = adultCount + childCount;
  const groupTravelerCount = groupAdults + groupChildren;
  const privateVillaPerFamilyEstimate = comfort === "smart" ? 38000 : comfort === "komfort" ? 48000 : 62000;
  const sharedGroupScale = Math.max(.82, groupTravelerCount / 15);
  const sharedStayGroupEstimate = familyCount === 1
    ? privateVillaPerFamilyEstimate
    : (comfort === "smart" ? 82000 : comfort === "komfort" ? 102000 : 132000) * sharedGroupScale;
  const nearbyHomeCapacity = 8;
  const nearbyHomeCount = Math.max(familyCount === 1 ? 1 : 2, Math.ceil(groupTravelerCount / nearbyHomeCapacity));
  const nearbyHomeEstimate = comfort === "smart" ? 31000 : comfort === "komfort" ? 39000 : 50000;
  const nearbyHomesGroupEstimate = nearbyHomeEstimate * nearbyHomeCount;
  const privateVillaGroupEstimate = privateVillaPerFamilyEstimate * familyCount;
  const selectedVillaGroupEstimate = villaMode === "shared"
    ? sharedStayGroupEstimate
    : villaMode === "nearby-homes"
      ? nearbyHomesGroupEstimate
      : privateVillaGroupEstimate;
  const selectedVillaFamilyShare = sharedStay ? selectedVillaGroupEstimate / familyCount : 0;
  const activitySpend = route.activities
    .filter((activity) => selectedActivities.includes(activity.id))
    .reduce((sum, activity) => sum + activity.cost * (peopleWeight / baselinePeopleWeight), 0);

  const activityPlaces = [...new Set(route.activities.map((activity) => activity.place))];
  const filteredActivities = route.activities.filter((activity) => {
    const categoryMatch = activityCategories.length === 0 || activityCategories.includes(activity.category);
    const placeMatch = activityPlace === "alle" || activity.place === activityPlace;
    const durationMatch = activityDuration === "alle" || activity.durationGroup === activityDuration;
    const ageMatch = !suitableForAll || activity.minAge <= youngestAge;
    return categoryMatch && placeMatch && durationMatch && ageMatch;
  });

  const budget = useMemo(() => {
    const factors = {
      smart: { international: .96, domestic: .92, hotel: .8333, food: .8, local: .82, activities: .88, buffer: .8 },
      komfort: { international: 1, domestic: 1, hotel: 1, food: 1, local: 1, activities: 1, buffer: 1 },
      plass: { international: 1.1, domestic: 1.08, hotel: 1.4, food: 1.18, local: 1.3, activities: 1.16, buffer: 1.2 },
    }[comfort];
    // Calibrated to an observed SAS round-trip fare of NOK 53,470 for
    // 2 adults + 2 children (ages 2 and 4) in January.
    const flightWeight = (adultCount + childAges.reduce((sum, age) => sum + (age < 2 ? .12 : .85), 0)) / 3.7;
    const estimatedRooms = travelerCount === 0
      ? 0
      : Math.max(1, Math.ceil(adultCount / 2), Math.ceil(childCount / 2), Math.ceil(travelerCount / 4));
    const hotelWeight = estimatedRooms;
    const localWeight = travelerCount === 0 ? 0 : Math.max(.55, travelerCount / 4) * (travelerCount > 4 ? 1.18 : 1);
    const variableScale = travelerCount === 0 ? 0 : peopleWeight / baselinePeopleWeight;
    const flightAmount = includeFlights ? route.costs.international * flightWeight * factors.international : 0;
    const transferAmount = route.costs.domestic * localWeight * factors.domestic;
    const hotelAmount = sharedStay ? selectedVillaFamilyShare : route.costs.hotel * hotelWeight * factors.hotel;
    const foodAmount = route.costs.food * variableScale * factors.food;
    const localAmount = route.costs.local * localWeight * factors.local;
    const activitiesAmount = travelerCount === 0 ? 0 : (2200 * variableScale + activitySpend) * factors.activities;
    const travelReadyAmount = travelerCount === 0 ? 0 : (700 + 200 * travelerCount) * variableScale;
    const baseRows = [
      {
        key: "international", label: "Fly tur/retur", amount: flightAmount,
        note: "Kjevik–København–Krabi og Bangkok–København–Kjevik",
        details: splitAmount(flightAmount, [["Flybilletter", .92], ["Setevalg og bagasjemargin", .08]]),
      },
      {
        key: "domestic", label: "Transfer mellom stedene", amount: transferAmount,
        note: "Privat bil/minivan og ferge",
        details: splitAmount(transferAmount, [["Krabi flyplass → Ao Nang", .16], ["Ao Nang → Koh Lanta", .42], ["Koh Lanta → Krabi flyplass", .42]]),
      },
      {
        key: "hotel", label: "Overnatting · 13 netter", amount: hotelAmount,
        note: sharedStay
          ? villaMode === "shared"
            ? `Deres grove andel når ${familyCount} familier deler`
            : villaMode === "nearby-homes"
              ? `Deres andel av ${nearbyHomeCount} mindre boliger`
              : `Én privat villa til hver av ${familyCount} familier`
          : `${estimatedRooms} ${estimatedRooms === 1 ? "rom" : "rom"} beregnet`,
        details: sharedStay
          ? villaMode === "shared"
            ? splitAmount(hotelAmount, [["Felles villa i Krabi · 5 netter", .39], ["Felles villa(er) på Koh Lanta · 7 netter", .55], ["Bangkok flyplass · 1 natt", .06]])
            : villaMode === "nearby-homes"
              ? splitAmount(hotelAmount, [[`${nearbyHomeCount} mindre boliger i Krabi · 5 netter`, .40], [`${nearbyHomeCount} mindre boliger på Koh Lanta · 7 netter`, .56], ["Bangkok flyplass · 1 natt", .04]])
              : splitAmount(hotelAmount, [["Egen familievilla i Krabi · 5 netter", .42], ["Egen familievilla på Koh Lanta · 7 netter", .54], ["Bangkok flyplass · 1 natt", .04]])
          : splitAmount(hotelAmount, [["Krabi · 5 netter", .383], ["Koh Lanta · 7 netter", .533], ["Bangkok flyplass · 1 natt", .084]]),
      },
      {
        key: "food", label: "Mat og drikke", amount: foodAmount,
        note: `ca. ${formatNok(foodAmount / 14)} per feriedag`,
        details: splitAmount(foodAmount, [["Frokost, snacks og is", .25], ["Lunsj og middag", .55], ["Drikke og småkjøp", .20]]),
      },
      {
        key: "local", label: "Transport på reisemålene", amount: localAmount,
        note: "Taxi, tuk-tuk og korte båtturer",
        details: splitAmount(localAmount, [["Krabi", .45], ["Koh Lanta", .45], ["Bangkok", .10]]),
      },
      {
        key: "activities", label: "Aktiviteter og utflukter", amount: activitiesAmount,
        note: `${route.activities.filter((item) => selectedActivities.includes(item.id)).length} aktiviteter valgt`,
        details: [
          { label: "Grunnramme for spontane opplevelser", amount: travelerCount === 0 ? 0 : 2200 * variableScale * factors.activities },
          { label: "Aktivitetene dere har valgt", amount: activitySpend * factors.activities },
        ],
      },
      {
        key: "travel-ready", label: "Praktisk før avreise", amount: travelReadyAmount,
        note: "Småposter som ofte glemmes",
        details: splitAmount(travelReadyAmount, [["eSIM og data", .25], ["Reiseapotek og solbeskyttelse", .45], ["Adaptere og annet småutstyr", .30]]),
      },
    ];
    const beforeBuffer = baseRows.reduce((sum, row) => sum + row.amount, 0);
    const baselineBeforeBuffer = Object.values(route.costs).reduce((sum, amount) => sum + amount, 0) - route.costs.buffer;
    const rows = [
      ...baseRows,
      {
        key: "buffer", label: "Reserve", amount: travelerCount === 0 ? 0 : route.costs.buffer * (beforeBuffer / baselineBeforeBuffer) * factors.buffer,
        note: "Til prisendringer og uforutsette utgifter",
        details: [],
      },
    ];
    return { rows, total: rows.reduce((sum, row) => sum + row.amount, 0) };
  }, [activitySpend, adultCount, childAges, childCount, comfort, familyCount, includeFlights, nearbyHomeCount, peopleWeight, route, selectedActivities, sharedStay, selectedVillaFamilyShare, travelerCount, villaMode]);

  const toggleActivity = (id: string) => {
    setSelectedActivities((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const toggleHotel = (id: string) => {
    setShortlist((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : current.length < 3 ? [...current, id] : [...current.slice(1), id]);
  };

  const setChildCount = (count: number) => {
    const boundedCount = Math.max(0, Math.min(10, count));
    setChildAges((current) => Array.from({ length: boundedCount }, (_, index) => current[index] ?? 4));
  };

  const setBoundedAdultCount = (count: number) => {
    setAdultCount(Math.max(0, Math.min(10, count)));
  };

  const setChildAge = (index: number, age: number) => {
    setChildAges((current) => current.map((value, childIndex) => childIndex === index ? age : value));
  };

  const toggleCategory = (category: ActivityCategory) => {
    setActivityCategories((current) => current.includes(category)
      ? current.filter((item) => item !== category)
      : [...current, category]);
  };

  const visibleHotels = hotels.filter((hotel) => hotel.place === hotelPlace);
  const comparedHotels = hotels.filter((hotel) => shortlist.includes(hotel.id));

  const changeView = (view: MainView) => {
    setMainView(view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    localStorage.setItem("thailand-packing-checks", JSON.stringify(packingChecks));
  }, [packingChecks]);

  const updatePackingTraveler = (id: number, patch: Partial<PackingTraveler>) => {
    setPackingTravelers((current) => current.map((traveler) => traveler.id === id ? { ...traveler, ...patch } : traveler));
  };

  const addPackingTraveler = () => {
    const id = Date.now();
    setPackingTravelers((current) => [...current, { id, name: `Familiemedlem ${current.length + 1}`, kind: "adult", gender: "other", age: 30 }]);
    setActivePackingTraveler(id);
  };

  const removePackingTraveler = (id: number) => {
    setPackingTravelers((current) => {
      const next = current.filter((traveler) => traveler.id !== id);
      if (activePackingTraveler === id && next[0]) setActivePackingTraveler(next[0].id);
      return next;
    });
  };

  return (
    <main className={`app-shell view-${mainView}`}>
      <header className="topbar">
        <button className="brand" type="button" onClick={() => changeView("overview")} aria-label="Thailand-planlegger, til oversikten">
          <span className="brand-name">FamilieReise</span>
          <span className="brand-country">Thailand</span>
        </button>
        <nav className="view-tabs" aria-label="Hovednavigasjon">
          {navItems.map(({ view, label, icon }) => (
            <button
              type="button"
              key={view}
              className={mainView === view ? "active" : ""}
              aria-current={mainView === view ? "page" : undefined}
              onClick={() => changeView(view)}
            >
              <span className="nav-icon" aria-hidden="true">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </header>

      <section className="hero" id="topp">
        <div className="hero-gallery" aria-label="Reiseinspirasjon fra Krabi og Koh Lanta">
          <figure className="hero-photo hero-photo-main">
          <img src={imageUrl("/hero-krabi.jpg")} alt="Turkist hav, kalksteinsklipper og longtail-båt ved Krabi" />
          </figure>
        </div>
        <div className="hero-wash" aria-hidden="true" />
        <div className="hero-copy">
          <p className="editorial-label">Forslag til familiereise · 14 dager</p>
          <h1>Thailand<br />2028</h1>
          <p className="lede"><span aria-hidden="true">☼</span> 14 dager · Krabi · Koh Lanta · Bangkok</p>
          <div className="hero-actions">
            <button className="primary-button" type="button" onClick={() => changeView("route")}>Se anbefalt rute <span aria-hidden="true">→</span></button>
          </div>
        </div>
        <div className="hero-route" aria-label="Anbefalt reiserute og flytider">
          <div className="route-group route-group-flight">
            <small>UTREISE</small>
            <div className="route-stops">
              <span><b>KRS</b><em>14:55</em></span>
              <i aria-hidden="true">→</i>
              <span><b>CPH</b><em>15:50</em></span>
              <i aria-hidden="true">→</i>
              <span><b>KBV</b><em>17:00 +1</em></span>
            </div>
          </div>
          <div className="route-divider" aria-hidden="true" />
          <div className="route-group">
            <small>THAILAND · 13 NETTER</small>
            <div className="route-stops route-stops-places">
              <span><b>Krabi</b><em>5 netter</em></span>
              <i aria-hidden="true">→</i>
              <span><b>Koh Lanta</b><em>7 netter</em></span>
              <i aria-hidden="true">→</i>
              <span><b>Bangkok</b><em>1 natt</em></span>
            </div>
          </div>
          <div className="route-divider" aria-hidden="true" />
          <div className="route-group route-group-home">
            <small>HJEMREISE</small>
            <div className="route-stops">
              <span><b>BKK</b><em>12:35</em></span>
              <i aria-hidden="true">→</i>
              <span><b>CPH</b><em>19:05</em></span>
              <i aria-hidden="true">→</i>
              <span><b>KRS</b><em>00:00 +1</em></span>
            </div>
          </div>
        </div>
        <p className="photo-credit">Railay · Krabi · Koh Lanta</p>
      </section>

      <section className="packing" id="pakkeliste">
        <div className="packing-head">
          <div>
            <p className="section-number">06 / PAKKELISTE & TIPS</p>
            <h2>Riktig pakket.<br />For hver og én.</h2>
          </div>
          <div className="packing-explainer">
            <strong>Slik fungerer listen</strong>
            <p>Legg inn hvert familiemedlem. Forslagene tilpasses Thailand, lang flyreise, barn/voksen, alder og enkelte personlige behov. Dette er en smart startliste – medisinske behov og egne vaner må alltid legges til av dere.</p>
          </div>
        </div>
        <div className="packing-layout">
          <aside className="traveler-panel">
            <div className="traveler-panel-title">
              <div><small>REISEFØLGET</small><strong>{packingTravelers.length} personer</strong></div>
              <button type="button" onClick={addPackingTraveler}>+ Legg til</button>
            </div>
            <div className="traveler-list">
              {packingTravelers.map((traveler) => (
                <button type="button" key={traveler.id} className={activePackingTraveler === traveler.id ? "active" : ""} onClick={() => setActivePackingTraveler(traveler.id)}>
                  <span>{traveler.kind === "child" ? (traveler.age === 0 ? "Spedbarn" : "Barn") : "Voksen"} · {traveler.age === 0 ? "under 1 år" : `${traveler.age} år`}</span>
                  <strong>{traveler.name || "Uten navn"}</strong>
                </button>
              ))}
            </div>
            {packingTravelers.filter((traveler) => traveler.id === activePackingTraveler).map((traveler) => (
              <div className="traveler-editor" key={traveler.id}>
                <label>Navn<input value={traveler.name} onChange={(event) => updatePackingTraveler(traveler.id, { name: event.target.value })} /></label>
                <div className="editor-row">
                  <label>Person<select value={traveler.kind} onChange={(event) => updatePackingTraveler(traveler.id, { kind: event.target.value as TravelerKind, age: event.target.value === "child" ? Math.min(traveler.age, 17) : Math.max(traveler.age, 18) })}><option value="adult">Voksen</option><option value="child">Barn</option></select></label>
                  <label>Alder<input type="number" min="0" max="100" value={traveler.age} onChange={(event) => updatePackingTraveler(traveler.id, { age: Math.max(0, Math.min(100, Number(event.target.value))) })} /><small>Velg 0 for spedbarn under ett år.</small></label>
                </div>
                <label>Kjønn<select value={traveler.gender} onChange={(event) => updatePackingTraveler(traveler.id, { gender: event.target.value as TravelerGender })}><option value="female">Kvinne/jente</option><option value="male">Mann/gutt</option><option value="other">Annet / ikke oppgi</option></select></label>
                {packingTravelers.length > 1 && <button className="remove-traveler" type="button" onClick={() => removePackingTraveler(traveler.id)}>Fjern personen</button>}
              </div>
            ))}
          </aside>
          <div className="packing-content">
            {packingTravelers.filter((traveler) => traveler.id === activePackingTraveler).map((traveler) => (
              <div key={traveler.id}>
                <div className="personal-note">
                  <span>PERSONALISERT FOR</span><h3>{traveler.name}</h3>
                  <p>{traveler.kind === "child"
                    ? traveler.age === 0 ? "Spedbarnslisten prioriterer mating, bleier, stell, søvn, bæreløsning og ekstra stor reserve i håndbagasjen."
                      : traveler.age <= 2 ? "Småbarnslisten prioriterer søvn, stell, mat og gode reserver på flyreisen."
                      : traveler.age <= 5 ? "Førskolelisten har ekstra skift, trygghetsting og enkel flyunderholdning."
                      : traveler.age <= 12 ? "Skolebarnslisten gir mer selvstendighet med egen liten sekk og underholdning."
                      : "Tenåringslisten legger mer vekt på egen elektronikk, hygiene og aktiviteter."
                    : traveler.age <= 25 ? "Listen kombinerer det praktiske med elektronikk, aktiviteter og et lett kveldsantrekk."
                      : traveler.age >= 60 ? "Listen prioriterer komfort, gode sko og trygg håndtering av medisiner."
                      : "En balansert voksenliste for tropisk klima, strand, restaurant og lang flyreise."}</p>
                </div>
                <div className="bag-columns">
                  {(["checked", "cabin"] as PackingBag[]).map((bag) => {
                    const items = personalizedPacking(traveler, bag);
                    const completed = items.filter((item) => packingChecks[`${traveler.id}-${bag}-${item.id}`]).length;
                    return (
                      <div className="bag-card" key={bag}>
                        <div className="bag-title">
                          <div><small>{bag === "checked" ? "INNSJEKKET BAGASJE" : "HÅNDBAGASJE"}</small><h4>{bag === "checked" ? "I kofferten" : "Til flyreisen"}</h4></div>
                          <span>{completed}/{items.length}</span>
                        </div>
                        <div className="packing-progress"><i style={{ width: `${items.length ? completed / items.length * 100 : 0}%` }} /></div>
                        <div className="packing-groups">
                          {(Object.keys(packingCategoryLabels) as PackingCategory[]).map((category, categoryIndex) => {
                            const categoryItems = items.filter((item) => item.category === category);
                            if (!categoryItems.length) return null;
                            const categoryCompleted = categoryItems.filter((item) => packingChecks[`${traveler.id}-${bag}-${item.id}`]).length;
                            return (
                              <details className="packing-group" key={category} open={categoryIndex < 2}>
                                <summary>
                                  <span className="packing-category-icon">{packingCategoryLabels[category].icon}</span>
                                  <strong>{packingCategoryLabels[category].label}</strong>
                                  <small>{categoryCompleted}/{categoryItems.length}</small>
                                  <i aria-hidden="true">⌄</i>
                                </summary>
                                <div className="packing-items">
                                  {categoryItems.map((item) => {
                                    const key = `${traveler.id}-${bag}-${item.id}`;
                                    return <label key={item.id} className={packingChecks[key] ? "checked" : ""}><input type="checkbox" checked={!!packingChecks[key]} onChange={() => setPackingChecks((current) => ({ ...current, [key]: !current[key] }))} /><span><b>{item.label}</b>{item.reason && <small>{item.reason}</small>}</span></label>;
                                  })}
                                </div>
                              </details>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="packing-tips">
              <strong>Ting hele familien bør huske</strong>
              <ul>
                <li>Fordel klær til alle i minst to kofferter, så ingen står uten klær hvis én bagasje blir forsinket.</li>
                <li>Ta bilde av pass, bagasjelapper og viktige dokumenter, og lagre dem sikkert offline.</li>
                <li>Ta med nok foretrukket solkrem til de første dagene – særlig barnesolkrem.</li>
                <li>Ikke overpakk klær: lett klesvask er vanligvis lett tilgjengelig og rimelig.</li>
                <li>Kontroller oppdaterte regler for pass, medisiner, vaksiner og håndbagasje nærmere avreise.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="destination-tips" id="thailand-tips">
        <div className="destination-tips-head">
          <div>
            <p className="section-number">07 / TIPS ETTER STED</p>
            <h2>Det som faktisk<br />gjør ferien enklere.</h2>
          </div>
          <div className="tips-intro-card">
            <strong>Tilpasset deres familie</strong>
            <p>Rådene tar utgangspunkt i fem netter i Krabi, syv på Koh Lanta og barn på 2 og 4 år. De prioriterer korte avstander, rolige dager, enkel mat og et tydelig sikkerhetsnett.</p>
          </div>
        </div>

        <div className="tips-place-tabs" role="tablist" aria-label="Velg reisemål">
          {(["krabi", "lanta"] as HotelPlace[]).map((place) => (
            <button
              type="button"
              role="tab"
              aria-selected={tipsPlace === place}
              className={tipsPlace === place ? "active" : ""}
              onClick={() => setTipsPlace(place)}
              key={place}
            >
              <span>{place === "krabi" ? "01" : "02"}</span>
              <strong>{destinationTips[place].label}</strong>
            </button>
          ))}
        </div>

        <div className="tips-place-summary">
          <div>
            <span>VÅR VURDERING</span>
            <h3>{destinationTips[tipsPlace].label}</h3>
            <p>{destinationTips[tipsPlace].intro}</p>
          </div>
          <blockquote>{destinationTips[tipsPlace].familyVerdict}</blockquote>
        </div>

        <div className="tips-accordion">
          {destinationTips[tipsPlace].categories.map((category, index) => (
            <details className="tips-category" key={category.title} open={index === 0}>
              <summary>
                <span className="tips-category-icon">{category.icon}</span>
                <span><strong>{category.title}</strong><small>{category.summary}</small></span>
                <b>{category.items.length} tips</b>
                <i aria-hidden="true">⌄</i>
              </summary>
              <div className="tips-items">
                {category.items.map((item) => (
                  <article className={`tip-item verdict-${item.verdict}`} key={item.name}>
                    <span className="tip-verdict">
                      {item.verdict === "best" ? "BEST MED BARN" : item.verdict === "good" ? "GODT VALG" : item.verdict === "skip" ? "VILLE HOPPET OVER" : "PRAKTISK"}
                    </span>
                    <h4>{item.name}</h4>
                    <p>{item.text}</p>
                    {item.link && <a href={item.link} target="_blank" rel="noreferrer">Åpne offisiell side ↗</a>}
                  </article>
                ))}
              </div>
            </details>
          ))}
        </div>

        <div className="tips-emergency">
          <div><span>VED AKUTT FARE I THAILAND</span><strong>Ambulanse 1669 · Turistpoliti 1155</strong></div>
          <p>Lagre også reiseforsikringens alarmsentral og adressen til bostedet offline. Kontroller telefonnumre og helsetilbud på nytt nærmere avreise i 2028.</p>
        </div>
      </section>

      <section className="comparison" id="sammenlign">
        <div className="comparison-intro">
          <div>
            <p className="section-number">01 / ANBEFALT REISERUTE</p>
            <h2>Krabi, Koh Lanta<br />og Bangkok.</h2>
          </div>
          <p className="section-note">
            13 netter med fem netter i Krabi, syv på Koh Lanta og en praktisk buffernatt i Bangkok før hjemreisen.
          </p>
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

        <figure className="editorial-break editorial-break-lanta">
          <img src={imageUrl("/koh-lanta-evening.jpg")} alt="Rolig strand og longtail-båt i solnedgangen på Koh Lanta" />
          <figcaption>
            <span>07 netter · Koh Lanta</span>
            <strong>Long Beach og Klong Dao gir kort vei mellom strand, hotell og restauranter.</strong>
          </figcaption>
        </figure>
      </section>

      <section className="hotels" id="hoteller">
        <div className="stay-subnav" role="tablist" aria-label="Velg type bosted">
          <button type="button" role="tab" aria-selected={stayView === "hotels"} className={stayView === "hotels" ? "active" : ""} onClick={() => setStayView("hotels")}>
            <span>01</span><strong>Hotell</strong><small>Familierom, resorter og flyplasshotell</small>
          </button>
          <button type="button" role="tab" aria-selected={stayView === "airbnb"} className={stayView === "airbnb" ? "active" : ""} onClick={() => setStayView("airbnb")}>
            <span>02</span><strong>Airbnb</strong><small>Villaer for én eller flere familier</small>
          </button>
        </div>
        <div className={`hotel-stay-content ${stayView === "hotels" ? "active" : ""}`}>
        <div className="hotel-head">
          <div>
            <p className="section-number">02 / BO VED STRANDEN</p>
            <h2>Hoteller som fungerer<br />for deres familie.</h2>
          </div>
          <p className="section-note">Utvalget spenner fra smarte firestjernerskjøp til luksus. Vi vurderer totalverdien: familierom, beliggenhet, strand, basseng og hva dere får for prisen. Velg inntil tre for en direkte sammenligning.</p>
        </div>

        <figure className="hotel-editorial">
          <img src={imageUrl("/resort-family.jpg")} alt="Luftig familievennlig strandresort i sørlige Thailand" />
          <figcaption><span>Hotellkriterier</span><strong>Barnevennlig, gode romløsninger og en pris som står i forhold til beliggenhet og fasiliteter.</strong></figcaption>
        </figure>

        <div className="hotel-place-tabs" aria-label="Velg reisemål">
          <button className={hotelPlace === "krabi" ? "active" : ""} onClick={() => setHotelPlace("krabi")}>Krabi / Ao Nang · 5 netter</button>
          <button className={hotelPlace === "lanta" ? "active" : ""} onClick={() => setHotelPlace("lanta")}>Koh Lanta · 7 netter</button>
        </div>
        <p className="hotel-value-note"><strong>Prisnivå:</strong> €€ = smart/mellomklasse · €€€ = komfort · €€€€ = luksus. Merkene viser relativ verdi mot de andre hotellene på samme reisemål.</p>

        <div className="hotel-grid">
          {visibleHotels.map((hotel) => {
            const selected = shortlist.includes(hotel.id);
            return (
              <article className={`hotel-card ${selected ? "selected" : ""}`} key={hotel.id}>
                <div className="hotel-card-image">
                  <img
                    src={imageUrl(hotelVisuals[hotel.id] || hotelFallbackVisuals[hotel.place])}
                    alt={`${hotel.name} i ${hotel.area}`}
                    loading="lazy"
                  />
                  <span>{hotel.place === "krabi" ? "Krabi / Ao Nang" : "Koh Lanta"}</span>
                  {selected && <b>Valgt ✓</b>}
                </div>
                <div className="hotel-card-top">
                  <span className="stars" aria-label={`${hotel.stars} stjerner`}>{"★".repeat(hotel.stars)}</span>
                  <span className="price-level" aria-label={`Prisnivå ${hotel.price.length} av 4`}>{hotel.price}</span>
                </div>
                {hotel.pick && <span className="hotel-pick">{hotel.pick}</span>}
                <h3>{hotel.name}</h3>
                <p className="hotel-area">{hotel.area}</p>
                <dl>
                  <div><dt>Strand</dt><dd>{hotel.beach}</dd></div>
                  <div><dt>For barna</dt><dd>{hotel.family}</dd></div>
                  <div><dt>Rom for fire</dt><dd>{hotel.room}</dd></div>
                  <div><dt>Basseng</dt><dd>{hotel.pools}</dd></div>
                </dl>
                <div className="hotel-verdict"><strong>Best for</strong><span>{hotel.best}</span></div>
                <p className="hotel-watch"><strong>Vær obs:</strong> {hotel.watch}</p>
                <div className="hotel-actions">
                  <button type="button" className={selected ? "compare-selected" : ""} aria-pressed={selected} onClick={() => toggleHotel(hotel.id)}>
                    {selected ? "Valgt til sammenligning ✓" : "Legg til sammenligning"}
                  </button>
                  <a href={hotel.url} target="_blank" rel="noreferrer">Hotellsiden ↗</a>
                </div>
              </article>
            );
          })}
        </div>

        {comparedHotels.length > 0 && (
          <div className="compare-panel">
            <div className="compare-title">
              <div><span>Deres kortliste</span><h3>Sammenlign side ved side</h3></div>
              <small>{comparedHotels.length}/3 valgt</small>
            </div>
            <div className="compare-scroll">
              <table>
                <thead><tr><th>Hotell</th>{comparedHotels.map((hotel) => <th key={hotel.id}>{hotel.name}</th>)}</tr></thead>
                <tbody>
                  <tr><th>Stjerner</th>{comparedHotels.map((hotel) => <td key={hotel.id}>{"★".repeat(hotel.stars)}</td>)}</tr>
                  <tr><th>Strand</th>{comparedHotels.map((hotel) => <td key={hotel.id}>{hotel.beach}</td>)}</tr>
                  <tr><th>Familiefordel</th>{comparedHotels.map((hotel) => <td key={hotel.id}>{hotel.family}</td>)}</tr>
                  <tr><th>Prisnivå</th>{comparedHotels.map((hotel) => <td key={hotel.id}>{hotel.price}</td>)}</tr>
                  <tr><th>Vår vurdering</th>{comparedHotels.map((hotel) => <td key={hotel.id}><strong>{hotel.best}</strong></td>)}</tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        <aside className="bangkok-hotel">
          <span className="bangkok-icon" aria-hidden="true">✈</span>
          <div><small>ÉN NATT I BANGKOK</small><h3>Hyatt Regency Bangkok Suvarnabhumi Airport</h3><p>Her gjør vi et bevisst unntak fra strandkravet. Hotellet er koblet til BKK-flyplassen, har gratis flyplasstransport, fleksibelt 24-timersopphold og utendørsbasseng – ideelt som trygg buffer før hjemreisen.</p></div>
          <div className="bangkok-hotel-actions">
            <a href="https://www.hyatt.com/hyatt-regency/en-US/bkkrb-hyatt-regency-bangkok-suvarnabhumi-airport" target="_blank" rel="noreferrer">Se hotellet ↗</a>
            <a href="#kart" onClick={() => setMapHotelId("hyatt-bkk")}>Vis på kartet ↓</a>
          </div>
        </aside>
        <p className="hotel-source-note">Stjerner, fasiliteter og plassering er kontrollert mot hotellenes egne nettsider. 2028-priser er ikke publisert; prisnivåene er derfor relative planleggingsnivåer. Sammenlign totalpris for riktig familierom, frokost og avbestillingsvilkår – ikke bare laveste annonserte dobbeltrom.</p>
        </div>

        <section className={`shared-stay ${stayView === "airbnb" ? "active" : ""}`} aria-labelledby="shared-stay-title">
          <div className="shared-stay-head">
            <div>
              <p className="section-number">ALTERNATIV / BO SAMMEN</p>
              <h2 id="shared-stay-title">Villa eller Airbnb<br />for én eller flere familier?</h2>
            </div>
            <p className="section-note">Velg mellom én stor villa, flere mindre boliger i nærheten eller én privat villa per familie. Appen sammenligner pris, kapasitet og privatliv.</p>
          </div>

          <div className="villa-mode-picker" role="radiogroup" aria-label="Velg hvordan familiene skal bo">
            <button type="button" role="radio" aria-checked={villaMode === "shared"} className={villaMode === "shared" ? "active" : ""} onClick={() => setVillaMode("shared")}>
              <span>Boform 1</span>
              <strong>Stor villa sammen</strong>
              <small>Lavest pris per familie og mest fellesskap. Kan kreve to nabovillaer hvis gruppen blir stor.</small>
            </button>
            <button type="button" role="radio" aria-checked={villaMode === "nearby-homes"} className={villaMode === "nearby-homes" ? "active" : ""} onClick={() => setVillaMode("nearby-homes")}>
              <span>Boform 2</span>
              <strong>Flere mindre boliger</strong>
              <small>{nearbyHomeCount} Airbnb-er med opptil ca. {nearbyHomeCapacity} personer i hver, helst i samme anlegg eller gangavstand.</small>
            </button>
            <button type="button" role="radio" aria-checked={villaMode === "family-villas"} className={villaMode === "family-villas" ? "active" : ""} onClick={() => setVillaMode("family-villas")}>
              <span>Boform 3</span>
              <strong>Én villa per familie</strong>
              <small>{familyCount === 1 ? "Én privat villa til familien – god plass, eget kjøkken og roligere legging." : `${familyCount} private villaer i samme anlegg eller nærområde – mer ro, flere bad og enklere legging.`}</small>
            </button>
          </div>

          <div className="group-config">
            <label className="shared-toggle">
              <input type="checkbox" checked={sharedStay} onChange={(event) => setSharedStay(event.target.checked)} />
              <span>
                <strong>{villaMode === "shared"
                  ? "Bruk felles villa i budsjettet"
                  : villaMode === "nearby-homes"
                    ? `Bruk ${nearbyHomeCount} mindre boliger i budsjettet`
                    : "Bruk egen familievilla i budsjettet"}</strong>
                <small>Erstatter hotellposten med deres grove andel av gruppeestimatet</small>
              </span>
            </label>
            <div className="group-steppers">
              {[
                { label: "Familier", value: familyCount, min: 1, max: 4, setter: (value: number) => {
                  setFamilyCount(value);
                  if (value === 1 && familyCount !== 1) {
                    setGroupAdults(2);
                    setGroupChildren(2);
                  }
                } },
                { label: "Voksne totalt", value: groupAdults, min: 0, max: 10, setter: setGroupAdults },
                { label: "Barn totalt", value: groupChildren, min: 0, max: 10, setter: setGroupChildren },
              ].map((item) => (
                <div className="group-stepper" key={item.label}>
                  <span>{item.label}</span>
                  <div>
                    <button type="button" onClick={() => item.setter(Math.max(item.min, item.value - 1))} disabled={item.value === item.min}>−</button>
                    <output>{item.value}</output>
                    <button type="button" onClick={() => item.setter(Math.min(item.max, item.value + 1))} disabled={item.value === item.max}>+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="group-summary">
              <span>{groupTravelerCount} personer · {familyCount} {familyCount === 1 ? "familie" : "familier"}</span>
              <strong>Ca. {formatNok(selectedVillaGroupEstimate)} samlet</strong>
              <b>≈ {formatNok(selectedVillaGroupEstimate / familyCount)} per familie</b>
              <small>Grovt anslag for 5 netter i Krabi, 7 på Koh Lanta og 1 flyplassnatt i Bangkok.</small>
            </div>
          </div>

          {villaMode === "family-villas" && (
            <div className="family-villa-plan">
              <div>
                <span>Oppsett for gruppen</span>
                <strong>{familyCount === 1 ? "1 familie = 1 privat villa" : `${familyCount} familier = ${familyCount} private villaer`}</strong>
                <p>Vi ser etter boliger med 2–4 soverom per familie, helst i samme villakompleks eller maks noen minutters gange fra hverandre.</p>
              </div>
              <dl>
                <div><dt>Krabi · 5 netter</dt><dd>ca. {formatNok(privateVillaPerFamilyEstimate * .42)} per familie</dd></div>
                <div><dt>Koh Lanta · 7 netter</dt><dd>ca. {formatNok(privateVillaPerFamilyEstimate * .54)} per familie</dd></div>
                <div><dt>Bangkok · 1 natt</dt><dd>ca. {formatNok(privateVillaPerFamilyEstimate * .04)} per familie</dd></div>
              </dl>
            </div>
          )}
          {villaMode === "nearby-homes" && (
            <div className="family-villa-plan">
              <div>
                <span>Fleksibelt oppsett for gruppen</span>
                <strong>{groupTravelerCount} personer = ca. {nearbyHomeCount} mindre boliger</strong>
                <p>Appen regner omtrent åtte sengeplasser per bolig. Familiene kan fordeles etter størrelse, og boligene bør ligge i samme anlegg eller maksimalt noen minutters gange fra hverandre.</p>
              </div>
              <dl>
                <div><dt>Kapasitet per bolig</dt><dd>opptil ca. {nearbyHomeCapacity} personer</dd></div>
                <div><dt>Samlet gruppepris</dt><dd>ca. {formatNok(nearbyHomesGroupEstimate)}</dd></div>
                <div><dt>Grovt per familie</dt><dd>ca. {formatNok(nearbyHomesGroupEstimate / familyCount)}</dd></div>
              </dl>
            </div>
          )}

          <div className="shared-place-columns">
            {(["krabi", "lanta"] as HotelPlace[]).map((place) => (
              <div className="shared-place" key={place}>
                <div className="shared-place-title">
                  <span>{place === "krabi" ? "Krabi / Ao Nang · 5 netter" : "Koh Lanta · 7 netter"}</span>
                  <strong>{sharedStays.filter((stay) => stay.place === place && (stay.guests >= groupTravelerCount || stay.flexibleUnits)).length} aktuelle forslag</strong>
                </div>
                <div className="shared-card-list">
                  {sharedStays.filter((stay) => stay.place === place).map((stay) => {
                    const fits = stay.guests >= groupTravelerCount || Boolean(stay.flexibleUnits);
                    const lowTotal = stay.nightlyEstimate[0] * stay.nights;
                    const highTotal = stay.nightlyEstimate[1] * stay.nights;
                    return (
                      <article className={`shared-card ${fits ? "fits" : "too-small"}`} key={stay.id}>
                        {stay.image && (
                          <a className="shared-card-image" href={stay.url} target="_blank" rel="noreferrer" aria-label={`Se bilder av ${stay.name} på Airbnb`}>
                            <img
                              src={stay.image || imageUrl(stay.place === "krabi" ? "/krabi-longtail.jpg" : "/koh-lanta-evening.jpg")}
                              alt={`${stay.name} på Airbnb`}
                              loading="lazy"
                            />
                            <span>Se alle bilder ↗</span>
                          </a>
                        )}
                        <div className="shared-card-top">
                          <span>{villaMode === "family-villas"
                            ? stay.flexibleUnits ? "Særlig aktuelt for hver sin villa" : "Sjekk naboenheter i området"
                            : villaMode === "nearby-homes"
                              ? stay.flexibleUnits ? "Godt valg for flere enheter" : "Sjekk mindre naboenheter"
                              : fits ? "Passer gruppen" : `Mangler plass til ${groupTravelerCount - stay.guests}`}</span>
                          <b>{stay.guests}+ gjester</b>
                        </div>
                        <h3>{stay.name}</h3>
                        <p className="shared-area">{stay.area} · {stay.bedrooms} soverom · {stay.baths}</p>
                        <p>{stay.setup}</p>
                        <small>{stay.childNote}</small>
                        <dl>
                          <div><dt>Vurdering</dt><dd>{stay.rating}</dd></div>
                          <div><dt>Pris per natt</dt><dd>{formatNok(stay.nightlyEstimate[0])}–{formatNok(stay.nightlyEstimate[1])}</dd></div>
                          <div><dt>Plananslag</dt><dd>{formatNok(lowTotal)}–{formatNok(highTotal)}</dd></div>
                          <div><dt>Per familie</dt><dd>{formatNok(lowTotal / familyCount)}–{formatNok(highTotal / familyCount)}</dd></div>
                        </dl>
                        <a href={stay.url} target="_blank" rel="noreferrer">Se konkret Airbnb ↗</a>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="shared-advice">
            <strong>Min foreløpige anbefaling</strong>
            <p>{villaMode === "shared"
              ? familyCount === 1
                ? "For én familie er utvalget størst. Se først etter en familievennlig villa eller leilighet med 2–3 soverom, gjerne med basseng og kort vei til strand og restauranter. Prisene vises direkte for hele familien – uten fordeling."
                : familyCount === 2
                ? "For 2 familier er utvalget normalt betydelig større. Se først etter én villa med 3–5 soverom og 7–10 sengeplasser; både i Krabi og på Koh Lanta kan dette gi en bedre bolig til lavere pris per familie enn for en større gruppe."
                : `For ${familyCount} familier er én stor villa ofte enklest i Ao Nang. På Koh Lanta kan to villaer i samme anlegg være mer realistisk enn én enorm villa.`
              : villaMode === "nearby-homes"
                ? `${nearbyHomeCount} mindre boliger er et godt kompromiss for denne gruppen: større utvalg enn én enorm villa, men ofte lavere pris enn én stor villa til hver familie. Prioriter samme anlegg, felles basseng eller svært kort gangavstand.`
                : `For ${familyCount} familier ville jeg prioritert ${familyCount} villaer i samme anlegg fremfor tilfeldig spredte boliger. Da beholder dere fellesskapet på dagtid, men hver familie får egen stue, bad og rolige kvelder.`}</p>
          </div>
          <p className="hotel-source-note">Kapasitet, rom, vurderinger og fasiliteter er kontrollert på Airbnb 30. juli 2026. Prisintervallene er grove planleggingsanslag, ikke hentet tilbud for januar 2028. Sjekk alltid sluttsum med rengjøring, Airbnb-gebyr, strøm, barnesenger og avbestilling.</p>
        </section>
      </section>

      {mainView === "stays" && stayView === "hotels" && (
        <div id="kart">
          <NearbyMap selectedHotelId={mapHotelId} onSelectHotel={setMapHotelId} />
        </div>
      )}

      <section className="planner" id="planlegg">
        <div className="planner-visual">
          <img src={imageUrl("/budget-longtail-thailand.png")} alt="Longtail-båt ved en idyllisk strand med turkist hav og kalksteinsøyer i Sør-Thailand" />
          <p><span>BUDSJETT FOR 14 DAGER</span><strong>Juster hotell, aktiviteter og komfortnivå.</strong></p>
        </div>
        <div className="planner-head">
          <div>
            <p className="section-number light">04 / GJØR DEN TIL DERES</p>
            <h2>Se hva ferien<br />faktisk vil koste.</h2>
          </div>
          <div className="trip-settings">
            <div className="family-picker">
              <span className="settings-label">Hvem reiser?</span>
              <div className="traveler-counts">
                <div className="traveler-counter">
                  <span><strong>Voksne</strong><small>0–10 reisende</small></span>
                  <div className="count-stepper" aria-label="Antall voksne">
                    <button type="button" onClick={() => setBoundedAdultCount(adultCount - 1)} disabled={adultCount === 0} aria-label="Færre voksne">−</button>
                    <output aria-live="polite">{adultCount}</output>
                    <button type="button" onClick={() => setBoundedAdultCount(adultCount + 1)} disabled={adultCount === 10} aria-label="Flere voksne">+</button>
                  </div>
                </div>
                <div className="traveler-counter">
                  <span><strong>Barn</strong><small>0–10 barn</small></span>
                  <div className="count-stepper" aria-label="Antall barn">
                    <button type="button" onClick={() => setChildCount(childCount - 1)} disabled={childCount === 0} aria-label="Færre barn">−</button>
                    <output aria-live="polite">{childCount}</output>
                    <button type="button" onClick={() => setChildCount(childCount + 1)} disabled={childCount === 10} aria-label="Flere barn">+</button>
                  </div>
                </div>
              </div>
              {childCount > 0 && (
                <div className="age-pickers">
                  {childAges.map((age, index) => (
                    <label key={index}>Barn {index + 1}
                      <select value={age} onChange={(event) => setChildAge(index, Number(event.target.value))}>
                        {Array.from({ length: 13 }, (_, value) => <option value={value} key={value}>{value === 0 ? "Under 1 år" : `${value} år`}</option>)}
                      </select>
                    </label>
                  ))}
                </div>
              )}
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
        </div>

        <div className="planner-grid">
          <div className="budget-panel">
            <div className="panel-title">
              <div><span>Valgt rute</span><strong>{route.places}</strong></div>
              <span className="total-label">{familyLabel}</span>
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
              Ta med fly fra Kjevik
            </label>

            <div className="budget-total" aria-live="polite">
              <span>Planleggingsbudsjett</span>
              <strong>{formatNok(budget.total)}</strong>
              <small>
                ca. {formatNok(budget.total / 14)} per feriedag
                {travelerCount > 0 ? ` · ${formatNok(budget.total / travelerCount)} per person` : ""}
              </small>
            </div>

            <div className="budget-breakdown">
              {budget.rows.filter((row) => row.amount > 0).map((row) => (
                <details className="budget-row" key={row.key}>
                  <summary>
                    <div>
                      <span>{row.label}<small>{row.note}</small></span>
                      <strong>{formatNok(row.amount)}</strong>
                    </div>
                    <div className="budget-bar"><span style={{ width: `${Math.max(6, (row.amount / Math.max(...budget.rows.map((item) => item.amount))) * 100)}%` }} /></div>
                  </summary>
                  {row.details.length > 0 && (
                    <div className="budget-details">
                      {row.details.filter((detail) => detail.amount > 0).map((detail) => (
                        <div key={detail.label}><span>{detail.label}</span><strong>{formatNok(detail.amount)}</strong></div>
                      ))}
                    </div>
                  )}
                </details>
              ))}
            </div>
            <p className="estimate-note">Trykk på en budsjettpost for å se hva estimatet inneholder. Beløpene er planleggingsanslag for {familyLabel}, ikke pristilbud. Flyanslaget er kalibrert mot en observert SAS-pris på 53 470 kr for 2 voksne + 2 barn i januar. {sharedStay ? `Overnatting viser nå familiens grove andel når ${familyCount} familier deler villa.` : "Overnatting for 13 netter er satt til ca. 25 000 kr på Smart, 30 000 kr på God komfort og 42 000 kr på Mer plass / luksus."} Reiseforsikring er ikke lagt til, siden mange allerede har helårsdekning.</p>
          </div>

          <div className="activity-panel" id="aktiviteter">
            <div className="panel-title">
              <div><span>Aktiviteter</span><strong>Velg – uten å fylle alle dager</strong></div>
              <span className="activity-count">{route.activities.filter((item) => selectedActivities.includes(item.id)).length} valgt</span>
            </div>
            <p className="activity-intro">En god rytme med små barn er én aktivitet, én hviledag. Kryss av det dere liker – budsjettet oppdateres til venstre.</p>
            <div className="activity-filters">
              <div className="filter-block">
                <span className="filter-label">Type · velg flere</span>
                <div className="filter-chips">
                  {(Object.keys(categoryLabels) as ActivityCategory[]).map((category) => (
                    <button type="button" className={activityCategories.includes(category) ? "active" : ""} aria-pressed={activityCategories.includes(category)} onClick={() => toggleCategory(category)} key={category}>
                      {categoryLabels[category]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="filter-selects">
                <label>Sted
                  <select value={activityPlace} onChange={(event) => setActivityPlace(event.target.value)}>
                    <option value="alle">Alle steder</option>
                    {activityPlaces.map((place) => <option value={place} key={place}>{place}</option>)}
                  </select>
                </label>
                <label>Lengde
                  <select value={activityDuration} onChange={(event) => setActivityDuration(event.target.value as "alle" | ActivityDuration)}>
                    <option value="alle">Alle lengder</option>
                    <option value="kort">Kort / fleksibel</option>
                    <option value="halvdag">Halvdag</option>
                    <option value="heldag">Heldag</option>
                  </select>
                </label>
              </div>
              {childCount > 0 && (
                <label className="suitable-toggle">
                  <input type="checkbox" checked={suitableForAll} onChange={(event) => setSuitableForAll(event.target.checked)} />
                  Vis bare aktiviteter som passer alle barna
                </label>
              )}
            </div>
            <div className="activity-list activity-card-grid">
              {filteredActivities.map((activity) => {
                const selected = selectedActivities.includes(activity.id);
                return (
                  <label className={`activity-item activity-card ${selected ? "selected" : ""}`} key={activity.id}>
                    <input type="checkbox" checked={selected} onChange={() => toggleActivity(activity.id)} />
                    {activityImage(activity) ? <span className="activity-image">
                        <img
                          src={activityImage(activity)!}
                          alt={`${activity.title} i ${activity.place}`}
                          loading="lazy"
                        />
                      <span className="activity-highlight">{activityHighlights[activity.category]}</span>
                      <span className="custom-check" aria-hidden="true">{selected ? "✓" : "+"}</span>
                    </span> : <span className="activity-no-image">
                      <span className="activity-highlight">{activityHighlights[activity.category]}</span>
                      <span>Foto kommer</span>
                      <span className="custom-check" aria-hidden="true">{selected ? "✓" : "+"}</span>
                    </span>}
                    <span className="activity-card-body">
                      <span className="activity-copy">
                        <small>{activity.place} · {categoryLabels[activity.category]}</small>
                        <strong>{activity.title}</strong>
                        <em>{activity.age}</em>
                      </span>
                      <span className="activity-meta">
                        <span>◷ {activity.duration}</span>
                        <b>ca. {formatNok(activity.cost * (peopleWeight / baselinePeopleWeight))}</b>
                      </span>
                    </span>
                  </label>
                );
              })}
              {filteredActivities.length === 0 && <div className="no-results">Ingen aktiviteter passer alle filtrene. Prøv å fjerne én kategori eller slå av aldersfilteret.</div>}
            </div>
            <div className="activity-rule"><span>Vår tommelfingerregel</span><strong>La minst 5 av 14 dager være helt åpne.</strong></div>
          </div>
        </div>

        <footer>
          <div>
            <span className="footer-mark">T</span>
            <p>Sjekk flytider, åpningstider, vær og aldersgrenser før bestilling.</p>
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
