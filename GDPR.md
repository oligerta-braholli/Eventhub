# GDPR-dokumentation – EventHub

Det här dokumentet förklarar vilka personuppgifter EventHub sparar, varför jag sparar dem och hur användaren kan ta bort sina uppgifter.

---

## Vilka personuppgifter sparar jag?

| Uppgift | Var sparas den? | Varför? |
|---------|----------------|---------|
| Namn | `users.name` | Visas på bokningar och recensioner |
| E-postadress | `users.email` | Används för inloggning |
| Lösenord | `users.password` | Autentisering – sparas **hashat** med bcrypt, aldrig i klartext |
| Roll | `users.role` | Styr vad användaren får göra (deltagare, arrangör, admin) |

Jag sparar **inte** mer information än vad som behövs.

---

## Hur länge sparas uppgifterna?

Uppgifterna sparas tills användaren själv väljer att ta bort sitt konto eller begär anonymisering.

---

## Användarens rättigheter

Användaren har rätt att:

- **Se sin data** – via `GET /api/gdpr/export` får man ut all sin sparade data
- **Ta bort sin data** – via `DELETE /api/gdpr/anonymize/:userId` anonymiseras namn, e-post och all kopplad data (bokningar, recensioner, väntelista)

### Vad händer vid anonymisering?

- Namn ändras till `Anonymized User`
- E-post ändras till `anon_XXXXXXXX@anonymized.invalid`
- Fältet `isAnonymized` sätts till `true` på alla kopplade poster
- Kontot kan inte återställas efter anonymisering

---

## Vad loggar jag?

Jag loggar bara teknisk information som behövs för felsökning:

| Loggas | Loggas INTE |
|--------|-------------|
| HTTP-metod (GET, POST osv.) | Lösenord |
| URL-sökväg | E-postadresser |
| Statuskod (200, 404 osv.) | Request body |
| Svarstid | Authorization-headers |

---

## Säkerhet

- Lösenord hashas med **bcrypt** (salt-faktor 12) – jag kan aldrig se ditt riktiga lösenord
- All kommunikation sker via **HTTPS** i produktion
- JWT-tokens används för autentisering och är tidsbegränsade (standard: 7 dagar)
- Känsliga miljövariabler (databaslösenord, JWT-nyckel) lagras aldrig i koden

---

## Ansvarig

Projekt: EventHub  
Kurs: Backendutveckling i Node.js, databaser och säkerhet  
Författare: Oligerta Braholli
