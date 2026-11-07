# Blokada odbioru niewydanych przyczep i optymalizacja wydruku do 1 strony A4

Wdrożenie blokady odbioru przyczep, które nie przeszły etapu wydania (status `active`), wraz z czytelną informacją o konieczności wcześniejszego wydania oraz precyzyjne dopasowanie formularzy umowy najmu i protokołu zdania (skalowanie o ok. 15%) tak, aby każdy z dokumentów mieścił się w 100% na jednej kartce formatu A4.

### User Review & Critical Decisions

> [!IMPORTANT]
> Potwierdzone decyzje z użytkownikiem:
> 1. **Widok niewydanych przyczep w zakładce Zwroty**: Rezerwacje, które nie zostały jeszcze wydane (`status !== "active"`), pozostają widoczne na liście zwrotów z zablokowanym przyciskiem odbioru oraz wyraźną etykietą statusu: **"Wymaga wydania"** (z szybkim przejściem do wydania).
> 2. **Wydruk A4 bez rozbijania na wiele stron**: Zachowujemy dokładny, oryginalny wzór dokumentów Dollco (`PrintableAgreement` oraz `PrintableReturnProtocol`), zmniejszając ich skalę o ok. 15% (kompaktowe marginesy, ciaśniejsze paddingi tabeli, dedykowane reguły `@media print` i `@page`), eliminując przechodzenie na drugą stronę.

---

### 1. Overview & Core Concept

- **Problem biznesowy**: Użytkownik mógł przypadkowo odebrać przyczepę zanim została ona wydana (np. prosto z listy zwrotów lub kalendarza), co łamało logikę procesu najmu i pomijało sporządzenie umowy oraz pobranie kaucji. Ponadto wydruki umów i protokołów minimalnie przekraczały format A4, generując niepotrzebną drugą stronę.
- **Rozwiązanie**:
  - Wymuszenie sekwencji procesowej: **Rezerwacja -> Wydanie (`active`) -> Zwrot (`completed`)**.
  - W zakładce **Zwroty** (DailyOperations) oraz w oknie szczegółów w **Kalendarzu**, jeśli status rezerwacji to `paid` lub `invoiced` (a nie `active`), przycisk zakończenia/zdania jest zablokowany, a użytkownik widzi status *"Wymaga wydania"* oraz bezpośredni przycisk *"Wydaj przyczepę"*.
  - Dodatkowa walidacja w `ReturnTrailerDialog` uniemożliwiająca zatwierdzenie protokołu zdania bez wcześniejszego wydania.
  - Optymalizacja szablonów CSS/HTML w `PrintableAgreement.tsx`, `PrintableReturnProtocol.tsx` oraz `lib/print.ts` pod format A4 (`size: A4 portrait`, zerowanie zbędnych marginesów zewnętrznych, zagęszczenie wierszy i kompensacja skali o ~15%).

---

### 2. User Experience & Visual Design

#### A. Zakładka Zwroty (`DailyOperations.tsx`)
- Dla rezerwacji ze statusem innym niż `active` (np. `paid`, `invoiced`):
  - Karta rezerwacji zawiera ostrzeżenie: `Wymaga wydania (przyczepa nie została jeszcze wydana)`.
  - Przycisk *"Zakończ i odbierz"* (`markAsCompleted`) zostaje zastąpiony stanem zablokowanym (`disabled`) lub zintegrowany z przyciskiem akcji *"Najpierw wydaj przyczepę"*, otwierającym od razu okno wydania i umowy (`ReleaseTrailerDialog`).
  - Dopiero po zakończeniu wydania (zmiana statusu na `active`) odblokowuje się pełna możliwość odbioru przyczepy.

#### B. Okno szczegółów rezerwacji (`TrailerCalendar.tsx`)
- Zachowanie spójnej ścieżki: jeśli rezerwacja nie jest `active`, dostępny jest wyłącznie przycisk *"Wydaj przyczepę"*. Przycisk zdania/odbioru pojawia się tylko dla trwających wydań (`active`).

