#!/usr/bin/env python3
"""Create small WebP thumbnails for every post.

For each post in _posts/ the source image is, in order:
  1. cover_image from the front matter
  2. _thumbnail from the front matter
  3. the first Markdown image in the post body

The thumbnail is written to assets/thumbs/<post-file-name>.webp (800px max) and
the list of posts that have one is written to _data/thumbs.json so templates
can check `site.data.thumbs contains stem`. Up-to-date thumbnails are skipped,
so this is safe to run on every Notion sync.

Usage:  python3 scripts/make_thumbs.py
"""
import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
POSTS = ROOT / "_posts"
OUT = ROOT / "assets" / "thumbs"
DATA = ROOT / "_data" / "thumbs.json"
MAX_SIDE = 800
QUALITY = 78

Image.MAX_IMAGE_PIXELS = None  # some originals are very large

KEY_RE = re.compile(r"^(cover_image|_thumbnail):\s*(?:>-?\s*)?(\S*)\s*$")
BODY_IMG_RE = re.compile(r"!\[[^\]]*\]\((/[^)\s]+)\)")


def source_image(md_file: Path):
    """Return the site-relative path of the best source image, or None."""
    lines = md_file.read_text(encoding="utf-8").splitlines()
    found = {}
    body_start = 0
    if lines and lines[0].strip() == "---":
        i = 1
        while i < len(lines) and lines[i].strip() != "---":
            m = KEY_RE.match(lines[i])
            if m:
                value = m.group(2)
                if not value and i + 1 < len(lines):
                    value = lines[i + 1].strip()
                if value.startswith("/"):
                    found[m.group(1)] = value
            i += 1
        body_start = i + 1
    for key in ("cover_image", "_thumbnail"):
        if key in found:
            return found[key]
    m = BODY_IMG_RE.search("\n".join(lines[body_start:]))
    return m.group(1) if m else None


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    DATA.parent.mkdir(parents=True, exist_ok=True)
    made = skipped = missing = 0
    stems = []
    for md in sorted(POSTS.rglob("*.md")):
        rel = source_image(md)
        if not rel:
            print(f"no image: {md.name}")
            continue
        src = ROOT / rel.lstrip("/")
        if not src.exists():
            print(f"missing: {rel}")
            missing += 1
            continue
        dest = OUT / (md.stem + ".webp")
        stems.append(md.stem)
        if dest.exists() and dest.stat().st_mtime >= src.stat().st_mtime:
            skipped += 1
            continue
        with Image.open(src) as im:
            im = ImageOps.exif_transpose(im)
            if im.mode not in ("RGB", "RGBA"):
                im = im.convert("RGB")
            im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
            im.save(dest, "WEBP", quality=QUALITY, method=6)
        print(f"{src.stat().st_size/1e6:6.1f} MB -> {dest.stat().st_size/1e3:5.0f} KB  {dest.name}")
        made += 1
    DATA.write_text(json.dumps(sorted(set(stems)), indent=1) + "\n", encoding="utf-8")
    print(f"done: {made} created, {skipped} up to date, {missing} missing, {len(set(stems))} posts listed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
