# 각 카드 묶음의 표지(01)로 가벼운 미리보기 thumb.jpg(가로 720px)를 만든다
import sys, pathlib
from PIL import Image
root = pathlib.Path(__file__).resolve().parent.parent / 'btcard' / 'cards'
made = 0
for d in sorted(p for p in root.glob('*/*') if p.is_dir()):
    imgs = sorted(f for f in d.iterdir() if f.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp') and f.stem != 'thumb')
    if not imgs: continue
    out = d / 'thumb.jpg'
    if out.exists() and out.stat().st_mtime >= imgs[0].stat().st_mtime: continue
    im = Image.open(imgs[0]).convert('RGB'); w = min(720, im.width)
    im.resize((w, round(im.height * w / im.width)), Image.LANCZOS).save(out, 'JPEG', quality=78, optimize=True, progressive=True)
    made += 1
print(f'thumbs: {made}')
