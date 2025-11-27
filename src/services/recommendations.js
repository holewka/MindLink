// usuwa ogonki i normalizuje
function normalize(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 \-]/g, " ");
}

// stemmowanie
function stem(token) {
  if (!token) return token;
  if (token.length <= 3) return token;

  return token
    .replace(/(ami|ach|ech|owi)$/g, "")
    .replace(/(owa|owe|owy)$/g, "")
    .replace(/(enia|eniu|enie|eni|cie|cia|nia|niu)$/g, "")
    .replace(/(om|mu|owi|cie)$/g, "");
}

function tokensize(input) {
  const n = normalize(input);
  return n.split(/\s+/).filter(Boolean).map(stem);
}

// negacje
function hasNegationRaw(text) {
  const raw = normalize(text).split(/\s+/).filter(Boolean);
  return raw.some((t) =>
    ["nie", "wcale", "ani", "bez", "brak", "nigdy"].includes(t)
  );
}

// anti-repeat
const ANTI_REPEAT_KEY = "mindlink_seen_suggestions";

function rememberSuggestion(id) {
  try {
    const arr = JSON.parse(localStorage.getItem(ANTI_REPEAT_KEY) || "[]");
    arr.unshift({ id, ts: Date.now() });
    localStorage.setItem(
      ANTI_REPEAT_KEY,
      JSON.stringify(arr.slice(0, 30))
    );
  } catch {}
}

function wasRecentlyShown(id) {
  try {
    const arr = JSON.parse(localStorage.getItem(ANTI_REPEAT_KEY) || "[]");
    return arr.some((x) => x.id === id);
  } catch {
    return false;
  }
}

const EMOTIONS = [
  "stres",
  "smutek",
  "zlosc",
  "lek",
  "przytloczenie",
  "zmeczenie",
  "radosc",
];

const KEYWORDS = {
  stres: {
    stres: 2.2,
    zestresowan: 2.2,
    napiec: 1.8,
    napiety: 1.6,
    presj: 1.9,
    nerw: 1.8,
    podenerwow: 1.6,
    cisnien: 1.5,
    spinka: 1.5,
    spies: 1.3,
    deadline: 1.7,
    term: 1.4,
    kolokwi: 1.4,
    egzam: 1.5,
    zaliczen: 1.4,
    przejm: 1.3,
    panik: 1.6,
    stukot: 1.1,
    zadrz: 1.1,
  },
  smutek: {
    smut: 2.2,
    przygnieb: 2.0,
    zal: 1.9,
    dol: 1.8,
    dolek: 1.8,
    pust: 1.8,
    teskni: 1.7,
    samot: 1.7,
    zalam: 2.0,
    rozpac: 2.0,
    deprecha: 1.9,
    depres: 2.2,
    beznadziej: 1.8,
    bezsens: 1.9,
    zle: 1.5,
    marn: 1.3,
    lzy: 1.4,
    placz: 1.7,
    apat: 1.6,
  },
  zlosc: {
    zlosc: 2.3,
    zlos: 2.3,
    wsciek: 2.3,
    wkur: 2.1,
    wkurw: 2.2,
    zdenerw: 1.9,
    iryt: 1.8,
    frustr: 1.9,
    rage: 1.7,
    wrog: 1.5,
    piekli: 1.4,
    gotuje: 1.3,
    krewmniezalewa: 1.6,
  },
  lek: {
    lek: 2.2,
    niepok: 2.0,
    obaw: 2.0,
    strach: 2.0,
    przeraz: 2.1,
    boje: 1.9,
    panik: 2.2,
    napad: 1.8,
    fobia: 1.6,
    zamartw: 1.7,
    kolatan: 1.5,
    drzenia: 1.4,
    scisk: 1.4,
    hiperwentyl: 1.6,
  },
  przytloczenie: {
    przytlocz: 2.3,
    overwhelm: 2.2,
    duzo: 1.9,
    naraz: 1.8,
    niewyrab: 2.1,
    nieogarn: 2.0,
    ogarn: 1.5,
    zawal: 1.8,
    natlok: 1.9,
    tlok: 1.6,
    chaos: 1.7,
    przesyt: 1.6,
    wszystko: 1.3,
    milionrzeczy: 1.7,
  },
  zmeczenie: {
    zmecz: 2.3,
    przemeczon: 2.3,
    wyczerp: 2.0,
    padam: 1.9,
    senny: 1.7,
    senno: 1.7,
    ospal: 1.6,
    otuman: 1.5,
    bezsenn: 1.8,
    niewyspan: 1.9,
    braksily: 1.9,
    brakmocy: 1.7,
    zeroenerg: 1.9,
    pustabateria: 1.7,
  },
  radosc: {
    rado: 2.0,
    szczesc: 2.0,
    zadowol: 1.8,
    mega: 1.8,
    euforia: 1.8,
    fajnie: 1.7,
    super: 1.6,
    git: 1.5,
    spoko: 1.4,
    ok: 1.2,
    sztos: 1.5,
    dumn: 1.6,
    wdzieczn: 1.7,
    zajebis: 1.7,
    spok: 1.5,
    ulga: 1.5,
  },
};