#### C. Szablony wydruku na 1 stronie A4
- **`PrintableAgreement.tsx`** (Umowa i rachunek):
  - Zmniejszenie paddingów kontenera z `p-8` na `p-4 print:p-0`.
  - Zmniejszenie pionowych marginesów sekcji (`mb-6` -> `mb-2 print:mb-1.5`).
  - Zagęszczenie komórek tabeli opłat i kaucji (`p-1` -> `py-0.5 px-1 text-xs`).
  - Skalowanie tekstu warunków najmu (`text-xs` -> `text-[9.5px] leading-tight`).
  - Wymuszenie w stylach druku: `@page { size: A4 portrait; margin: 8mm; }` oraz reguły `page-break-inside: avoid`.
- **`PrintableReturnProtocol.tsx`** (Protokół zdania):
  - Identyczne dopasowanie do formatu A4: zredukowanie wysokości 10 wierszy kontrolnych tabeli, zwięzły nagłówek DOLLCO, skrócone odstępy na podpisy.
  - Gwarancja, że cały protokół z podpisami mieści się na dokładnie 1 kartce papieru.

---

### 3. Key Product Decisions & Trade-Offs

- **Widoczność niewydanych przyczep na liście zwrotów**: Zgodnie z wyborem użytkownika, przyczepy nie są ukrywane, lecz wyraźnie oznaczone jako oczekujące na wydanie. Ułatwia to personelowi orientację, kiedy klient przychodzi zdać przyczepę, a system wskazuje, że formalność wydania nie została jeszcze dopełniona.
- **Skalowanie wydruku vs. zmiana układu**: Zamiast usuwać sekcje umowy, zachowujemy w 100% oryginalny wzór i treść prawną, kompensując nadmiarowe 15% wysokości poprzez usunięcie pustych przestrzeni, zmniejszenie marginesów strony oraz delikatne zagęszczenie typografii.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Daily Operations View                    │
│                                                             │
│  [Pickups Tab]                   [Returns Tab]              │
│  • res.status == 'paid'          • res.status == 'active'   │
│    -> [ Wydaj przyczepę ]          -> [ Odbierz przyczepę ] │
│                                  • res.status != 'active'   │
│                                    -> Status: Wymaga wydania│
│                                    -> [ Wydaj najpierw ]    │
└───────────────────────────────┬─────────────────────────────┘
                                │
                 ┌──────────────┴──────────────┐
                 ▼                             ▼
       [ Release Process ]            [ Return Process ]
       • Sets status = 'active'       • Blocked if status != 'active'
       • Generates Agreement          • Sets status = 'completed'
       • Print Agreement A4           • Print Return Protocol A4
         (1 Page Strict)                (1 Page Strict)
```

#### Komponenty podlegające modyfikacjom:
1. `components/DailyOperations.tsx`:
   - Logika sprawdzania czy `res.status === 'active'` przed umożliwieniem zwrotu.
   - Nowy stan wizualny dla kart w zakładce Zwroty (badge `Wymaga wydania`, przycisk `Wydaj przyczepę`).
2. `components/ReturnTrailerDialog.tsx`:
   - Zabezpieczenie przed wywołaniem dialogu dla rezerwacji niewydanej.
3. `components/TrailerCalendar.tsx`:
   - Warunek sprawdzający status przy wyświetlaniu akcji wydania/odbioru.
4. `components/PrintableAgreement.tsx` & `components/PrintableReturnProtocol.tsx`:
   - Redukcja rozmiarów czcionek, paddingów i marginesów o ~15% do idealnego spasowania z formatem A4.
5. `lib/print.ts`:
   - Dostosowanie reguł `@page` (`margin: 8mm`, `size: A4 portrait`) i usunięcie podwójnych marginesów `body`.
