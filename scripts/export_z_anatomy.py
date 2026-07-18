import json
import re
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public" / "anatomy"
OUT_GLB = OUT_DIR / "z-anatomy-musculoskeletal.glb"
OUT_MANIFEST = OUT_DIR / "z-anatomy-structures.json"

SYSTEM_COLLECTIONS = {
    "1: Skeletal system": "os",
    "4: Muscular system": "muschi",
}

CONNECTIVE_TISSUE_TERMS = (
    "aponeurosis",
    "bursa",
    "fascia",
    "ligament",
    "retinaculum",
    "septum",
    "sheath",
    "tendon",
    "tract",
)

PHRASE_RO = {
    "abdominal part of muscular system": "Partea abdominala a sistemului muscular",
    "abdominal part of pectoralis major muscle": "Partea abdominala a muschiului pectoral mare",
    "abductor digiti minimi of foot": "Muschiul abductor al degetului mic al piciorului",
    "abductor digiti minimi of hand": "Muschiul abductor al degetului mic al mainii",
    "abductor hallucis": "Muschiul abductor al halucelui",
    "abductor pollicis brevis": "Muschiul abductor scurt al policelui",
    "abductor pollicis longus": "Muschiul abductor lung al policelui",
    "acromial part of deltoid muscle": "Partea acromiala a muschiului deltoid",
    "anterior abdominal muscle": "Muschi abdominal anterior",
    "anterior belly of digastric muscle": "Pantecele anterior al muschiului digastric",
    "anterior intermuscular septum of leg": "Sept intermuscular anterior al gambei",
    "anterior layer of thoracolumbar fascia": "Stratul anterior al fasciei toracolombare",
    "ary-epiglottic part of oblique arytenoid muscle": "Partea ariepiglotica a muschiului aritenoid oblic",
    "biceps brachii muscle": "Muschiul biceps brahial",
    "brachialis muscle": "Muschiul brahial",
    "brachioradialis muscle": "Muschiul brahioradial",
    "clavicular head of pectoralis major muscle": "Capul clavicular al muschiului pectoral mare",
    "clavicular part of deltoid muscle": "Partea claviculara a muschiului deltoid",
    "coracobrachialis muscle": "Muschiul coracobrahial",
    "deep head of pronator teres": "Capul profund al muschiului pronator rotund",
    "dorsal interossei muscles of hand": "Muschii interososi dorsali ai mainii",
    "dorsal interossei muscles of foot": "Muschii interososi dorsali ai piciorului",
    "external abdominal oblique muscle": "Muschiul oblic extern abdominal",
    "external anal sphincter": "Sfincterul anal extern",
    "external intercostal muscles": "Muschii intercostali externi",
    "flexor carpi radialis": "Muschiul flexor radial al carpului",
    "flexor carpi ulnaris": "Muschiul flexor ulnar al carpului",
    "flexor digitorum profundus": "Muschiul flexor profund al degetelor",
    "flexor digitorum superficialis": "Muschiul flexor superficial al degetelor",
    "flexor pollicis longus": "Muschiul flexor lung al policelui",
    "gastrocnemius": "Gastrocnemian",
    "gluteus maximus muscle": "Muschiul fesier mare",
    "gluteus medius muscle": "Muschiul fesier mijlociu",
    "gluteus minimus muscle": "Muschiul fesier mic",
    "internal abdominal oblique muscle": "Muschiul oblic intern abdominal",
    "internal intercostal muscles": "Muschii intercostali interni",
    "latissimus dorsi muscle": "Muschiul dorsal mare",
    "lateral head of triceps brachii": "Capul lateral al tricepsului brahial",
    "long head of biceps brachii": "Capul lung al bicepsului brahial",
    "long head of biceps femoris": "Capul lung al bicepsului femural",
    "long head of triceps brachii": "Capul lung al tricepsului brahial",
    "medial head of triceps brachii": "Capul medial al tricepsului brahial",
    "orbicularis oculi": "Muschiul orbicular al ochiului",
    "orbicularis oris muscle": "Muschiul orbicular al gurii",
    "palmar interossei muscles": "Muschii interososi palmari",
    "pectoralis major muscle": "Muschiul pectoral mare",
    "pectoralis minor muscle": "Muschiul pectoral mic",
    "posterior belly of digastric muscle": "Pantecele posterior al muschiului digastric",
    "posterior layer of thoracolumbar fascia": "Stratul posterior al fasciei toracolombare",
    "rectus abdominis muscle": "Muschiul drept abdominal",
    "rectus femoris muscle": "Muschiul drept femural",
    "rhomboid major muscle": "Muschiul romboid mare",
    "rhomboid minor muscle": "Muschiul romboid mic",
    "scapular spinal part of deltoid muscle": "Partea spinala scapulara a muschiului deltoid",
    "serratus anterior muscle": "Muschiul dintat anterior",
    "short head of biceps brachii": "Capul scurt al bicepsului brahial",
    "short head of biceps femoris": "Capul scurt al bicepsului femural",
    "sternocostal head of pectoralis major muscle": "Capul sternocostal al muschiului pectoral mare",
    "sternocleidomastoid muscle": "Muschiul sternocleidomastoidian",
    "superficial head of pronator teres": "Capul superficial al muschiului pronator rotund",
    "temporalis muscle": "Muschiul temporal",
    "triceps brachii": "tricepsul brahial",
    "transversus abdominis muscle": "Muschiul transvers abdominal",
    "vastus intermedius muscle": "Muschiul vast intermediar",
    "vastus lateralis muscle": "Muschiul vast lateral",
    "vastus medialis muscle": "Muschiul vast medial",
}

