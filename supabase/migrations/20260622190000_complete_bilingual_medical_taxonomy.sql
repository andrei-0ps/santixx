begin;

alter table public.anatomy_structures
  add column if not exists description_en text,
  add column if not exists function_en text;

alter table public.muscles
  add column if not exists description_ro text,
  add column if not exists description_en text,
  add column if not exists location_ro text,
  add column if not exists location_en text,
  add column if not exists primary_actions_ro text[],
  add column if not exists primary_actions_en text[];

alter table public.muscle_groups
  add column if not exists description_ro text,
  add column if not exists description_en text;

alter table public.movement_patterns
  add column if not exists name_ro text,
  add column if not exists name_en text,
  add column if not exists description_ro text,
  add column if not exists description_en text;

alter table public.pain_classifications
  add column if not exists name_ro text,
  add column if not exists name_en text,
  add column if not exists description_ro text,
  add column if not exists description_en text,
  add column if not exists recommendations_ro text[],
  add column if not exists recommendations_en text[];

alter table public.muscle_pain_profiles
  add column if not exists title_ro text,
  add column if not exists title_en text,
  add column if not exists common_symptoms_ro text[],
  add column if not exists common_symptoms_en text[],
  add column if not exists common_causes_ro text[],
  add column if not exists common_causes_en text[],
  add column if not exists general_treatment_ro text[],
  add column if not exists general_treatment_en text[],
  add column if not exists prevention_ro text[],
  add column if not exists prevention_en text[],
  add column if not exists stop_training_when_ro text[],
  add column if not exists stop_training_when_en text[],
  add column if not exists see_doctor_when_ro text[],
  add column if not exists see_doctor_when_en text[],
  add column if not exists educational_note_ro text,
  add column if not exists educational_note_en text;

alter table public.triage_questions
  add column if not exists question_en text;

alter table public.triage_options
  add column if not exists option_key text,
  add column if not exists label_en text,
  add column if not exists finding_en text;

alter table public.triage_rules
  add column if not exists name_en text,
  add column if not exists explanation_en text;

update public.muscles
set
  description_ro = description,
  location_ro = location,
  primary_actions_ro = primary_actions;

update public.muscle_groups
set description_ro = description;

update public.movement_patterns
set
  name_ro = name,
  name_en = english_name,
  description_ro = description;

update public.pain_classifications
set
  name_ro = name,
  description_ro = description,
  recommendations_ro = recommendations;

update public.muscle_pain_profiles
set
  title_ro = title,
  common_symptoms_ro = common_symptoms,
  common_causes_ro = common_causes,
  general_treatment_ro = general_treatment,
  prevention_ro = prevention,
  stop_training_when_ro = stop_training_when,
  see_doctor_when_ro = see_doctor_when,
  educational_note_ro = educational_note;

update public.anatomy_structures a
set
  description_en = o.description_en,
  function_en = o.function_en,
  updated_at = now()
from public.organs o
where o.slug = a.slug;

update public.anatomy_structures a
set
  description_en = v.description_en,
  function_en = v.function_en,
  updated_at = now()
