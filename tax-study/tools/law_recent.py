# 조문에서 기준일 이후 개정 표시가 붙은 부분만 앞뒤 문맥과 함께 출력
# 사용: law_recent.py <법령폴더> <기준일> 법령명:조문 ...
import sys, re
d, since = sys.argv[1], int(sys.argv[2])
DATE = re.compile(r'(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.')
for spec in sys.argv[3:]:
    law, art = spec.split(':')
    t = open(f'{d}/{law}.txt').read().split('\n'); out = []; on = False
    for ln in t:
        s = ln.strip(); m = re.match(r'^(제\d+조(?:의\d+)?)\(', s)
        if m: on = (m.group(1) == art)
        if on: out.append(s)
    txt = ' '.join(out); print(f'######## {law} {art} ({len(txt)}자)')
    for m in re.finditer(r'[<\[]\s*(?:본조신설|전문개정|개정|신설|삭제)[^>\]]*[>\]]', txt):
        ds = [int(f'{y}{int(a):02d}{int(b):02d}') for y, a, b in DATE.findall(m.group(0))]
        if ds and max(ds) > since:
            st = txt.rfind(' ① ', 0, m.start()); st2 = max(txt.rfind(' ' + c + ' ', 0, m.start()) for c in '①②③④⑤⑥⑦⑧⑨⑩⑪⑫') 
            st = max(st2, m.start() - 600)
            print('  …' + txt[max(st, 0): m.end()][-700:])
