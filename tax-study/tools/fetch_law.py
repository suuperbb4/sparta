# 국가법령정보센터에서 현행 법령 본문을 받아 텍스트로 저장 (조문 대조용)
# 사용: python3 fetch_law.py <저장폴더> 법령명 ...
import sys, re, html, os, subprocess, json
out = sys.argv[1]; os.makedirs(out, exist_ok=True)
import time
def get(url, need=2000):
    for i in range(4):
        r = subprocess.run(['curl', '-s', '-L', '--max-time', '90', url], capture_output=True).stdout.decode('utf-8', 'ignore')
        if len(r) > need: return r
        time.sleep(3 + 3 * i)
    return r
meta = json.load(open(os.path.join(out, 'meta.json'))) if os.path.exists(os.path.join(out, 'meta.json')) else {}
for name in sys.argv[2:]:
    page = get('https://www.law.go.kr/법령/' + name.replace(' ', ''))
    seq = re.search(r'name="lsiSeq"[^>]*value="(\d+)"', page) or re.search(r"lsiSeq\s*[:=]\s*'(\d+)", page)
    ef = re.search(r'id="efYd" name="efYd" value="(\d+)"', page) or re.search(r"efYd = '(\d+)'", page)
    anc = re.search(r'ancYd" value="(\d+)"', page)
    if not seq: print('실패', name); continue
    body = get(f'https://www.law.go.kr/LSW/lsInfoR.do?lsiSeq={seq.group(1)}&efYd={ef.group(1) if ef else ""}&chrClsCd=010202&ancYnChk=0')
    body = re.sub(r'<script.*?</script>', ' ', body, flags=re.S)
    t = html.unescape(re.sub(r'<[^>]+>', '\n', body))
    t = re.sub(r'[ \t ]+', ' ', t); t = re.sub(r'\n\s*\n+', '\n', t)
    open(os.path.join(out, name.replace(' ', '') + '.txt'), 'w').write(t)
    meta[name] = {'lsiSeq': seq.group(1), 'efYd': ef.group(1) if ef else None, 'ancYd': anc.group(1) if anc else None, 'chars': len(t)}
    print(name, meta[name])
json.dump(meta, open(os.path.join(out, 'meta.json'), 'w'), ensure_ascii=False, indent=1)
