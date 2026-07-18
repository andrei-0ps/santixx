
update public.anatomy_structures s
set description_ro = v.description_ro,
    function_ro    = v.function_ro,
    updated_at     = now()
from (values
  ('muschii-abdominali',
   'Peretele abdominal are patru straturi: dreptul abdominal (mușchiul „pătratelor", flexează trunchiul), oblicul extern și oblicul intern (rotesc și înclină trunchiul) și transversul abdominal (cel mai profund, „corsetul natural" care comprimă abdomenul și stabilizează coloana).',
   'Susțin organele, stabilizează coloana și participă la flexia și rotația trunchiului, la respirație și la tuse.'),

  ('muschii-bratului-anteriori',
   'Grupul anterior al brațului: bicepsul brahial (flexează cotul și supinează antebrațul), brahialul (cel mai puternic flexor pur al cotului, situat sub biceps) și coracobrahialul (aduce brațul spre corp).',
   'Flexează cotul, supinează antebrațul și participă la flexia umărului.'),

  ('muschii-bratului-posteriori',
   'Grupul posterior al brațului: tricepsul brahial (trei capete — lung, lateral și medial) și anconeul. Tricepsul reprezintă circa două treimi din masa musculară a brațului.',
   'Extinde cotul — esențial la împins, aruncat și la sprijinul pe brațe.'),

  ('muschii-gatului',
   'Mușchii gâtului: sternocleidomastoidianul (rotește și înclină capul), scalenii (flexie laterală și ridicarea primelor coaste la inspir), platysma (mușchiul superficial al gâtului) și mușchii prevertebrali.',
   'Permit rotația, flexia și înclinarea capului și stabilizează coloana cervicală.'),

  ('muschii-masticatori',
   'Mușchii masticației acționează asupra articulației temporo-mandibulare: maseterul și temporalul închid gura și strâng mandibula, iar pterigoidienii (medial și lateral) o deplasează lateral și o coboară.',
   'Asigură mestecatul și mișcările mandibulei (închidere, deschidere, lateralitate).'),

  ('cvadriceps',
   'Cvadricepsul femural are patru capete (rectus femoris, vastus lateralis, vastus medialis și vastus intermedius) pe fața anterioară a coapsei. Este cel mai puternic extensor al genunchiului.',
   'Extinde genunchiul și stabilizează rotula — esențial la mers, alergat, urcat scări și sărituri.'),

  ('ischiogambieri',
   'Ischiogambierii (biceps femural, semitendinos, semimembranos) ocupă fața posterioară a coapsei. Sunt printre cei mai frecvent lezați mușchi în sprint.',
   'Flexează genunchiul și extind șoldul; participă la mers, alergare și propulsie.'),

  ('adductori',
   'Grupul medial al coapsei: adductorii mare, lung și scurt, gracilis și pectineu, dispuși pe fața internă a coapsei.',
   'Aduc coapsa spre linia mediană și stabilizează membrul inferior la schimbările de direcție.'),

  ('muschii-tibiali-peronieri',
   'Tibialul anterior (fața anterioară a gambei) ridică vârful piciorului și inversează planta; fibularii (lung și scurt, fața laterală) eversează planta și stabilizează glezna lateral.',
   'Controlează dorsiflexia și eversia piciorului și previn entorsele de gleznă.'),

  ('muschii-fesieri',
   'Mușchii fesieri: gluteus maximus (cel mai puternic mușchi din corp — extinde și rotește lateral coapsa), gluteus medius și gluteus minimus (abduc coapsa și stabilizează bazinul la mers).',
   'Asigură extensia, abducția și rotația coapsei și stabilizarea pelvisului la fiecare pas.'),

  ('muschii-soldului-profunzi',
   'Rotatorii externi profunzi ai șoldului: piriform, obturator intern și extern, gemenii (superior și inferior) și pătratul femural. Piriformul trece peste nervul sciatic.',
   'Rotesc lateral coapsa și stabilizează articulația șoldului.'),

  ('muschii-spatelui-superficiali',
   'Stratul superficial al spatelui: trapezul (ridică, retrage și coboară omoplatul), marele dorsal (cel mai mare mușchi al spatelui), romboizii și levator scapulae.',
   'Mișcă și stabilizează omoplatul și brațul; sunt activi în tracțiune, canotaj și înot.'),

  ('muschii-spatelui-profunzi',
   'Stratul profund al spatelui: erector spinae (iliocostal, longissimus, spinos), multifidus și pătratul lombar.',
   'Extind și stabilizează coloana vertebrală și mențin postura verticală.'),

  ('muschii-pieptului',
   'Mușchii pieptului: pectoral mare (adducție și rotație internă a brațului), pectoral mic (coboară omoplatul) și serratus anterior (rotește omoplatul în sus).',
   'Participă la mișcările brațului, la împins și la stabilizarea omoplatului.'),

  ('coafa-rotatorilor',
   'Coafa rotatorilor este formată din patru mușchi profunzi ai umărului: supraspinos, infraspinos, subscapular și rotund mic.',
   'Mențin capul humeral în cavitatea glenoidă și asigură rotația și stabilitatea umărului.')
) as v(slug, description_ro, function_ro)
where s.slug = v.slug
  and s.tissue = 'muschi'
  and (coalesce(s.description_ro, '') = '' or coalesce(s.function_ro, '') = '');