from (values
  ('frontal', 'Flat bone forming the forehead and the anterior part of the skull vault.', 'Protects the frontal lobes of the brain and forms the roof of the eye sockets.'),
  ('parietal', 'Two paired bones forming the lateral and superior parts of the skull cap.', 'Protect the cerebral hemispheres.'),
  ('temporal', 'Paired bones that contain the middle and inner ear and lie below the parietal bones.', 'House structures involved in hearing and balance.'),
  ('occipital', 'Posterior skull bone containing the large opening called the foramen magnum.', 'Allows passage of the spinal cord and protects the cerebellum.'),
  ('sfenoid', 'Central butterfly-shaped bone that articulates with the other cranial bones.', 'Supports the skull base and contains the sella turcica for the pituitary gland.'),
  ('etmoid', 'Light, spongy bone between the eye sockets that forms part of the roof of the nasal cavity.', 'Supports the olfactory lining and contains the ethmoidal air cells.'),
  ('maxilar', 'Paired bones that form the upper jaw and contain the upper tooth sockets.', 'Support the upper teeth and form part of the roof of the mouth.'),
  ('mandibula', 'The mobile bone of the skull that forms the lower jaw.', 'Enables chewing and contributes to speech articulation.'),
  ('zigomatic', 'Paired cheekbones that form the prominence of the cheeks.', 'Shape the face and protect the outer sides of the eye sockets.'),
  ('nazal', 'Two small bones that form the bridge of the nose.', 'Support the upper part of the nasal framework.'),
  ('lacrimal', 'The smallest facial bones, located in the medial wall of each eye socket.', 'Contain part of the nasolacrimal drainage passage.'),
  ('palatin', 'Paired bones that form the posterior part of the hard palate.', 'Help separate the oral and nasal cavities.'),
  ('vomer', 'Thin bone that forms the lower part of the nasal septum.', 'Divides the nasal cavity into left and right passages.'),
  ('cornet-inf', 'Curved bony plates on the lateral walls of the nasal cavity.', 'Help warm and humidify inhaled air.'),
  ('ciocan', 'The largest middle-ear ossicle, attached to the eardrum.', 'Transmits vibrations from the eardrum to the incus.'),
  ('nicovala', 'Anvil-shaped middle-ear ossicle between the malleus and stapes.', 'Continues the transmission of sound vibrations.'),
  ('scarita', 'The smallest bone in the body, resting against the oval window of the inner ear.', 'Transmits vibrations into the inner ear.'),
  ('hioid', 'Horseshoe-shaped bone suspended in the neck without a direct joint with another bone.', 'Provides attachment for muscles of the tongue and larynx.'),
  ('vert-cervicale', 'The seven vertebrae of the neck, including the atlas and axis.', 'Support the head and allow neck rotation and flexion.'),
  ('vert-toracice', 'The twelve vertebrae of the thoracic region that articulate with the ribs.', 'Anchor the ribs and protect the spinal cord.'),
  ('vert-lombare', 'The five large vertebrae in the lower back.', 'Support much of the weight of the upper body.'),
  ('sacrum', 'Triangular bone formed by five fused sacral vertebrae.', 'Connects the vertebral column to the pelvis.'),
  ('coccis', 'The lowest part of the vertebral column, formed by several fused vertebrae.', 'Provides attachment for pelvic-floor muscles and ligaments.'),
  ('stern', 'Flat central chest bone made of the manubrium, body, and xiphoid process.', 'Protects thoracic organs and provides attachment for the ribs.'),
  ('coaste', 'Twelve pairs of curved bones forming the rib cage.', 'Protect the heart and lungs and assist breathing mechanics.'),
  ('clavicula', 'Long S-shaped bone positioned above the first rib.', 'Connects the upper limb to the trunk.'),
  ('scapula', 'Paired flat triangular bones on the back of the chest.', 'Provide a mobile base for the shoulder and arm.'),
  ('humerus', 'The long bone of the upper arm between the shoulder and elbow.', 'Supports the upper arm and participates in shoulder and elbow movement.'),
  ('radius', 'The forearm bone on the thumb side.', 'Participates in forearm rotation and wrist movement.'),
  ('ulna', 'The forearm bone on the little-finger side that forms the point of the elbow.', 'Stabilizes the elbow and forearm.'),
  ('carp', 'Eight small bones in each wrist, arranged in two rows.', 'Form the wrist and enable fine hand mobility.'),
  ('metacarp', 'Five long bones in the palm of each hand.', 'Support the palm and connect the wrist to the fingers.'),
  ('falange-mana', 'Fourteen finger bones in each hand.', 'Enable fine movement of the fingers.'),
  ('coxal', 'Each hip bone is formed by the fused ilium, ischium, and pubis.', 'Forms the pelvis and transfers the weight of the trunk to the lower limbs.'),
  ('femur', 'The longest and strongest bone in the body.', 'Supports body weight during standing and walking.'),
  ('rotula', 'Sesamoid bone located in front of the knee joint.', 'Protects the knee and improves the leverage of the quadriceps.'),
  ('tibia', 'The larger, medial bone of the lower leg.', 'Carries body weight between the knee and ankle.'),
  ('fibula', 'The slender bone on the outer side of the lower leg.', 'Stabilizes the ankle and provides muscle attachment.'),
  ('tars', 'Seven bones in each rearfoot and ankle, including the talus and calcaneus.', 'Form the ankle and rear part of the foot.'),
  ('metatars', 'Five long bones in the middle of each foot.', 'Support the foot arches and transfer body weight.'),
  ('falange-picior', 'Fourteen toe bones in each foot.', 'Contribute to balance and push-off during walking.'),
  ('schelet-cap', 'The skull consists of cranial and facial bones that form the head.', 'Protects the brain and supports the structures of the face.'),
  ('schelet-coloana', 'The vertebral column is formed by cervical, thoracic, lumbar, sacral, and coccygeal segments.', 'Supports the body, protects the spinal cord, and permits trunk movement.'),
  ('schelet-torace', 'The thoracic cage is formed mainly by the ribs, sternum, and thoracic vertebrae.', 'Protects the heart and lungs and supports breathing.'),
  ('schelet-membrul-superior', 'The upper-limb skeleton includes the shoulder girdle, arm, forearm, wrist, and hand bones.', 'Supports positioning and movement of the upper limb.'),
  ('schelet-membrul-inferior', 'The lower-limb skeleton includes the pelvic girdle, thigh, lower leg, ankle, and foot bones.', 'Supports body weight, balance, standing, and walking.')
) as v(slug, description_en, function_en)
where a.slug = v.slug;

update public.anatomy_structures a
set
  description_ro = v.description_ro,
  function_ro = v.function_ro,
  updated_at = now()
from (values
  ('schelet-cap', 'Craniul este format din oase craniene și faciale care alcătuiesc capul.', 'Protejează creierul și susține structurile feței.'),
  ('schelet-coloana', 'Coloana vertebrală este formată din segmente cervicale, toracice, lombare, sacrale și coccigiene.', 'Susține corpul, protejează măduva spinării și permite mișcarea trunchiului.'),
  ('schelet-torace', 'Cutia toracică este formată în principal din coaste, stern și vertebre toracice.', 'Protejează inima și plămânii și participă la mecanica respirației.'),
  ('schelet-membrul-superior', 'Scheletul membrului superior include centura scapulară și oasele brațului, antebrațului, mâinii și degetelor.', 'Susține poziționarea și mișcarea membrului superior.'),
  ('schelet-membrul-inferior', 'Scheletul membrului inferior include centura pelviană și oasele coapsei, gambei, gleznei și piciorului.', 'Susține greutatea corpului, echilibrul, statul în picioare și mersul.')
) as v(slug, description_ro, function_ro)
where a.slug = v.slug;

update public.anatomy_structures a
set
  description_en = v.description_en,
  function_en = v.function_en,
  updated_at = now()
