# 큐넷 2차 원본 문제지 → 【문제 N】 단위 세트(지문+물음) 이미지와 답란 구조
# 사용: python3 build_2cha.py <2차 PDF 폴더(연도별)> <출력 data 폴더> <이미지 폴더>
import re, os, sys, json, glob, subprocess
from PIL import Image
SRC, OUT, IMG = sys.argv[1], sys.argv[2], sys.argv[3]
ROUND = {2021: 58, 2022: 59, 2023: 60, 2024: 61, 2025: 62, 2026: 63}
KEYS = {'h1': ('1교시', '회계학 1부', '회계학1부'), 'h2': ('2교시', '회계학 2부', '회계학2부'),
        's1': ('3교시', '세법학 1부', '세법학1부'), 's2': ('4교시', '세법학 2부', '세법학2부')}
CIRC = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮'
DPI = 150; K = DPI / 72; SCALE = .75

def find_pdf(y, subj):
    for f in glob.glob(os.path.join(SRC, str(y), '*.pdf')):
        b = os.path.basename(f)
        if any(k in b for k in KEYS[subj]): return f

def bbox_marks(pdf):
    bb = subprocess.run(['pdftotext', '-bbox', pdf, '-'], capture_output=True, text=True).stdout
    pages = bb.split('<page ')[1:]
    marks = []; foot = {}; H = float(re.search(r'height="([\d.]+)"', pages[0]).group(1))
    for pi, p in enumerate(pages, 1):
        ws = re.findall(r'xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)<', p)
        fy = [float(y0) for x0, y0, x1, y1, w in ws if re.search(r'교시', w) and float(y0) > H * .85]
        foot[pi] = (min(fy) - 6) if fy else H - 45
        for x0, y0, x1, y1, w in ws:
            if w.startswith('【문제'): marks.append((pi, float(y0)))
    return marks, foot, H, len(pages)

def render(pdf, page, y0, y1):
    tmp = f'/tmp/claude-0/-home-user-sparta/2908f4fd-aba7-54f7-849d-aa3dbe521f3b/scratchpad/c2'
    subprocess.run(['pdftoppm', '-gray', '-png', '-r', str(DPI), '-f', str(page), '-l', str(page), '-singlefile',
                    '-x', str(int(30 * K)), '-y', str(int(y0 * K)), '-W', str(int(535 * K)), '-H', str(int((y1 - y0) * K)), pdf, tmp], check=True)
    return Image.open(tmp + '.png').convert('L')

def raw_text(pdf):
    t = subprocess.run(['pdftotext', '-raw', pdf, '-'], capture_output=True, text=True).stdout
    return '\n'.join(l for l in t.replace('\f', '\n').split('\n') if not re.search(r'세무사 2차 \d교시', l))

def parts_of(subj, seg):
    """물음 단위 답안란 (실제 2차 답안지처럼 물음별로 작성)"""
    parts = []; seen = set()
    for m in re.finditer(r'\(?물음\s*(\d+)\)?\s*([^\n]*)', seg):
        n = int(m.group(1))
        if n in seen: continue
        seen.add(n)
        rest = m.group(2) + seg[m.end():m.end() + 200]
        pt = re.search(r'\((\d+)점\)', rest)
        parts.append({'q': f'물음 {n}', 'label': re.sub(r'\s*\(\d+점\).*', '', m.group(2)).strip()[:80], 'points': int(pt.group(1)) if pt else None,
                      'kind': 'essay' if subj[0] == 's' else 'calc'})
    if not parts: parts = [{'q': '답안', 'label': '', 'points': None, 'kind': 'essay' if subj[0] == 's' else 'calc'}]
    return parts

def main():
    os.makedirs(IMG, exist_ok=True); os.makedirs(OUT, exist_ok=True)
    allsets = {}
    for y in sorted(ROUND):
        for subj in KEYS:
            pdf = find_pdf(y, subj)
            if not pdf: print('없음', y, subj); continue
            marks, foot, H, NP = bbox_marks(pdf)
            if not marks: print('텍스트 없음(스캔본)', y, subj); continue
            raw = raw_text(pdf)
            pre = raw.split('【문제', 1)[0]
            pre = re.sub(r'^(회계학|세법학)\s*\d부\s*', '', pre.strip()).strip()
            segs = ['【문제' + s for s in raw.split('【문제')[1:]]
            sets = []
            for i, (pg, yy) in enumerate(marks):
                nxt = marks[i + 1] if i + 1 < len(marks) else (NP + 1, 0)
                crops = []
                for p in range(pg, nxt[0] + (1 if nxt[1] > 60 else 0)):
                    if p > NP: break
                    top = yy - 4 if p == pg else 28
                    bot = (nxt[1] - 6) if p == nxt[0] else foot[p]
                    if bot - top > 15: crops.append(render(pdf, p, top, bot))
                W = crops[0].width; Ht = sum(c.height for c in crops) + 6 * len(crops)
                im = Image.new('L', (W, Ht), 255); o = 0
                for c in crops: im.paste(c, (0, o)); o += c.height + 6
                im = im.resize((int(W * SCALE), int(Ht * SCALE)), Image.LANCZOS)
                name = f'{y}-{subj}-{i + 1}.png'; im.quantize(16, dither=Image.Dither.NONE).save(os.path.join(IMG, name), optimize=True)
                seg = segs[i] if i < len(segs) else ''
                pts = re.search(r'\((\d+)점\)', seg.split('\n')[0] + seg[:300])
                first = re.sub(r'\s+', ' ', seg.split('\n')[0])[:120]
                sets.append({'id': f's{y}-{subj}-{i + 1}', 'type': 'set', 'kind': '서술' if subj[0] == 's' else '계산', 'year': y, 'no': i + 1,
                             'topic': first.replace('【문제 ', '문제 ').replace('【문제', '문제'), 'points': int(pts.group(1)) if pts else None,
                             'src': f'제{ROUND[y]}회({y}) 2차 {"회계학" if subj[0] == "h" else "세법학"} {subj[1]}부 문제{i + 1}',
                             'img': [f'img/2cha/{name}'], 'px': im.width * im.height, 'parts': parts_of(subj, seg), 'text': seg[:20000]})
            allsets[(y, subj)] = (sets, pre)
            print(y, subj, len(sets), '문제', [len(s['parts']) for s in sets], max(s['px'] for s in sets) // 10**6, 'Mpx')
    for (y, subj), (sets, pre) in allsets.items():
        json.dump({'subject': subj, 'year': y, 'preamble': pre[:2000], 'source': 'Q-Net 공개 2차 원본 문제지 (공식 모범답안 없음)', 'questions': sets},
                  open(os.path.join(OUT, f'e{y}-{subj}.json'), 'w'), ensure_ascii=False, indent=0)
main()