// frazy kryzysowe
const CRISIS_KEYWORDS = [
  "samoboj",
  "zrobic sobie krzywd",
  "skrzywdzic sie",
  "nie chce zyc",
  "koniec ze soba",
  "umrzec",
  "odejsc na zawsze",
  "poddac sie",
  "bez sensu zycia",
  "zabic",
  "zajebac",
  "zdechnac",
  "podciac zyly",
  "zachlac",
  "zacpac",
].map(normalize);

const SUGGESTIONS = {
  stres: [
    {
      id: "stres-boxing-bag",
      category: "body",
      durationMin: 5,
      title: "Boks na worek (lub powietrze)",
      detail: "30 s ciosy / 30 s przerwy. Skup się na oddechu.",
    },
    {
      id: "stres-gym-heavy",
      category: "body",
      durationMin: 10,
      title: "Ciężary zamiast myślenia",
      detail: "Powolne, ciężkie serie – odprowadź napięcie z ciała.",
    },
    {
      id: "stres-youtube-off",
      category: "media",
      durationMin: 30,
      title: "Tryb samolot + cisza",
      detail: "Odłóż telefon na 30 minut. Mini-reset dla mózgu.",
    },
    {
      id: "stres-pack-bag",
      category: "mind",
      durationMin: 15,
      title: "Spakuj plecak ‘jak na jutro’",
      detail: "Tylko rzeczy niezbędne – porządek uspokaja.",
    },
    {
      id: "stres-mini-stretch",
      category: "body",
      durationMin: 5,
      title: "Rozciąganie kark + barki",
      detail: "Krążenia szyją, ściąganie łopatek, otwórz klatkę.",
    },
  ],
  smutek: [
    {
      id: "smutek-play",
      category: "mind",
      durationMin: 60,
      title: "Zagraj w coś",
      detail: "Sięgnij po ulubioną grę – łagodny fokus.",
    },
    {
      id: "smutek-swim",
      category: "body",
      durationMin: 45,
      title: "Pływanie/prysznic",
      detail: "Woda uspokaja układ nerwowy. Nawet krótki prysznic.",
    },
    {
      id: "smutek-sing-real",
      category: "expression",
      durationMin: 10,
      title: "Zaśpiewaj ‘na serio’",
      detail: "Pozwól głosowi wyrzucić emocje. Nie performance.",
    },
    {
      id: "smutek-youtube-comfort",
      category: "media",
      durationMin: 5,
      title: "Jeden filmik ‘comfort’",
      detail: "Tylko jeden – bez scrolla. Ulubiony twórca.",
    },
    {
      id: "smutek-run-night",
      category: "body",
      durationMin: 7,
      title: "Szybki marsz/bieg",
      detail: "Rytm kroków porządkuje głowę.",
    },
  ],
  lek: [
    {
      id: "lek-new-skill",
      category: "mind",
      durationMin: 5,
      title: "Mikro-nauka",
      detail: "Jeden akord/słówko/trik. Mały progres obniża lęk.",
    },
    {
      id: "lek-therapy-text",
      category: "social",
      durationMin: 4,
      title: "Wiadomość do ‘terapeuty’ (nie wysyłaj)",
      detail: "Wylej myśli na tekst, uporządkuj je.",
    },
    {
      id: "lek-cold-water",
      category: "body",
      durationMin: 1,
      title: "Zimna woda na twarz",
      detail: "Sygnał bezpieczeństwa dla układu nerwowego.",
    },
  ],
  zlosc: [
    {
      id: "zlosc-pompki",
      category: "body",
      durationMin: 4,
      title: "Pompki do zmęczenia",
      detail: "Gdy mięśnie pracują, złość opada.",
    },
    {
      id: "zlosc-plank",
      category: "body",
      durationMin: 2,
      title: "Deska na rage",
      detail: "30–60 s napięcia i oddech.",
    },
    {
      id: "zlosc-music-scream",
      category: "expression",
      durationMin: 3,
      title: "Wrzask przy muzyce",
      detail: "Wykrzycz tekst lub dźwięk – bez oceniania.",
    },
    {
      id: "zlosc-write-and-burn",
      category: "mind",
      durationMin: 3,
      title: "Spisz i podrzyj/spal",
      detail: "Rozładuj emocję symbolicznym aktem.",
    },
    {
      id: "zlosc-walk",
      category: "body",
      durationMin: 25,
      title: "Przewietrz się",
      detail: "Spacer prawie zawsze pomaga.",
    },
  ],
  przytloczenie: [
    {
      id: "ovw-mini-clean",
      category: "mind",
      durationMin: 4,
      title: "Mikro-porządek",
      detail: "Tylko biurko/półka/plecak. Mały porządek = ulga.",
    },
    {
      id: "ovw-run-away-plan",
      category: "mind",
      durationMin: 6,
      title: "Plan ‘ucieczki’",
      detail: "Najtańszy bilet/lot – nawet jako zabawa myślowa.",
    },
    {
      id: "ovw-learn-just-one",
      category: "mind",
      durationMin: 5,
      title: "Jedna mini-umiejętność",
      detail: "Akord/krok/fraza – poczucie progresu zamiast chaosu.",
    },
    {
      id: "ovm-people",
      category: "mind",
      durationMin: 60,
      title: "Do ludzi",
      detail: "Krótko wyjdź do ludzi, zmień otoczenie.",
    },
  ],
  zmeczenie: [
    {
      id: "tired-nap-short",
      category: "rest",
      durationMin: 15,
      title: "Power nap",
      detail: "10–15 min, ciemno i cicho, budzik.",
    },
    {
      id: "tired-coffeine",
      category: "body",
      durationMin: 8,
      title: "Pobudź się",
      detail: "Kawa/herbata/zimna woda – rozsądnie.",
    },
    {
      id: "tired-no-screen",
      category: "mind",
      durationMin: 15,
      title: "Zero ekranu, oczy zamknięte",
      detail: "10–15 min – mózg i tak odpocznie.",
    },
    {
      id: "tired-protein-water",
      category: "habit",
      durationMin: 2,
      title: "Woda + coś odżywczego",
      detail: "Szklanka wody i drobna przekąska (np. owoc).",
    },
  ],
  radosc: [
    {
      id: "joy-dance-room",
      category: "body",
      durationMin: 3,
      title: "Tańcz dla siebie",
      detail: "Ulubiony kawałek, tylko Ty i pokój.",
    },
    {
      id: "joy-training-hit",
      category: "body",
      durationMin: 5,
      title: "Ulubiona mini-seria",
      detail: "Zrób swój ‘pewniak’ treningowy.",
    },
    {
      id: "joy-call-share",
      category: "social",
      durationMin: 2,
      title: "Podziel się dobrym",
      detail: "Wyślij komuś dobry news.",
    },
    {
      id: "joy-favorite-food-small",
      category: "body",
      durationMin: 30,
      title: "Mini-wersja ulubionego jedzenia",
      detail: "Nawet tost/pizza/makaron – mała przyjemność.",
    },
  ],
  neutral: [
    {
      id: "neutral-breath",
      category: "mind",
      durationMin: 2,
      title: "Dwa spokojne oddechy",
      detail:
        "Weź 2 powolne wdechy i dłuższe wydechy. Zobacz, co teraz czujesz.",
    },
  ],
};