from (values
  ('adductori', 'A group of muscles on the inner thigh, including the adductor longus, adductor magnus, adductor brevis, gracilis, and pectineus.', 'Bring the thigh toward the body midline and help stabilize the lower limb during changes of direction.'),
  ('coafa-rotatorilor', 'A group of four deep shoulder muscles: supraspinatus, infraspinatus, subscapularis, and teres minor.', 'Stabilize the humeral head in the shoulder socket and support shoulder rotation.'),
  ('cvadriceps', 'A four-part muscle group on the front of the thigh: rectus femoris and the three vasti.', 'Extends the knee and helps stabilize the kneecap during walking, running, stairs, and jumping.'),
  ('ischiogambieri', 'The hamstrings are the biceps femoris, semitendinosus, and semimembranosus on the back of the thigh.', 'Flex the knee, extend the hip, and contribute to walking and running.'),
  ('muschii-abdomenului', 'The abdominal muscles include the rectus abdominis, obliques, and transversus abdominis.', 'Support the abdominal wall and contribute to trunk flexion, rotation, breathing, and spinal stability.'),
  ('muschii-abdominali', 'The abdominal wall includes the rectus abdominis, external and internal obliques, and transversus abdominis.', 'Support the organs, stabilize the spine, and contribute to trunk movement, breathing, and coughing.'),
  ('muschii-antebratului', 'Forearm muscles control the wrist, fingers, and rotation of the forearm.', 'Enable grip, wrist and finger movement, pronation, and supination.'),
  ('muschii-bazinului', 'The pelvic-floor muscles form a supportive muscular layer at the base of the pelvis.', 'Support the pelvic organs and contribute to continence and pelvic stability.'),
  ('muschii-bratului', 'Upper-arm muscles include the main elbow flexors in front and extensors behind.', 'Produce flexion and extension of the elbow and assist forearm movement.'),
  ('muschii-bratului-anteriori', 'The anterior upper-arm group includes the biceps brachii, brachialis, and coracobrachialis.', 'Flex the elbow, supinate the forearm, and assist shoulder flexion.'),
  ('muschii-bratului-posteriori', 'The posterior upper-arm group includes the triceps brachii and anconeus.', 'Extends the elbow during pushing, throwing, and weight-bearing through the arms.'),
  ('muschii-capului-gatului', 'Head and neck muscles control facial expression, chewing, head movement, and cervical posture.', 'Support facial movement, mastication, head movement, and neck stability.'),
  ('muschii-coapsei', 'Thigh muscles include the quadriceps, hamstrings, and adductors.', 'Move and stabilize the hip and knee during standing, walking, and running.'),
  ('muschii-fesieri', 'The gluteal group includes the gluteus maximus, medius, and minimus.', 'Extend, abduct, and rotate the thigh while stabilizing the pelvis during walking.'),
  ('muschii-gambei', 'Lower-leg muscles include the gastrocnemius, soleus, tibial muscles, and fibular muscles.', 'Control the ankle and foot during standing, walking, running, and push-off.'),
  ('muschii-gatului', 'Neck muscles include the sternocleidomastoid, scalenes, and deeper cervical stabilizers.', 'Rotate, flex, and tilt the head while stabilizing the cervical spine.'),
  ('muschii-labei-piciorului', 'Intrinsic foot muscles lie within the foot and support the toes and arches.', 'Support the foot arches, toe movement, balance, and walking.'),
  ('muschii-mainii', 'Intrinsic hand muscles include the thenar, hypothenar, interosseous, and lumbrical groups.', 'Enable fine finger movement, grip, pinch, and object manipulation.'),
  ('muschii-masticatori', 'The muscles of mastication include the masseter, temporalis, and medial and lateral pterygoids.', 'Open, close, and move the jaw during chewing.'),
  ('muschii-pieptului', 'Chest muscles include the pectoralis major, pectoralis minor, and serratus anterior.', 'Move the arm during pushing and help stabilize the shoulder blade.'),
  ('muschii-soldului', 'Hip muscles include the gluteal muscles, iliopsoas, tensor fasciae latae, and deep rotators.', 'Move and stabilize the hip and pelvis during standing and walking.'),
  ('muschii-soldului-profunzi', 'Deep hip muscles include the piriformis, obturators, gemelli, and quadratus femoris.', 'Rotate the thigh outward and stabilize the hip joint.'),
  ('muschii-spatelui', 'Back muscles are arranged in superficial and deep layers around the spine and shoulder blades.', 'Maintain posture and move the trunk, neck, shoulders, and arms.'),
  ('muschii-spatelui-profunzi', 'Deep back muscles include the erector spinae, multifidus, and other segmental stabilizers.', 'Extend and stabilize the vertebral column and maintain upright posture.'),
  ('muschii-spatelui-superficiali', 'Superficial back muscles include the trapezius, latissimus dorsi, rhomboids, and levator scapulae.', 'Move and stabilize the shoulder blade and arm during pulling and overhead movement.'),
  ('muschii-tibiali-peronieri', 'The tibial muscles lie mainly at the front and back of the lower leg, while the fibular muscles lie laterally.', 'Control dorsiflexion, inversion, eversion, and ankle stability.'),
  ('muschii-toracelui', 'Thoracic muscles include chest-wall, shoulder-related, intercostal, and breathing muscles.', 'Contribute to arm movement, shoulder stability, and breathing.'),
  ('muschii-umarului', 'Shoulder muscles include the deltoid and the deep rotator-cuff muscles.', 'Move the arm through a wide range while stabilizing the shoulder joint.')
) as v(slug, description_en, function_en)
where a.slug = v.slug;