WORD_RO = {
    "abdominal": "abdominal",
    "abductor": "abductor",
    "adductor": "adductor",
    "anterior": "anterior",
    "aponeurosis": "aponevroza",
    "arch": "arc",
    "biceps": "biceps",
    "bone": "os",
    "brachii": "brahial",
    "brachial": "brahial",
    "brevis": "scurt",
    "bursa": "bursa",
    "calcaneal": "calcanean",
    "carpi": "carpului",
    "cervical": "cervical",
    "clavicular": "clavicular",
    "common": "comun",
    "crural": "crurala",
    "deep": "profund",
    "deltoid": "deltoid",
    "digiti": "degetelor",
    "digitorum": "degetelor",
    "dorsal": "dorsal",
    "extensor": "extensor",
    "external": "extern",
    "fascia": "fascie",
    "femoral": "femural",
    "femoris": "femural",
    "fibular": "fibular",
    "fibularis": "fibular",
    "flexor": "flexor",
    "foot": "piciorului",
    "hallucis": "halucelui",
    "hand": "mainii",
    "head": "cap",
    "humeral": "humeral",
    "inferior": "inferior",
    "inguinal": "inghinal",
    "intercostal": "intercostal",
    "intermedius": "intermediar",
    "internal": "intern",
    "lateral": "lateral",
    "layer": "strat",
    "ligament": "ligament",
    "long": "lung",
    "longus": "lung",
    "major": "mare",
    "medial": "medial",
    "minor": "mic",
    "minimi": "mic",
    "muscle": "muschi",
    "muscles": "muschi",
    "oblique": "oblic",
    "of": "al",
    "palmar": "palmar",
    "part": "parte",
    "pectoral": "pectoral",
    "pectoralis": "pectoral",
    "plantar": "plantar",
    "pollicis": "policelui",
    "posterior": "posterior",
    "profundus": "profund",
    "quadratus": "patrat",
    "radialis": "radial",
    "retinaculum": "retinacul",
    "scapular": "scapular",
    "septum": "sept",
    "sheath": "teaca",
    "short": "scurt",
    "superficial": "superficial",
    "superior": "superior",
    "tendon": "tendon",
    "teres": "rotund",
    "thoracolumbar": "toracolombar",
    "tibialis": "tibial",
    "tract": "tract",
    "transverse": "transvers",
    "triceps": "triceps",
    "ulnar": "ulnar",
    "ulnaris": "ulnar",
    "vastus": "vast",
}

SIDE_RO = {
    "left": "stanga",
    "right": "dreapta",
}


def slugify(value: str) -> str:
    value = value.lower()
    value = re.sub(r"\.[a-z]+$", "", value)
    value = value.replace("&", " and ")
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def display_name(value: str) -> str:
    value = re.sub(r"\.[a-z]+$", "", value)
    value = value.strip("()[] ")
    return re.sub(r"\s+", " ", value)


def romanian_name(value: str, side: str | None = None) -> str:
    clean = display_name(value)
    key = clean.lower()
    translated = PHRASE_RO.get(key)
    if translated is None:
        words = re.findall(r"[A-Za-z0-9]+|[-]", clean)
        translated_words: list[str] = []
        for word in words:
            if word == "-":
                translated_words.append("-")
                continue
            translated_words.append(WORD_RO.get(word.lower(), word))
        translated = " ".join(translated_words)
        translated = translated.replace(" - ", "-")
        translated = translated.replace(" al mainii", " al mainii")
        translated = translated.replace(" al piciorului", " al piciorului")
        if "muschi" in translated.lower() and not translated.lower().startswith(("muschi", "muschii")):
            translated = f"Muschiul {translated.replace('muschi', '').strip()}"
    if side:
        translated = f"{translated} ({SIDE_RO[side]})"
    return translated[:1].upper() + translated[1:]


