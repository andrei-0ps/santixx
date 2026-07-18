alter table public.ai_knowledge_entries
  add column if not exists title_en text,
  add column if not exists content_en text;

with translated as (
  select *
  from jsonb_to_recordset($knowledge$
[
  {
    "id": "0002db18-957e-4b05-9c68-2b72e98629a2",
    "title_en": "Possible symptoms involving Shoulder",
    "content_en": "pain when raising the lateral arm (painful arc between 60-120 degrees), nocturnal pain in the affected shoulder, weakness when rotating the arm, pain when combing or dressing (movements of the arm behind the back), clicking or cracking sensation when moving the shoulder, pain on palpation under the acromion."
  },
  {
    "id": "00410ef1-521e-46f8-98a0-9f77c50930ab",
    "title_en": "Possible symptoms involving Back of head",
    "content_en": "local pain after head trauma, sensitivity to touch, swelling or scalp wound; warning signs include confusion, loss of consciousness, repeated vomiting, unusual sleepiness, seizures, weakness, numbness, or fluid/blood coming from the nose or ears."
  },
  {
    "id": "00e09211-7b5a-4565-b665-3cb69db04dc1",
    "title_en": "Anatomical context: Middle ear",
    "content_en": "Anvil-shaped bone, located between the malleus and the stapes. Main function: Continues the transmission of sound vibrations."
  },
  {
    "id": "01431748-7c56-47a0-99d3-13465254c44f",
    "title_en": "Possible symptoms involving Forehead",
    "content_en": "local pain after head trauma, sensitivity to touch, swelling or scalp wound; warning signs include confusion, loss of consciousness, repeated vomiting, unusual sleepiness, seizures, weakness, numbness, or fluid/blood coming from the nose or ears."
  },
  {
    "id": "0390f789-53c6-4bcf-b5c9-22009a6c0d35",
    "title_en": "Educational guidance for Pelvis",
    "content_en": "pelvic pain after trauma with impossibility of support requires urgent evaluation; avoid walking and seek medical help."
  },
  {
    "id": "0477ca37-3de3-4113-b477-14ec43b60564",
    "title_en": "Useful questions about Tailbone",
    "content_en": "Was there a fall or accident? Does the pain go down the arm/leg? Is there numbness, weakness, trouble walking or urinary control?"
  },
  {
    "id": "04e448cd-5eb7-4d30-a4f9-5fc873bff30f",
    "title_en": "Possible symptoms involving Upper back",
    "content_en": "localized back or neck pain, stiffness, pain that increases with movement or support; possible neurological signs: numbness, tingling, weakness, difficulty walking or urinary/bowel disturbances."
  },
  {
    "id": "05fcbf4d-fbf1-4e04-9ed7-37775427e31a",
    "title_en": "Useful questions about Center of chest",
    "content_en": "Was it a frontal impact? Do you have shortness of breath, palpitations, dizziness or deep chest pain?"
  },
  {
    "id": "06126425-4973-488a-bf50-5a9a5f9e36e1",
    "title_en": "Anatomical context: Thigh",
    "content_en": "The longest and strongest bone in the body. Main function: Supports body weight in walking and support."
  },
  {
    "id": "0736d158-80e5-4b24-b44d-c2183b5a160d",
    "title_en": "Anatomical context: Palm",
    "content_en": "5 long bones in the palm of each hand. Main function: Supports the palm and articulates the fingers."
  },
  {
    "id": "07e03288-7a1e-4e68-9e17-2866c3287f56",
    "title_en": "Possible causes of pain involving Neck",
    "content_en": "trauma, fall, accident, overuse, compression fracture, osteoporosis, pathological bone processes or joint/ligament irritation around the vertebrae."
  },
  {
    "id": "082a98c9-a96b-42d3-96d9-fe1dda35c2b0",
    "title_en": "Possible causes of pain involving Jaw muscles",
    "content_en": "bruxism (nocturnal teeth grinding), masseter stress, TMJ dysfunction, dental malocclusion (teeth that don't fit properly), bad head posture, TMJ arthritis."
  },
  {
    "id": "083295dc-ac6e-45f5-91f8-1114932d6080",
    "title_en": "Warning signs involving Thigh",
    "content_en": "popping sound followed by intense pain and complete loss of strength (possible complete rupture); rapid extensive bruising; inability to walk; pain with large swelling and tenderness (possible compartment syndrome); knee pain with instability (possible ligament injury); progressive nocturnal pain."
  },
  {
    "id": "091f6c80-1ff7-48cf-8ab1-04b258312f82",
    "title_en": "Useful questions about Lower jaw",
    "content_en": "Has your bite changed? Can you open your mouth? Do you have numbness in your lip or any loose teeth?"
  },
  {
    "id": "0a31e80b-4817-4fbd-a738-21b3069648d4",
    "title_en": "Educational guidance for Upper shoulder",
    "content_en": "temporary sling/scarf immobilization and medical evaluation for deformity, severe pain, or major limitation; recovery includes pain control and guided mobilization as recommended."
  },
  {
    "id": "0c1b3ed2-55b1-4767-95f0-b8749052bc0b",
    "title_en": "Possible symptoms involving Tailbone",
    "content_en": "localized back or neck pain, stiffness, pain that increases with movement or support; possible neurological signs: numbness, tingling, weakness, difficulty walking or urinary/bowel disturbances."
  },
  {
    "id": "0cc35930-bef9-46f4-93cf-24845cfd0b48",
    "title_en": "Possible causes of pain involving Back",
    "content_en": "wrong weight lifting (most common), prolonged bad posture, overuse in sports, sleeping on the wrong mattress, contracture after standing, herniated disc (pain radiating down the leg), spondylolisthesis. The most common cause of low back pain in adults is musculo-ligamentous."
  },
  {
    "id": "0cf76bbe-5548-4c58-bd78-2661bcf4b28d",
    "title_en": "Educational guidance for Nose",
    "content_en": "apply cold wrap and seek evaluation if nose is deformed, nasal breathing is blocked, or bleeding persists."
  },
  {
    "id": "0dce4679-f951-4ffb-ac9e-2ed2b059503b",
    "title_en": "Warning signs involving Top of head",
    "content_en": "call 112 or seek urgent medical care for loss of consciousness, confusion, convulsions, neurological deficit, severe progressive pain, open wound or suspected open fracture."
  },
  {
    "id": "0ea1f7a7-b132-41ae-826d-11c89c6dc7cc",
    "title_en": "Possible symptoms involving Tear duct area",
    "content_en": "local facial pain, swelling, bruising, deformity, difficulty biting or chewing, jaw jam, deformed nose, nosebleed, double vision or numbness of the cheek/lip."
  },
  {
    "id": "127a7b87-e16a-4e19-8c37-c57488456514",
    "title_en": "Educational guidance for Thigh",
    "content_en": "for cramps: immediate stretching and hydration; for muscle fever: active rest, light movement; for muscle stretching: RICE (Rest-Ice-Compression-Elevation) protocol in the first 48 hours; gradual return to sports. See a doctor for severe pain with loss of strength or large bruising."
  },
  {
    "id": "12b0a4d2-eadf-4ab5-8207-1e4240228e62",
    "title_en": "Useful questions about Toes",
    "content_en": "Can you take four steps? Is the pain in the ankle, midfoot, heel or toes? Is there deformity or numbness?"
  },
  {
    "id": "14ecd93a-7d2d-418d-ab10-47861060afd1",
    "title_en": "Useful questions about Tear duct area",
    "content_en": "Was the trauma direct? Can you open your mouth normally? Has the bite changed? Do you have double vision, numbness or persistent nosebleeds?"
  },
  {
    "id": "1520a15a-0ab2-4ff1-9dc8-3ec4ab6add91",
    "title_en": "Useful questions about Chest and rib cage",
    "content_en": "Does the pain occur when you move your arm or when you breathe? Or is it a pain that sits and rests? Does it radiate to the left arm or the back? Do you have difficulty breathing, sweating or feeling sick? Did it appear after the effort at the gym or after the blow?"
  },
  {
    "id": "15c3ae82-d294-43ff-9648-659cd57ed29a",
    "title_en": "Useful questions about Inner nose",
    "content_en": "Was the trauma direct? Can you open your mouth normally? Has the bite changed? Do you have double vision, numbness or persistent nosebleeds?"
  },
  {
    "id": "16a93e90-171d-4e2c-b4dc-769f7318b93d",
    "title_en": "Warning signs involving Upper shoulder",
    "content_en": "emergency for deformity, arm numbness/weakness, pale/cold skin, open wound, or high energy trauma."
  },
  {
    "id": "17804554-b28b-47a1-9b9b-e90bad5af799",
    "title_en": "Educational guidance for Abdomen",
    "content_en": "reducing abdominal exercises until relief; avoiding painful twisting movements; applying light heat to the contracted area. Consult a doctor if you are not sure if the pain is muscular, if it is severe, if it occurs at rest, if you have a fever, nausea or intestinal disorders."
  },
  {
    "id": "18cf5ccf-7b19-4997-9a0c-0afd42eebbae",
    "title_en": "Possible causes of pain involving Hip and buttock",
    "content_en": "gluteal insufficiency (common in those who sit a lot), overuse when running, trochanteric bursitis (inflammation of the bursa on the side of the hip), muscle rupture due to trauma, piriformis syndrome (the piriformis irritates the sciatic nerve), contracture after high-intensity sports."
  },
  {
    "id": "192846e8-87ab-48da-96a3-7995b357fcf0",
    "title_en": "Possible causes of pain involving Knee",
    "content_en": "fall directly on the knee, kick, strong contraction of the quadriceps; it can be patella fracture or contusion."
  },
  {
    "id": "19534e0b-c3e0-470b-a887-55d9a4df70ba",
    "title_en": "Educational guidance for Rib cage",
    "content_en": "simple rib pain is usually managed with pain control and regular deep breathing, but severe trauma or difficulty breathing requires medical evaluation."
  },
  {
    "id": "1ad35865-92c6-4052-802c-a81916cfe48c",
    "title_en": "Warning signs involving Hand",
    "content_en": "persistent numbness in fingers (possible carpal tunnel or cervical problem), joint deformity, inability to extend or flex a finger, suddenly pale or cold fingers (circulation problem), loss of control of fine movements, severe pain after trauma."
  },
  {
    "id": "1afa92f1-5f73-4ec0-a01a-67d342c988f4",
    "title_en": "Possible causes of pain involving Tailbone",
    "content_en": "trauma, fall, accident, overuse, compression fracture, osteoporosis, pathological bone processes or joint/ligament irritation around the vertebrae."
  },
  {
    "id": "1bbe3f55-aff9-4a95-8f6a-3e6a8f425643",
    "title_en": "Possible symptoms involving Temple",
    "content_en": "local pain after head trauma, sensitivity to touch, swelling or scalp wound; warning signs include confusion, loss of consciousness, repeated vomiting, unusual sleepiness, seizures, weakness, numbness, or fluid/blood coming from the nose or ears."
  },
  {
    "id": "1bc0e909-6a81-40dd-83d6-13312b12986b",
    "title_en": "Warning signs involving Ankle",
    "content_en": "Seek emergency medical care for inability to bear weight, visible deformity, an open wound, numbness, cold or pale toes, or a wound or post-traumatic pain in a person with diabetes or vascular disease."
  },
  {
    "id": "1d34cc23-84a7-4e49-8336-5d4924e99be4",
    "title_en": "Warning signs involving Calf",
    "content_en": "red, warm and swollen calf with pain (blood clot — EMERGENCY); popping sound in the heel with inability to lift the heel off the ground (Achilles rupture); severe pain with rapid swelling after trauma; inability to walk."
  },
  {
    "id": "1d464c38-7411-4c3a-bbd2-56d25fe4c820",
    "title_en": "Possible causes of pain involving Midfoot",
    "content_en": "fall, twist, impact, object dropped on leg, running/overexertion; they can be tarsal, metatarsal, phalangeal fractures or Lisfranc injuries."
  },
  {
    "id": "1dfd1ac3-e847-4caa-be87-9be5079a157d",
    "title_en": "Possible symptoms involving Thigh",
    "content_en": "pain when running or climbing stairs, thigh cramps, tension or pain when stretching (stretch), weakness in knee extension (quadriceps), sudden pain when sprinting (muscle tear), tenderness to palpation, localized bruising, pain when sitting for a long time (hamstrings)."
  },
  {
    "id": "1f0403e9-bb53-44d2-b4c0-42d42e8d8273",
    "title_en": "Warning signs involving Arm",
    "content_en": "visible deformity after trauma (possible fracture or dislocation); inability to move the joint after a fall; rapid extensive bruising; numbness or weakness distal to trauma; suddenly cold or pale hand after trauma (possible vascular compromise)."
  },
  {
    "id": "21c544ab-9615-4e17-99b0-4b8bbbdb6ab3",
    "title_en": "Anatomical context: Neck",
    "content_en": "The sternocleidomastoid (SCM) rotates the head to the opposite side and tilts it to the same side—the most visible muscle in the neck. The scalenes (anterior, middle, posterior) laterally flex the neck and raise the first ribs on forced inspiration. Platysma — superficial neck muscle. All are involved in head posture."
  },
  {
    "id": "2386e88f-6a9b-4a3d-9bda-d64fbf9303b0",
    "title_en": "Useful questions about Palm",
    "content_en": "Where does it hurt: wrist, palm or finger? Can you make a fist? Is there deformity, numbness, or pain at the base of the hip?"
  },
  {
    "id": "246f29be-0d86-4ed0-af40-be0d5f6eb6ad",
    "title_en": "Warning signs involving Forearm",
    "content_en": "numbness or tingling in fingers 1-3 (possible carpal tunnel), progressive weakness of the grip, pain that does not go away with rest, swelling or deformity after trauma, loss of control of fine movements, pallor or sudden coldness of the hand."
  },
  {
    "id": "24a1d394-ee26-43d9-9f06-2ac97d0dc24e",
    "title_en": "Useful questions about Cheekbones",
    "content_en": "Was the trauma direct? Can you open your mouth normally? Has the bite changed? Do you have double vision, numbness or persistent nosebleeds?"
  },
  {
    "id": "24b919bf-fd65-4f0c-920b-d180d36de69d",
    "title_en": "Warning signs involving Upper arm",
    "content_en": "popping sound followed by intense pain and loss of strength (possible complete rupture), visible deformity of the arm, extensive bruising that appears quickly, progressive numbness or weakness, inability to extend the elbow after trauma."
  },
  {
    "id": "2545b6a8-3b0b-45bf-b84a-bc4b00995538",
    "title_en": "Useful questions about Skull base",
    "content_en": "Was there a hit to the head or a fall? Has loss of consciousness, vomiting, confusion or drowsiness occurred? Is the pain getting worse? Is there bleeding or a wound?"
  },
  {
    "id": "2588bf58-3534-42d3-8005-a18d47a526b9",
    "title_en": "Possible causes of pain involving Toes",
    "content_en": "fall, twist, impact, object dropped on leg, running/overexertion; they can be tarsal, metatarsal, phalangeal fractures or Lisfranc injuries."
  },
  {
    "id": "25eaee7d-0d8c-495c-b5a2-fd12c4d7a41c",
    "title_en": "Warning signs involving Knee",
    "content_en": "emergency for inability to bear weight, deformity, severe pain, numbness, bleeding, major trauma or locked knee after impact."
  },
  {
    "id": "267ccc6d-2c19-4f0f-ac47-f764fd759115",
    "title_en": "Possible causes of pain involving Inner nose",
    "content_en": "direct hit, fall, sports or road accident; pain may come from contusion, skull fracture, scalp injury, or intracranial complications associated with trauma."
  },
  {
    "id": "26f0a50e-8712-406b-bef7-7d63caec25fb",
    "title_en": "Possible causes of pain involving Lower leg",
    "content_en": "direct blow, fall, twist, overexertion by running/jumping, tibial/fibular fracture or bone contusion."
  },
  {
    "id": "28091211-eb76-408b-a241-ce2f3bd2457f",
    "title_en": "Anatomical context: Back of thigh",
    "content_en": "Hamstrings (biceps femoris longus brevis, semitendinosus, semimembranosus) flex the knee, extend the hip, and rotate the calf. They are the most frequently injured muscles in sports — the \"sprint tear.\" The biceps femoris is the most lateral; the deepest semimembranous."
  },
  {
    "id": "284517c3-4b72-4380-aa7a-c8f0ec950e12",
    "title_en": "Warning signs involving Throat",
    "content_en": "emergency for difficulty breathing, rapid swelling, changed voice, inability to swallow, or significant cervical trauma."
  },
  {
    "id": "286f7a5e-eed3-400b-8655-a844803df58b",
    "title_en": "Anatomical context: Upper arm",
    "content_en": "The arm has two main groups: the front (biceps brachii and brachii) which flex the elbow and supine the forearm, and the back (triceps brachii and anconeus) which extend the elbow. The bicep is usually the most \"visible\" arm muscle. The coracobrachialis stabilizes the arm against the chest."
  },
  {
    "id": "28b5f837-32ff-47f0-a456-116e9e0e4a12",
    "title_en": "Anatomical context: Upper shoulder",
    "content_en": "Long S-shaped bone, located horizontally above the first rib. Main function: Connects the upper limb to the thorax."
  },
  {
    "id": "2938c7a7-da6e-4f2d-968b-144eebb4f4b8",
    "title_en": "Useful questions about Upper arm",
    "content_en": "Does the pain occur when bending or extending the elbow? Did it appear after exertion (sports, weights) or after a blow? Did you hear or feel a popping sound? Does the arm look normal or is there deformity? Is there weakness or numbness?"
  },
  {
    "id": "29536b12-c52d-4a53-97df-683406f08ad4",
    "title_en": "Possible causes of pain involving Thigh",
    "content_en": "cramps (dehydration, fatigue), post-exercise muscle fever (DOMS), muscle strain (grade 1-2) when sprinting or sudden change of direction, muscle tear (grade 3 — snapping sound, complete loss of strength), direct contusion (hematoma), overexertion while cycling or swimming."
  },
  {
    "id": "29e4eed3-3327-44b8-968f-a51f14a7a420",
    "title_en": "Warning signs involving Abdomen",
    "content_en": "URGENT: severe and sudden abdominal pain; pain with fever, nausea, vomiting or intestinal disorders (possible internal causes: appendicitis, lithiasis, etc.); abdomen stiff as a board; pain that cannot be related to muscle activity; blood in the stool or urine; pain that gets progressively worse."
  },
  {
    "id": "2a0f1a15-4791-44b6-9862-073cee1e21db",
    "title_en": "Possible symptoms involving Lower leg",
    "content_en": "calf pain, tibia/fibula tenderness, swelling, bruising, pain on bearing, deformity or progressive pain on exertion in stress fracture."
  },
  {
    "id": "2b373238-1146-4418-b448-4cb9aff9cb4b",
    "title_en": "Educational guidance for Throat",
    "content_en": "sore throat with difficulty breathing, swallowing, or altered voice after trauma should be evaluated urgently."
  },
  {
    "id": "2bf2183a-d9e6-4869-a459-48f759995235",
    "title_en": "Warning signs involving Foot and sole",
    "content_en": "Warning signs include inability to place the foot on the ground after trauma, visible deformity, persistent numbness or tingling, suddenly pale or cold toes, severe pain with rapid swelling, or a wound or infection in a person with diabetes. These require urgent medical evaluation."
  },
  {
    "id": "2caf14c7-572d-4e26-bf99-6993e21e1734",
    "title_en": "Possible causes of pain involving Forearm",
    "content_en": "fall on outstretched hand, torsion, direct impact; the radius and ulna can fracture separately or together, including at the elbow or wrist."
  },
  {
    "id": "2d5cfd30-9109-4e5c-b011-b1a92f214114",
    "title_en": "Possible symptoms involving Inner nose",
    "content_en": "local facial pain, swelling, bruising, deformity, difficulty biting or chewing, jaw jam, deformed nose, nosebleed, double vision or numbness of the cheek/lip."
  },
  {
    "id": "2da59b22-12b7-4458-b529-0f65fe08f1df",
    "title_en": "Useful questions about Pelvis",
    "content_en": "Is the pain constant or does it occur with certain activities? Are you leaking urine on exertion? Is there difficulty with bladder or bowel control? Does the pain occur during sexual activity? Was there a recent birth or trauma to the area?"
  },
  {
    "id": "2dde8d40-f7bc-4742-8ecf-0fe6f28f2d93",
    "title_en": "Possible symptoms involving Lower spine",
    "content_en": "localized back or neck pain, stiffness, pain that increases with movement or support; possible neurological signs: numbness, tingling, weakness, difficulty walking or urinary/bowel disturbances."
  },
  {
    "id": "2e46fc29-d4d3-49e1-9a26-b41837bd891c",
    "title_en": "Educational guidance for Top of head",
    "content_en": "after head trauma with neurological symptoms, loss of consciousness, vomiting, aggravation or suspected fracture, urgent evaluation is required; exercise is avoided and neurological status is monitored until evaluation."
  },
  {
    "id": "2ebb00a1-221c-4756-b600-1ed36eae9d87",
    "title_en": "Warning signs involving Wrist",
    "content_en": "emergency for numb/cold fingers, deformity, open wound, inability to move fingers or severe pain after trauma."
  },
  {
    "id": "2ee252dd-610c-4424-b51c-676d704afb2f",
    "title_en": "Possible causes of pain involving Pelvis",
    "content_en": "fall, accident, osteoporosis, high energy trauma; there may be pelvic fractures, hip injuries or deep contusions."
  },
  {
    "id": "2f9e8f42-f45b-46bb-a94c-da58d9c64586",
    "title_en": "Useful questions about Throat",
    "content_en": "Did the pain occur after the blow? Can you breathe and swallow normally? Has the voice changed?"
  },
  {
    "id": "2fad5bcc-4309-4186-815e-d6fa8d766448",
    "title_en": "Educational guidance for Back",
    "content_en": "continue light movement (total bed rest does not help, on the contrary); stretching of the back and hamstrings; application of heat or ice (whatever brings you more comfort); correcting the posture at the office; correct lifting technique (knees, not back). See a doctor if the pain persists for more than 6 weeks or if it radiates into the leg."
  },
  {
    "id": "30f922ae-2455-4110-b055-0baa3c404fd4",
    "title_en": "Educational guidance for Calf",
    "content_en": "for cramps: immediate stretching of the ankle (pull the tip of the foot towards you), hydration; for tibial periostitis: reduce running, training on soft surfaces; for Achilles tendon: rest and physiotherapy. See a doctor for severe pain, swelling with redness (clot?), inability to step."
  },
  {
    "id": "31bc3789-7b25-475d-aee9-a5d57ae66c94",
    "title_en": "Warning signs involving Pelvis",
    "content_en": "sudden loss of bladder or bowel control (possible neurological emergency), sudden severe pelvic pain with fever (possible infection), unexplained vaginal or rectal bleeding, very intense pain after falling on tailbone."
  },
  {
    "id": "32289aaa-3d37-4609-8587-80b81b1cb487",
    "title_en": "Anatomical context: Calf",
    "content_en": "The lower leg has three muscle groups: the superficial posterior group, including the gastrocnemius and soleus; both plantarflex the foot, while the gastrocnemius also flexes the knee. The deep posterior group includes flexor digitorum longus, tibialis posterior, and flexor hallucis longus; they move the toes and turn the sole inward. The anterior and lateral groups include tibialis anterior, which lifts the front of the foot, and the fibularis muscles, which turn the sole outward. The Achilles tendon connects the gastrocnemius and soleus to the heel."
  },
  {
    "id": "330c68bb-c610-4c5e-ae1f-6bb34529b651",
    "title_en": "Warning signs involving Upper back",
    "content_en": "emergency for progressive numbness/weakness, difficulty walking, loss of bladder/bowel control, major trauma, fever, or severe night pain."
  },
  {
    "id": "33291a16-5293-4849-a854-0e681d395682",
    "title_en": "Anatomical context: Hip and buttock",
    "content_en": "Gluteus maximus (big glute) is the strongest muscle in the body: it extends and laterally rotates the thigh, essential for climbing stairs, running and standing up from a chair. Gluteus medius and minimus (middle and small glutes) abduct the thigh and stabilize the pelvis with each step. Their weakness causes a \"wobbly\" gait and lower back pain."
  },
  {
    "id": "335cac8c-66eb-4abc-ab88-c6d63393d53c",
    "title_en": "Possible symptoms involving Foot and sole",
    "content_en": "cramps in the sole (especially in the evening), pain when taking the first steps in the morning (plantar fasciitis), plantar fatigue after walking or prolonged standing, localized pain when palpating the plant, tension on the plantar arch, pain when moving the toes, burning sensation or pressure."
  },
  {
    "id": "3393bf4c-6412-420a-bf64-f609f8d5d47d",
    "title_en": "Possible symptoms involving Wrist",
    "content_en": "wrist/palm/finger pain, swelling, bruising, tenderness to pressure, grip limitation, deformity or pain in the scaphoid anatomic snuffbox."
  },
  {
    "id": "3461a488-aff7-4677-b018-35849e6c5445",
    "title_en": "Anatomical context: Head",
    "content_en": "The skull protects the brain (neurocranium: frontal, parietal, temporal, occipital, sphenoid, ethmoid) and forms the structure of the face (viscerocranium: maxilla, mandible, zygomatic, nasal). The bones of the face support the teeth, form the orbits and nasal cavities. The only movable joint is the mandible (temporomandibular joint)."
  },
  {
    "id": "3925a890-0efe-4baf-9a15-2274121cf430",
    "title_en": "Warning signs involving Neck",
    "content_en": "emergency for progressive numbness/weakness, difficulty walking, loss of bladder/bowel control, major trauma, fever, or severe night pain."
  },
  {
    "id": "3b9db1fd-44c4-4202-be64-ec50adedbfff",
    "title_en": "Anatomical context: Front of thigh",
    "content_en": "The quadriceps consists of 4 heads: rectus femoris, vastus lateralis, vastus medialis and vastus intermedius. It is the strongest knee extensor muscle and is essential for walking, running, climbing stairs and jumping. The vastus medialis (\"teardrop\") stabilizes the patella."
  },
  {
    "id": "3bfcad78-c6e0-44d0-a49a-f562688946b6",
    "title_en": "Possible causes of pain involving Shoulder",
    "content_en": "subacromial impingement (the tendon caught between the acromion and the humeral head) — the most common cause; degenerative tendinopathy (wear and tear in the elderly); partial or total rupture after sudden exertion or trauma; tendinous calcification (calcified = sudden intense pain); chronic shoulder instability."
  },
  {
    "id": "3c5a2e92-bd27-4275-a5ea-f417f36f1d3b",
    "title_en": "Possible symptoms involving Middle ear",
    "content_en": "deep pain in the ear after trauma, hearing loss, ringing, dizziness or feeling off balance; the ossicles of the ear may be involved in trauma to the temporal bone."
  },
  {
    "id": "3d0be6c0-c7d5-4eb0-946e-b69b3d897bf3",
    "title_en": "Educational guidance for Lower spine",
    "content_en": "spinal pain after trauma or associated with neurological symptoms requires medical evaluation; for pain without severe trauma, avoid prolonged immobilization and consult if it persists or worsens."
  },
  {
    "id": "3d5c4557-27ce-4381-8d3c-5df7995c617f",
    "title_en": "Warning signs involving Lower leg",
    "content_en": "emergency for deformity, severe pain, inability to bear weight, numbness, cold/pale leg or severe pain with progressive swelling."
  },
  {
    "id": "3d7a8d4e-8ec2-4c35-bceb-2a5a62f66c47",
    "title_en": "Educational guidance for Inner nose",
    "content_en": "after head trauma with neurological symptoms, loss of consciousness, vomiting, aggravation or suspected fracture, urgent evaluation is required; exercise is avoided and neurological status is monitored until evaluation."
  },
  {
    "id": "3e70dfbe-c274-47a0-a815-f120691d0fdc",
    "title_en": "Anatomical context: Foot and sole",
    "content_en": "The foot contains intrinsic muscles on the plantar surface (abductor hallucis — moves the big toe outward, flexor digitorum brevis, adductor hallucis, interosseous) and on the dorsal surface (extensor digitorum brevis). They support the longitudinal and transverse arch, allow the movements of the toes and adapt the sole to the terrain while walking."
  },
  {
    "id": "3f15170d-72e7-42ca-be1f-a044857307f6",
    "title_en": "Warning signs involving Roof of mouth",
    "content_en": "emergency for difficulty breathing, double vision, affected eye, obvious deformity, persistent bleeding, loose teeth, altered bite, or extensive numbness."
  },
  {
    "id": "3fee7c5e-279d-4778-a9dd-c6cb1bcc68ed",
    "title_en": "Possible symptoms involving Nose",
    "content_en": "nose pain, swelling, bleeding, deformity, stuffy nose or bruising around the eyes."
  },
  {
    "id": "41189d37-e235-429f-8eb2-132eaef03228",
    "title_en": "Warning signs involving Forehead",
    "content_en": "call 112 or seek urgent medical care for loss of consciousness, confusion, convulsions, neurological deficit, severe progressive pain, open wound or suspected open fracture."
  },
  {
    "id": "4172ccfa-11d5-48f2-afd4-bfbae97ab880",
    "title_en": "Possible symptoms involving Calf",
    "content_en": "cramps in the calf muscle (especially at night), pain when walking or running on the back of the calf, tension and pain when lifting on the toes, pain on the front side when lifting the leg (anterior tibia), shin splints in runners, pain on palpation of the Achilles tendon, slight swelling."
  },
  {
    "id": "4331d801-9c9c-47c3-8a1a-4ec36d4f1942",
    "title_en": "Anatomical context: Lower leg",
    "content_en": "The thin lateral leg bone. Main function: Stabilizes the ankle; muscle insertion point."
  },
  {
    "id": "4337cf0c-2fe1-42df-8b86-fe66fab8c91e",
    "title_en": "Possible symptoms involving Back of thigh",
    "content_en": "sudden pain in the posterior thigh when sprinting or explosive movement, tension or dull pain in the thigh after running, pain when bending the knee with resistance, tenderness to palpation in the posterior thigh, bruising in the posterior area, difficulty running or extending the hip."
  },
  {
    "id": "4366bcab-255a-49d3-b297-3ac9d74baea9",
    "title_en": "Possible symptoms involving Inner nose",
    "content_en": "local pain after head trauma, sensitivity to touch, swelling or scalp wound; warning signs include confusion, loss of consciousness, repeated vomiting, unusual sleepiness, seizures, weakness, numbness, or fluid/blood coming from the nose or ears."
  },
  {
    "id": "444b46ca-3813-493a-b570-54e76b8bc29d",
    "title_en": "Warning signs involving Palm",
    "content_en": "emergency for numb/cold fingers, deformity, open wound, inability to move fingers or severe pain after trauma."
  },
  {
    "id": "4461d586-0fc0-4dc7-849a-5cda9d688469",
    "title_en": "Possible causes of pain involving Ankle",
    "content_en": "fall, twist, impact, object dropped on leg, running/overexertion; they can be tarsal, metatarsal, phalangeal fractures or Lisfranc injuries."
  },
  {
    "id": "453906a6-318e-489c-80e6-ce7ba0e0f923",
    "title_en": "Useful questions about Abdomen",
    "content_en": "Does the pain occur with movement (twisting, bending) or also at rest? Did it occur after exercise or after coughing? Is there fever, nausea or vomiting? Can you link the pain to a physical activity? Is the pain localized or diffuse?"
  },
  {
    "id": "455846ee-cb09-4516-b203-4fa508982eab",
    "title_en": "Anatomical context: Back of head",
    "content_en": "Posterior bone of the skull, with the large opening (foramen magnum). Main function: Allows the passage of the spinal cord and protects the cerebellum."
  },
  {
    "id": "45e9ddab-839e-4cb3-8b6b-1a75269c22bf",
    "title_en": "Possible symptoms involving Calf",
    "content_en": "cramps at night or with exertion, pain when standing on tiptoes, tension in the calf muscle after running, pain in the Achilles tendon (above the heel), weakness in propulsion when walking or running, feeling of \"pulled muscle\" in the calf."
  },
  {
    "id": "46f5093e-68cc-42fe-aa4e-db3887e0f0e1",
    "title_en": "Warning signs involving Back of head",
    "content_en": "call 112 or seek urgent medical care for loss of consciousness, confusion, convulsions, neurological deficit, severe progressive pain, open wound or suspected open fracture."
  },
  {
    "id": "48fc7157-b649-4f62-a562-028212a1ec11",
    "title_en": "Anatomical context: Shoulder blade",
    "content_en": "Flat triangular bones located posteriorly on the thorax. Main function: Joint for humerus; ample arm mobility."
  },
  {
    "id": "4916144a-5aa8-4649-875d-bf001f53cf22",
    "title_en": "Educational guidance for Upper back",
    "content_en": "spinal pain after trauma or associated with neurological symptoms requires medical evaluation; for pain without severe trauma, avoid prolonged immobilization and consult if it persists or worsens."
  },
  {
    "id": "4992574c-1d37-4b33-982d-f00824762cf2",
    "title_en": "Possible causes of pain involving Lower leg",
    "content_en": "direct blow, fall, twist, overexertion by running/jumping, tibial/fibular fracture or bone contusion."
  },
  {
    "id": "49e213a5-1d69-44e9-ab6d-7721a7090d4f",
    "title_en": "Possible causes of pain involving Thigh",
    "content_en": "severe accident, fall, stress fracture or bone weakened by osteoporosis; femur fractures can be serious and require surgery."
  },
  {
    "id": "49f816f3-4f05-41f0-9cd2-7c8b18b0a623",
    "title_en": "Possible causes of pain involving Roof of mouth",
    "content_en": "direct trauma to the face, fall, contact sport, road accident, blow to the mandible, nose, eye socket, jaw or cheekbones; there may be fractures, tooth dislocations or soft tissue injuries."
  },
  {
    "id": "4b7ad0b2-86fb-40bd-ac9a-7dddf3eb57b0",
    "title_en": "Useful questions about Back",
    "content_en": "Is the pain in the lumbar (lower), dorsal (middle) or cervical (neck) area? Does it radiate into the buttocks, thigh or leg? Did it occur after lifting, sudden movement, or for no apparent reason? Is there numbness or weakness in the leg? Do you wake up at night because of pain? Do you have bladder or bowel problems?"
  },
  {
    "id": "4bdfbdc1-6626-4655-a206-caa56f021229",
    "title_en": "Educational guidance for Lower leg",
    "content_en": "avoid support if pain is severe or there is deformity; consult for X-ray if pain persists, occurs after trauma or prevents walking."
  },
  {
    "id": "4be901ec-b812-466d-a9ed-75118b780817",
    "title_en": "Educational guidance for Knee",
    "content_en": "suspected femur/hip or patella fracture requires urgent evaluation; the limb must be immobilized and not forced to walk."
  },
  {
    "id": "4c022178-2131-4199-9b15-213a65bf7201",
    "title_en": "Educational guidance for Ankle",
    "content_en": "elevating the limb, applying a wrapped cold compress, and reducing weight bearing; consult if you can't walk, the pain is intense, there is deformity or suspected fracture."
  },
  {
    "id": "4c603297-0de6-41a7-9fd2-d40bb5d7cc04",
    "title_en": "Warning signs involving Lower back",
    "content_en": "emergency for progressive numbness/weakness, difficulty walking, loss of bladder/bowel control, major trauma, fever, or severe night pain."
  },
  {
    "id": "4c78d8a7-cd9e-459d-bfd5-b17c7e0e58d1",
    "title_en": "Anatomical context: Back of upper arm",
    "content_en": "The triceps brachii (three heads: long — from the shoulder blade; lateral and medial — from the humerus) extends the elbow — essential for pushing, throwing, and arm support. The elbow is a small triangular muscle near the elbow that helps with extension. The triceps make up about 2/3 of the muscle mass of the arm."
  },
  {
    "id": "4ca2d399-6324-4e20-9dc7-79c49efdfaaf",
    "title_en": "Possible symptoms involving Forearm",
    "content_en": "pain or burning in the forearm when typing, writing, or grasping, rapid hand fatigue, cramping when making a fist, tension or mild swelling on the inside or outside of the forearm, weakness in the grip, pain radiating toward the elbow (lateral epicondylitis = \"tennis elbow\") or inward (medial epicondylitis = \"golfer's elbow\")."
  },
  {
    "id": "4d0e8a20-44bc-440d-802a-37d6027a527b",
    "title_en": "Warning signs involving Rib cage",
    "content_en": "chest pain with difficulty breathing and low blood pressure after trauma (possible pneumothorax or hemothorax — EMERGENCY); rib fracture with paradoxical breathing (rib flap — EMERGENCY); sternal pain radiating to left arm (possibly cardiac — EMERGENCY 112)."
  },
  {
    "id": "4d4eaa8d-ea62-42dd-bd90-c8130722a291",
    "title_en": "Anatomical context: Inner nose",
    "content_en": "Bony blades hooked into the side wall of the nasal cavity. Main function: Warms and humidifies the inspired air."
  },
  {
    "id": "4d7635ff-aabe-4782-a601-b23210c0a1f4",
    "title_en": "Possible causes of pain involving Abdomen",
    "content_en": "overexertion during abdominal exercises or sports, contracture, direct contusion, intense prolonged cough, muscle strain with a sudden movement. Important: Abdominal pain can also be of internal (organ) causes — it cannot automatically be assumed to be muscular."
  },
  {
    "id": "4dac04a3-c9d6-4973-894f-ee1bb4df2d44",
    "title_en": "Anatomical context: Temple",
    "content_en": "They contain the inner and middle ear; located laterally, under the parietal bones. Main function: House the auditory and balance structures."
  },
  {
    "id": "4e1c5588-b651-4638-b210-fa82a1499db4",
    "title_en": "Warning signs involving Inner nose",
    "content_en": "emergency for difficulty breathing, double vision, affected eye, obvious deformity, persistent bleeding, loose teeth, altered bite, or extensive numbness."
  },
  {
    "id": "4e89b4e7-724d-453b-8416-5d640f50ae80",
    "title_en": "Useful questions about Upper arm",
    "content_en": "Was it a fall or a hit? Can you move your shoulder and elbow? Do you have hand numbness or deformity?"
  },
  {
    "id": "4f7bc22e-843b-43d8-a20c-7b7744627cbc",
    "title_en": "Possible symptoms involving Chest and rib cage",
    "content_en": "pain when moving the arm inward or when pushed, muscle tension when palpating the pectoral, pain when breathing deeply (intercostal muscles), chest wall cramps, pain after intense exercise at the gym, tightness in the chest related to arm movement."
  },
  {
    "id": "50747a8d-772b-4ac2-af49-83a7da50f0db",
    "title_en": "Possible causes of pain involving Shoulder",
    "content_en": "overuse by repetitive overhead movements (sports, work), muscle contracture, subacromial impingement (tendon compression), rotator cuff tear after exertion or trauma, bursitis, shoulder dislocation or fracture (after a fall). The pain can also be referred to the cervical spine."
  },
  {
    "id": "50bac085-c968-4af4-97b7-3a9182e459b5",
    "title_en": "Anatomical context: Upper and middle back",
    "content_en": "The trapezius (upper, middle, lower) raises, retracts and lowers the shoulder blade and supports the head. The latissimus dorsi is the largest muscle of the back: it adducts and lowers the arm, internally rotates the humerus. The rhomboid retracts the scapula. Levator scapulae raises the scapula and tilts the neck laterally. All are active in traction, rowing, swimming."
  },
  {
    "id": "50bf1dca-1a4e-44f6-a09e-d6fa6cdc02ea",
    "title_en": "Possible symptoms involving Upper arm",
    "content_en": "pain when bending or extending the elbow, weakness when lifting weights, tenderness to palpation of the biceps or triceps, cramping after exertion, dull pain after intense training, localized swelling after trauma."
  },
  {
    "id": "50d683bd-c8e1-4e6b-8940-a8fdc853b220",
    "title_en": "Warning signs involving Leg",
    "content_en": "inability to bear weight after trauma (possible fracture — especially the femoral neck in the elderly); visible deformity; rapid bruising and swelling; distal numbness or weakness; swollen and red calf without trauma (possible blood clot — EMERGENCY)."
  },
  {
    "id": "516be81e-a95b-4db4-87d5-e900aa572021",
    "title_en": "Possible causes of pain involving Nose",
    "content_en": "direct hit, fall, contact sport; nasal fracture is common in facial trauma."
  },
  {
    "id": "5239129f-2333-4722-b83e-86f8513b2d70",
    "title_en": "Possible symptoms involving Back support muscles",
    "content_en": "lower back pain when lifting or bending over, paralyzing muscle spasm, pain on waking (reduced after warming up), difficulty standing for prolonged periods, sharp pain when coughing or sneezing, tenderness on paravertebral palpation (near the spine)."
  },
  {
    "id": "5442bd46-2aa6-4983-8243-a5c4a443c5fc",
    "title_en": "Possible causes of pain involving Shoulder blade",
    "content_en": "higher energy trauma, direct rear impact or road traffic accident; scapular fractures can be associated with thoracic injuries."
  },
  {
    "id": "55968e18-ed1c-4e97-afc4-f1378c6ae992",
    "title_en": "Useful questions about Shoulder blade",
    "content_en": "Did you fall on your shoulder or your outstretched hand? Can you raise your arm? Is there deformity, tingling or weakness?"
  },
  {
    "id": "55cd323e-2e15-4d1b-af3e-8f53f2f2caf0",
    "title_en": "Possible symptoms involving Front of thigh",
    "content_en": "pain in the front of the thigh when running or climbing stairs, weakness when extending the knee, pain on palpation of the thigh, muscle fever after exercise, sudden pain when sprinting or changing direction (possible tear), patellar tendinopathy (pain at the top of the kneecap)."
  },
  {
    "id": "55f1b5d6-c4d4-42a6-ae5c-a2e134fa50ef",
    "title_en": "Useful questions about Temple",
    "content_en": "Was there a hit to the head or a fall? Has loss of consciousness, vomiting, confusion or drowsiness occurred? Is the pain getting worse? Is there bleeding or a wound?"
  },
  {
    "id": "585efbb3-3906-46a0-a5ed-8decd129eeba",
    "title_en": "Possible symptoms involving Toes",
    "content_en": "pain in the ankle, heel, midfoot or toes, swelling, bruising, bone tenderness, pain when walking or inability to stand."
  },
  {
    "id": "5a7eb271-3e8a-45f0-98fc-8e4a058d1cac",
    "title_en": "Educational guidance for Lower jaw",
    "content_en": "altered bite, loose teeth, or difficulty opening the mouth requires maxillofacial evaluation; hard chewing is avoided."
  },
  {
    "id": "5a8dcb26-6dd7-4ba9-a3e7-68cacfbc9a1e",
    "title_en": "Useful questions about Midfoot",
    "content_en": "Can you take four steps? Is the pain in the ankle, midfoot, heel or toes? Is there deformity or numbness?"
  },
  {
    "id": "5b243b53-75d6-499f-9947-75afcc95f80a",
    "title_en": "Possible causes of pain involving Hand",
    "content_en": "Possible causes include overuse from repetitive activity such as typing, playing a musical instrument, or sport; cramps; direct contusion; arthritis, especially in the small finger joints; carpal tunnel syndrome, which may cause numbness in the thumb, index finger, and middle finger; or trigger finger, where a finger catches, locks, or clicks."
  },
  {
    "id": "5b4bbfa5-c623-4110-b0d8-bf2707c6509c",
    "title_en": "Useful questions about Neck",
    "content_en": "Was there a fall or accident? Does the pain go down the arm/leg? Is there numbness, weakness, trouble walking or urinary control?"
  },
  {
    "id": "5b601a65-f1e5-4eb1-a02e-03ff9a3e9848",
    "title_en": "Useful questions about Lower leg",
    "content_en": "Can you walk? Is the pain over the shin bone or on the outer side over the fibula? Was there an impact, a twisting injury, or repeated strain?"
  },
  {
    "id": "5cc8894e-dc37-4583-a004-16702474eaa7",
    "title_en": "Warning signs involving Inner nose",
    "content_en": "emergency for difficulty breathing, double vision, affected eye, obvious deformity, persistent bleeding, loose teeth, altered bite, or extensive numbness."
  },
  {
    "id": "5d764077-b0c4-4acb-8ec5-923eba19754b",
    "title_en": "Anatomical context: Abdomen",
    "content_en": "The abdominal wall has four layers: rectus abdominis (in front, \"squares\"), external oblique (lateral superficial layer), internal oblique (deep lateral layer), transversus abdominis (deepest, \"natural corset\"). Together they support the organs, stabilize the spine, participate in breathing, coughing and trunk movements."
  },
  {
    "id": "5d939dcb-d14e-41c7-aba4-73ea53700e12",
    "title_en": "Possible causes of pain involving Middle ear",
    "content_en": "head/ear blow, temporal fracture, sudden pressure changes or damage to the eardrum and ossicular chain."
  },
  {
    "id": "5dde8bed-515e-4a80-9ba7-79c854a960b4",
    "title_en": "Anatomical context: Roof of mouth",
    "content_en": "It forms the posterior part of the hard palate. Main function: Separates the oral cavity from the nasal cavity."
  },
  {
    "id": "5eb406af-c94e-40d7-ad25-eb0f1534c058",
    "title_en": "Possible symptoms involving Jaw muscles",
    "content_en": "pain when chewing or opening the mouth wide, cracking or clicking in the jaw joint, fatigue when chewing, temporal headache (contracted temple), earache without infection, difficulty opening the mouth fully, night pain in those with bruxism."
  },
  {
    "id": "5fcf32b5-b682-48a2-8395-419bcd423b85",
    "title_en": "Anatomical context: Nose",
    "content_en": "Two small bones that form the bridge of the nose. Main function: Support the upper part of the nasal pyramid."
  },
  {
    "id": "613751a8-b58b-44fb-884d-02ecec9cc016",
    "title_en": "Possible symptoms involving Inner nose",
    "content_en": "local facial pain, swelling, bruising, deformity, difficulty biting or chewing, jaw jam, deformed nose, nosebleed, double vision or numbness of the cheek/lip."
  },
  {
    "id": "619ee27d-caf3-4377-81d0-a2d0ffa439dd",
    "title_en": "Possible causes of pain involving Hip",
    "content_en": "overexertion when running or climbing (iliotibial band syndrome), trochanteric bursitis, piriformis contracture (piriformis syndrome — mimicking sciatica), gluteal weakness (secondary low back pain), fall on buttock (contusion), hip arthritis (pain in groin, not buttock)."
  },
  {
    "id": "622b1b3b-265a-46ad-b047-5456a3f775d0",
    "title_en": "Educational guidance for Back of head",
    "content_en": "after head trauma with neurological symptoms, loss of consciousness, vomiting, aggravation or suspected fracture, urgent evaluation is required; exercise is avoided and neurological status is monitored until evaluation."
  },
  {
    "id": "6232193c-45e6-4d9b-aac6-4028fa671fa5",
    "title_en": "Possible causes of pain involving Temple",
    "content_en": "direct hit, fall, sports or road accident; pain may come from contusion, skull fracture, scalp injury, or intracranial complications associated with trauma."
  },
  {
    "id": "62a6ef92-5339-4371-9866-92e0fa328599",
    "title_en": "Possible symptoms involving Abdomen",
    "content_en": "pain when twisting or bending the trunk, localized pain on palpation of the abdominal wall, sensitivity after exertion (abdominal, sports), muscle cramps, pain accentuated by coughing or laughing, morning stiffness of the abdominal area, feeling of tension."
  },
  {
    "id": "62c35f42-a11d-4299-a903-a9c47b90bd4a",
    "title_en": "Possible symptoms involving Top of head",
    "content_en": "local pain after head trauma, sensitivity to touch, swelling or scalp wound; warning signs include confusion, loss of consciousness, repeated vomiting, unusual sleepiness, seizures, weakness, numbness, or fluid/blood coming from the nose or ears."
  },
  {
    "id": "6331a985-ada9-4c13-aa89-cf1775015f02",
    "title_en": "Warning signs involving Midfoot",
    "content_en": "Seek emergency medical care for inability to bear weight, visible deformity, an open wound, numbness, cold or pale toes, or a wound or post-traumatic pain in a person with diabetes or vascular disease."
  },
  {
    "id": "63de1b27-f4ca-46a5-9716-8515e680ac02",
    "title_en": "Possible symptoms involving Shoulder",
    "content_en": "pain when raising the arm above the level of the shoulder, weakness when pushing or pulling, pain at night (especially on the affected side), difficulty dressing or combing hair, sensation of locking or clicking when moving, tenderness on palpation of the shoulder, pain radiating to the elbow."
  },
  {
    "id": "6410cf67-79ed-46b4-b79f-8d3a69f00320",
    "title_en": "Possible causes of pain involving Upper arm",
    "content_en": "fall, direct impact, sports/traffic accident; bone pain may suggest contusion, humerus fracture, or injury to neighboring joints."
  },
  {
    "id": "64444ee6-f38e-41cf-89ab-e89f940c1f69",
    "title_en": "Possible symptoms involving Middle ear",
    "content_en": "deep pain in the ear after trauma, hearing loss, ringing, dizziness or feeling off balance; the ossicles of the ear may be involved in trauma to the temporal bone."
  },
  {
    "id": "64a948f0-4f00-4517-9dea-7464ff56d855",
    "title_en": "Possible causes of pain involving Calf",
    "content_en": "cramps (fatigue, dehydration, magnesium deficiency), tibial periostitis (running on hard surfaces), Achilles tendinopathy (overuse), muscle strain of the ankle, contracture, contusion. Calf pain with swelling and redness may indicate thrombophlebitis (clot)—requires urgent evaluation."
  },
  {
    "id": "64c92d08-6f68-4aca-8084-b1bb9f675363",
    "title_en": "Useful questions about Forearm",
    "content_en": "Does the pain increase when you rotate your palm? Did you fall on your hand? Can you move your fingers and feel normal?"
  },
  {
    "id": "64d8b94f-59e2-469c-b204-4548f74dfbc6",
    "title_en": "Possible symptoms involving Shoulder blade",
    "content_en": "shoulder/clavicle/scapula pain, swelling, bruising, deformity, limitation of arm lift or pain with shoulder movement."
  },
  {
    "id": "64e7e335-791a-4024-8bba-de18f30d6f08",
    "title_en": "Anatomical context: Knee",
    "content_en": "Sesamoid bone in front of the knee joint. Main function: Protects the knee and optimizes the action of the quadriceps."
  },
  {
    "id": "6509c278-da0c-47ec-af8a-f53b8237bb52",
    "title_en": "Possible causes of pain involving Upper jaw",
    "content_en": "direct trauma to the face, fall, contact sport, road accident, blow to the mandible, nose, eye socket, jaw or cheekbones; there may be fractures, tooth dislocations or soft tissue injuries."
  },
  {
    "id": "652bcb26-82df-4caa-962a-de98c8513339",
    "title_en": "Possible causes of pain involving Cheekbones",
    "content_en": "direct trauma to the face, fall, contact sport, road accident, blow to the mandible, nose, eye socket, jaw or cheekbones; there may be fractures, tooth dislocations or soft tissue injuries."
  },
  {
    "id": "65afbe9b-0885-41d7-92fa-b5051bdc1a5b",
    "title_en": "Possible causes of pain involving Center of chest",
    "content_en": "frontal impact, traffic accident, sports impact or chest compression; may be contusion or sternal fracture."
  },
  {
    "id": "6601193d-f1a1-4714-b7d6-2ab00d07168d",
    "title_en": "Useful questions about Roof of mouth",
    "content_en": "Was the trauma direct? Can you open your mouth normally? Has the bite changed? Do you have double vision, numbness or persistent nosebleeds?"
  },
  {
    "id": "667cdead-d787-49d4-8507-d34fe584fddd",
    "title_en": "Educational guidance for Lower leg",
    "content_en": "avoid support if pain is severe or there is deformity; consult for X-ray if pain persists, occurs after trauma or prevents walking."
  },
  {
    "id": "66b7904e-26c8-4761-9f12-903122480e58",
    "title_en": "Warning signs involving Inner nose",
    "content_en": "call 112 or seek urgent medical care for loss of consciousness, confusion, convulsions, neurological deficit, severe progressive pain, open wound or suspected open fracture."
  },
  {
    "id": "66ecdecb-bc85-4065-818d-69f5ebd8c2cb",
    "title_en": "Anatomical context: Upper jaw",
    "content_en": "They form the upper mandible and contain the upper dental alveoli. Main function: They support the upper dentition and form the roof of the oral cavity."
  },
  {
    "id": "68199b81-ffb8-4b58-bd14-e7aa3b7edd16",
    "title_en": "Possible causes of pain involving Front and side of lower leg",
    "content_en": "tibial periostitis (sudden increase in training volume), fibular tendon rupture (repeated sprain), sprained ankle with fibular injury, anterior compartment syndrome (rare, pain on exertion with very severe calf), stress fracture of the tibia in runners."
  },
  {
    "id": "6892e31d-c233-4cf0-932a-8f675441be91",
    "title_en": "Educational guidance for Middle ear",
    "content_en": "hearing loss, vertigo, bleeding from the ear, or symptoms after head trauma require medical/ENT consultation."
  },
  {
    "id": "69e507de-b00b-459b-90c1-cd7b8bdd8990",
    "title_en": "Possible symptoms involving Fingers",
    "content_en": "wrist/palm/finger pain, swelling, bruising, tenderness to pressure, grip limitation, deformity or pain in the scaphoid anatomic snuffbox."
  },
  {
    "id": "6b1ed1af-04e4-4b9b-a318-94a8e85bc1fd",
    "title_en": "Possible symptoms involving Throat",
    "content_en": "previous neck pain, discomfort swallowing, local tenderness or voice changes after trauma."
  },
  {
    "id": "6b91f0d0-5842-4465-a22e-8399302f62eb",
    "title_en": "Anatomical context: Inner nose",
    "content_en": "Light and spongy bone, located between the orbits, forming the roof of the nasal cavity. Main function: Support for the olfactory mucosa; contains the ethmoid cells."
  },
  {
    "id": "6d731b90-4c0b-403c-811b-883b43e914ef",
    "title_en": "Warning signs involving Lower leg",
    "content_en": "emergency for deformity, severe pain, inability to bear weight, numbness, cold/pale leg or severe pain with progressive swelling."
  },
  {
    "id": "6d820e70-04a0-4c92-b9e3-90296a492eba",
    "title_en": "Anatomical context: Inner nose",
    "content_en": "Thin bone that forms the lower part of the nasal septum. Main function: Divides the nasal cavity into two fossae."
  },
  {
    "id": "6d8832fb-1309-44a5-95bc-b73a54d4ba02",
    "title_en": "Warning signs involving Shoulder",
    "content_en": "visible deformity of the shoulder (possible dislocation or fracture), complete inability to move the arm, severe pain after falling on an outstretched arm, numbness or tingling in the entire arm or hand, rapid swelling or extensive bruising, pain that has not improved at all in 2 weeks."
  },
  {
    "id": "6e2bdd50-3838-49ef-9959-77ea91e94515",
    "title_en": "Possible symptoms involving Neck",
    "content_en": "localized back or neck pain, stiffness, pain that increases with movement or support; possible neurological signs: numbness, tingling, weakness, difficulty walking or urinary/bowel disturbances."
  },
  {
    "id": "6f38d215-1948-44a1-b276-8c6e1eca4a89",
    "title_en": "Warning signs involving Shoulder blade",
    "content_en": "emergency for shoulder pain after major accident, difficulty breathing, numbness/weakness or associated chest pain."
  },
  {
    "id": "6f78aedd-ed43-4e4b-90f3-26ede0db36bc",
    "title_en": "Anatomical context: Inner thigh",
    "content_en": "Adductors (adductor major, longus, brevis, gracilis, pectineus) bring the thigh toward the midline and contribute to hip flexion/extension. The gracilis is the most medial and long, also crossing the knee. They are required in changes of direction, shooting and ball games."
  },
  {
    "id": "6ff7fd32-71d5-4d3d-a865-b50b5359b05c",
    "title_en": "Educational guidance for Head and neck",
    "content_en": "rest and reducing activities that aggravate the pain; local heat application (10-15 minutes) for contracts; gentle stretching of the neck; correcting the posture at the office; avoiding a pillow that is too high or too low. See a doctor if the pain doesn't go away in a few days or if it gets worse."
  },
  {
    "id": "72643b76-e0b7-42ca-81e7-ac5934394d85",
    "title_en": "Warning signs involving Cheekbones",
    "content_en": "emergency for difficulty breathing, double vision, affected eye, obvious deformity, persistent bleeding, loose teeth, altered bite, or extensive numbness."
  },
  {
    "id": "73306cf3-f4d5-4b09-921f-e4927b0633b3",
    "title_en": "Warning signs involving Lower jaw",
    "content_en": "emergency for difficulty breathing, double vision, affected eye, obvious deformity, persistent bleeding, loose teeth, altered bite, or extensive numbness."
  },
  {
    "id": "73ad60c6-84ae-436e-b850-dcab4a14975b",
    "title_en": "Educational guidance for Wrist",
    "content_en": "remove rings, apply cold wrap, immobilize, and seek evaluation if there is deformity, persistent pain, or suspected fracture; scaphoid requires attention for risk of difficult healing."
  },
  {
    "id": "7457e315-836b-470b-9e49-33627f52ad75",
    "title_en": "Possible causes of pain involving Throat",
    "content_en": "direct trauma, stretching of the suprahyoid/infrahyoid muscles, or rare injuries to the hyoid-laryngeal complex."
  },
  {
    "id": "746de7a1-b5ff-42da-901e-8d061eaa6417",
    "title_en": "Anatomical context: Chest",
    "content_en": "Pectoralis major: adduction, flexion and internal rotation of the arm — essential for pushing (push-ups, press). Pectoralis minor: lowers and protracts the scapula; in chest-trained athletes, it can compress the vessels and nerves to the arm (thoracic outlet syndrome). The serratus anterior rotates the scapula up — essential in raising the arm."
  },
  {
    "id": "748fdf4d-15d7-48e4-a319-e5b86f4199d1",
    "title_en": "Warning signs involving Nose",
    "content_en": "emergency for unstoppable bleeding, clear fluid from the nose after trauma, severe deformity, difficulty breathing, or associated head trauma."
  },
  {
    "id": "74a2328b-2bd6-453e-9a10-600135c44f89",
    "title_en": "Useful questions about Forearm",
    "content_en": "Does the pain increase when you rotate your palm? Did you fall on your hand? Can you move your fingers and feel normal?"
  },
  {
    "id": "75237b67-61e9-4d16-b6f4-e25022337f02",
    "title_en": "Warning signs involving Back",
    "content_en": "back pain with numbness or weakness in the leg (possible nerve compression); pain with loss of bladder or bowel control (EMERGENCY — cauda equina syndrome); intense nocturnal pain that does not give way to position (possible tumor); pain after severe trauma; fever with back pain (possible spinal infection); pain in a person with osteoporosis."
  },
  {
    "id": "763c0fb7-575f-4288-8dfa-0c2c277a2130",
    "title_en": "Possible causes of pain involving Back of head",
    "content_en": "direct hit, fall, sports or road accident; pain may come from contusion, skull fracture, scalp injury, or intracranial complications associated with trauma."
  },
  {
    "id": "76415fcc-7d50-4498-8195-8e86ce9f12bd",
    "title_en": "Possible causes of pain involving Inner nose",
    "content_en": "direct trauma to the face, fall, contact sport, road accident, blow to the mandible, nose, eye socket, jaw or cheekbones; there may be fractures, tooth dislocations or soft tissue injuries."
  },
  {
    "id": "76e02fe8-69c8-4dc2-ac45-d28b7cfb7fc4",
    "title_en": "Possible symptoms involving Skull base",
    "content_en": "local pain after head trauma, sensitivity to touch, swelling or scalp wound; warning signs include confusion, loss of consciousness, repeated vomiting, unusual sleepiness, seizures, weakness, numbness, or fluid/blood coming from the nose or ears."
  },
  {
    "id": "77a30900-4721-4435-81dc-180fcc934909",
    "title_en": "Anatomical context: Hip",
    "content_en": "Deep external rotator group: piriformis, internal and external obturator, hamstrings (superior and inferior), quadrate femoris. They all laterally rotate the thigh and stabilize the hip joint. The piriformis passes over the sciatic nerve — its contracture can compress the sciatic nerve (piriformis syndrome)."
  },
  {
    "id": "77ebbb3b-64f0-47dd-9912-58208dbbad13",
    "title_en": "Useful questions about Inner nose",
    "content_en": "Was the trauma direct? Can you open your mouth normally? Has the bite changed? Do you have double vision, numbness or persistent nosebleeds?"
  },
  {
    "id": "78ee29c4-018f-4a6f-805b-6b782dc6b6a5",
    "title_en": "Educational guidance for Middle ear",
    "content_en": "hearing loss, vertigo, bleeding from the ear, or symptoms after head trauma require medical/ENT consultation."
  },
  {
    "id": "7a9909c7-3a37-4e5c-9160-e0348b8f0ae8",
    "title_en": "Useful questions about Lower back",
    "content_en": "Was there a fall or accident? Does the pain go down the arm/leg? Is there numbness, weakness, trouble walking or urinary control?"
  },
  {
    "id": "7b333e62-5e75-450e-b5da-389237aa4129",
    "title_en": "Warning signs involving Skull base",
    "content_en": "call 112 or seek urgent medical care for loss of consciousness, confusion, convulsions, neurological deficit, severe progressive pain, open wound or suspected open fracture."
  },
  {
    "id": "7b524b08-7ae2-4042-98b8-dcc385f4c854",
    "title_en": "Anatomical context: Top of head",
    "content_en": "Two paired bones that make up the sides and top of the skull. Main function: Protects the cerebral hemispheres."
  },
  {
    "id": "7caf4ecf-a75b-41fa-81fd-273463a3ed89",
    "title_en": "Possible symptoms involving Hip",
    "content_en": "pain in the buttock or side of the hip, pain when climbing stairs or getting up from a chair, pain when walking for a long time, weakness when climbing steps, feeling tired or burning in the buttock after running, pain when palpating the side of the hip (trochanteric bursitis), pain that goes down the thigh."
  },
  {
    "id": "7d0db0f5-654e-492e-a881-5b92fc5596dc",
    "title_en": "Possible symptoms involving Upper jaw",
    "content_en": "local facial pain, swelling, bruising, deformity, difficulty biting or chewing, jaw jam, deformed nose, nosebleed, double vision or numbness of the cheek/lip."
  },
  {
    "id": "7df55e26-bc6e-4df0-975c-e1a8c37b9c36",
    "title_en": "Anatomical context: Jaw muscles",
    "content_en": "The masseter (palpable on the cheek when clenching the teeth) and the temporalis (on the temple) close the mouth and tighten the mandible. The medial and lateral pterygoid move the mandible laterally and help open the mouth. They all act on the temporomandibular joint (TMJ). Bruxism (teeth grinding) overuses these muscles."
  },
  {
    "id": "80158f8a-31fb-4386-93c4-2827fdf6ae70",
    "title_en": "Anatomical context: Upper back",
    "content_en": "The vertebrae of the thoracic area, articulated with the ribs. Main function: Insertion point for ribs; protects the marrow."
  },
  {
    "id": "807c25ef-085d-48f1-b048-0193c7fe407f",
    "title_en": "Possible symptoms involving Ankle",
    "content_en": "pain in the ankle, heel, midfoot or toes, swelling, bruising, bone tenderness, pain when walking or inability to stand."
  },
  {
    "id": "81e985a7-26b1-492f-8eff-13ff456f6b1d",
    "title_en": "Anatomical context: Front of upper arm",
    "content_en": "Biceps brachii (two heads: long — passes through the bicipital groove; short — from the coracoid) flexes the elbow, supinates the forearm and contributes to shoulder flexion. The brachialis is below the biceps and is the strongest pure elbow flexor. The coracobrachialis brings the arm toward the body."
  },
  {
    "id": "8302c7f9-13d8-4844-aad1-d53a21bef7e9",
    "title_en": "Educational guidance for Fingers",
    "content_en": "remove rings, apply cold wrap, immobilize, and seek evaluation if there is deformity, persistent pain, or suspected fracture; scaphoid requires attention for risk of difficult healing."
  },
  {
    "id": "832eecdb-59b3-4e73-a5ae-bf52195521fb",
    "title_en": "Anatomical context: Shoulder",
    "content_en": "The rotator cuff consists of 4 deep muscles: supraspinatus (initial abduction of the arm—most commonly affected), infraspinatus (external rotation), subscapularis (internal rotation), teres minor (external rotation and adduction). Together they keep the humeral head in the socket while the deltoid lifts the arm."
  },
  {
    "id": "83583e78-a657-4b0b-bdd8-47120398fe77",
    "title_en": "Warning signs involving Fingers",
    "content_en": "emergency for numb/cold fingers, deformity, open wound, inability to move fingers or severe pain after trauma."
  },
  {
    "id": "848e7b91-06b0-4e27-8a5d-b4f1be393b01",
    "title_en": "Warning signs involving Jaw muscles",
    "content_en": "jaw lock (can't open or close your mouth), severe unilateral pain with swelling (possible tooth abscess or infection); trismus (impossibility to open the mouth) with fever; mandibular trauma with suspected fracture."
  },
  {
    "id": "84fd08b6-d5f5-472e-80fa-4f98b6da847f",
    "title_en": "Anatomical context: Upper arm",
    "content_en": "The largest bone of the upper limb, between the shoulder and the elbow. Main function: Support for arm muscles; allows shoulder movements."
  },
  {
    "id": "8558ad06-1d29-4c35-8b6d-c81d4049b8f3",
    "title_en": "Useful questions about Forehead",
    "content_en": "Was there a hit to the head or a fall? Has loss of consciousness, vomiting, confusion or drowsiness occurred? Is the pain getting worse? Is there bleeding or a wound?"
  },
  {
    "id": "88040c57-79f7-4b7d-b3ef-17c719a97a01",
    "title_en": "Possible causes of pain involving Back of thigh",
    "content_en": "muscle strain or tear when sprinting, sudden acceleration or hit by the ball, front-back strength imbalance (quadriceps much stronger than hamstrings), insufficient warm-up, fatigue. Chronic pain at the insertion site (ischial tuberosity) = proximal tendinopathy."
  },
  {
    "id": "886036cd-4eb7-4226-a530-70c4fc84f3ef",
    "title_en": "Educational guidance for Upper arm",
    "content_en": "supports and immobilizes the arm if there is a suspicion of fracture; seek medical evaluation for severe pain, deformity, or inability to use."
  },
  {
    "id": "889a0e63-2271-4d33-aa13-2e8ecc033513",
    "title_en": "Warning signs involving Thigh",
    "content_en": "emergency for inability to bear weight, deformity, severe pain, numbness, bleeding, major trauma or locked knee after impact."
  },
  {
    "id": "89981faa-81b9-489c-8ef3-995affb046cb",
    "title_en": "Warning signs involving Forearm",
    "content_en": "emergency for deformity, severe pain, numbness, cold/pale fingers, open wound or disproportionate pain."
  },
  {
    "id": "8a0554d7-2463-4c72-b685-1b3a03f3870e",
    "title_en": "Useful questions about Upper shoulder",
    "content_en": "Did you fall on your shoulder or your outstretched hand? Can you raise your arm? Is there deformity, tingling or weakness?"
  },
  {
    "id": "8a1a9f20-6b03-42cb-b615-68331469fe58",
    "title_en": "Useful questions about Hip",
    "content_en": "Is the pain in the buttock, the side of the hip, or the groin? Does it appear when running, climbing stairs or even at rest? Did it occur after a fall or without a clear cause? Is there numbness in the leg? Can you walk normally? Are you over 60?"
  },
  {
    "id": "8a690fc7-a29b-4d2a-a1f8-10e4173c57f2",
    "title_en": "Useful questions about Lower leg",
    "content_en": "Can you walk? Is the pain over the shin bone or on the outer side over the fibula? Was there an impact, a twisting injury, or repeated strain?"
  },
  {
    "id": "8b64ed88-8e66-44ba-b033-3f2c0520f69b",
    "title_en": "Anatomical context: Spine",
    "content_en": "The spine has 33-34 vertebrae: 7 cervical (C1-C7), 12 thoracic (T1-T12), 5 lumbar (L1-L5), 5 fused sacral (sacrum), 3-5 fused coccyx (coccyx). Each vertebra has a body (strength), a vertebral arch (marrow protection) and apophyses (muscle insertions). Intervertebral discs absorb shocks."
  },
  {
    "id": "8c25cc24-deef-4237-8fac-7c1a6f135e9a",
    "title_en": "Anatomical context: Forearm",
    "content_en": "Lateral bone of the forearm, on the phalanx side. Main function: Allows forearm rotation (pronation/supination)."
  },
  {
    "id": "8c7c301c-beb5-40c2-a323-e15d4614178e",
    "title_en": "Possible causes of pain involving Chest and rib cage",
    "content_en": "overexertion when pushed (push-ups, press), muscle contracture, contusion by direct blow, prolonged intense cough (intercostal muscles), partial pectoral tear after maximal effort. Chest pain can also be of non-muscular causes (cardiac, pleural, costal) — it is important to differentiate."
  },
  {
    "id": "8d1808f2-0f9a-41e3-8183-0328c36904e6",
    "title_en": "Anatomical context: Thigh",
    "content_en": "The thigh has three groups: front — quadriceps (rectus femoris + 3 vastus) extends the knee, sartorius flexes the hip and knee; back — hamstrings (biceps femoris, semitendinosus, semimembranosus) flex the knee and extend the hip; inside — the adductors (gracilis, pectineus, 3 adductors) bring the thigh closer together. Tensor fascia lata goes laterally."
  },
  {
    "id": "8d1afa61-39e4-4729-96f9-9e23a77c797e",
    "title_en": "Possible symptoms involving Hand",
    "content_en": "pain when making a fist or grasping objects, weakness in pinching or precision, cramps in the palm (especially in the evening), sensitivity to palpation on the palm or between the fingers, morning stiffness, decreased grip strength, pain when moving the fingers."
  },
  {
    "id": "8d4b9836-4e28-45eb-a6b6-668ca0b92e7e",
    "title_en": "Possible symptoms involving Palm",
    "content_en": "wrist/palm/finger pain, swelling, bruising, tenderness to pressure, grip limitation, deformity or pain in the scaphoid anatomic snuffbox."
  },
  {
    "id": "8f46dd7e-7cce-49d6-bc78-9370cba7a033",
    "title_en": "Educational guidance for Skull base",
    "content_en": "after head trauma with neurological symptoms, loss of consciousness, vomiting, aggravation or suspected fracture, urgent evaluation is required; exercise is avoided and neurological status is monitored until evaluation."
  },
  {
    "id": "8f6601fa-5416-4e60-a14a-6772f7063895",
    "title_en": "Warning signs involving Middle ear",
    "content_en": "emergency for blood or fluid in the ear after trauma, severe vertigo, sudden hearing loss, facial paralysis, or neurological symptoms."
  },
  {
    "id": "8f6ac6c9-80ea-4b00-a0c9-4aabf5b6e278",
    "title_en": "Possible causes of pain involving Foot and sole",
    "content_en": "Plantar fasciitis, which commonly causes pain with the first steps in the morning; cramps related to fatigue or dehydration; overuse from running or prolonged standing; unsuitable footwear with a stiff sole or high heel; contusion; or a stress fracture in athletes. Morton's neuroma can cause pain and numbness between toes 3 and 4."
  },
  {
    "id": "8f808c88-1c37-40ae-bc4d-1be21685e236",
    "title_en": "Educational guidance for Forearm",
    "content_en": "immobilize the forearm and avoid rotation if you suspect a fracture; medical evaluation for X-ray and splint/plaster treatment or surgery in displaced cases."
  },
  {
    "id": "906af0af-79b7-48ed-ab3d-31cb46bfca05",
    "title_en": "Anatomical context: Tailbone",
    "content_en": "The top of the spine, consisting of 3–5 fused vertebrae. Main function: Attachment point for pelvic floor muscles."
  },
  {
    "id": "92431d7e-ff2f-4d0e-b024-9e3c8180cec3",
    "title_en": "Educational guidance for Tailbone",
    "content_en": "spinal pain after trauma or associated with neurological symptoms requires medical evaluation; for pain without severe trauma, avoid prolonged immobilization and consult if it persists or worsens."
  },
  {
    "id": "9374a769-f9aa-4845-872f-363370058596",
    "title_en": "Anatomical context: Hip",
    "content_en": "The hip has gluteal muscles (major, medius, minimus) that extend, abduct, and rotate the thigh—the gluteus maximus is the strongest muscle in the body. Deep: piriformis, obturator, hamstrings, quadratus femoris — lateral rotators of the thigh. The iliopsoas (thigh flexor) goes from the inside. Tensor fascia lata stabilizes laterally."
  },
  {
    "id": "93dbb0dd-74e8-409b-b408-3152a3acb350",
    "title_en": "Possible causes of pain involving Front of thigh",
    "content_en": "post-exercise muscle fever (DOMS), patellar tendinopathy (overuse in athletes), contracture, partial or total tear at maximal sprint, patellofemoral pain syndrome (pain around the kneecap when climbing stairs or prolonged sitting)."
  },
  {
    "id": "94c66ae9-f7c5-4ffb-b387-9bcc9317a477",
    "title_en": "Possible symptoms involving Rib cage",
    "content_en": "local chest pain after impact, tenderness to pressure, pain on deep inspiration, coughing, sneezing, or movement; possible cracking sensation at the fracture."
  },
  {
    "id": "9502ef13-4178-44fe-9d71-8289ab59b503",
    "title_en": "Warning signs involving Tear duct area",
    "content_en": "emergency for difficulty breathing, double vision, affected eye, obvious deformity, persistent bleeding, loose teeth, altered bite, or extensive numbness."
  },
  {
    "id": "964c4462-b863-4d46-bb02-38a2974b00ec",
    "title_en": "Educational guidance for Forehead",
    "content_en": "after head trauma with neurological symptoms, loss of consciousness, vomiting, aggravation or suspected fracture, urgent evaluation is required; exercise is avoided and neurological status is monitored until evaluation."
  },
  {
    "id": "96adee65-690e-4f71-a8f1-adb0f38bd366",
    "title_en": "Anatomical context: Pelvis",
    "content_en": "Each formed by fused ilium, ischium, and pubis. Main function: Forms the pelvis; supports the weight of the trunk."
  },
  {
    "id": "970a58b3-b1ba-4a46-a27d-c702fcf8ff89",
    "title_en": "Useful questions about Top of head",
    "content_en": "Was there a hit to the head or a fall? Has loss of consciousness, vomiting, confusion or drowsiness occurred? Is the pain getting worse? Is there bleeding or a wound?"
  },
  {
    "id": "97ac9e01-d9ae-408b-92ab-4574a5df3fc6",
    "title_en": "Anatomical context: Ankle",
    "content_en": "7 bones in the foot, including calcaneus (heel) and talus. Main function: Forms the ankle and the back of the foot."
  },
  {
    "id": "9933c1ca-a80c-472e-9f71-481cdc9b10bd",
    "title_en": "Warning signs involving Head",
    "content_en": "head trauma with loss of consciousness or confusion (EMERGENCY — 112); sudden and very intense headache (possible subarachnoid hemorrhage); cranial deformity or bulge; clear fluid draining from the ear or nose after trauma (cerebrospinal fluid — EMERGENCY)."
  },
  {
    "id": "9b4966d3-88e1-4cd4-9c95-d307239f9d29",
    "title_en": "Possible symptoms involving Center of chest",
    "content_en": "central chest pain after impact, sternum tenderness, pain with deep breathing or trunk movements."
  },
  {
    "id": "9b776e65-bffe-4d34-a464-d28d7e401c41",
    "title_en": "Anatomical context: Back support muscles",
    "content_en": "Erector spinae (iliocostal, longisimus, spinos) extend and stabilize the spine in a vertical position. Multifidus has short fascicles between adjacent vertebrae — fine stabilizer of the spine, frequently atrophied after low back pain. Lumbar square: lateral flexion and lumbar stabilization. All participate in static posture and lifting."
  },
  {
    "id": "9d0e5177-0a4e-438d-b414-1f01aa0b9c18",
    "title_en": "Useful questions about Nose",
    "content_en": "Does the nose look crooked? Can you breathe through your nose? Does the bleeding persist? Were you hit hard on the head?"
  },
  {
    "id": "9deb2d1b-6ca3-46db-8267-cb9e898e29ad",
    "title_en": "Educational guidance for Upper arm",
    "content_en": "reducing the effort that causes the pain; active rest (light movements, without weights); ice after acute trauma; gradual return to activity. See a doctor if there is arm deformity, significant loss of strength, or very intense pain after a sudden movement."
  },
  {
    "id": "9f2984bf-8192-4332-b2fd-c1bc0a0140c8",
    "title_en": "Warning signs involving Calf",
    "content_en": "URGENT: swollen, red and warm calf with pain to palpation (possible deep vein thrombosis — blood clot); severe pain with rapid swelling after trauma; popping sound in the area of ​​the Achilles tendon with loss of strength to lift the heel (Achilles rupture); complete inability to walk; sudden numbness or coldness of the leg."
  },
  {
    "id": "9f2c23a0-ec3c-4391-af42-6b2b164688e2",
    "title_en": "Useful questions about Middle ear",
    "content_en": "Was there a blow to the head or ear? Has your hearing decreased? Is there dizziness, wheezing, bleeding or fluid?"
  },
  {
    "id": "9f6656b2-303d-4e98-a705-d2b3f3678c3b",
    "title_en": "Useful questions about Foot and sole",
    "content_en": "Does the pain occur with the first steps in the morning or while walking in general? Is it on the sole, in the toes, or on the top of the foot? Did it begin after running or an impact, or without an obvious cause? Is there swelling or bruising? What type of footwear do you use? Do you have numbness in your toes?"
  },
  {
    "id": "a05aed3e-7751-4bc3-b781-15fbf91fa05e",
    "title_en": "Educational guidance for Upper jaw",
    "content_en": "facial trauma with deformity, visual disturbances, difficulty breathing, altered bite, or numbness should be medically evaluated; local cold wrap can be applied and pressure on the area is avoided."
  },
  {
    "id": "a13b8c2f-ffb2-4413-9e94-47da9d723ce9",
    "title_en": "Possible causes of pain involving Inner thigh",
    "content_en": "muscle strain or tear with sudden lateral movement (football, tennis, basketball), direct contusion, overuse, \"pubalgia\" (pain syndrome in the pubis and adductors in athletes). Groin pain can also be an inguinal hernia—requires medical evaluation."
  },
  {
    "id": "a21d8e6a-29c9-49c8-bd06-688b5c85280e",
    "title_en": "Warning signs involving Upper and middle back",
    "content_en": "sudden and very intense interscapular pain radiating to the chest or abdomen (possible aortic dissection or heart problem — EMERGENCY); progressive pain with no identifiable muscular cause; numbness or weakness in the arms."
  },
  {
    "id": "a260d45d-73bc-4e1a-9a36-86ba6775cc60",
    "title_en": "Useful questions about Knee",
    "content_en": "Can you straighten your knee? Did you fall directly on your kneecap? Did the knee swell up quickly?"
  },
  {
    "id": "a387966f-2580-4577-b5a4-d362d43dea7e",
    "title_en": "Educational guidance for Hand",
    "content_en": "breaks and finger stretching; mobility exercises (open-close the fist slowly); application of heat for morning stiffness; avoiding repetitive forced grip. See a doctor for persistent numbness, weakness, deformity, or pain that limits daily activities."
  },
  {
    "id": "a3b56f2b-744f-4a75-aa5b-4d7a7c3b3126",
    "title_en": "Anatomical context: Midfoot",
    "content_en": "There are 5 metatarsal bones in the middle of each foot. Their main functions are to support the arches of the foot and transfer weight during standing and movement."
  },
  {
    "id": "a41bba37-54b5-491c-b35c-93f54a0a6163",
    "title_en": "Possible symptoms involving Front of upper arm",
    "content_en": "pain when bending the elbow with resistance (bearing weights), pain when palpating the biceps, cramping after intense exertion with weights, pain in the shoulder on the long head of the biceps (bicipital tendinopathy), feeling of \"pulled muscle\" after lifting suddenly."
  },
  {
    "id": "a425e675-04f1-4bbe-80c9-db44768767ce",
    "title_en": "Anatomical context: Toes",
    "content_en": "14 phalanges per foot: 2 for the hallux, 3 for each toe. Main function: Enables walking propulsion and balance."
  },
  {
    "id": "a44ab670-85cb-4107-8d17-dbf8ba7ddb51",
    "title_en": "Warning signs involving Upper jaw",
    "content_en": "emergency for difficulty breathing, double vision, affected eye, obvious deformity, persistent bleeding, loose teeth, altered bite, or extensive numbness."
  },
  {
    "id": "a4ee8dfa-dc9a-465a-aa86-ab66733115c6",
    "title_en": "Possible causes of pain involving Lower jaw",
    "content_en": "direct blow to the chin/mandible, accident, contact sport; there may be mandibular fracture or damage to the temporomandibular joint."
  },
  {
    "id": "a51a5919-c044-45c9-a71b-5293f5197ef7",
    "title_en": "Warning signs involving Hip and buttock",
    "content_en": "inability to get up from a chair or walk after trauma (possible fracture or tear); buttock pain radiating down the leg — numbness down the leg (possible sciatic nerve compression or lumbar disc herniation); unexplained progressive nocturnal pain."
  },
  {
    "id": "a52e982a-5637-4779-87b2-fea4bfac046a",
    "title_en": "Educational guidance for Forearm",
    "content_en": "regular breaks from repetitive activities; forearm stretching (bends the wrist with the other hand); ice on the painful area for 10 minutes; office ergonomics (correct hand position). See a doctor if numbness, weakness, or pain persists beyond 2 weeks."
  },
  {
    "id": "a56962f1-c1ab-4add-ac1c-9b3fc75ce849",
    "title_en": "Warning signs involving Middle ear",
    "content_en": "emergency for blood or fluid in the ear after trauma, severe vertigo, sudden hearing loss, facial paralysis, or neurological symptoms."
  },
  {
    "id": "a58aa00d-1b70-4f9c-b57a-736f752632e9",
    "title_en": "Anatomical context: Cheekbones",
    "content_en": "The cheekbones of the cheeks. Main function: Contours the face and laterally protects the eye sockets."
  },
  {
    "id": "a5f803f5-5a4d-4f91-b0b3-82620a4ed745",
    "title_en": "Anatomical context: Abdomen",
    "content_en": "The rectus abdominis flexes the trunk on the pelvis and is visible as \"squares\" when toned. The external oblique (superficial layer) rotates the trunk to the opposite side. The internal oblique rotates to the same side. The transverse (deepest) is the \"natural corset\" — it compresses the abdomen and stabilizes the spine without vertebral movement."
  },
  {
    "id": "a6010c86-c31f-409c-a6cb-f8a2193229b6",
    "title_en": "Educational guidance for Cheekbones",
    "content_en": "facial trauma with deformity, visual disturbances, difficulty breathing, altered bite, or numbness should be medically evaluated; local cold wrap can be applied and pressure on the area is avoided."
  },
  {
    "id": "a78ae75f-d7d7-4dc1-ba5d-cb212b000a5e",
    "title_en": "Anatomical context: Lower leg",
    "content_en": "The medial and thicker bone of the calf. Main function: Supports body weight between knee and ankle."
  },
  {
    "id": "a7e12079-cf59-42b0-9019-d48f956a446d",
    "title_en": "Useful questions about Calf",
    "content_en": "Is the pain in the calf muscle (back), front or side? Does it occur while running or also at rest? Do you have cramps at night? Is the calf swollen, red or warm? Did it appear after sports or for no apparent reason? Can you lift the tip of your foot? Do you have pain in your Achilles tendon (above the heel)?"
  },
  {
    "id": "a8d4570b-bbc7-4814-8d0f-0af1ca5a65bd",
    "title_en": "Educational guidance for Toes",
    "content_en": "elevating the limb, applying a wrapped cold compress, and reducing weight bearing; consult if you can't walk, the pain is intense, there is deformity or suspected fracture."
  },
  {
    "id": "a8fa537d-93d6-4ae9-9d17-a769a77ff272",
    "title_en": "Educational guidance for Inner nose",
    "content_en": "facial trauma with deformity, visual disturbances, difficulty breathing, altered bite, or numbness should be medically evaluated; local cold wrap can be applied and pressure on the area is avoided."
  },
  {
    "id": "aa44270d-b19f-464d-8104-c916449b468e",
    "title_en": "Possible symptoms involving Chest",
    "content_en": "pain when pushing or bringing the arm inward, tension when palpating the pectoral, pain when crossing the arms, numbness in the arm (thoracic outlet syndrome), sudden pain with deformity at maximal effort (pectoral tear), tightness in the chest when moving."
  },
  {
    "id": "ab122cf7-1b5c-4123-9a77-33878c6b28ae",
    "title_en": "Anatomical context: Shoulder",
    "content_en": "The shoulder joint has the most mobility in the body, enabled by a complex set of muscles. The deltoid (anterior, lateral, posterior) raises and rotates the arm. The rotator cuff (supraspinata, infraspinatus, subscapularis, teres minor) stabilizes the humeral head in the socket. The biceps and pectoralis major contribute to arm movements relative to the shoulder."
  },
  {
    "id": "ab40af6e-651d-40b6-8746-8d0ebec12a00",
    "title_en": "Anatomical context: Chest and rib cage",
    "content_en": "The pectoralis major (the largest muscle in the chest) brings the arm toward the body and internally rotates it. Pectoralis minor stabilizes the shoulder blade. The serratus anterior rotates the scapula upward. The intercostals and diaphragm are essential for breathing. The subclavian stabilizes the clavicle."
  },
  {
    "id": "aba78911-bf68-4ea8-b8eb-db58db568171",
    "title_en": "Educational guidance for Hip",
    "content_en": "stretching of the piriformis and glutes (knee to chest, external rotation); reducing rough terrain running; ice on the painful area; progressive strengthening of the glutes (exercises with low resistance). See a doctor if the pain is in the groin (possibly a joint), if it prevents you from walking, or if it occurs after a fall."
  },
  {
    "id": "ac03b6f9-5058-4990-b35a-7818e148b4b1",
    "title_en": "Possible symptoms involving Inner thigh",
    "content_en": "pain on the inner side of the thigh, pain when opening the legs (abduction) or changing direction, tenderness on palpation on the inner thigh, pain when kicking or moving sideways, embarrassment or pain when walking on uneven ground."
  },
  {
    "id": "ac278ac7-3ab1-47c7-990e-69e48651c51d",
    "title_en": "Warning signs involving Back of thigh",
    "content_en": "popping sound with immediate intense pain and inability to walk (possible complete rupture); rapidly expanding bruise; sitting pain radiating down the leg (possible torn proximal tendon or sciatic nerve compression); significantly reduced knee flexion force."
  },
  {
    "id": "acc67ad0-4f82-4d5b-91e7-81f0719ec881",
    "title_en": "Anatomical context: Pelvis",
    "content_en": "The pelvic floor consists of the levator ani (pubococcygeus, iliococcygeus), coccygeus and the sphincter muscles. They support the pelvic organs (bladder, uterus/prostate, rectum), control urinary and fecal continence, and are involved in sexual function."
  },
  {
    "id": "acede517-6d32-4ad2-b612-773515697875",
    "title_en": "Possible causes of pain involving Top of head",
    "content_en": "direct hit, fall, sports or road accident; pain may come from contusion, skull fracture, scalp injury, or intracranial complications associated with trauma."
  },
  {
    "id": "ae309674-77b4-45aa-a7d8-61b8d83be963",
    "title_en": "Possible symptoms involving Upper shoulder",
    "content_en": "pain above the chest/shoulder, swelling, bruising, drooping shoulder, bulge or pain when moving the arm."
  },
  {
    "id": "af54faa9-261f-4caa-b063-f4414262fe47",
    "title_en": "Anatomical context: Head and neck",
    "content_en": "Head muscles control facial expressions (mimic, smile, frown) and mastication. The neck muscles allow rotation, flexion and extension of the head and stabilize the cervical spine. Main muscles: sternocleidomastoid (head rotation), upper trapezius (shoulder/head lift), scalenes (neck flexion), facial muscles (orbicularis, zygomatic, frontalis), masseter and temporalis (chewing)."
  },
  {
    "id": "af74709f-6f78-4646-9569-08be4652ba79",
    "title_en": "Possible causes of pain involving Middle ear",
    "content_en": "head/ear blow, temporal fracture, sudden pressure changes or damage to the eardrum and ossicular chain."
  },
  {
    "id": "b09f0a57-8acb-4cae-8a67-142daafba7e2",
    "title_en": "Useful questions about Shoulder",
    "content_en": "Does the pain occur when you raise your arm or all the time? Did it start after exertion or after a fall/bump? Do you have a weakness for pushing or pulling? Is there numbness or tingling in your arm or hand? Does the pain wake you up at night? Have you had problems with the same shoulder before?"
  },
  {
    "id": "b0eb7cab-ad20-489c-8077-ba57b2acf8ad",
    "title_en": "Educational guidance for Tear duct area",
    "content_en": "facial trauma with deformity, visual disturbances, difficulty breathing, altered bite, or numbness should be medically evaluated; local cold wrap can be applied and pressure on the area is avoided."
  },
  {
    "id": "b144b8b0-e8d3-4fba-9523-5e8c93c394a9",
    "title_en": "Possible symptoms involving Back of upper arm",
    "content_en": "pain when extending the elbow with resistance (pushed at the gym), tenderness to palpation of the back of the arm, muscle fever after intense triceps training, pain in the triceps tendon (above the olecranon), pain after throwing or hitting the ball."
  },
  {
    "id": "b1c2c8b7-fc69-47d5-a9e9-0d868aebfc57",
    "title_en": "Possible causes of pain involving Pelvis",
    "content_en": "pelvic floor weakness (postpartum, pregnancy, elderly), hypertonia (muscles that are too contracted — common cause of chronic pelvic pain), coccyx trauma (fall), prostatitis, endometriosis, chronic pelvic pain syndrome."
  },
  {
    "id": "b2290d0c-b340-4fbc-9951-0c2461e25652",
    "title_en": "Possible causes of pain involving Forearm",
    "content_en": "fall on outstretched hand, torsion, direct impact; the radius and ulna can fracture separately or together, including at the elbow or wrist."
  },
  {
    "id": "b271acc4-3f4b-48cf-b113-6f22ae2b78c3",
    "title_en": "Anatomical context: Middle ear",
    "content_en": "The largest ossicle of the middle ear, attached to the eardrum. Main function: Transmits the vibrations of the eardrum to the anvil."
  },
  {
    "id": "b4c36c4b-95a9-4be0-bf37-e45d3930aece",
    "title_en": "Warning signs involving Back support muscles",
    "content_en": "low back pain radiating down the leg and numbness/weakness (nerve compression—herniated disc); loss of bladder or bowel control (EMERGENCY — cauda equina syndrome); progressive nocturnal pain or pain in a person with osteoporosis or a history of cancer; fever with backache."
  },
  {
    "id": "b59ac185-b799-4484-a0bc-67b498b59599",
    "title_en": "Useful questions about Upper back",
    "content_en": "Was there a fall or accident? Does the pain go down the arm/leg? Is there numbness, weakness, trouble walking or urinary control?"
  },
  {
    "id": "b631f686-25ec-47e6-aea7-a64b5f4de43a",
    "title_en": "Possible causes of pain involving Back support muscles",
    "content_en": "incorrect lifting, prolonged posture in flexion, disc herniation (with root compression), spondylolisthesis, atrophy of the multifidus after an episode of lumbago, muscle fatigue during intense physical work, contracture."
  },
  {
    "id": "b65dc5b1-97d2-4084-a75b-cf1a29f3953c",
    "title_en": "Anatomical context: Front and side of lower leg",
    "content_en": "The tibialis anterior, on the front of the lower leg, lifts the front of the foot through dorsiflexion and turns the sole inward. This is essential during walking because it helps prevent the toes from catching the ground. The fibularis longus and brevis, on the outer side of the lower leg, turn the sole outward and help stabilize the outer ankle."
  },
  {
    "id": "b6e6d941-f825-4dce-b14e-778d19dd4254",
    "title_en": "Possible symptoms involving Middle ear",
    "content_en": "deep pain in the ear after trauma, hearing loss, ringing, dizziness or feeling off balance; the ossicles of the ear may be involved in trauma to the temporal bone."
  },
  {
    "id": "b809c182-d9a8-4166-9d71-1fa855fe7f3a",
    "title_en": "Possible symptoms involving Pelvis",
    "content_en": "chronic pelvic pain or pressure, loss of urine when coughing/laughing/exertion (stress incontinence), pelvic heaviness, pain in the coccyx area, problems with bladder or bowel control, pain during sexual activity."
  },
  {
    "id": "b90ce585-eaf5-4bb4-915f-c41e4ab8496e",
    "title_en": "Warning signs involving Shoulder",
    "content_en": "Complete loss of strength when lifting the arm may indicate a full rotator cuff tear. Other warning signs include being unable to raise the arm out to the side, severe sudden pain with complete loss of function, visible deformity, or progressive pain that does not improve with rest or anti-inflammatory medicine."
  },
  {
    "id": "b92ec59f-38be-45be-8410-eabc50d9ea8a",
    "title_en": "Possible symptoms involving Lower jaw",
    "content_en": "jaw pain, altered bite, difficulty opening the mouth, loose teeth, lip/chin numbness or pain when chewing."
  },
  {
    "id": "bb3d1e0a-7f91-4e23-abf4-8241567610f9",
    "title_en": "Possible symptoms involving Midfoot",
    "content_en": "pain in the ankle, heel, midfoot or toes, swelling, bruising, bone tenderness, pain when walking or inability to stand."
  },
  {
    "id": "bca0133a-bc6c-46dc-94ac-d958eb901886",
    "title_en": "Useful questions about Forearm",
    "content_en": "Does the pain occur while typing, gripping, or moving the wrist? Is it worse on the inner side toward the little finger or on the outer side toward the thumb? Do you have numbness in your fingers? Does the pain wake you at night? Is it related to a sport or repetitive activity?"
  },
  {
    "id": "bd3c814c-b2d1-4803-8fcf-3cb6c3f2591b",
    "title_en": "Educational guidance for Center of chest",
    "content_en": "simple rib pain is usually managed with pain control and regular deep breathing, but severe trauma or difficulty breathing requires medical evaluation."
  },
  {
    "id": "bd4e954b-9d44-43d7-b45e-220127f615b6",
    "title_en": "Warning signs involving Front of upper arm",
    "content_en": "popping sound at elbow or shoulder with visible arm deformity and loss of strength (proximal or distal biceps tendon rupture); rapid extensive bruising; marked weakness in flexion or supination."
  },
  {
    "id": "bd9f321c-87be-44cd-884e-9749f4663b76",
    "title_en": "Anatomical context: Rib cage",
    "content_en": "12 pairs: 7 true, 3 false, 2 floating. Main function: Forms the rib cage and protects the vital organs."
  },
  {
    "id": "be5d36f0-6c98-4d24-908c-d062a7e5597e",
    "title_en": "Warning signs involving Middle ear",
    "content_en": "emergency for blood or fluid in the ear after trauma, severe vertigo, sudden hearing loss, facial paralysis, or neurological symptoms."
  },
  {
    "id": "be88a39a-7ad2-4091-80ef-0b0c9f9a8755",
    "title_en": "Possible symptoms involving Thigh",
    "content_en": "severe thigh/hip pain, inability to bear weight, swelling, deformity, shortening or abnormal rotation of the leg."
  },
  {
    "id": "bec9be35-fc40-46b5-8522-6a6eb27a9ef4",
    "title_en": "Educational guidance for Palm",
    "content_en": "remove rings, apply cold wrap, immobilize, and seek evaluation if there is deformity, persistent pain, or suspected fracture; scaphoid requires attention for risk of difficult healing."
  },
  {
    "id": "bee2446f-a55b-4483-9f2a-03e67f4f6e9e",
    "title_en": "Educational guidance for Middle ear",
    "content_en": "hearing loss, vertigo, bleeding from the ear, or symptoms after head trauma require medical/ENT consultation."
  },
  {
    "id": "beeb4499-2368-4b3c-994e-6857a09a4a56",
    "title_en": "Possible symptoms involving Hip and buttock",
    "content_en": "pain in the buttock, weakness when climbing stairs or rising from a low chair, pain when running or walking long distances, pain on the side of the hip (associated trochanteric bursitis), \"rocking\" walking with bilateral weakness, early fatigue during sports, pain when palpating the buttock."
  },
  {
    "id": "bf061c74-27e0-470c-8d57-cb3e4e96a8e3",
    "title_en": "Warning signs involving Rib cage",
    "content_en": "emergency for difficulty breathing, increasing chest pain, coughing up blood, dizziness, major trauma, or signs of lung damage."
  },
  {
    "id": "bf097879-8a85-49a8-a75b-bb8dfa89d09d",
    "title_en": "Educational guidance for Neck",
    "content_en": "spinal pain after trauma or associated with neurological symptoms requires medical evaluation; for pain without severe trauma, avoid prolonged immobilization and consult if it persists or worsens."
  },
  {
    "id": "bf2a3e1c-215d-4484-8f53-a085fd008453",
    "title_en": "Anatomical context: Hand",
    "content_en": "The hand contains intrinsic muscles: the thenar muscles move and oppose the thumb; the hypothenar muscles move the little finger; the interossei spread the fingers apart and bring them together; and the lumbricals flex the first finger joints while extending the other joints. These muscles enable very fine movements, including precision grip, grasping, pinching, and rotation."
  },
  {
    "id": "c0bfa104-83ee-489c-bea8-d9e5d3c4e6de",
    "title_en": "Anatomical context: Lower jaw",
    "content_en": "The only movable bone of the skull; forms the lower jaw. Main function: Allows mastication and articulation of speech."
  },
  {
    "id": "c0de5b92-9004-4fa6-805d-c6e78fe5120e",
    "title_en": "Warning signs involving Chest",
    "content_en": "URGENT: chest pain with radiation in the left arm or jaw (possible heart attack — call 112); popping sound in pectoral with deformity and loss of strength (complete pectoral tear); pain with difficulty breathing and fever."
  },
  {
    "id": "c13b3e7f-817a-43a7-94fc-d6ab4cb097e4",
    "title_en": "Warning signs involving Back of upper arm",
    "content_en": "popping sound at posterior elbow with loss of extension strength and deformity (possible triceps tendon rupture—rare, but does exist); elbow swollen and painful after falling on outstretched hand (possible olecranon fracture — not muscle tear)."
  },
  {
    "id": "c1bbe6d3-95e3-47b0-9cff-4ff32a4ab9d7",
    "title_en": "Anatomical context: Center of chest",
    "content_en": "Central flat bone of the thorax, formed by the manubrium, body and xiphoid appendage. Main function: Protects the heart and lungs; insertion point for ribs."
  },
  {
    "id": "c4094dd0-57c4-41a2-924e-dc2f95330afb",
    "title_en": "Educational guidance for Pelvis",
    "content_en": "Kegel exercises (contraction and relaxation of the pelvic floor) for progressive strengthening or relaxation; consultation of a physiotherapist specialized in pelviperineology. Pelvic pain requires medical evaluation to rule out organic causes."
  },
  {
    "id": "c534ad59-36c0-489a-b570-8c0529e71abe",
    "title_en": "Useful questions about Hand",
    "content_en": "Is the pain in the palm, fingers or joints? Is there numbness (and in which fingers)? Does it occur mostly in the morning or after exercise? Does a finger stick or click? Was it a hit or an accident? Do you also have pain in your forearm or shoulder?"
  },
  {
    "id": "c5725ede-6e4f-4e7d-b4f8-e75690e01df3",
    "title_en": "Useful questions about Fingers",
    "content_en": "Where does it hurt: wrist, palm or finger? Can you make a fist? Is there deformity, numbness, or pain at the base of the hip?"
  },
  {
    "id": "c57a399f-d801-4393-8bff-ded441735c56",
    "title_en": "Possible causes of pain involving Middle ear",
    "content_en": "head/ear blow, temporal fracture, sudden pressure changes or damage to the eardrum and ossicular chain."
  },
  {
    "id": "c7cbba67-5ac7-4975-99a2-6ecd0e495e5a",
    "title_en": "Educational guidance for Lower back",
    "content_en": "spinal pain after trauma or associated with neurological symptoms requires medical evaluation; for pain without severe trauma, avoid prolonged immobilization and consult if it persists or worsens."
  },
  {
    "id": "c7da0ff9-9e74-4838-bf6f-56730a51bd9f",
    "title_en": "Educational guidance for Temple",
    "content_en": "after head trauma with neurological symptoms, loss of consciousness, vomiting, aggravation or suspected fracture, urgent evaluation is required; exercise is avoided and neurological status is monitored until evaluation."
  },
  {
    "id": "c88f8dd4-2e1a-4570-92b9-d74d07ac1d1a",
    "title_en": "Anatomical context: Lower back",
    "content_en": "The largest vertebrae, located in the lower back. Main function: Support the weight of the upper torso."
  },
  {
    "id": "c97d5ddd-28c3-440c-93c8-e69238c52632",
    "title_en": "Useful questions about Lower spine",
    "content_en": "Was there a fall or accident? Does the pain go down the arm/leg? Is there numbness, weakness, trouble walking or urinary control?"
  },
  {
    "id": "cc409024-d876-4083-9905-9fc16dce71de",
    "title_en": "Warning signs involving Tailbone",
    "content_en": "emergency for progressive numbness/weakness, difficulty walking, loss of bladder/bowel control, major trauma, fever, or severe night pain."
  },
  {
    "id": "cc729d19-1e34-4ee8-be9c-d9b37c27642e",
    "title_en": "Warning signs involving Toes",
    "content_en": "Seek emergency medical care for inability to bear weight, visible deformity, an open wound, numbness, cold or pale toes, or a wound or post-traumatic pain in a person with diabetes or vascular disease."
  },
  {
    "id": "ccc89a12-0d8b-406d-a106-6382ca3f5eaa",
    "title_en": "Possible symptoms involving Hip",
    "content_en": "deep pain in the buttock, pain on external rotation of the leg, discomfort with prolonged sitting (especially on the piriformis), pain radiating to the back of the thigh (mimicking sciatica), pain when walking on rough terrain, tenderness on deep palpation of the buttock."
  },
  {
    "id": "cd290123-9e39-4028-9aef-aec1bd775526",
    "title_en": "Possible causes of pain involving Palm",
    "content_en": "fall on hand, punch, crush, twist of fingers; carpal, metacarpal or phalangeal fractures may occur."
  },
  {
    "id": "ce90d19f-1d09-47b9-8fa6-93b25b59eaaa",
    "title_en": "Anatomical context: Tear duct area",
    "content_en": "The smallest bones of the face, located in the medial wall of the orbit. Main function: They contain the nasolacrimal duct."
  },
  {
    "id": "cef8dbf4-6ef8-4b24-a290-b251a5e7d571",
    "title_en": "Educational guidance for Roof of mouth",
    "content_en": "facial trauma with deformity, visual disturbances, difficulty breathing, altered bite, or numbness should be medically evaluated; local cold wrap can be applied and pressure on the area is avoided."
  },
  {
    "id": "cf344848-f5db-4c08-a9c0-c445a4657bfb",
    "title_en": "Anatomical context: Forehead",
    "content_en": "Flat bone that forms the forehead and the anterior part of the cranial vault. Main function: Protects the frontal lobes of the brain and forms the roof of the orbits."
  },
  {
    "id": "cf7ab2fe-6441-4a5a-9008-2b419c9696a8",
    "title_en": "Warning signs involving Temple",
    "content_en": "call 112 or seek urgent medical care for loss of consciousness, confusion, convulsions, neurological deficit, severe progressive pain, open wound or suspected open fracture."
  },
  {
    "id": "cf8f2792-2453-45c8-95b0-fec58fc2e449",
    "title_en": "Useful questions about Head and neck",
    "content_en": "Did the pain come on suddenly or did it build up gradually? Did you sleep in an awkward position or spend a lot of time at the computer? Can you turn your head in both directions? Is there numbness, tingling or weakness in the arm? Do you have a fever, dizziness or blurred vision? Did the pain appear after a trauma?"
  },
  {
    "id": "d11b03c9-24b6-4e8c-82a3-8fd5dc74b970",
    "title_en": "Educational guidance for Chest and rib cage",
    "content_en": "avoid pushing or crossing your arms if they are painful; rest; ice in the first 24-48h after trauma; gentle stretching of the pectorals at the door; consult a doctor if the pain is severe anterior chest to rule out cardiac or pleural causes."
  },
  {
    "id": "d1a6e774-a261-4580-8f13-74c771f0f80f",
    "title_en": "Possible causes of pain involving Lower spine",
    "content_en": "trauma, fall, accident, overuse, compression fracture, osteoporosis, pathological bone processes or joint/ligament irritation around the vertebrae."
  },
  {
    "id": "d2285a9f-4545-4136-b367-4e075745f702",
    "title_en": "Possible symptoms involving Lower leg",
    "content_en": "calf pain, tibia/fibula tenderness, swelling, bruising, pain on bearing, deformity or progressive pain on exertion in stress fracture."
  },
  {
    "id": "d2baf51a-8cb5-4017-9a9a-568037e4ccb0",
    "title_en": "Anatomical context: Fingers",
    "content_en": "Each hand has 14 phalanges: 2 in the thumb and 3 in each of the other fingers. Their main function is to enable fine finger movement."
  },
  {
    "id": "d3d1b458-51b5-4737-9765-2e26eafc3556",
    "title_en": "Educational guidance for Forearm",
    "content_en": "immobilize the forearm and avoid rotation if you suspect a fracture; medical evaluation for X-ray and splint/plaster treatment or surgery in displaced cases."
  },
  {
    "id": "d4a7c79b-8cb6-4f39-9edc-43d0b551cc3e",
    "title_en": "Anatomical context: Back",
    "content_en": "The back has several layers: superficial (trapezius — raises and lowers the shoulder, latissimus dorsi — pulls the arm down and back, rhomboid — retracts the scapula), and deep (erector spinae = iliocostal+longisimus+spinos — extends the spine, multifidus — stabilizes the vertebrae, quadratus lumbar — lateral flexion). They all work on posture and trunk movement."
  },
  {
    "id": "d5022945-07c7-4010-9d1c-7eb1f9f3db24",
    "title_en": "Anatomical context: Lower spine",
    "content_en": "Triangular bone formed by the fusion of 5 sacral vertebrae. Main function: Connects the spine to the pelvis."
  },
  {
    "id": "d6a5bb2f-6508-498a-a175-4fb6eaeeb49d",
    "title_en": "Warning signs involving Pelvis",
    "content_en": "emergency for inability to walk/support, severe pain after fall, dizziness, major trauma or suspected internal bleeding."
  },
  {
    "id": "d73a3e05-640c-4874-b36b-f19ba57d3356",
    "title_en": "Anatomical context: Wrist",
    "content_en": "8 bones on each hand, arranged in two rows (scaphoid, semilunar, pyramidal, etc.). Main function: Forms the wrist; allow fine mobility."
  },
  {
    "id": "d740741a-abae-471b-84de-194af8685c62",
    "title_en": "Possible causes of pain involving Upper arm",
    "content_en": "muscle fever after intense exercise (DOMS), overuse in the gym or sports, muscle strain (partial tear), direct contusion, cramping, complete biceps tear (snapping sound, deformity) after maximal effort. The pain can also come from the shoulder or elbow."
  },
  {
    "id": "d77fca51-a7d4-443b-8d95-29a155eac069",
    "title_en": "Possible causes of pain involving Wrist",
    "content_en": "fall on hand, punch, crush, twist of fingers; carpal, metacarpal or phalangeal fractures may occur."
  },
  {
    "id": "d81964df-010d-4e3c-b2b7-14d23e6792a0",
    "title_en": "Possible causes of pain involving Tear duct area",
    "content_en": "direct trauma to the face, fall, contact sport, road accident, blow to the mandible, nose, eye socket, jaw or cheekbones; there may be fractures, tooth dislocations or soft tissue injuries."
  },
  {
    "id": "d92bbc4e-a05c-4044-b014-a171e8b90298",
    "title_en": "Educational guidance for Thigh",
    "content_en": "suspected femur/hip or patella fracture requires urgent evaluation; the limb must be immobilized and not forced to walk."
  },
  {
    "id": "d99589c0-fcad-4f81-9803-f33e09894515",
    "title_en": "Possible symptoms involving Roof of mouth",
    "content_en": "local facial pain, swelling, bruising, deformity, difficulty biting or chewing, jaw jam, deformed nose, nosebleed, double vision or numbness of the cheek/lip."
  },
  {
    "id": "d99bc9e6-bfcc-496f-aee7-6c733c60ee08",
    "title_en": "Possible symptoms involving Front and side of lower leg",
    "content_en": "pain on the anterior or lateral side of the calf when running, shin splints, pain that occurs after running on asphalt, weakness when raising the tip of the foot (drop foot), lateral instability of the ankle, pain on palpation on the lateral malleolus or on the lateral side of the calf."
  },
  {
    "id": "da638723-66b8-49f9-9bd2-fdc392930b88",
    "title_en": "Possible causes of pain involving Inner nose",
    "content_en": "direct trauma to the face, fall, contact sport, road accident, blow to the mandible, nose, eye socket, jaw or cheekbones; there may be fractures, tooth dislocations or soft tissue injuries."
  },
  {
    "id": "db5ffd86-a360-4c36-b73a-20849cb0e39e",
    "title_en": "Educational guidance for Foot and sole",
    "content_en": "Stretch the plantar fascia in the morning before the first step by gently pulling the toes toward you. Other measures include rolling a tennis ball under the sole, wearing shoes with good arch support, and avoiding walking barefoot on hard surfaces. Seek medical advice for persistent pain, numbness, deformity, or inability to bear weight."
  },
  {
    "id": "dd6daabd-1173-4fdd-98fb-c1c7cb9f055f",
    "title_en": "Anatomical context: Forearm",
    "content_en": "The medial bone of the forearm, forms the tip of the elbow. Main function: Stabilizes the elbow joint."
  },
  {
    "id": "dd9e638c-bc1b-4c4e-a1e0-d116a0b31cf0",
    "title_en": "Possible causes of pain involving Forehead",
    "content_en": "direct hit, fall, sports or road accident; pain may come from contusion, skull fracture, scalp injury, or intracranial complications associated with trauma."
  },
  {
    "id": "dda9aedb-d70a-440e-aa03-0e65151e0dec",
    "title_en": "Warning signs involving Chest and rib cage",
    "content_en": "URGENT: intense chest pain radiating to the left arm, jaw or back (possible heart attack); pain with difficulty breathing, sweating and feeling sick (possibly a heart or lung problem); severe pain when breathing with fever (possible pleurisy or pneumonia); rib deformity after trauma."
  },
  {
    "id": "de2e45da-02cf-4bff-b85f-940df0b8bb72",
    "title_en": "Useful questions about Middle ear",
    "content_en": "Was there a blow to the head or ear? Has your hearing decreased? Is there dizziness, wheezing, bleeding or fluid?"
  },
  {
    "id": "ded70d2e-b06c-4203-94a1-d07c88c4eaaa",
    "title_en": "Possible symptoms involving Back",
    "content_en": "lumbar (lower back) or back (middle area) pain, palpable muscle tension, paralyzing muscle spasm, pain when bending forward or backward, pain that worsens after prolonged sitting, muscle fatigue with physical work, morning pain that improves with movement."
  },
  {
    "id": "df4aba12-eb71-459f-ae14-020bd283963f",
    "title_en": "Possible causes of pain involving Hip",
    "content_en": "piriformis syndrome (contracture of the piriformis compresses the sciatic nerve — more common in runners and cyclists), overuse in external rotation movements (dance, martial arts), direct contusion on the buttock, deep hematoma."
  },
  {
    "id": "df589eab-f1cd-4a5a-a78f-734293dfe808",
    "title_en": "Anatomical context: Forearm",
    "content_en": "The forearm contains two groups: front (flexors: flexor carpi radialis and ulnar, palmaris longus, flexor digitorum) which bends the wrist and fingers, and back (extensors: extensor carpi, extensor digitorum) which extend them. The pronator and supinator rotate the forearm. The brachioradialis flexes the elbow and is most visible laterally."
  },
  {
    "id": "e07f88fc-e7c0-4a73-9e64-2aaf0c130c44",
    "title_en": "Warning signs involving Spine",
    "content_en": "Back or spinal pain with numbness or weakness in the limbs may indicate nerve compression. Loss of bladder or bowel control is an EMERGENCY and may indicate cauda equina syndrome. After trauma with a suspected vertebral fracture, do not move the person. Other warning signs include progressive pain at night or sudden spinal deformity."
  },
  {
    "id": "e091081e-17ca-4592-87fb-3858ce87c2b3",
    "title_en": "Warning signs involving Neck",
    "content_en": "neck pain after trauma with numbness or weakness in the limbs (possible cervical injury — do not move the patient, call 112); torticollis in a newborn or young child (pediatric consultation); severe pain with fever and stiffness on flexion of the neck (possible meningitis — EMERGENCY)."
  },
  {
    "id": "e095550e-3865-4fa2-aa9c-b5fd2b47f9c1",
    "title_en": "Educational guidance for Midfoot",
    "content_en": "elevating the limb, applying a wrapped cold compress, and reducing weight bearing; consult if you can't walk, the pain is intense, there is deformity or suspected fracture."
  },
  {
    "id": "e11c06f5-c973-4a38-a968-ad134cc86ac4",
    "title_en": "Warning signs involving Lower spine",
    "content_en": "emergency for progressive numbness/weakness, difficulty walking, loss of bladder/bowel control, major trauma, fever, or severe night pain."
  },
  {
    "id": "e13752ac-12c5-47ef-9f44-b3dd5b8ea0bc",
    "title_en": "Anatomical context: Calf",
    "content_en": "The gastrocnemius and soleus form the calf and are the main plantarflexors of the foot, which makes them essential for walking, running, and jumping. The gastrocnemius has two heads that attach above the knee, so it also helps flex the knee. The soleus lies deeper and is more resistant to fatigue. The Achilles tendon connects both muscles to the heel."
  },
  {
    "id": "e283e307-1319-48b4-a8b9-3c0337ae7cad",
    "title_en": "Useful questions about Inner nose",
    "content_en": "Was there a hit to the head or a fall? Has loss of consciousness, vomiting, confusion or drowsiness occurred? Is the pain getting worse? Is there bleeding or a wound?"
  },
  {
    "id": "e2c70511-2d59-4c0b-8182-ee23a7be4a48",
    "title_en": "Possible symptoms involving Forearm",
    "content_en": "pain between elbow and wrist, swelling, bone tenderness, deformity, pain when rotating the forearm or decreased grip strength."
  },
  {
    "id": "e2d3ef0d-996c-49e9-8331-d7006213554f",
    "title_en": "Possible causes of pain involving Upper shoulder",
    "content_en": "fall on shoulder, sports, bicycle, accident; the clavicle is frequently fractured by impact on the shoulder or outstretched hand."
  },
  {
    "id": "e396607c-d3ed-48ae-8827-565c01ff7a74",
    "title_en": "Useful questions about Wrist",
    "content_en": "Where does it hurt: wrist, palm or finger? Can you make a fist? Is there deformity, numbness, or pain at the base of the hip?"
  },
  {
    "id": "e3cd456d-5f0e-47af-9440-1b8ad9137b9f",
    "title_en": "Useful questions about Middle ear",
    "content_en": "Was there a blow to the head or ear? Has your hearing decreased? Is there dizziness, wheezing, bleeding or fluid?"
  },
  {
    "id": "e4479867-54dd-4322-906d-6026a415a87f",
    "title_en": "Warning signs involving Hip",
    "content_en": "inability to put weight on the leg after falling (possible femoral neck fracture — especially elderly), deformity or abnormal rotation of the leg, severe pain in the groin with total block of movement, extensive bruising, progressive numbness or weakness in the leg, progressive night pain."
  },
  {
    "id": "e58a067c-45b2-4655-81db-e245aab7b327",
    "title_en": "Possible causes of pain involving Head and neck",
    "content_en": "bad posture at the desk or on the phone, accumulated tension (stress), sleeping in an uncomfortable position, cold air current directly on the neck, sudden rotational movement, contracture after exertion or contact sports, teeth grinding (bruxism) for masticatory muscles."
  },
  {
    "id": "e5ffa7d6-8367-40c3-9ae9-1f9a6fb63451",
    "title_en": "Useful questions about Rib cage",
    "content_en": "Does it hurt when you take a deep breath? Are you having trouble breathing, coughing up blood, or a severe accident? Is the pain local to pressure?"
  },
  {
    "id": "e6cd8f3a-e52f-4f75-8e73-12b0dd8872ab",
    "title_en": "Anatomical context: Neck",
    "content_en": "The 7 vertebrae of the neck, with Atlas (C1) and Axis (C2) as the first two. Main function: Support the head and allow rotation and flexion of the neck."
  },
  {
    "id": "e714e961-47c0-4a64-9d71-614cbda8a15d",
    "title_en": "Useful questions about Upper jaw",
    "content_en": "Was the trauma direct? Can you open your mouth normally? Has the bite changed? Do you have double vision, numbness or persistent nosebleeds?"
  },
  {
    "id": "e7436eed-d6c8-48d7-ac97-efaf8f3e8f9a",
    "title_en": "Warning signs involving Head and neck",
    "content_en": "very intense pain that comes on suddenly (\"worst pain of my life\"), severe neck stiffness with fever (possible meningitis), numbness or weakness in arms or hands, severe dizziness with double vision, pain after trauma (accident, fall), difficulty swallowing or breathing, pain with unexplained weight loss."
  },
  {
    "id": "e7a6abb6-e9d8-44d7-bbba-fe7a4fae5846",
    "title_en": "Warning signs involving Front and side of lower leg",
    "content_en": "anterior or lateral calf extremely hard and painful on exertion with sensation of internal pressure (possible acute compartment syndrome — SURGICAL EMERGENCY); drop foot — inability to raise the top of the foot (serious nerve or muscle injury); stress fracture (pain on palpation of the shin, worse when running)."
  },
  {
    "id": "e7e5d4ce-1784-48b5-b89c-fd34dfd32b93",
    "title_en": "Possible symptoms involving Lower back",
    "content_en": "localized back or neck pain, stiffness, pain that increases with movement or support; possible neurological signs: numbness, tingling, weakness, difficulty walking or urinary/bowel disturbances."
  },
  {
    "id": "e95869ef-9552-47ff-837d-656e64eeec48",
    "title_en": "Possible symptoms involving Pelvis",
    "content_en": "pelvic/hip/groin pain, difficulty walking, pain on bearing, tenderness after fall or trauma."
  },
  {
    "id": "ea3a6bbf-877a-46b8-904a-ee0c9eee9d81",
    "title_en": "Possible symptoms involving Knee",
    "content_en": "pain in front of the knee, swelling, bruising, difficulty straightening the knee or walking."
  },
  {
    "id": "eaaefda4-5519-4698-a16d-2e8d7e44cc8f",
    "title_en": "Anatomical context: Leg",
    "content_en": "Lower limb: femur (longest bone in the body), patella (sesamoid bone of the knee), tibia and fibula (leg), 7 tarsals (ankle and back of the foot — calcaneus, talus, etc.), 5 metatarsals, 14 phalanges. Main joints: hip (ball-socket), knee (largest joint), ankle, foot joints."
  },
  {
    "id": "eac70e81-512c-4621-80e1-cbac95e9ee68",
    "title_en": "Useful questions about Ankle",
    "content_en": "Can you take four steps? Is the pain in the ankle, midfoot, heel or toes? Is there deformity or numbness?"
  },
  {
    "id": "eacca2f4-928f-49f2-8ccf-3fd527cd3b3d",
    "title_en": "Warning signs involving Forearm",
    "content_en": "emergency for deformity, severe pain, numbness, cold/pale fingers, open wound or disproportionate pain."
  },
  {
    "id": "ebc41c52-77de-4c78-a30d-41323313b2f4",
    "title_en": "Possible symptoms involving Neck",
    "content_en": "pain when turning the head, torticollis (head stuck in one position), palpable tension on the SCM or scalenes, pain radiating to the ear or shoulder, occipital headache, difficulty in full rotation of the neck."
  },
  {
    "id": "ed728f8d-e94d-4fc1-b219-83b18e1b015c",
    "title_en": "Warning signs involving Center of chest",
    "content_en": "emergency for difficulty breathing, increasing chest pain, coughing up blood, dizziness, major trauma, or signs of lung damage."
  },
  {
    "id": "eda69520-bf42-4f3f-838f-b2f28eeee924",
    "title_en": "Possible causes of pain involving Skull base",
    "content_en": "direct hit, fall, sports or road accident; pain may come from contusion, skull fracture, scalp injury, or intracranial complications associated with trauma."
  },
  {
    "id": "ee4ad6e6-7249-4f40-b476-58ca0cc0424f",
    "title_en": "Possible symptoms involving Upper arm",
    "content_en": "arm pain, swelling, bruising, deformity, difficulty moving the shoulder/elbow, or pain when using the arm."
  },
  {
    "id": "ef0b26c4-b350-44db-a3fb-e74b522ebe17",
    "title_en": "Useful questions about Thigh",
    "content_en": "Is the pain in the front, back, or inner thigh? Did it suddenly appear on the run or gradually? Did you hear or feel a popping sound? Is there bruising or swelling? Can you walk normally? Do you have difficulty climbing stairs or extending your knee?"
  },
  {
    "id": "ef83ae7b-9c57-493f-b354-172eece9f88d",
    "title_en": "Educational guidance for Shoulder blade",
    "content_en": "temporary sling/scarf immobilization and medical evaluation for deformity, severe pain, or major limitation; recovery includes pain control and guided mobilization as recommended."
  },
  {
    "id": "f115f889-2559-4d70-8e44-41ea246e35e3",
    "title_en": "Warning signs involving Front of thigh",
    "content_en": "popping sound with complete loss of strength in knee extension (possible quadriceps or patellar tendon rupture); rapid extensive bruising; inability to walk or extend the knee; severe pain with large swelling after trauma."
  },
  {
    "id": "f1899db7-8a4f-48c7-8604-a0a1c8f822dd",
    "title_en": "Possible causes of pain involving Forearm",
    "content_en": "repetitive movements (typing, gripping, writing), overuse in racquet or weight sports, contracture, cramp, contusion. Epicondylitis (tennis or golfer's elbow) is a common cause. Numbness and tingling may indicate median nerve compression (carpal tunnel syndrome)."
  },
  {
    "id": "f249a11f-a86e-44c9-bbb2-23ab8426afe8",
    "title_en": "Warning signs involving Hip",
    "content_en": "pain in the buttock with radiation to the entire lower limb (numbness, tingling down the leg) that does not improve with rest (possible significant nerve compression or lumbar disc herniation); progressive nocturnal pain with no identifiable cause."
  },
  {
    "id": "f31ce92f-c968-4b8f-840a-09ee4f821c2e",
    "title_en": "Warning signs involving Upper arm",
    "content_en": "emergency for deformity, open wound, numbness/weakness, cold/pale hand or severe pain after trauma."
  },
  {
    "id": "f37039f4-858b-4a92-957d-7bec47dd7636",
    "title_en": "Possible causes of pain involving Rib cage",
    "content_en": "blow, fall, chest compression, severe coughing in vulnerable persons, rib/sternal fracture or chest wall contusion."
  },
  {
    "id": "f3fc5d51-7859-4140-a44e-f102ecbc752b",
    "title_en": "Possible symptoms involving Upper and middle back",
    "content_en": "interscapular pain (between the shoulder blades), tension and tenderness to palpation in the trapezius (especially upper), pain when rotating or bending the trunk, pain when pulling or raising the arm, \"stuck\" shoulder blade sensation or clicking when moving the shoulder."
  },
  {
    "id": "f49b8670-3291-4f8c-b961-d10469aa1ba1",
    "title_en": "Possible symptoms involving Abdomen",
    "content_en": "abdominal pain or when getting out of bed, sensitivity to palpation on the right or left side, cramps after intense exertion, umbilical or inguinal hernia (visible bulge), diastasis recti (separation of the rectus abdominis — often postpartum)."
  },
  {
    "id": "f5d78d10-ec08-41f2-861f-5d178acda6a3",
    "title_en": "Useful questions about Back of head",
    "content_en": "Was there a hit to the head or a fall? Has loss of consciousness, vomiting, confusion or drowsiness occurred? Is the pain getting worse? Is there bleeding or a wound?"
  },
  {
    "id": "f61f8d88-dfec-46e1-bfb5-4260843c5f5d",
    "title_en": "Possible causes of pain involving Calf",
    "content_en": "cramps (fatigue, dehydration, low magnesium), Achilles tendinopathy (overuse in runners), calf or Achilles tear (snapping sound + loss of power on propulsion), tibial periostitis, contusion. CAUTION: Swollen calf + redness + heat = possible blood clot (thrombosis)."
  },
  {
    "id": "f63ea0b8-bc8e-4edf-9170-398ebc25a615",
    "title_en": "Possible causes of pain involving Upper back",
    "content_en": "trauma, fall, accident, overuse, compression fracture, osteoporosis, pathological bone processes or joint/ligament irritation around the vertebrae."
  },
  {
    "id": "f6db5f58-317b-4667-b1e6-fb6b6efbbdab",
    "title_en": "Anatomical context: Throat",
    "content_en": "Horseshoe-shaped bone, suspended in the neck, without joints with other bones. Main function: Point of insertion for the muscles of the tongue and larynx."
  },
  {
    "id": "f6ebdc58-2125-479a-82da-8055d7c51ff1",
    "title_en": "Possible symptoms involving Head and neck",
    "content_en": "pain or tension in the back of the neck and neck, stiffness when turning the head, feeling heavy in the head, tension-type headache, palpable muscle spasm, pain starting from the neck to the shoulder, muscle fatigue after prolonged sitting at a desk or computer."
  },
  {
    "id": "f71a367e-ed35-4450-8878-0bf211e6d70d",
    "title_en": "Useful questions about Pelvis",
    "content_en": "Can you stand? Is the pain in the groin or on the outer side of the hip? Was there a fall or accident? Do you feel dizzy or weak?"
  },
  {
    "id": "f73a7ac9-6d24-4c05-bc73-2aa75c14272f",
    "title_en": "Educational guidance for Shoulder",
    "content_en": "avoid overhead lifts and painful movements; relative rest (not total immobilization); ice in the first 48h after acute trauma, then heat; light shoulder stretching; see a doctor for evaluation and physical therapy if pain persists for more than a week."
  },
  {
    "id": "f8083677-7b20-46b2-83da-d73029cf4d32",
    "title_en": "Anatomical context: Skull base",
    "content_en": "Butterfly-shaped central bone, articulated with all other cranial bones. Main function: Supports the base of the skull and contains the Turkish saddle for the pituitary gland."
  },
  {
    "id": "f8132ccf-3dae-40cc-a0a6-1df5828f6cdf",
    "title_en": "Possible causes of pain involving Lower back",
    "content_en": "trauma, fall, accident, overuse, compression fracture, osteoporosis, pathological bone processes or joint/ligament irritation around the vertebrae."
  },
  {
    "id": "f84e2be9-21c9-4fab-97d8-7304bc78580d",
    "title_en": "Warning signs involving Inner thigh",
    "content_en": "groin pain with swelling (possible hernia or hip joint injury); popping sound with loss of power; inability to bring the legs; persistent severe pain that does not improve within a few days."
  },
  {
    "id": "f8eb4d28-f80b-4a74-bb21-5a24e61ce819",
    "title_en": "Anatomical context: Rib cage",
    "content_en": "Rib cage: 12 pairs of ribs (7 \"true\" articulated with the sternum, 3 \"false\" joined by costal cartilage, 2 \"floating\" without anterior articulation) + sternum (handlebar, body, xiphoid). It protects the heart, lungs and great vessels. The sternum is the reference point for cardiopulmonary resuscitation."
  },
  {
    "id": "f939322f-c39f-4f5f-aa10-ed6179ae6b7f",
    "title_en": "Possible symptoms involving Cheekbones",
    "content_en": "local facial pain, swelling, bruising, deformity, difficulty biting or chewing, jaw jam, deformed nose, nosebleed, double vision or numbness of the cheek/lip."
  },
  {
    "id": "fa6aa776-82d3-4916-bc40-14df1a651567",
    "title_en": "Educational guidance for Inner nose",
    "content_en": "facial trauma with deformity, visual disturbances, difficulty breathing, altered bite, or numbness should be medically evaluated; local cold wrap can be applied and pressure on the area is avoided."
  },
  {
    "id": "fa999cb7-73f6-4ed6-9ed7-33e93644cd84",
    "title_en": "Anatomical context: Middle ear",
    "content_en": "The smallest bone in the body; leaning against the oval window. Main function: Transmits vibrations to the inner ear."
  },
  {
    "id": "fbcb837a-17e6-4665-a482-501dbe593245",
    "title_en": "Warning signs involving Abdomen",
    "content_en": "abdominal pain with fever, nausea, vomiting or transit disturbances (possible internal cause — appendicitis, occlusion); painful bulge on exertion (strangulated hernia — EMERGENCY); sudden severe \"stabbing\" pain (possible abdominal emergency)."
  },
  {
    "id": "fbe0a586-b195-4126-9d89-21e77569de56",
    "title_en": "Useful questions about Thigh",
    "content_en": "Can you put weight on your leg? Is the pain in your hip, thigh or knee? Was there a hard impact or fall?"
  },
  {
    "id": "fbeb6841-0633-4347-b702-4ec114e84569",
    "title_en": "Possible symptoms involving Forearm",
    "content_en": "pain between elbow and wrist, swelling, bone tenderness, deformity, pain when rotating the forearm or decreased grip strength."
  },
  {
    "id": "fcc5ca04-c95a-4fd0-aef4-db71672fe1b9",
    "title_en": "Anatomical context: Arm",
    "content_en": "The upper limb includes the humerus in the upper arm; the radius and ulna in the forearm; 8 carpal bones in the wrist; 5 metacarpal bones in the palm; and 14 phalanges in the fingers, with 2 in the thumb and 3 in each other finger. The main joints are the shoulder, elbow, radioulnar joints, wrist, metacarpophalangeal joints, and interphalangeal joints."
  },
  {
    "id": "fda99b3f-ea20-4d5e-b5a2-c86c07f0f732",
    "title_en": "Possible causes of pain involving Upper and middle back",
    "content_en": "kyphotic posture (shoulder rounding) with overuse of the rhomboids and middle trapezius, prolonged standing at the desk, traction sports (rowing, rock climbing), upper trapezius contracture (stress, tension), direct contusion, front-back muscle imbalance."
  },
  {
    "id": "fee94e68-3282-4394-aaba-d0653b53ff41",
    "title_en": "Possible causes of pain involving Fingers",
    "content_en": "fall on hand, punch, crush, twist of fingers; carpal, metacarpal or phalangeal fractures may occur."
  }
]
$knowledge$::jsonb) as value(id uuid, title_en text, content_en text)
)
update public.ai_knowledge_entries as knowledge
set
  title_en = translated.title_en,
  content_en = translated.content_en,
  updated_at = now()
