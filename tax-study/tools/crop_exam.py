# 큐넷 원본 문제지 PDF에서 문항별 이미지를 잘라낸다 (pdftotext -bbox 좌표 + pdftoppm)
# 사용: crop_exam.py <pdf> <out_dir> <prefix> <first_no> <last_no>
import re, sys, subprocess, os
pdf, out, prefix, a, b = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5])
DPI = 150; K = DPI / 72
bb = subprocess.run(['pdftotext', '-bbox', pdf, '-'], capture_output=True, text=True).stdout
pages = bb.split('<page ')[1:]
H = float(re.search(r'height="([\d.]+)"', pages[0]).group(1))
nums = []; foot = {}
for pi, p in enumerate(pages, 1):
    words = [(float(x0), float(y0), float(y1), w) for x0, y0, _, y1, w in re.findall(r'xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)<', p)]
    f = [y0 for x, y0, y1, w in words if re.fullmatch(r'[A-Z]형', w)]
    foot[pi] = (min(f) - 4) if f else H - 40
    for x, y0, y1, w in words:
        m = re.fullmatch(r'(\d{1,2})\.', w)
        if m and x < 60: nums.append((int(m.group(1)), pi, y0))
# 해당 범위 문항만, 번호 순서대로 첫 등장
seen = {}
for n, pi, y in nums:
    if a <= n <= b and n not in seen and (not seen or pi >= max(v[0] for v in seen.values())): seen[n] = (pi, y)
os.makedirs(out, exist_ok=True)
def crop(pi, y0, y1, path):
    subprocess.run(['pdftoppm', '-gray', '-png', '-r', str(DPI), '-f', str(pi), '-l', str(pi), '-singlefile',
        '-x', str(int(36 * K)), '-y', str(int(y0 * K)), '-W', str(int(525 * K)), '-H', str(int((y1 - y0) * K)), pdf, path[:-4]], check=True)
missing = [n for n in range(a, b + 1) if n not in seen]
order = sorted(seen.items())
for i, (n, (pi, y)) in enumerate(order):
    nxt = order[i + 1][1] if i + 1 < len(order) else None
    parts = []
    if nxt and nxt[0] == pi: parts.append((pi, y - 6, nxt[1] - 8))
    else:
        parts.append((pi, y - 6, foot[pi]))
        if nxt and nxt[0] == pi + 1 and nxt[1] > 90: parts.append((pi + 1, 40, nxt[1] - 8))
    files = []
    for k, (p, y0, y1) in enumerate(parts):
        if y1 - y0 < 20: continue
        fn = f'{out}/{prefix}-{n:02d}{"" if k == 0 else "b"}.png'; crop(p, y0, y1, fn); files.append(os.path.basename(fn))
    print(n, pi, ' '.join(files))
print('missing', missing)