update public.muscles m
set location_en = v.location_en
from (values
  ('coapsă medială', 'medial thigh'),
  ('posterior cot', 'back of the elbow'),
  ('braț anterior', 'front of the upper arm'),
  ('coapsă posterioară laterală', 'outer back of the thigh'),
  ('braț anterior profund', 'deep front of the upper arm'),
  ('antebraț lateral', 'outer forearm'),
  ('braț medial superior', 'inner upper arm'),
  ('umăr anterior', 'front of the shoulder'),
  ('umăr lateral', 'side of the shoulder'),
  ('umăr posterior', 'back of the shoulder'),
  ('torace lateral', 'side of the chest'),
  ('spate lateral', 'side of the back'),
  ('abdomen anterior', 'front of the abdomen'),
  ('coapsă anterioară', 'front of the thigh'),
  ('de-a lungul coloanei', 'along the spine'),
  ('antebraț posterior', 'back of the forearm'),
  ('fesă superficială', 'superficial buttock'),
  ('șold lateral profund', 'deep side of the hip'),
  ('șold lateral', 'side of the hip'),
  ('antebraț anterior', 'front of the forearm'),
  ('gambă posterioară superficială', 'superficial back of the lower leg'),
  ('coapsă medială superficială', 'superficial medial thigh'),
  ('anterior șold profund', 'deep front of the hip'),
  ('posterior scapular', 'back of the shoulder blade'),
  ('între coaste', 'between the ribs'),
  ('lateral mandibular', 'side of the jaw'),
  ('coloană profundă', 'deep along the spine'),
  ('abdomen lateral superficial', 'superficial side of the abdomen'),
  ('abdomen lateral profund', 'deep side of the abdomen'),
  ('coapsă superioară medială', 'upper inner thigh'),
  ('torace anterior', 'front of the chest'),
  ('sub pectoralul mare', 'beneath the pectoralis major'),
  ('gambă laterală', 'outer lower leg'),
  ('fesă profundă', 'deep buttock'),
  ('posterior genunchi', 'back of the knee'),
  ('antebraț anterior proximal', 'upper front of the forearm'),
  ('ceafă laterală', 'side of the back of the neck'),
  ('spate superior medial', 'upper middle back'),
  ('umăr posterior inferior', 'lower back of the shoulder'),
  ('posterior lateral scapular', 'outer back of the shoulder blade'),
  ('coapsă anterioară oblică', 'diagonally across the front of the thigh'),
  ('lateral cervical', 'side of the neck'),
  ('coapsă posterioară medială profundă', 'deep inner back of the thigh'),
  ('coapsă posterioară medială', 'inner back of the thigh'),
  ('gambă posterioară profundă', 'deep back of the lower leg'),
  ('ceafă', 'back of the neck'),
  ('fața antero-laterală a gâtului', 'front and side of the neck'),
  ('fața anterioară a scapulei', 'front surface of the shoulder blade'),
  ('antebraț posterior proximal', 'upper back of the forearm'),
  ('posterior superior scapular', 'upper back of the shoulder blade'),
  ('regiunea tâmplei', 'temple region'),
  ('șold antero-lateral', 'front and side of the hip'),
  ('gambă anterioară', 'front of the lower leg'),
  ('abdomen profund', 'deep abdomen'),
  ('spate superior și ceafă', 'upper back and back of the neck'),
  ('braț posterior', 'back of the upper arm'),
  ('coapsă anterioară profundă', 'deep front of the thigh'),
  ('coapsă antero-laterală', 'outer front of the thigh'),
  ('coapsă antero-medială', 'inner front of the thigh')
) as v(location_ro, location_en)
where m.location = v.location_ro;

update public.muscles m
set primary_actions_en = (
  select coalesce(array_agg(
    case action_ro
      when 'adducția șoldului' then 'hip adduction'
      when 'extensia cotului' then 'elbow extension'
      when 'flexia cotului' then 'elbow flexion'
      when 'supinație' then 'forearm supination'
      when 'flexia genunchiului' then 'knee flexion'
      when 'extensia șoldului' then 'hip extension'
      when 'flexia umărului' then 'shoulder flexion'
      when 'adducția brațului' then 'arm adduction'
      when 'împingere verticală' then 'vertical pushing'
      when 'abducția umărului' then 'shoulder abduction'
      when 'extensia umărului' then 'shoulder extension'
      when 'tracțiune orizontală' then 'horizontal pulling'
      when 'protracția scapulei' then 'shoulder-blade protraction'
      when 'stabilizare scapulară' then 'shoulder-blade stabilization'
      when 'extensia brațului' then 'arm extension'
      when 'tracțiune' then 'pulling'
      when 'flexia trunchiului' then 'trunk flexion'
      when 'stabilizare core' then 'core stabilization'
      when 'extensia genunchiului' then 'knee extension'
      when 'flexia șoldului' then 'hip flexion'
      when 'extensia coloanei' then 'spinal extension'
      when 'stabilizare posturală' then 'postural stabilization'
      when 'extensia pumnului' then 'wrist extension'
      when 'extensia degetelor' then 'finger extension'
      when 'stabilizare bazin' then 'pelvic stabilization'
      when 'abducția șoldului' then 'hip abduction'
      when 'stabilizare șold' then 'hip stabilization'
      when 'flexia pumnului' then 'wrist flexion'
      when 'priză' then 'grip'
      when 'flexie plantară' then 'plantar flexion'
      when 'rotația externă a umărului' then 'external shoulder rotation'
      when 'stabilizare umăr' then 'shoulder stabilization'
      when 'respirație' then 'breathing'
      when 'stabilizare toracică' then 'thoracic stabilization'
      when 'ridicarea mandibulei' then 'jaw elevation'
      when 'stabilizare spinală' then 'spinal stabilization'
      when 'rotația trunchiului' then 'trunk rotation'
      when 'flexia laterală' then 'lateral flexion'
      when 'rotația internă a umărului' then 'internal shoulder rotation'
      when 'împingere' then 'pushing'
      when 'stabilizarea scapulei' then 'shoulder-blade stabilization'
      when 'eversie picior' then 'foot eversion'
      when 'stabilizare gleznă' then 'ankle stabilization'
      when 'rotația externă a șoldului' then 'external hip rotation'
      when 'rotație tibială' then 'tibial rotation'
      when 'pronație' then 'forearm pronation'
      when 'ridicarea scapulei' then 'shoulder-blade elevation'
      when 'retracția scapulei' then 'shoulder-blade retraction'
      when 'flexia gâtului' then 'neck flexion'
      when 'stabilizare cervicală' then 'cervical stabilization'
      when 'extensia capului' then 'head extension'
      when 'rotația capului' then 'head rotation'
      when 'dorsiflexie' then 'dorsiflexion'
      when 'inversie picior' then 'foot inversion'
      when 'stabilizare arcadă' then 'foot-arch stabilization'
      else action_ro
    end
    order by ordinal
  ), '{}')
  from unnest(m.primary_actions) with ordinality as actions(action_ro, ordinal)
);

update public.muscles
set description_en =
  scientific_name_en ||
  case when is_group_label then ' are located in the ' else ' is located in the ' end ||
  location_en ||
  case
    when cardinality(primary_actions_en) > 0
      then '. Primary actions: ' || array_to_string(primary_actions_en, ', ') || '.'
    else '.'
  end,
  updated_at = now();

update public.muscle_groups g
set description_en = v.description_en,
    updated_at = now()
