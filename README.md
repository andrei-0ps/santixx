# Santix

Santix este o aplicație web educațională pentru explorarea anatomiei umane în 3D. Proiectul a fost realizat pentru InfoEducație, secțiunea Web, de o echipă formată din 2 membri.

Ideea de bază este simplă: utilizatorul poate alege o zonă sau o structură anatomică din modelul 3D, poate citi explicații pe înțelesul lui și poate folosi un asistent AI pentru întrebări legate de anatomie sau de un triaj orientativ al durerii.

Santix nu oferă diagnostic medical. Răspunsurile despre simptome sunt doar orientative și includ recomandări generale sau trimitere către medic atunci când apar semne de risc.

## Ce include aplicația

- explorator 3D pentru schelet, sistem muscular și organe interne;
- selectarea structurilor anatomice din model și afișarea detaliilor relevante;
- denumiri în română și, unde este cazul, denumiri științifice;
- glosar / ghid cu informații anatomice;
- quiz de anatomie cu întrebări de verificare;
- asistent AI contextual, legat de structura selectată;
- triaj local orientativ pentru durere, cu întrebări ghidate;
- detecție pentru semne de urgență;
- autentificare cu email sau Google;
- istoric al conversațiilor pentru utilizatorii autentificați;
- interfață în română și engleză;
- mod luminos / întunecat;
- teste automate pentru părțile importante ale aplicației.

## Tehnologii folosite

### Frontend

| Tehnologie | Unde este folosită |
|---|---|
| React 19 | componentele aplicației și interfața principală |
| TypeScript | tipare mai clare pentru date, componente și logica AI |
| TanStack Start | structura aplicației și partea de server functions |
| TanStack Router | rutare între landing page, explorator, glosar, quiz și callback auth |
| TanStack Query | gestionarea datelor asincrone unde este nevoie |
| Vite | development server și build de producție |
| Tailwind CSS | stilizarea interfeței |
| Radix UI | componente UI accesibile: dialoguri, meniuri, tabs, popover etc. |
| lucide-react | iconițe pentru navigație și butoane |
| Framer Motion | animații și tranziții în interfață |

### 3D și resurse anatomice

| Tehnologie / format | Rol |
|---|---|
| Three.js | baza randării 3D |
| @react-three/fiber | integrarea Three.js în React |
| @react-three/drei | helper-e pentru camera, lumini, controale și încărcare modele |
| GLB / glTF | formatul modelelor anatomice |
| @gltf-transform/core | prelucrare / export pentru unele resurse 3D |

### Backend, date și autentificare

| Tehnologie | Rol |
|---|---|
| Supabase | autentificare, bază de date și acces la date |
| PostgreSQL | stocarea datelor aplicației |
| Row Level Security | protecția conversațiilor și mesajelor pe utilizator |
| Migrații SQL | versionarea schemei bazei de date |
| pgvector | suport pentru căutare semantică în baza de cunoștințe |
| Supabase Auth | conturi prin email și Google |

### AI și validare

| Tehnologie / modul | Rol |
|---|---|
| Ollama | rulare locală a modelului AI în dezvoltare și testare |
| Zod | validarea inputului pentru server functions |
| Pipeline AI propriu | normalizare, clasificare, extragere semnale, stare conversație și alegerea pasului următor |
| RAG / retrieval | alegerea contextului relevant din baza de cunoștințe |
| Filtre de siguranță | limitare lungime input, respingere prompt injection evident și mesaje repetitive |

### Testare, calitate și deploy

| Tehnologie | Rol |
|---|---|
| Playwright | teste automate pentru scenarii AI, securitate și date anatomice |
| ESLint | verificări de cod |
| Prettier | formatare cod |
| Cloudflare Vite Plugin | build pentru deploy pe infrastructură Cloudflare |
| Wrangler | configurare pentru Cloudflare Workers |
| Git | versionarea codului |

## Arhitectura AI

Pentru partea AI nu ne-am bazat doar pe un prompt trimis direct către model. Am separat logica în mai mulți pași, ca să putem controla mai bine răspunsurile:

1. normalizare text;
2. extragere de semnale medicale simple: durere, traumă, severitate, durată, limitare de mișcare;
3. clasificare: anatomie, durere, red flag, întrebare în afara scopului;
4. actualizarea stării conversației;
5. alegerea următoarei întrebări sau recomandări;
6. retrieval din baza de cunoștințe;
7. generarea răspunsului final.

Am ales abordarea asta pentru că într-un proiect cu temă medicală nu este suficient ca AI-ul să răspundă fluent. Trebuie să fie limitat la scopul aplicației și să evite recomandările riscante.

## Baza de date

Schema bazei de date include:

- structuri anatomice și aliasuri pentru căutare;
- legături între structuri și modelul 3D;
- informații pentru baza de cunoștințe;
- conversații AI;
- mesaje salvate pe utilizator;
- stare structurată pentru conversații;
- limitare de cereri AI;
- reguli RLS pentru protecția datelor utilizatorului.

Migrațiile sunt păstrate în `supabase/migrations/`, ca să poată fi urmărite modificările schemei.

## Securitate

În proiect există câteva măsuri de bază pentru securitate:

- validare input cu Zod;
- sanitizare pentru textul salvat;
- limitare de lungime pentru întrebări;
- rate limiting pentru cererile AI;
- RLS în Supabase;
- token Bearer pentru funcțiile care cer autentificare;
- security headers: CSP, Referrer Policy, X-Frame-Options, X-Content-Type-Options, Permissions Policy;
- afișarea mesajelor ca text, nu HTML injectat;
- teste pentru cazuri de input abuziv.

Mai multe detalii sunt în `docs/security.md`.

## Contribuția echipei

Proiectul a fost împărțit pe zone principale de lucru, iar integrarea finală a fost făcută împreună.

### Alexandru Grama

- flow-ul aplicației și structura interfeței;
- landing page, explorator și navigare;
- integrarea modelului 3D în browser;
- logica de interacțiune cu straturile anatomice;
- mapping vizual între structuri, denumiri și informații;
- ajustări pentru experiența utilizatorului în demo.

### Andrei Meilă

- Supabase, autentificare și reguli RLS;
- schema bazei de date și migrațiile SQL;
- logica pentru conversații și istoric;
- pipeline-ul AI pentru clasificare, triaj și răspunsuri;
- validare input, rate limiting și security headers;
- teste automate pentru scenarii AI, securitate și date anatomice.

Bibliotecile externe sunt folosite ca infrastructură, nu ca aplicație gata făcută. Modelele 3D și resursele anatomice sunt integrate și adaptate în Santix, iar produsul, integrarea și deciziile de implementare aparțin echipei.

## Structura proiectului

```txt
src/
├── components/       # componente UI, layout, auth, explorator 3D
├── data/             # date anatomice și cunoștințe locale
├── hooks/            # hook-uri React
├── integrations/     # Supabase client și middleware auth
├── lib/
│   ├── ai/           # pipeline AI, retrieval, provider, state
│   └── security/     # input safety, headers, rate limit
└── routes/           # paginile aplicației

public/
└── anatomy/          # modele și date anatomice

supabase/
└── migrations/       # schema bazei de date

tests/                # teste Playwright
```

## Rulare locală

Instalare dependențe:

```bash
npm install
```

Development server:

```bash
npm run dev
```

Build de producție:

```bash
npm run build
```

Teste:

```bash
npm run test:e2e
```

Pentru AI local este necesar Ollama cu modelul `llama3.2:3b`. Pentru autentificare și baza de date sunt necesare variabilele Supabase în `.env`.

## Status

Proiectul este încă în dezvoltare.