def side_from_name(value: str) -> str | None:
    if value.endswith((".l", ".ol", ".el")):
        return "left"
    if value.endswith((".r", ".or", ".er")):
        return "right"
    return None


def tissue_from_name(value: str, fallback: str) -> str:
    if fallback != "muschi":
        return fallback
    value = value.lower()
    if any(term in value for term in CONNECTIVE_TISSUE_TERMS):
        return "tendon"
    return fallback


def should_skip_object(value: str) -> bool:
    clean = display_name(value).lower()
    suffix = re.search(r"\.([a-z]+)$", value.lower())
    if value.startswith(("Abduction", "Adduction", "Extension", "Flexion")):
        return True
    if suffix and suffix.group(1) == "g":
        return True
    if "system" in clean:
        return True
    if "region of" in clean or "part of muscular system" in clean:
        return True
    return False


def collect_objects(collection: bpy.types.Collection) -> list[bpy.types.Object]:
    objects: list[bpy.types.Object] = []
    for obj in collection.objects:
        if obj.type == "MESH":
            objects.append(obj)
    for child in collection.children:
        objects.extend(collect_objects(child))
    return objects


def make_material(tissue: str) -> bpy.types.Material:
    material = bpy.data.materials.new(name=f"Anato {tissue}")
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        if tissue == "muschi":
            bsdf.inputs["Base Color"].default_value = (0.82, 0.20, 0.16, 0.78)
            bsdf.inputs["Roughness"].default_value = 0.58
            bsdf.inputs["Alpha"].default_value = 0.78
        else:
            bsdf.inputs["Base Color"].default_value = (0.96, 0.91, 0.78, 0.42)
            bsdf.inputs["Roughness"].default_value = 0.44
            bsdf.inputs["Alpha"].default_value = 0.42
    material.blend_method = "BLEND"
    material.use_screen_refraction = False
    return material


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    bpy.ops.object.select_all(action="DESELECT")
    materials = {
        tissue: make_material(tissue)
        for tissue in set(SYSTEM_COLLECTIONS.values()) | {"tendon"}
    }
    manifest: list[dict[str, str | None]] = []
    selected_objects: list[bpy.types.Object] = []

    for collection_name, collection_tissue in SYSTEM_COLLECTIONS.items():
        collection = bpy.data.collections.get(collection_name)
        if collection is None:
            raise RuntimeError(f"Missing collection: {collection_name}")

        for obj in collect_objects(collection):
            if should_skip_object(obj.name):
                continue
            tissue = tissue_from_name(obj.name, collection_tissue)
            obj.hide_set(False)
            obj.hide_viewport = False
            obj.hide_render = False
            obj.select_set(True)
            selected_objects.append(obj)

            obj.data.materials.clear()
            obj.data.materials.append(materials[tissue])

            clean_name = display_name(obj.name)
            side = side_from_name(obj.name)
            clean_name_ro = romanian_name(obj.name, side)
            structure_id = f"{tissue}-{slugify(obj.name)}"
            if side:
                structure_id = f"{structure_id}-{side}"
            obj["structureId"] = structure_id
            obj["structureName"] = clean_name_ro
            obj["structureNameEn"] = clean_name
            obj["tissue"] = tissue
            obj["side"] = side or ""

            manifest.append(
                {
                    "id": structure_id,
                    "meshName": obj.name,
                    "label": clean_name_ro,
                    "labelEn": clean_name,
                    "tissue": tissue,
                    "side": side,
                }
            )

    if not selected_objects:
        raise RuntimeError("No objects selected for export.")

    bpy.ops.export_scene.gltf(
        filepath=str(OUT_GLB),
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=True,
        export_extras=True,
        export_materials="EXPORT",
    )

    OUT_MANIFEST.write_text(
        json.dumps(sorted(manifest, key=lambda item: item["label"]), indent=2),
        encoding="utf-8",
    )
    print(f"Exported {len(selected_objects)} meshes to {OUT_GLB}")
    print(f"Wrote {len(manifest)} structure records to {OUT_MANIFEST}")


if __name__ == "__main__":
    main()