from (values
  ('adductori', 'Inner-thigh muscle group involved in hip adduction.'),
  ('coafa-rotatorilor', 'Group of deep muscles that stabilize and rotate the shoulder.'),
  ('cvadriceps', 'Front-thigh muscle group responsible mainly for knee extension.'),
  ('ischiogambieri', 'Back-thigh muscle group involved in knee flexion and hip extension.'),
  ('muschii-abdominali', 'Muscles involved in trunk flexion, rotation, breathing, and core stability.'),
  ('muschii-antebratului', 'Muscles involved in grip, wrist movement, and finger movement.'),
  ('muschii-bratului-anteriori', 'Upper-arm muscles involved in elbow flexion and forearm supination.'),
  ('muschii-bratului-posteriori', 'Upper-arm muscles involved in elbow extension.'),
  ('muschii-fesieri', 'Muscles involved in hip extension, hip abduction, and pelvic stability.'),
  ('muschii-gambei', 'Muscles involved in push-off, walking, running, and ankle stability.'),
  ('muschii-gatului', 'Muscles involved in head movement and cervical stability.'),
  ('muschii-masticatori', 'Muscles that move the jaw during chewing.'),
  ('muschii-pieptului', 'Muscles involved in pushing, arm adduction, and shoulder-blade control.'),
  ('muschii-soldului-profunzi', 'Deep muscles involved in hip rotation and stabilization.'),
  ('muschii-spatelui-profunzi', 'Deep muscles involved in spinal extension and stabilization.'),
  ('muschii-spatelui-superficiali', 'Superficial muscles involved in pulling, posture, and shoulder-blade control.'),
  ('muschii-tibiali-peronieri', 'Lower-leg muscles involved in ankle and foot control.'),
  ('muschii-umarului', 'Muscles involved in lifting, rotating, and stabilizing the shoulder.')
) as v(slug, description_en)
where g.slug = v.slug;

update public.movement_patterns p
set description_en = v.description_en,
    updated_at = now()
from (values
  ('abductie-sold', 'Moving the thigh away from the body midline.'),
  ('adductie-sold', 'Moving the thigh toward the body midline.'),
  ('dorsiflexie', 'Lifting the front of the foot toward the shin.'),
  ('extensie-cot', 'Straightening the elbow.'),
  ('extensie-genunchi', 'Straightening the knee.'),
  ('extensie-sold', 'Moving the thigh backward.'),
  ('flexie-cot', 'Bending the elbow.'),
  ('flexie-genunchi', 'Bending the knee.'),
  ('flexie-plantara', 'Pointing the foot downward or lifting the heel to push against the ground.'),
  ('flexie-sold', 'Lifting the thigh toward the trunk.'),
  ('flexie-trunchi', 'Bringing the chest toward the pelvis.'),
  ('impingere-orizontala', 'Pushing movements performed in front of the body.'),
  ('impingere-verticala', 'Pushing movements performed overhead.'),
  ('priza', 'Holding and controlling objects with the hand.'),
  ('rotatie-trunchi', 'Rotating the trunk.'),
  ('stabilizare-core', 'Maintaining control of the trunk and pelvis.'),
  ('tractiune-orizontala', 'Pulling movements directed toward the trunk.'),
  ('tractiune-verticala', 'Vertical pulling movements.')
) as v(slug, description_en)
where p.slug = v.slug;

update public.pain_classifications
set
  name_en = case level
    when 'usor' then 'Mild'
    when 'mediu' then 'Moderate'
    when 'consultare_doctor' then 'Medical evaluation recommended'
  end,
  description_en = case level
    when 'usor' then 'Minor discomfort, usually after exertion, without major restriction of movement.'
    when 'mediu' then 'Persistent or clearly noticeable pain with partial restriction of movement, during or after activity.'
    when 'consultare_doctor' then 'Severe or sudden pain, marked swelling or bruising, numbness, tingling, weakness, inability to use the area normally, pain after injury, or worsening pain.'
  end,
  recommendations_en = case level
    when 'usor' then array['relative rest', 'hydration', 'adequate sleep', 'gentle pain-free movement', 'reduced activity intensity']
    when 'mediu' then array['pause the provoking activity', 'reduce load', 'gentle active recovery', 'monitor symptoms', 'seek medical advice if symptoms persist or worsen']
    when 'consultare_doctor' then array['stop training', 'avoid loading the affected area', 'seek medical evaluation']
  end,
  updated_at = now();

update public.triage_questions
set question_en = case slug
  when 'intensitate-durere' then 'How intense is the pain?'
  when 'debut-durere' then 'How did the pain start?'
  when 'functie-zona' then 'Can you use the affected area?'
  when 'semne-asociate' then 'Are there any visible signs or other symptoms?'
  when 'durata-durere' then 'How long has it been present?'
end;

update public.triage_options o
set
  option_key = v.option_key,
  label_en = v.label_en,
  finding_en = v.finding_en
from public.triage_questions q
cross join (values
  ('intensitate-durere', 1, 'mild-manageable', 'Mild and manageable', 'mild pain'),
  ('intensitate-durere', 2, 'moderate-limits-movement', 'Moderate and affects movement', 'moderate pain'),
  ('intensitate-durere', 3, 'severe-unbearable', 'Severe or unbearable', 'severe pain'),
  ('debut-durere', 1, 'gradual-after-exertion', 'Gradually, after exertion', 'gradual onset after exertion'),
  ('debut-durere', 2, 'sudden-during-movement', 'Suddenly, during a movement', 'sudden onset'),
  ('debut-durere', 3, 'after-impact-fall-pop', 'After an impact, fall, or popping sound', 'trauma or popping sound'),
  ('functie-zona', 1, 'function-near-normal', 'Yes, almost normally', 'function mostly preserved'),
  ('functie-zona', 2, 'function-limited', 'Yes, but with limitations', 'limited function'),
  ('functie-zona', 3, 'function-impossible', 'No, I cannot use the area', 'loss of function'),
  ('semne-asociate', 1, 'no-visible-signs', 'No, only discomfort', 'no visible signs'),
  ('semne-asociate', 2, 'mild-swelling-tenderness', 'Mild swelling or tenderness', 'swelling or tenderness'),
  ('semne-asociate', 3, 'warning-signs', 'Large bruise, deformity, fever, numbness, or weakness', 'warning signs'),
  ('durata-durere', 1, 'under-48-hours', 'Less than 24 to 48 hours', 'short duration'),
  ('durata-durere', 2, 'several-days-persistent', 'Several days without improvement', 'persistent for several days'),
  ('durata-durere', 3, 'worsening-or-recurring', 'It is worsening or frequently returns', 'worsening or recurrent symptoms')
) as v(question_slug, sort_order, option_key, label_en, finding_en)
where o.question_id = q.id
  and v.question_slug = q.slug
  and v.sort_order = o.sort_order;

