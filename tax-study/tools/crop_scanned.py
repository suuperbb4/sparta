# 스캔본(글자 정보 없는) 문제지: 행별 잉크 분포로 줄을 찾고, 큰 여백을 문항 경계로 본다
# 사용: crop_scanned.py <pdf> <work_dir>  → 페이지별 블록 목록(JSON) 출력
import sys, os, subprocess, json, glob
from PIL import Image
pdf, work = sys.argv[1], sys.argv[2]; DPI = 150
os.makedirs(work, exist_ok=True)
if not glob.glob(work + '/p-*.png'):
    subprocess.run(['pdftoppm', '-r', str(DPI), '-gray', '-png', pdf, work + '/p'], check=True)
pages = sorted(glob.glob(work + '/p-*.png'))
GAP = int(sys.argv[3]) if len(sys.argv) > 3 else 30
out = []
for pi, f in enumerate(pages, 1):
    im = Image.open(f).convert('L'); W, H = im.size
    px = im.load()
    x0, x1 = int(W * .06), int(W * .94)
    rows = []
    for y in range(H):
        c = 0
        for x in range(x0, x1, 2):
            if px[x, y] < 140: c += 1
        rows.append(c)
    foot = int(H * .93)  # 하단 쪽번호 영역 제외
    lines = []; y = int(H * .03)
    while y < foot:
        if rows[y] > 1:
            s = y
            while y < foot and rows[y] > 1: y += 1
            if y - s > 3: lines.append([s, y])
        y += 1
    blocks = []
    for l in lines:
        if blocks and l[0] - blocks[-1][1] < GAP: blocks[-1][1] = l[1]
        else: blocks.append(l[:])
    # 각 블록의 왼쪽 시작 x
    res = []
    for s, e in blocks:
        lx = W
        for y in range(s, min(s + 25, e)):
            for x in range(x0, x1):
                if px[x, y] < 140: lx = min(lx, x); break
        res.append([s, e, lx])
    out.append({'page': pi, 'file': os.path.basename(f), 'W': W, 'H': H, 'blocks': res})
json.dump(out, open(work + '/blocks.json', 'w'))
print(sum(len(p['blocks']) for p in out), 'blocks in', len(out), 'pages')
