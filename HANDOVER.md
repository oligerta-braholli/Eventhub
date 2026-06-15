# Överlämningsdokumentation – EventHub

Det här dokumentet beskriver projektets nuläge, vad som fungerar, vad som saknas och varför jag tog vissa tekniska beslut.

---

## Projektets nuläge

EventHub är en fullstack-webbapplikation för eventhantering. Projektet är färdigt och driftsatt.

| Del | Status |
|-----|--------|
| Backend API (Express + MongoDB) | ✅ Klar och driftsatt |
| Frontend (React + Vite) | ✅ Klar och driftsatt |
| Autentisering med JWT | ✅ Fungerar |
| Rollbaserad åtkomstkontroll (RBAC) | ✅ Fungerar |
| Bokningar och väntelista | ✅ Fungerar |
| Recensioner | ✅ Fungerar |
| Admin-dashboard | ✅ Fungerar |
| GDPR – export och anonymisering | ✅ Fungerar |
| Automatiska tester | ✅ 24 tester, alla godkända |

---

## Kända problem och begränsningar

Dessa saker fungerar inte eller är inte implementerade:

1. **Ingen e-postnotifikation** – när en bokning bekräftas eller en användare befordras från väntelistan skickas inget e-postmeddelande. Skulle behöva ett e-posttjänst som Nodemailer eller SendGrid.

2. **Ingen betalning** – biljetter kan ha ett pris men det finns ingen faktisk betalningsintegration. Skulle behöva Stripe eller liknande.

3. **Ingen bilduppladdning** – events kan inte ha bilder. Skulle behöva molnlagring som Cloudinary.

4. **Ingen lösenordsåterställning** – användare kan inte återställa sitt lösenord om de glömmer det.

---

## Hur man tar över projektet

1. Klona repot och följ installationsstegen i [README.md](README.md)
2. Skapa en `.env`-fil baserat på `.env.example`
3. Kör `npm run seed` för att lägga in testdata
4. Kör `npm test` i `backend/`-mappen för att verifiera att allt fungerar

---

## ADR – Arkitekturella beslut

Här förklarar jag varför jag valde de tekniker jag valde.

---

### ADR-1: MongoDB istället för SQL (PostgreSQL/MySQL)

**Beslut:** Jag använder MongoDB som databas.

**Varför:**
- Events har flexibla strukturer (olika antal biljetttyper per event)
- MongoDB passar bra när data inte alltid ser likadan ut
- Jag använde MongoDB Atlas som hanterad molntjänst vilket gör driftsättning enklare

**Nackdel:**
- Ingen inbyggd stöd för relationer och joins som i SQL
- Transaktioner kräver en Replica Set-konfiguration

---

### ADR-2: JWT istället för sessions

**Beslut:** Jag använder JWT (JSON Web Tokens) för autentisering.

**Varför:**
- JWT är stateless – servern behöver inte spara sessionsinformation
- Fungerar bra med REST API:er
- Enkelt att skicka med i varje request via Authorization-headern

**Nackdel:**
- Går inte att ogiltigförklara en token innan den löper ut (om någon stjäl en token kan den användas i upp till 7 dagar)

---

### ADR-3: TypeScript istället för vanlig JavaScript

**Beslut:** Hela projektet är skrivet i TypeScript.

**Varför:**
- Fångar fel tidigt – TypeScript klagar om man skickar fel typ av data
- Bättre kodkomplettering i VS Code
- Lättare att förstå koden

**Nackdel:**
- Lite mer kod att skriva (typer och interfaces)
- Kräver kompilering innan man kan köra koden

---

### ADR-4: Zod för validering

**Beslut:** Jag använder Zod för att validera inkommande data från användaren.

**Varför:**
- Enkelt att definiera regler för vad som är giltig data
- Ger tydliga felmeddelanden om något är fel
- Fungerar bra med TypeScript

---

### ADR-5: React + Vite för frontend

**Beslut:** Frontend är byggd med React och Vite.

**Varför:**
- React är ett populärt och välkänt bibliotek
- Vite är snabbare än Create React App
- Komponentbaserat – lätt att återanvända UI-delar

---

## Författare

Oligerta Braholli  
Kurs: Backendutveckling i Node.js, databaser och säkerhet