update public.triage_rules
set
  name_en = case slug
    when 'contradictie-usor-nu-pot-folosi' then 'Contradiction: mild pain but loss of function'
    when 'red-flags-consult' then 'Warning signs'
  end,
  explanation_en = case slug
    when 'contradictie-usor-nu-pot-folosi' then 'If the user describes the pain as mild but cannot use the affected area, the application must ask for clarification before providing a triage result.'
    when 'red-flags-consult' then 'Warning signs such as trauma, numbness, weakness, deformity, or loss of function raise the triage result to medical evaluation.'
  end;

update public.triage_rules
set rule = jsonb_build_object(
  'action', 'clarify',
  'if', jsonb_build_array(
    jsonb_build_object('question', 'intensitate-durere', 'option_key', 'mild-manageable'),
    jsonb_build_object('question', 'functie-zona', 'option_key', 'function-impossible')
  )
)
where slug = 'contradictie-usor-nu-pot-folosi';

update public.muscle_pain_profiles p
set
  title_en = v.title_en,
  common_symptoms_en = v.common_symptoms_en,
  common_causes_en = v.common_causes_en,
  general_treatment_en = v.general_treatment_en,
  prevention_en = v.prevention_en,
  stop_training_when_en = v.stop_training_when_en,
  see_doctor_when_en = v.see_doctor_when_en,
  educational_note_en = 'Fitness-oriented educational information. This is not a medical diagnosis and does not replace evaluation by a qualified healthcare professional.',
  updated_at = now()
