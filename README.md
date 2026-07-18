# Santix

Santix este o aplicație web educațională pentru explorarea anatomiei umane în 3D. Am realizat proiectul pentru a lega modelul anatomic de explicații clare, căutare și conversații ghidate despre simptome descrise de utilizator. Aplicația poate organiza informațiile într-o fișă pentru consultație, dar nu oferă diagnostic și nu înlocuiește medicul.

## Funcționalități principale

Santix pornește dintr-un explorator 3D în care utilizatorul poate schimba între schelet, sistem muscular, organe și o vedere completă. Structurile pot fi selectate direct pe model sau prin căutare, iar panoul lateral afișează denumiri, descrieri educaționale și context pentru zona aleasă.

Pentru întrebări despre durere sau simptome, aplicația oferă o conversație contextuală. Răspunsurile utilizatorului sunt păstrate în fluxul conversației, iar la final poate fi generată o fișă PDF pentru consultație, cu întrebările, răspunsurile și informațiile neprecizate. Utilizatorii autentificați pot reveni la conversații din istoric.

Există și modul Ajutor Aproape, care folosește o hartă și date OpenStreetMap pentru orientare către farmacii sau servicii medicale din apropiere. Separat, pagina Optică & Vedere include un simulator educațional pentru dioptrii, deficiențe de vedere și corecție vizuală. Proiectul mai include quiz, ghid/glosar, interfață în română și engleză, mod luminos/întunecat și opțiune pentru text mărit.

## Cum funcționează partea conversațională

Partea conversațională este organizată în fluxuri de întrebări, nu doar într-un răspuns liber. Aplicația păstrează întrebarea activă, interpretează răspunsuri scurte în context și acceptă formulări naturale, inclusiv răspunsuri fără diacritice. De exemplu, un răspuns precum „moderata” este tratat ca severitate a durerii atunci când întrebarea activă cere severitatea.

Am separat întrebările educaționale despre anatomie de raportarea simptomelor. Pentru simptome, regulile conversației sunt controlate prin logică deterministă: stare de conversație, întrebări completate, răspunsuri normalizate și condiții de finalizare. Sistemul poate semnala prudent situații care merită atenție, dar nu stabilește diagnostice și nu prescrie tratamente.

Conversațiile pot fi folosite și fără cont pentru o sesiune locală. Autentificarea adaugă persistență: istoric, redeschiderea conversațiilor și legarea mesajelor de utilizatorul curent.

## Tehnologii

Interfața este construită cu React, TypeScript, TanStack Router, TanStack Start și Vite. Pentru stilizare sunt folosite Tailwind CSS, Radix UI, lucide-react și Framer Motion.

Exploratorul 3D folosește Three.js, React Three Fiber, Drei și modele în format GLB/glTF. Datele și autentificarea sunt gestionate prin Supabase și PostgreSQL, iar migrațiile SQL descriu schema bazei de date.

Partea conversațională are adaptoare pentru OpenAI și Ollama local, în funcție de configurarea mediului. Căutarea semantică folosește module de embeddings și pgvector, inclusiv provider OpenAI pentru embeddings atunci când este configurat. Harta din Ajutor Aproape folosește Leaflet și OpenStreetMap. Testele sunt scrise cu Playwright, iar verificările de cod folosesc TypeScript, ESLint și Prettier.

## Arhitectură

Codul este separat pe rute, componente UI, date anatomice și logică de domeniu. Exploratorul 3D, panoul de informații, istoricul, autentificarea, harta și simulatorul de vedere sunt module distincte, astfel încât pot fi dezvoltate și verificate separat.

Motorul conversațional are componente pentru normalizarea răspunsurilor, starea conversației, planul de întrebări, fluxurile ghidate și persistența mesajelor. Generarea PDF este separată într-un modul propriu, iar datele pentru hartă și logica de filtrare sunt păstrate în module dedicate.

## Rulare locală

1. Clonează repository-ul.
2. Instalează dependențele:

```bash
npm install
```

3. Creează configurația locală într-un fișier `.env.local`, folosind doar variabilele necesare pentru Supabase și, dacă este cazul, pentru providerul conversațional sau embeddings.
4. Pornește aplicația:

```bash
npm run dev
```

5. Pentru verificări locale:

```bash
npm run build
npm run test:e2e
npm run lint
```

## Utilizare

Un traseu simplu de demo începe în pagina Explorator. Utilizatorul alege scheletul, mușchii sau organele, selectează o structură din model sau din căutare și citește explicația afișată în panou.

Dacă descrie o problemă, conversația continuă cu întrebări scurte. După suficiente răspunsuri, aplicația poate genera fișa pentru consultație. Din același context se poate deschide Ajutor Aproape pentru orientare către opțiuni medicale din zonă, iar modulele Quiz și Optică & Vedere pot fi folosite separat pentru învățare.

## Limitări și siguranță

Santix este un proiect educațional. Nu oferă diagnostic medical, nu prescrie tratamente și nu înlocuiește consultația unui medic. Fișa PDF organizează informațiile introduse de utilizator, pentru a fi mai ușor de prezentat într-o discuție cu un specialist.

Pentru simptome severe, agravare rapidă sau situații de urgență trebuie contactate serviciile medicale. Datele OpenStreetMap pot fi incomplete sau neactualizate, deci rezultatele din Ajutor Aproape trebuie privite ca orientare, nu ca listă oficială.

## Echipa și contribuțiile

Proiectul este realizat de echipa Santix pentru InfoEducație. Contribuțiile pot fi completate în funcție de rolurile reale ale membrilor: interfață și experiență utilizator, integrare 3D, structurarea datelor anatomice, Supabase, conversații ghidate, PDF, hartă, testare și documentare.

Santix folosește biblioteci, servicii și resurse 3D externe ca infrastructură tehnică. Integrarea lor în aplicație, organizarea fluxurilor și legarea componentelor într-un produs funcțional aparțin echipei proiectului.

## Licență / utilizare

Repository-ul nu declară în prezent o licență separată. Utilizarea codului și a resurselor trebuie făcută ținând cont de licențele bibliotecilor, serviciilor și modelelor externe folosite.
