#!/usr/bin/env python3
"""นำเข้าชุดภาพไพ่ใหม่ แปลงเป็น WebP ขนาดมาตรฐาน แล้วสลับเว็บไปใช้ชุดนั้น

ใช้:  python3 -I tools/import_deck.py <ไฟล์.zip หรือโฟลเดอร์ภาพ> [ชื่อชุด]
ชื่อไฟล์ที่รับได้: major-00.png ... major-21.png และ back.png
(รับ .png .jpg .jpeg .webp และชื่อแบบ 00.png, 0.png, major-0.png ก็ได้)
"""
import json
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
W, H = 600, 900          # ขนาดภาพที่ใช้บนเว็บ (2:3)
QUALITY = 82
EXTS = {".png", ".jpg", ".jpeg", ".webp"}
NEEDED = ["back"] + [f"major-{i:02d}" for i in range(22)]


def key_for(name: str):
    stem = Path(name).stem.lower().strip()
    if re.fullmatch(r"(card[-_ ]?)?back", stem):
        return "back"
    m = re.fullmatch(r"(?:major[-_ ]?)?(\d{1,2})", stem)
    if m and int(m.group(1)) <= 21:
        return f"major-{int(m.group(1)):02d}"
    return None


def collect(src: Path, work: Path):
    """คืน dict key -> path ของภาพ (แตก zip อย่างปลอดภัยถ้าจำเป็น)"""
    files = []
    if src.is_dir():
        files = [p for p in src.rglob("*") if p.is_file()]
    elif zipfile.is_zipfile(src):
        with zipfile.ZipFile(src) as z:
            for info in z.infolist():
                n = Path(info.filename)
                if info.is_dir() or n.suffix.lower() not in EXTS or n.name.startswith("."):
                    continue
                if "__MACOSX" in n.parts:
                    continue
                out = work / f"{len(files):03d}{n.suffix.lower()}"
                with z.open(info) as fi, open(out, "wb") as fo:
                    shutil.copyfileobj(fi, fo)
                files.append((n.name, out))
            files = [(name, p) for name, p in files]
    else:
        sys.exit(f"ไม่พบโฟลเดอร์หรือไฟล์ zip: {src}")
    found, unknown = {}, []
    for item in files:
        name, path = item if isinstance(item, tuple) else (item.name, item)
        if Path(name).suffix.lower() not in EXTS:
            continue
        k = key_for(name)
        if k is None:
            unknown.append(name)
        elif k in found:
            print(f"  ! ชื่อซ้ำ {name} (ใช้ไฟล์แรก)")
        else:
            found[k] = path
    return found, unknown


def convert(path: Path, out: Path):
    im = Image.open(path)
    im = ImageOps.exif_transpose(im).convert("RGB")
    w, h = im.size
    ratio = w / h
    note = ""
    if abs(ratio - 2 / 3) > 0.02:
        note = f" (สัดส่วนเดิม {w}x{h} ตัดขอบให้เป็น 2:3)"
    im = ImageOps.fit(im, (W, H), method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
    im.save(out, "WEBP", quality=QUALITY, method=6)
    return note


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src = Path(sys.argv[1]).expanduser().resolve()
    deck = sys.argv[2] if len(sys.argv) > 2 else "navadara"
    if not re.fullmatch(r"[a-z0-9-]+", deck):
        sys.exit("ชื่อชุดใช้ได้เฉพาะ a-z 0-9 และ -")
    with tempfile.TemporaryDirectory() as tmp:
        found, unknown = collect(src, Path(tmp))
        missing = [k for k in NEEDED if k not in found]
        for u in unknown:
            print(f"  ? ไม่รู้จักชื่อไฟล์ {u} (ข้าม)")
        if missing:
            sys.exit("ภาพยังไม่ครบ ขาด: " + ", ".join(missing))
        dest = ROOT / "decks" / deck
        dest.mkdir(parents=True, exist_ok=True)
        for k in NEEDED:
            note = convert(found[k], dest / f"{k}.webp")
            print(f"  ✓ {k}.webp{note}")
    cfg_path = ROOT / "data" / "site.json"
    cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
    cfg["deck"] = {"folder": deck, "ext": "webp"}
    cfg_path.write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    subprocess.run(["node", str(ROOT / "tools" / "build.mjs")], check=True)
    print(f"เปลี่ยนเว็บไปใช้ชุดภาพ '{deck}' แล้ว")


if __name__ == "__main__":
    main()
