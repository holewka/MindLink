# MindLink 

MindLink to prosta aplikacja webowa do **szybkiej analizy nastroju** i **podpowiedzi, co możesz zrobić tu i teraz**, żeby trochę sobie ulżyć.

Projekt realizowany w ramach studiów – nie jest to narzędzie medyczne i **nie zastępuje** profesjonalnej pomocy.

---

## Funkcje

-  **Analiza nastroju z tekstu**
  - wpisujesz 1–2 zdania o tym, jak się czujesz
  - prosty silnik analizuje słowa kluczowe (stres, smutek, lęk, złość, przytłoczenie, zmęczenie, radość)
  - zwracana jest dominująca emocja (`topEmotion`) + lista rekomendacji

-  **Konkretne rekomendacje**
  - krótki „task” typu:
    - ruch / ciało (body)
    - głowa (mind)
    - social (kontakt z kimś)
    - media (ograniczenie/zmiana bodźców)
    - odpoczynek (rest)
    - ekspresja (expression)
  - każda rekomendacja ma:
    - `category`
    - szacowany czas (`durationMin`)
    - tytuł i opis

-  **Historia nastrojów**
  - zapisywanie każdego wyniku:
    - lokalnie (`localStorage`)
    - oraz w chmurze (Firebase Firestore, anonimowe konto)
  - filtrowanie po:
    - emocji
    - zakresie dat
  - przełączanie źródła:
    - **Chmura (live)** – dane z Firestore
    - **Lokalnie (przeglądarka)** – dane z `localStorage`

-  **Insights**
  - prosty wykres (sparkline) średnich dziennych nastrojów
  - statystyki z ostatnich 7 dni:
    - liczba wpisów
    - najczęstsza emocja + procent

-  **Ustawienia**
  - zapis profilu w chmurze:
    - wyświetlana nazwa
    - kontakt zaufany (np. telefon / imię)
  - lokalne preferencje:
    - domyślne źródło danych: chmura vs lokalnie

-  **Motyw jasny / ciemny**
  - przełącznik ThemeSwitch
  - zapisywany wybór w `localStorage` (atrybut `html[data-theme="dark"]`)

-  **Eksport danych**
  - eksport historii do:
    - CSV
    - JSON

---

## Stos technologiczny

- **React 18**
- **React Router** (nawigacja SPA)
- **Vite** (bundler, `import.meta.env`)
- **Firebase**
  - Authentication (anonimowe logowanie)
  - Firestore (kolekcje `users/{uid}/moods`, `feedback`, `users/{uid}/profile`)
- **CSS** (custom, bez frameworka)
- `localStorage` (historia lokalna, preferencje, anti-repeat dla sugestii)

---

## Struktura 

Najważniejsze pliki/katalogi:

```text
src/
  App.jsx               # routing + topbar + layout
  main.jsx              # punkt wejścia, ReactDOM + BrowserRouter
  styles.css            # globalne style + dark mode

  pages/
    Home.jsx            # formularz "Jak się dziś czujesz?"
    Result.jsx          # wynik analizy + rekomendacje + feedback
    History.jsx         # historia nastrojów (chmura/lokalnie)
    Settings.jsx        # profil + preferencje
    Insights.jsx        # wykres i statystyki z historii

  services/
    recommendations.js  # silnik analizy nastroju + sugestie
    firebase.js         # integracja z Firebase (moods, feedback, profile)
    storageLocal.js     # zapis/odczyt historii w localStorage

  utils/
    insights.js         # agregacje dnia, statystyki 7-dniowe

  components/
    ThemeSwitch.jsx     # przełącznik motywu
    Sparkline.jsx       # prosty wykres liniowy dla nastrojów
    Loading.jsx         # spinner / komunikat ładowania
    ErrorMsg.jsx        # wyświetlanie błędów

  hooks/
    useAsyncState.js    # custom hook do obsługi async (data/loading/error)
