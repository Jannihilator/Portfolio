"""
Makes the small pictures for the "More work" grid (toy/others.js): each
project's first picture, 640 px wide, as a JPEG in assets/thumbs/ under the
same name. The grid shows them at about 200 px, so this stays sharp on a
2x screen. See-through parts are filled with the grid's own slot colour.

    python scripts/make-thumbs.py assets/cat.png assets/sheep.png ...

A project without one in assets/thumbs/ shows its full picture instead.
"""
import sys
from pathlib import Path

from PIL import Image

WIDTH = 640
SLOT = (0xEF, 0xE5, 0xD2)  # .thumb-shot's background in toy.css

out = Path(__file__).resolve().parent.parent / "assets" / "thumbs"
out.mkdir(exist_ok=True)

for name in sys.argv[1:]:
    src = Path(name)
    im = Image.open(src)
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        flat = Image.new("RGB", im.size, SLOT)
        flat.paste(im, mask=im.getchannel("A"))
        im = flat
    else:
        im = im.convert("RGB")
    if im.width > WIDTH:
        im = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)
    dest = out / f"{src.stem}.jpg"
    im.save(dest, quality=82, optimize=True, progressive=True)
    print(f"{src} {src.stat().st_size // 1024}K -> {dest.name} {dest.stat().st_size // 1024}K")