from (values
  (
    'durere-adductori',
    'Common pain involving the adductors',
    array['pain on the inner thigh', 'discomfort during changes of direction', 'tightness when moving the legs apart'],
    array['intense side-to-side movement', 'insufficient warm-up', 'overuse in sports with frequent changes of direction'],
    array['pause painful side-to-side movements', 'use gentle pain-free mobility', 'return gradually to activity'],
    array['warm up progressively', 'build adductor strength', 'increase side-to-side training volume gradually'],
    array['the pain is sharp', 'bruising appears', 'walking becomes limited'],
    array['severe pain follows a sudden movement', 'swelling or bruising develops', 'pain persists or worsens']
  ),
  (
    'durere-coafa-rotatorilor',
    'Common pain involving the rotator cuff',
    array['deep shoulder pain', 'pain during shoulder rotation', 'weakness when lifting the arm'],
    array['repetitive overuse', 'poor technique during pushing or throwing', 'insufficient shoulder stabilization'],
    array['pause provoking movements', 'use gentle pain-free exercises', 'return gradually to activity'],
    array['use a shoulder-specific warm-up', 'train shoulder-blade control', 'avoid sudden increases in load'],
    array['sudden weakness appears', 'pain prevents lifting the arm', 'pain follows trauma'],
    array['there is loss of function', 'pain persists or worsens', 'there was a popping sound or injury']
  ),
  (
    'durere-cvadriceps',
    'Common pain involving the quadriceps',
    array['pain at the front of the thigh', 'tenderness during squats', 'pain while using stairs'],
    array['high squat volume', 'intense running', 'overuse during knee extension'],
    array['reduce painful exercises', 'use gentle active recovery', 'return gradually to activity'],
    array['warm up progressively', 'increase training volume gradually', 'use stable squat technique'],
    array['pain starts suddenly', 'bruising appears', 'you cannot bear weight normally'],
    array['there is deformity or marked swelling', 'pain follows trauma', 'you cannot use the leg normally']
  ),
  (
    'durere-ischiogambieri',
    'Common pain involving the hamstrings',
    array['pain at the back of the thigh', 'tightness when bending forward', 'pain during sprinting or deadlift-type movements'],
    array['sprinting without adequate warm-up', 'heavy hip-hinge loading', 'insufficient flexibility or movement control'],
    array['stop painful sprinting', 'reduce load', 'return progressively to activity'],
    array['use a specific warm-up', 'progress sprinting gradually', 'build eccentric strength gradually'],
    array['a popping sensation occurs', 'bruising appears', 'walking is affected'],
    array['sudden severe pain occurs', 'bruising or swelling develops', 'you cannot continue the activity']
  ),
  (
    'durere-muschii-abdominali',
    'Common pain involving the abdominal muscles',
    array['pain when bending the trunk', 'local tenderness after core exercises', 'tightness during rotation'],
    array['high-volume abdominal exercises', 'intense trunk rotation', 'insufficient trunk stabilization during lifting'],
    array['pause painful movements', 'use controlled breathing', 'return with gentle core exercises'],
    array['progress gradually', 'use controlled technique', 'balance trunk flexion with stabilization work'],
    array['the pain is sharp', 'unusual swelling or tenderness appears', 'pain increases with coughing or exertion'],
    array['abdominal pain is severe', 'fever or other general symptoms occur', 'pain does not seem muscular or is worsening']
  ),
  (
    'durere-muschii-antebratului',
    'Common pain involving the forearm',
    array['pain during gripping', 'forearm tightness', 'discomfort during wrist flexion or extension'],
    array['excessive gripping', 'repetitive movement', 'high volume of pulling exercises or typing'],
    array['use relative rest', 'reduce gripping load', 'use gentle mobility'],
    array['alternate grip types', 'take active breaks', 'increase volume gradually'],
    array['numbness appears', 'pain spreads toward the hand', 'grip strength clearly decreases'],
    array['tingling persists', 'weakness or loss of sensation develops', 'pain worsens']
  ),
  (
    'durere-muschii-bratului-anteriori',
    'Common pain involving the biceps and front upper-arm muscles',
    array['tightness at the front of the upper arm', 'pain during elbow flexion', 'tenderness after pulling or curl exercises'],
    array['high curl volume', 'excessive grip demand', 'insufficient recovery'],
    array['reduce training volume', 'pause painful movements', 'return gradually to activity'],
    array['warm up progressively', 'control the movement', 'alternate grip types'],
    array['pain is sharp', 'a popping sensation occurs', 'strength drops suddenly'],
    array['bruising or deformity develops', 'you cannot flex the elbow normally', 'pain follows an injury']
  ),
  (
    'durere-muschii-bratului-posteriori',
    'Common pain involving the triceps',
    array['pain at the back of the upper arm', 'tenderness during elbow extension', 'fatigue after pushing exercises'],
    array['high pushing volume', 'overly heavy triceps extensions', 'incomplete warm-up'],
    array['reduce painful exercises', 'use a lighter load', 'return gradually to activity'],
    array['use stable technique', 'progress load slowly', 'allow adequate recovery'],
    array['pain starts suddenly', 'weakness appears', 'the elbow cannot be extended normally'],
    array['severe pain follows trauma', 'marked swelling develops', 'function is lost']
  ),
  (
    'durere-muschii-fesieri',
    'Common pain involving the gluteal muscles',
    array['local pain after squats or running', 'tightness at the side of the hip', 'fatigue while climbing stairs'],
    array['high hip-training volume', 'poor squat technique', 'insufficient muscle activation or control'],
    array['reduce load', 'walk gently if comfortable', 'return gradually to activity'],
    array['warm up the hips', 'progress gradually', 'control knee and pelvic alignment'],
    array['pain travels down the leg', 'numbness appears', 'you cannot walk normally'],
    array['neurological symptoms occur', 'pain is severe', 'pain follows a fall']
  ),
  (
    'durere-muschii-gambei',
    'Common pain involving the calf',
    array['calf cramps', 'pain while running', 'tightness when rising onto the toes'],
    array['high running or jumping volume', 'insufficient hydration', 'a sudden increase in training volume'],
    array['reduce running or jumping', 'walk gently if it is comfortable', 'return gradually to activity'],
    array['progress running slowly', 'warm up and cool down', 'allow adequate recovery'],
    array['pain starts suddenly', 'marked swelling appears', 'you cannot step normally'],
    array['severe pain follows a popping sensation', 'marked swelling or redness develops', 'walking becomes difficult or unusual symptoms appear']
  ),
  (
    'durere-muschii-pieptului',
    'Common pain involving the chest muscles',
    array['front chest discomfort during pushing', 'tightness when extending the arm', 'local tenderness after chest exercises'],
    array['pushing overuse', 'insufficient warm-up', 'load increased too quickly'],
    array['pause painful exercises', 'reduce volume and intensity', 'use gentle pain-free mobility'],
    array['warm up progressively', 'use stable pushing technique', 'balance pushing and pulling exercises'],
    array['pain becomes sharp', 'pain with breathing or chest pressure appears', 'strength drops suddenly'],
    array['chest pain is severe or unusual', 'breathing becomes difficult', 'pain follows trauma or worsens']
  ),
  (
    'durere-muschii-spatelui-profunzi',
    'Common pain involving the deep back muscles',
    array['lower- or mid-back stiffness', 'pain during extension or lifting', 'postural fatigue'],
    array['overuse during lifting', 'poor trunk control', 'remaining in one position for a long time'],
    array['reduce load', 'use gentle walking and mobility', 'use gentle trunk-control exercises'],
    array['progress lifting gradually', 'use controlled hip-hinge technique', 'take posture breaks'],
    array['pain is sudden and severe', 'pain travels down the leg', 'numbness or weakness appears'],
    array['strength is lost', 'pain worsens', 'neurological symptoms or trauma are present']
  ),
  (
    'durere-muschii-spatelui-superficiali',
    'Common pain involving the superficial back muscles',
    array['tightness between the shoulder blades', 'pain during pulling or rowing', 'neck or shoulder-blade stiffness'],
    array['prolonged posture', 'poor pulling technique', 'trapezius overuse'],
    array['reduce pulling exercises', 'use gentle thoracic mobility', 'return gradually to load'],
    array['train shoulder-blade control', 'take active breaks', 'balance mobility and strength'],
    array['pain travels down the arm', 'numbness or weakness appears', 'you cannot control the shoulder blade'],
    array['pain is severe', 'neurological symptoms occur', 'pain follows an injury']
  ),
  (
    'durere-muschii-tibiali-peronieri',
    'Common pain involving the tibial and fibular muscles',
    array['pain at the front or side of the lower leg', 'discomfort while running', 'tightness when lifting the front of the foot'],
    array['running on hard surfaces', 'unsuitable footwear', 'distance increased too quickly'],
    array['reduce running volume', 'use gentle active recovery', 'return gradually to activity'],
    array['progress slowly', 'alternate running surfaces', 'use an adequate warm-up and controlled running technique'],
    array['pain increases quickly', 'numbness appears', 'walking becomes difficult'],
    array['pain is severe or persistent', 'numbness or weakness develops', 'pain does not improve with relative rest']
  ),
  (
    'durere-muschii-umarului',
    'Common pain involving the shoulder muscles',
    array['pain when lifting the arm', 'deltoid tightness', 'discomfort during overhead pushing'],
    array['high pushing volume', 'insufficient mobility', 'poor shoulder-blade control'],
    array['reduce overhead movements', 'use a gentle warm-up', 'use pain-free control exercises'],
    array['progress slowly', 'balance front and back shoulder training', 'use stable technique'],
    array['you cannot lift the arm', 'pain starts suddenly', 'clear weakness appears'],
    array['pain follows a fall', 'there is deformity', 'numbness or loss of strength appears']
  )
) as v(
  slug,
  title_en,
  common_symptoms_en,
  common_causes_en,
  general_treatment_en,
  prevention_en,
  stop_training_when_en,
  see_doctor_when_en
)
where p.slug = v.slug;

