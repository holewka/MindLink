// Zbiór krótkich cytatów, afirmacji i mikro-porad kontekstowych dla różnych emocji.


export const QUOTES = {
  smutek: [
    { type: 'quote', text: 'Nie musisz być silna każdego dnia. To też jest siła.' },
    { type: 'quote', text: 'Każdy deszcz kiedyś ustaje, nawet jeśli pada długo.' },
    { type: 'tip', text: 'Zrób coś małego, co kiedyś Cię cieszyło — muzyka, spacer, kubek herbaty.' },
    { type: 'action', text: 'Wypisz trzy rzeczy, które dziś mimo wszystko są w porządku.' },
    { type: 'quote', text: '„Smutek nie jest błędem. Jest przypomnieniem, że coś było ważne.”' },
  ],

  lęk: [
    { type: 'quote', text: 'Oddychaj. Masz prawo nie wiedzieć wszystkiego.' },
    { type: 'quote', text: 'To, co teraz czujesz, nie jest dowodem, że coś jest nie tak — tylko że coś Cię obchodzi.' },
    { type: 'tip', text: 'Zatrzymaj się. Rozejrzyj. Nazwij 5 rzeczy, które widzisz. Wracaj do teraźniejszości.' },
    { type: 'tip', text: 'Nie próbuj walczyć z lękiem — pozwól mu przejść jak fali.' },
    { type: 'action', text: 'Połóż dłoń na klatce piersiowej i weź 3 spokojne oddechy.' },
  ],

  złość: [
    { type: 'quote', text: 'Złość to energia — zdecyduj, jak ją wykorzystasz.' },
    { type: 'tip', text: 'Nie reaguj od razu. Weź kilka głębokich oddechów lub wyjdź na chwilę z pokoju.' },
    { type: 'quote', text: 'Czasem „nic nie mówić” to największa siła, jaką masz.' },
    { type: 'action', text: 'Idź na szybki spacer. Zrób 10 przysiadów. Wyrzuć napięcie z ciała.' },
    { type: 'tip', text: 'Zapisz, co dokładnie Cię rozzłościło — samo nazwanie tego działa uspokajająco.' },
  ],

  spokój: [
    { type: 'quote', text: 'Doceniaj ciszę — to moment, w którym słyszysz siebie.' },
    { type: 'tip', text: 'Zachowaj ten stan. Zrób notatkę, co pomogło Ci dziś poczuć spokój.' },
    { type: 'quote', text: 'Spokój nie oznacza braku hałasu — tylko to, że nie wpuszczasz go do środka.' },
    { type: 'action', text: 'Zrób coś wolno: napij się herbaty, włącz spokojną muzykę, oddychaj.' },
    { type: 'quote', text: '„Jeśli chcesz zmienić świat, zacznij od siebie — spokojnie.”' },
  ],

  radość: [
    { type: 'quote', text: 'Podziel się dziś swoim uśmiechem — jest zaraźliwy.' },
    { type: 'tip', text: 'Zrób zdjęcie, zapisz chwilę, zapamiętaj uczucie. Wrócisz tu w trudniejszy dzień.' },
    { type: 'quote', text: 'Nie analizuj szczęścia — po prostu je czuj.' },
    { type: 'action', text: 'Wyślij komuś miłą wiadomość. Dobro wraca.' },
    { type: 'tip', text: 'Nawet drobna wdzięczność wzmacnia radość — pomyśl o czymś, co dziś było dobre.' },
  ],

  neutral: [
    { type: 'quote', text: 'Dzień nie musi być idealny, żeby był dobry.' },
    { type: 'tip', text: 'Sprawdź, jak się czujesz fizycznie — sen, jedzenie, woda, oddech.' },
    { type: 'action', text: 'Zrób coś małego tylko dla siebie.' },
  ]
};

// Losowanie cytatu (można zwrócić sam tekst lub pełny obiekt)
export function pickQuote(emotion, returnFull = false) {
  const key = (emotion || '').toLowerCase();
  const pool = QUOTES[key] || QUOTES.neutral;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  return returnFull ? chosen : chosen.text;
}
