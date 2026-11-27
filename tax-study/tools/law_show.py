# 현행 법령 조문 출력: law_show.py <법령폴더> <법령명> <조문(제8조, 제12조의2...)> [키워드]
import sys, re
d, law, art = sys.argv[1], sys.argv[2], sys.argv[3]; kw = sys.argv[4] if len(sys.argv) > 4 else None
t = open(f'{d}/{law}.txt').read().split('\n'); out = []; on = False
for ln in t:
    s = ln.strip()
    m = re.match(r'^(제\d+조(?:의\d+)?)\(', s)
    if m: on = (m.group(1) == art)
    if on: out.append(s)
txt = ' '.join(out)
if kw:
    for m in re.finditer(kw, txt): print('…' + txt[max(0, m.start() - 350): m.end() + 450] + '…\n')
else: print(txt[:6000])