update public.muscle_movement_patterns
set role = case role
  when 'principal' then 'primary'
  when 'secundar' then 'secondary'
  when 'sinergic' then 'synergist'
  when 'stabilizator' then 'stabilizer'
  else role
end;

alter table public.muscle_movement_patterns
  drop constraint if exists muscle_movement_patterns_role_check,
  add constraint muscle_movement_patterns_role_check
    check (role in ('primary', 'secondary', 'synergist', 'stabilizer'));

alter table public.triage_options
  drop constraint if exists triage_options_question_option_key_key;

alter table public.triage_options
  add constraint triage_options_question_option_key_key unique (question_id, option_key);

do $$
begin
  if exists (
    select 1
    from public.anatomy_structures
    where nullif(btrim(description_en), '') is null
       or nullif(btrim(function_en), '') is null
  ) then
    raise exception 'anatomy_structures contains incomplete English descriptions or functions';
  end if;

  if exists (
    select 1
    from public.muscles
    where nullif(btrim(description_ro), '') is null
       or nullif(btrim(description_en), '') is null
       or nullif(btrim(location_ro), '') is null
       or nullif(btrim(location_en), '') is null
       or cardinality(primary_actions_ro) = 0
       or cardinality(primary_actions_en) = 0
  ) then
    raise exception 'muscles contains incomplete bilingual content';
  end if;

  if exists (
    select 1
    from public.muscle_groups
    where nullif(btrim(description_ro), '') is null
       or nullif(btrim(description_en), '') is null
  ) then
    raise exception 'muscle_groups contains incomplete bilingual descriptions';
  end if;

  if exists (
    select 1
    from public.movement_patterns
    where nullif(btrim(name_ro), '') is null
       or nullif(btrim(name_en), '') is null
       or nullif(btrim(description_ro), '') is null
       or nullif(btrim(description_en), '') is null
  ) then
    raise exception 'movement_patterns contains incomplete bilingual content';
  end if;

  if exists (
    select 1
    from public.pain_classifications
    where nullif(btrim(name_ro), '') is null
       or nullif(btrim(name_en), '') is null
       or nullif(btrim(description_ro), '') is null
       or nullif(btrim(description_en), '') is null
       or cardinality(recommendations_ro) = 0
       or cardinality(recommendations_en) = 0
  ) then
    raise exception 'pain_classifications contains incomplete bilingual content';
  end if;

  if exists (
    select 1
    from public.muscle_pain_profiles
    where nullif(btrim(title_ro), '') is null
       or nullif(btrim(title_en), '') is null
       or cardinality(common_symptoms_ro) = 0
       or cardinality(common_symptoms_en) = 0
       or cardinality(common_causes_ro) = 0
       or cardinality(common_causes_en) = 0
       or cardinality(general_treatment_ro) = 0
       or cardinality(general_treatment_en) = 0
       or cardinality(prevention_ro) = 0
       or cardinality(prevention_en) = 0
       or cardinality(stop_training_when_ro) = 0
       or cardinality(stop_training_when_en) = 0
       or cardinality(see_doctor_when_ro) = 0
       or cardinality(see_doctor_when_en) = 0
       or nullif(btrim(educational_note_ro), '') is null
       or nullif(btrim(educational_note_en), '') is null
  ) then
    raise exception 'muscle_pain_profiles contains incomplete bilingual content';
  end if;

  if exists (
    select 1
    from public.triage_questions
    where nullif(btrim(question_en), '') is null
  ) or exists (
    select 1
    from public.triage_options
    where nullif(btrim(option_key), '') is null
       or nullif(btrim(label_en), '') is null
       or nullif(btrim(finding_en), '') is null
  ) or exists (
    select 1
    from public.triage_rules
    where nullif(btrim(name_en), '') is null
       or nullif(btrim(explanation_en), '') is null
  ) then
    raise exception 'triage tables contain incomplete English content';
  end if;
end
$$;

alter table public.anatomy_structures
  alter column description_en set not null,
  alter column function_en set not null;

alter table public.muscles
  alter column description_ro set not null,
  alter column description_en set not null,
  alter column location_ro set not null,
  alter column location_en set not null,
  alter column primary_actions_ro set not null,
  alter column primary_actions_en set not null;

alter table public.muscle_groups
  alter column description_ro set not null,
  alter column description_en set not null;

alter table public.movement_patterns
  alter column name_ro set not null,
  alter column name_en set not null,
  alter column description_ro set not null,
  alter column description_en set not null;

alter table public.pain_classifications
  alter column name_ro set not null,
  alter column name_en set not null,
  alter column description_ro set not null,
  alter column description_en set not null,
  alter column recommendations_ro set not null,
  alter column recommendations_en set not null;

alter table public.muscle_pain_profiles
  alter column title_ro set not null,
  alter column title_en set not null,
  alter column common_symptoms_ro set not null,
  alter column common_symptoms_en set not null,
  alter column common_causes_ro set not null,
  alter column common_causes_en set not null,
  alter column general_treatment_ro set not null,
  alter column general_treatment_en set not null,
  alter column prevention_ro set not null,
  alter column prevention_en set not null,
  alter column stop_training_when_ro set not null,
  alter column stop_training_when_en set not null,
  alter column see_doctor_when_ro set not null,
  alter column see_doctor_when_en set not null,
  alter column educational_note_ro set not null,
  alter column educational_note_en set not null;

alter table public.triage_questions
  alter column question_en set not null;

alter table public.triage_options
  alter column option_key set not null,
  alter column label_en set not null,
  alter column finding_en set not null;

alter table public.triage_rules
  alter column name_en set not null,
  alter column explanation_en set not null;

create index if not exists triage_options_option_key_idx
  on public.triage_options (option_key);

commit;
