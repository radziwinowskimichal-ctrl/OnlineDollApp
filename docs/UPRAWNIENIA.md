# Smart Trailer Manager — uprawnienia (PL / DE / EN)

Dokument opisuje, kto co może robić w aplikacji. Macierz uprawnień jest zdefiniowana w kodzie
w jednym miejscu (`lib/permissions.ts`) i egzekwowana w `lib/context.tsx` przez `canManage()`.

## Role

| Rola | Konto przykładowe | Zakres |
|---|---|---|
| `admin` | `admin` | Wszystko |
| `employee` (biuro) | Erwin, Steffi, BOSS | Wszystkie operacje biurowe — **bez** dostępu do danych klientów nie ma mechanik |
| `mechanic` | Andy, Michal | Tylko panel mechanika (RODO): bez CRM, kalendarza, floty, TÜV, kopii bazy |

## Macierz operacji biurowych

Każda operacja poniżej jest dozwolona dla **admina i każdego pracownika biura**, a zablokowana dla mechanika:

| Akcja (`canManage`) | Co obejmuje |
|---|---|
| `fleet.edit` | Dodawanie / edycja / usuwanie przyczep, reset floty, zmiana statusu serwisowego, **edycja terminu TÜV** |
| `reservation.edit` | Edycja i usuwanie rezerwacji |
| `client.edit` | Edycja i usuwanie klientów |
| `client.balance` | Korekty salda / rozliczenia |
| `workshop.delete` | Usuwanie zleceń warsztatowych |
| `data.restore` | Tworzenie, usuwanie i przywracanie kopii bazy |
| `settings.edit` | Ustawienia aplikacji i kolory statusów |
| `profile.manage` | Dodawanie / usuwanie kont pracowników i mechaników |

Konto `admin` oraz konto aktualnie zalogowanego użytkownika nie może zostać usunięte
(blokada w `deleteEmployeeProfile`).

## Terminy TÜV

- Osobna zakładka **TÜV** z licznikami (przeterminowane / ≤30 / ≤60 / ≤90 dni / bez terminu), filtrami,
  wyszukiwarką, drukiem listy i kartami mobilnymi.
- Edycja daty: `updateTrailerTuv()` — zapisuje datę, autora i znacznik czasu oraz wpis w `tuvHistory`
  (data poprzednia → nowa, autor, opcjonalna notatka).
- Dostęp: `admin` + `employee`. Mechanik nie widzi zakładki i nie otrzymuje danych floty.

## Mechanicy (RODO)

- Mechanik nigdy nie pobiera klientów, rezerwacji, kopii bazy ani danych kosztowych.
- Logowanie mechanika kieruje do wydzielonego panelu warsztatu.

---

# Permissions (EN, short)

All office operations are available to `admin` **and** every `employee` (office) account and are
blocked for `mechanic` accounts. The matrix lives in `lib/permissions.ts`:

`fleet.edit`, `reservation.edit`, `client.edit`, `client.balance`, `workshop.delete`,
`data.restore`, `settings.edit`, `profile.manage`.

# Berechtigungen (DE, kurz)

Alle Bürovorgänge stehen `admin` **und jedem** `employee`-Konto (Büro) zur Verfügung und sind für
`mechanic`-Konten gesperrt. Matrix in `lib/permissions.ts` (siehe oben).
