# 2026 2차 회계학 1부: 글자가 이미지로 된 PDF라 페이지 범위를 직접 지정해 세트 이미지 생성
import json, os, subprocess, glob, sys
from PIL import Image
pdf = sys.argv[1]; work = sys.argv[2]; os.makedirs(work, exist_ok=True)
if not glob.glob(work + '/p-*.png'): subprocess.run(['pdftoppm', '-r', '150', '-gray', '-png', pdf, work + '/p'], check=True)
P = lambda i: Image.open(f'{work}/p-{i:02d}.png').convert('L')
SETS = [(1, [(1, 462)] + [(p, 85) for p in (2, 3, 4)], 30, 3), (2, [(p, 85) for p in (5, 6, 7)], 30, 2),
        (3, [(p, 85) for p in (8, 9)], 20, 2), (4, [(p, 85) for p in (10, 11)], 20, 2)]
qs = []
for no, pages, pts, nq in SETS:
    crops = [P(p).crop((80, top, 1165, 1655)) for p, top in pages]
    W = crops[0].width; H = sum(c.height for c in crops) + 6 * len(crops)
    im = Image.new('L', (W, H), 255); o = 0
    for c in crops: im.paste(c, (0, o)); o += c.height + 6
    im = im.resize((int(W * .75), int(H * .75)), Image.LANCZOS)
    name = f'2026-h1-{no}.png'; im.quantize(16, dither=Image.Dither.NONE).save('img/2cha/' + name, optimize=True)
    qs.append({'id': f's2026-h1-{no}', 'type': 'set', 'kind': '계산', 'year': 2026, 'no': no, 'topic': f'문제 {no}', 'points': pts,
               'src': f'제63회(2026) 2차 회계학 1부 문제{no}', 'img': ['img/2cha/' + name], 'px': im.width * im.height,
               'parts': [{'q': f'물음 {k}', 'label': '', 'points': None, 'kind': 'calc'} for k in range(1, nq + 1)], 'text': ''})
json.dump({'subject': 'h1', 'year': 2026, 'preamble': '', 'source': 'Q-Net 공개 2차 원본 문제지 (공식 모범답안 없음)', 'questions': qs},
          open('data/gichul2/e2026-h1.json', 'w'), ensure_ascii=False, indent=0)
print([q['px'] // 10**6 for q in qs])
