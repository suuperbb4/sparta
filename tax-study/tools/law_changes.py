# 현행 법령 텍스트에서 조문별 개정 표시(<개정 YYYY. M. D.>, <신설 ...>, [전문개정 ...] 등)를 모아
# 기준일 이후 바뀐 조문 목록을 만든다.  사용: law_changes.py <법령폴더> <기준일 YYYYMMDD> [출력json]
import re, sys, os, glob, json
d = sys.argv[1]; since = int(sys.argv[2]); out = sys.argv[3] if len(sys.argv) > 3 else None
ART = re.compile(r'^(제\d+조(?:의\d+)?)\(([^)]{1,60})\)')
DATE = re.compile(r'(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.')
res = {}
for f in sorted(glob.glob(os.path.join(d, '*.txt'))):
    law = os.path.basename(f)[:-4]; cur = None; arts = {}
    for ln in open(f).read().split('\n'):
        s = ln.strip(); m = ART.match(s)
        if m: cur = m.group(1); arts.setdefault(cur, {'title': m.group(2), 'dates': set(), 'text': []})
        if not cur: continue
        arts[cur]['text'].append(s)
        for tag in re.findall(r'[<\[]\s*(?:본조신설|전문개정|개정|신설|삭제|종전)[^>\]]*[>\]]', s):
            for y, mo, dd in DATE.findall(tag): arts[cur]['dates'].add(int(f'{y}{int(mo):02d}{int(dd):02d}'))
    ch = {a: {'title': v['title'], 'changed': sorted(x for x in v['dates'] if x > since)} for a, v in arts.items() if any(x > since for x in v['dates'])}
    res[law] = ch
    print(f'{law}: 조문 {len(arts)}개 중 {len(ch)}개가 {since} 이후 개정')
if out: json.dump(res, open(out, 'w'), ensure_ascii=False, indent=1)
