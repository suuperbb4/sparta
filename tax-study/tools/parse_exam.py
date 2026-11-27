# 큐넷 원본 문제지(pdftotext -layout 결과)를 문항 단위로 분리
import re, json, sys
CH = '①②③④⑤'
def parse(path, start, end):
    t = open(path, encoding='utf-8').read()
    t = re.sub(r'\n\s*\d{4}년도? 제\d+회 세무사 1차 \d교시 [A-Z]형 \(.*?\)\s*\n', '\n', t)
    t = t.replace('\f', '\n')
    pos = []
    for n in range(start, end + 1):
        m = re.search(r'(?m)^\s{0,3}%d\.\s' % n, t[pos[-1][1] if pos else 0:])
        if not m: pos.append((n, None)); continue
        base = pos[-1][1] if pos and pos[-1][1] is not None else 0
        pos.append((n, base + m.start()))
    out = {}
    for i, (n, p) in enumerate(pos):
        if p is None: out[n] = None; continue
        q = pos[i + 1][1] if i + 1 < len(pos) and pos[i + 1][1] else None
        blk = t[p:q] if q else t[p:p + 4000]
        blk = re.sub(r'^\s*\d+\.\s', '', blk.strip())
        idx = [blk.find(c) for c in CH]
        ok = all(x >= 0 for x in idx) and idx == sorted(idx)
        if not ok: out[n] = {'raw': blk, 'ok': False}; continue
        stem = blk[:idx[0]].rstrip()
        ch = [re.sub(r'\s+', ' ', blk[idx[k] + 1: idx[k + 1] if k < 4 else len(blk)]).strip() for k in range(5)]
        out[n] = {'stem': stem, 'choices': ch, 'ok': True}
    return out
if __name__ == '__main__':
    r = parse(sys.argv[1], int(sys.argv[2]), int(sys.argv[3]))
    json.dump(r, open(sys.argv[4], 'w'), ensure_ascii=False, indent=1)
    print(sum(1 for v in r.values() if v and v['ok']), '/', len(r), 'parsed')