from translated
where knowledge.id = translated.id;

do $validation$
begin
  if exists (
    select 1
    from public.ai_knowledge_entries
    where active = true
      and (
        nullif(trim(title_en), '') is null
        or nullif(trim(content_en), '') is null
      )
  ) then
    raise exception 'Active AI knowledge entries must contain complete English translations';
  end if;
end
$validation$;

alter table public.ai_knowledge_entries
  alter column title_en set not null,
  alter column content_en set not null;

alter table public.ai_knowledge_entries
  drop constraint if exists ai_knowledge_entries_title_en_not_blank,
  drop constraint if exists ai_knowledge_entries_content_en_not_blank;

alter table public.ai_knowledge_entries
  add constraint ai_knowledge_entries_title_en_not_blank
    check (char_length(trim(title_en)) > 0),
  add constraint ai_knowledge_entries_content_en_not_blank
    check (char_length(trim(content_en)) > 0);

drop function if exists public.get_ai_context_for_selection(
  public.tissue_type,
  text,
  text,
  text,
  integer
);

create function public.get_ai_context_for_selection(
  p_tissue public.tissue_type,
  p_model_selection_id text default null,
  p_structure_slug text default null,
  p_body_region text default null,
  p_limit integer default 12
)
returns table (
  id uuid,
  tissue public.tissue_type,
  structure_slug text,
  model_selection_id text,
  body_region text,
  category public.knowledge_category,
  title_ro text,
  content_ro text,
  title_en text,
  content_en text,
  priority smallint
)
language sql
stable
security invoker
as $function$
  select
    knowledge.id,
    knowledge.tissue,
    knowledge.structure_slug,
    knowledge.model_selection_id,
    knowledge.body_region,
    knowledge.category,
    knowledge.title_ro,
    knowledge.content_ro,
    knowledge.title_en,
    knowledge.content_en,
    knowledge.priority
  from public.ai_knowledge_entries as knowledge
  where knowledge.active = true
    and knowledge.tissue = p_tissue
    and (
      (p_structure_slug is not null and knowledge.structure_slug = p_structure_slug)
      or (
        p_model_selection_id is not null
        and knowledge.model_selection_id = p_model_selection_id
      )
      or (p_body_region is not null and knowledge.body_region = p_body_region)
    )
  order by
    case
      when p_structure_slug is not null and knowledge.structure_slug = p_structure_slug then 0
      when (
        p_model_selection_id is not null
        and knowledge.model_selection_id = p_model_selection_id
      ) then 1
      when p_body_region is not null and knowledge.body_region = p_body_region then 2
      else 3
    end,
    knowledge.priority desc,
    knowledge.created_at asc
  limit greatest(1, least(coalesce(p_limit, 12), 30));
$function$;
