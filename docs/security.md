# Securitate Santix

## Masuri implementate

- Autentificare prin Supabase Auth pentru functionalitatile AI cu istoric.
- Row Level Security pentru conversatii si mesaje AI: utilizatorul vede si sterge doar datele lui.
- Validare input cu Zod pentru server functions.
- Limitare lungime input:
  - AI contextual: maximum 900 caractere;
  - triaj local: maximum 800 caractere.
- Filtrare input abuziv:
  - caractere de control eliminate;
  - mesaje repetitive excesiv respinse;
  - incercari evidente de prompt injection respinse.
- Rate limiting pentru AI:
  - 12 cereri / minut / utilizator;
  - 150 cereri / zi / utilizator;
  - implementat atomic in Supabase prin `check_ai_rate_limit`;
  - fallback temporar in memorie pentru dezvoltare locala.
- Triajul rapid foloseste analiza locala determinista si nu mai apeleaza provider extern.
- Raspunsurile AI sunt salvate dupa curatarea caracterelor de control si limitarea lungimii.
- Afisarea mesajelor in React se face ca text, nu ca HTML injectat.
- `dangerouslySetInnerHTML` a fost eliminat din componenta de chart.
- Headere defensive sunt setate in dev/preview si in build-ul server-side:
  - Content Security Policy;
  - Referrer Policy;
  - X-Content-Type-Options;
  - X-Frame-Options;
  - Permissions Policy.
- Semantic search extern este dezactivat in codul curent. Retrieval-ul foloseste fallback local/contextual
  pana cand alegi explicit un provider de embeddings pe care il poti justifica in prezentare.
- `npm audit --audit-level=moderate` raporteaza 0 vulnerabilitati dupa update-ul de dependinte.

## Ce trebuie aplicat in Supabase

Ruleaza migratiile noi in proiectul Supabase:

- `20260515172000_ai_rate_limits.sql`

Aceasta creeaza:

- tabela `ai_rate_limits`;
- politici RLS pentru utilizatorul curent;
- functia `check_ai_rate_limit`.

## Ce trebuie configurat la deploy

- Nu expune niciodata `SUPABASE_SERVICE_ROLE_KEY` in frontend.
- Pastreaza doar `VITE_SUPABASE_URL` si `VITE_SUPABASE_PUBLISHABLE_KEY` in client.
- Foloseste HTTPS in productie.
- Configureaza protectie la nivel de platforma:
  - Cloudflare/WAF pentru rate limit global;
  - limita de request body;
  - cache static pentru asset-uri;
  - alerte pentru trafic anormal.
- Pastreaza Ollama/API AI in zona server-side, nu in client.

## Riscuri ramase

- Rate limiting-ul in memorie este doar fallback local. Protectia reala este cea din Supabase.
- Nu exista inca WAF configurat in repository, deoarece tine de contul de deploy.
- Nu exista audit automat complet pentru accesibilitate si security headers.
- Dependintele trebuie verificate periodic cu `npm audit`, fara update automat orb chiar inainte de demo.