// tryb kryzysowy
function detectCrisis(text) {
  const t = normalize(text);
  return CRISIS_KEYWORDS.some((k) => t.includes(k));
}

// scoring emocji
function scoreEmotions(tokens, neg) {
  const scores = Object.fromEntries(EMOTIONS.map((e) => [e, 0]));
  for (const token of tokens) {
    for (const emo of EMOTIONS) {
      const dict = KEYWORDS[emo] || {};
      for (const [stemKey, weight] of Object.entries(dict)) {
        if (token.includes(stemKey)) {
          scores[emo] += neg ? weight * 0.3 : weight;
        }
      }
    }
  }
  return scores;
}

// dobór sugestii
function pickSuggestionsForEmotion(emotion, count = 3) {
  const pool = (SUGGESTIONS[emotion] || []).slice();

  const catOrder = [
    "mind",
    "body",
    "social",
    "media",
    "habit",
    "rest",
    "expression",
  ].sort(() => Math.random() - 0.5);

  const chosen = [];

  for (const cat of catOrder) {
    const candidates = pool
      .filter((s) => s.category === cat)
      .filter((s) => !wasRecentlyShown(s.id));

    if (candidates.length) {
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      chosen.push({ ...pick, emotion });
      const idx = pool.findIndex((x) => x.id === pick.id);
      if (idx >= 0) pool.splice(idx, 1);
      rememberSuggestion(pick.id);
    }
    if (chosen.length >= count) break;
  }

  // fallback – dobieramy resztę losowo z puli
  while (chosen.length < count && pool.length) {
    const pick = pool[Math.floor(Math.random() * pool.length)];
    chosen.push({ ...pick, emotion });
    const idx = pool.findIndex((x) => x.id === pick.id);
    if (idx >= 0) pool.splice(idx, 1);
    rememberSuggestion(pick.id);
  }

  // ostateczny fallback
  if (!chosen.length) {
    const backup = (SUGGESTIONS.radosc || []).map((x) => ({
      ...x,
      emotion: "radosc",
    }));
    if (backup.length)
      chosen.push(backup[Math.floor(Math.random() * backup.length)]);
  }

  return chosen;
}

// API
export function analyze(text, opts = {}) {
  // tryb kryzysu
  if (detectCrisis(text)) {
    const crisisSuggestions = [
      {
        id: "crisis-call-112",
        category: "mind",
        durationMin: 5,
        title: "Jeśli grozi Ci bezpośrednie niebezpieczeństwo",
        detail: "Zadzwoń pod 112 lub udaj się na SOR. Nie zostawaj sam(a).",
      },
      {
        id: "crisis-116123",
        category: "social",
        durationMin: 5,
        title: "Całodobowe wsparcie 116 123",
        detail: "Bezpłatna linia wsparcia emocjonalnego w Polsce.",
      },
      {
        id: "crisis-trusted-person",
        category: "social",
        durationMin: 5,
        title: "Skontaktuj się z kimś zaufanym",
        detail: "Zadzwoń/napisz do przyjaciela, rodziny, terapeuty.",
      },
    ];

    return {
      urgent: true,
      topEmotion: "kryzys",
      suggestions: crisisSuggestions,
    };
  }

  const tokens = tokensize(text);
  const neg = hasNegationRaw(text);
  const scores = scoreEmotions(tokens, neg);

  const total = Object.values(scores).reduce((a, b) => a + b, 0);

  if (total === 0) {
    return {
      urgent: false,
      topEmotion: "neutral",
      suggestions: pickSuggestionsForEmotion("neutral", opts.count || 3),
    };
  }

  let topEmotion = "neutral";
  let best = 0;
  for (const emo of EMOTIONS) {
    const val = scores[emo] || 0;
    if (val > best) {
      best = val;
      topEmotion = emo;
    }
  }

  return {
    urgent: false,
    topEmotion,
    suggestions: pickSuggestionsForEmotion(topEmotion, opts.count || 3),
  };
}



