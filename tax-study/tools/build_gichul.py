# 큐넷 원본 기출(2023~2026 1차) → 문항 메타데이터 + 말/계산 분류 + 기출 OX + 출제경향
# 사용: python3 build_gichul.py <원본PDF 폴더(연도별 하위폴더)> <출력 폴더>
import re, os, sys, json, subprocess, glob
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'data'))
from answers import ANS
SRC, OUT = sys.argv[1], sys.argv[2]
ROUND = {2023: 60, 2024: 61, 2025: 62, 2026: 63}
CH = '①②③④⑤'
SUBJ = {'jae': ('1교시', 1, 40), 'segae': ('1교시', 41, 80), 'hoegae': ('행정소송법', 1, 40), 'haeng': ('행정소송법', 41, 80)}
CORPUS = ''
# 아티팩트 파일 수 한도(511) 때문에 일부 이미지는 asset 저장소에 올림: '연도/파일명 asset_id'
_am = os.path.join(os.path.dirname(os.path.abspath(sys.argv[0])), '..', 'data', 'asset_map.txt')
AMAP = dict(l.split() for l in open(_am)) if os.path.exists(_am) else {}
SOLO = set('및등수그것각이또중후전때안뒤외더못잘곧즉단총약본당동해위매새옛온갖저와과의를을은는가에도로나')

def raw_text(pdf):
    t = subprocess.run(['pdftotext', '-raw', pdf, '-'], capture_output=True, text=True).stdout
    keep = []
    for ln in t.replace('\f', '\n').split('\n'):
        s = ln.strip()
        if re.search(r'세무사 1차 \d교시 [A-Z]형', s) or s in ('재정학', '세법학개론', '회계학개론', '행정소송법', '재 정 학'): continue
        keep.append(s)
    return keep

def join(lines):
    out = ''
    for s in lines:
        if not s: continue
        if out and re.search(r'[가-힣]$', out) and re.match(r'[가-힣]', s):
            last = re.split(r'[\s(「｢‘“]', out)[-1]; first = re.split(r'[\s,.)」｣’”]', s)[0]
            glue = (last + first) in CORPUS or re.fullmatch(r'(을|를|이|가|은|는|의|에|로|으로|와|과|도|만|에서|에게|으며|하여|하고|된|되는|하는|한다|된다|이다|할|될|임|함)', first or '')
            out += ('' if glue else ' ') + s
        else: out += (' ' if out else '') + s
    return re.sub(r'\s+', ' ', out).strip()

def split_blocks(lines, a, b):
    idx = {}; i = 0
    for n in range(a, b + 1):
        while i < len(lines) and not re.match(r'%d\.(\s|$)' % n, lines[i]): i += 1
        if i < len(lines): idx[n] = i
    blocks = {}
    ks = sorted(idx)
    for j, n in enumerate(ks):
        end = idx[ks[j + 1]] if j + 1 < len(ks) else next((k for k in range(idx[n] + 1, len(lines)) if re.match(r'\d{1,2}\.(\s|$)', lines[k])), len(lines))
        blocks[n] = lines[idx[n]:end]
    return blocks

def parse_block(bl):
    txt = '\n'.join(bl); txt = re.sub(r'^\d+\.\s*', '', txt)
    pos = [txt.find(c) for c in CH]
    if not all(p >= 0 for p in pos) or pos != sorted(pos): return None
    stem_lines = txt[:pos[0]].split('\n')
    ch = []
    for k in range(5):
        seg = txt[pos[k] + 1: pos[k + 1] if k < 4 else len(txt)]
        ch.append(join(seg.split('\n')))
    return stem_lines, ch

NUMRE = re.compile(r'^[￦\\\-−△(]?\s*[\d,.]+\s*(원|개|단위|시간|%|배|년|세|명|억원|만원)?\)?(\s*(감소|증가|이익|손실|과대|과소|유리|불리))?$')
def is_calc(stem, ch):
    if sum(1 for c in ch if NUMRE.match(c.replace(' ', '')) or NUMRE.match(c)) >= 4: return True
    if all(re.search(r'[￦\d]', c) and len(c) < 40 for c in ch) and re.search(r'(금액|얼마|계산|은\?|는\?)', stem) and sum(c.count('￦') + len(re.findall(r'\d{2,}', c)) > 0 for c in ch) >= 4: return True
    return False

LAWS = ['국세기본법', '국세징수법', '조세범처벌법', '소득세법', '법인세법', '부가가치세법']
HOE = [('원가관리', r'표준원가|활동기준|결합원가|결합공정|종합원가|개별원가|변동원가계산|전부원가계산|초변동|공헌이익|손익분기|예산|제조간접원가|직접재료원가|직접노무원가|대체가격|투자수익률|잔여이익|균형성과|품질원가|수명주기|목표원가|특별주문|외부구입|제품배합|정상원가|보조부문|학습곡선|경제적 주문|안전재고|기대영업이익|영업레버리지|가중평균법과 선입선출법|공손|부산물|원가동인|원가함수|차이분석|조업도'),
 ('리스', r'리스'), ('주식기준보상', r'주식기준보상|주식선택권|주가차액보상'), ('종업원급여', r'확정급여|종업원급여|퇴직급여'),
 ('법인세회계', r'법인세회계|이연법인세|법인세비용|당기법인세'), ('주당이익', r'주당이익'), ('현금흐름표', r'현금흐름'),
 ('회계변경·오류수정', r'회계정책|회계추정|오류수정|회계변경|전기오류'), ('관계기업·사업결합', r'관계기업|지분법|사업결합|영업권|지배력|연결|공동약정'),
 ('환율', r'외화|환율|기능통화|표시통화'), ('정부보조금', r'정부보조금'), ('차입원가', r'차입원가|적격자산'), ('매각예정', r'매각예정|중단영업'),
 ('농림어업', r'생물자산|수확물'), ('투자부동산', r'투자부동산'), ('무형자산', r'무형자산|개발비|내부적으로 창출'), ('충당부채', r'충당부채|우발부채|우발자산'),
 ('수익', r'고객과의 계약|수행의무|거래가격|건설계약|라이선스|반품|보증|미인도청구|본인|대리인|수익인식|고객'),
 ('금융상품', r'사채|금융자산|금융부채|상각후원가|공정가치로 측정|전환사채|신주인수권|기대신용손실|대손|매출채권|손상|지분상품|채무상품|금융상품|금융보증'),
 ('유형자산', r'유형자산|감가상각|재평가|원상복구|교환|기계장치|건물'), ('재고자산', r'재고자산|매출원가|저가법|소매재고|매입|상품'),
 ('개념체계', r'개념체계|질적특성|자본유지|측정기준|재무보고'), ('자본', r'자본|자기주식|이익잉여금|배당|유상증자|감자'),
 ('재무제표 표시', r'재무제표 표시|재무제표의 표시|포괄손익|재무상태표|중간재무보고|보고기간후사건|특수관계자'), ('원가관리', r'원가|제품|판매량|생산')]
HAENG = [('대상적격(처분성)', r'항고소송의 대상|처분성|대상적격|처분에 해당'), ('원고적격·소의 이익', r'원고적격|소의 이익|법률상 이익'),
 ('피고적격', r'피고'), ('제소기간', r'제소기간'), ('행정심판 전치', r'행정심판|전치'), ('집행정지·가처분', r'집행정지|가처분'),
 ('소송참가', r'소송참가|참가'), ('소의 변경·관련청구', r'소의 변경|소 변경|병합|이송|관련청구'), ('심리·증명책임', r'심리|증명책임|입증|직권|처분사유'),
 ('판결·효력', r'판결|기속력|기판력|간접강제|재처분|사정판결|재심'), ('무효등확인소송', r'무효'), ('부작위위법확인소송', r'부작위'),
 ('당사자소송', r'당사자소송'), ('민중·기관소송', r'민중소송|기관소송'), ('관할·총론', r'관할|행정소송')]
JAE = [('공공재', r'공공재|린달|사무엘슨'), ('외부성', r'외부|피구|코즈|배출'), ('후생·효율', r'파레토|후생|효율'), ('공공선택', r'투표|중위|공공선택|애로우|관료|지대추구'),
 ('조세 일반·귀착', r'귀착|전가|조세부담|담세'), ('초과부담·최적과세', r'초과부담|최적|램지|코렛|헤이그'), ('소득세', r'소득세|근로|노동공급'), ('법인세', r'법인세'),
 ('소비·재산·기타세', r'부가가치세|소비세|재산세|물품세|관세'), ('소득분배', r'로렌츠|지니|앳킨슨|분배|빈곤'), ('비용편익분석', r'비용-?편익|현재가치|내부수익률|할인율'),
 ('사회보장', r'사회보험|연금|실업|건강보험|복지'), ('지방재정', r'지방|티부|교부금|보조금'), ('재정정책·공채', r'공채|국채|재정적자|리카도|재정정책'), ('공기업·가격', r'공기업|가격설정|평균비용'),
 ('탈세', r'탈세'), ('경비팽창', r'바그너|팽창|전위')]
HOE_FIX = {(2023, 1): '개념체계', (2023, 2): '유형자산', (2023, 19): '현금흐름표', (2024, 1): '회계변경·오류수정', (2024, 3): '현금흐름표',
 (2024, 11): '매각예정', (2024, 14): '유형자산', (2024, 20): '재무제표 표시', (2025, 3): '재고자산', (2025, 15): '금융상품',
 (2026, 6): '공정가치 측정', (2026, 11): '차입원가', (2026, 13): '무형자산', (2026, 15): '농림어업', (2026, 24): '금융상품'}
TEXTUAL = re.compile(r'설명|모두 고른|옳은 것|옳지 않은 것|해당하는|해당하지|아닌 것|적절한|틀린|않는 것')
def topic(subj, stem, y=0, n=0):
    if subj == 'hoegae':
        if n >= 25: return '원가관리'
        if (y, n) in HOE_FIX: return HOE_FIX[(y, n)]
    if subj == 'segae':
        m = re.search(r'<([^>]+)>', stem)
        if m: return {'조세범 처벌법': '조세범처벌법', '국제조세조정에 관한 법률': '국제조세조정법'}.get(m.group(1), m.group(1).split(',')[0].replace(' ', ''))
        for L in LAWS:
            if L in stem: return L
        return '세법 기타'
    table = {'hoegae': HOE, 'haeng': HAENG, 'jae': JAE}[subj]
    for name, rx in table:
        if re.search(rx, stem): return name
    return '기타'

def context(stem):
    s = re.sub(r'<[^>]+>', '', stem).strip()
    s = re.sub(r'\(다툼이 있으면 판례에 따름\)|\(단,[^)]*\)', '', s)
    m = re.match(r'(.*?)(에 관한|에 대한)( 설명| 내용)', s)
    return (m.group(1) if m else '').strip()[:60]

ITEM = re.compile(r'^([ㄱ-ㅁ])\.\s*')
def items_of(stem_lines):
    items = {}; cur = None
    for s in stem_lines:
        m = ITEM.match(s)
        if m: cur = m.group(1); items[cur] = [s[m.end():]]
        elif cur: items[cur].append(s)
    return {k: join(v) for k, v in items.items()}
def combo(c):
    c = c.replace(' ', '')
    if re.fullmatch(r'[ㄱ-ㅁ](,[ㄱ-ㅁ])*', c): return set(c.split(','))
    return None
def is_prop(s): return len(s) >= 18 and re.search(r'(다|다\.|음|함)\.?$', s) and not re.match(r'[ㄱ-ㅁ][:.,]', s)

def main():
    os.makedirs(OUT, exist_ok=True)
    global CORPUS
    qs_all, ox_all, trend = {}, {}, {}
    CORPUS = '\n'.join(l for y in ANS for p in glob.glob(os.path.join(SRC, str(y), '*.pdf')) for l in raw_text(p))
    for y in sorted(ANS):
        pdfs = glob.glob(os.path.join(SRC, str(y), '*.pdf'))
        texts = {}
        for key in ('1교시', '행정소송법'):
            pdf = [p for p in pdfs if key in os.path.basename(p)][0]
            texts[key] = raw_text(pdf)
        for subj, (key, a, b) in SUBJ.items():
            blocks = split_blocks(texts[key], a, b)
            for n in range(a, b + 1):
                ans = ANS[y][subj][n - a]
                qid = f'g{y}-{subj}-{n:02d}'
                bl = blocks.get(n); p = parse_block(bl) if bl else None
                stem = join(p[0]) if p else ''
                ch = p[1] if p else []
                kind = '계산' if p and subj != 'haeng' and is_calc(stem, ch) and not re.search(r'몇 개|개수|모두 몇', stem) else '말'
                if subj == 'hoegae' and (n >= 25 or not TEXTUAL.search(stem)): kind = '계산'
                tp = topic(subj, stem or (bl[0] if bl else ''), y, n)
                imgs = sorted(os.path.basename(f) for f in glob.glob(os.path.join(OUT, '..', '..', 'img', str(y), f'{subj}-{n:02d}*.png')))
                q = dict(id=qid, topic=tp, type='gichul', kind=kind, year=y, no=n, ans=ans, diff=2,
                         src=f'제{ROUND[y]}회({y}) 1차 문{n}', img=[('/_blob/' + AMAP[f'{y}/{f[:-4]}']) if f'{y}/{f[:-4]}' in AMAP else f'img/{y}/{f}' for f in imgs])
                if not imgs: q['missing_img'] = True
                qs_all.setdefault((y, subj), []).append(q)
                t = trend.setdefault(subj, {}).setdefault(tp, {}); t[str(y)] = t.get(str(y), [0, 0]); t[str(y)][0 if kind == '말' else 1] += 1
                # ---- 기출 OX ----
                if not p or kind != '말' or not isinstance(ans, int): continue
                neg = bool(re.search(r'옳지 않은|틀린|아닌 것|않는 것', stem))
                pos = bool(re.search(r'옳은 것', stem)) and not neg
                ctx = context(stem)
                its = items_of(p[0])
                if its and re.search(r'모두 고른', stem):
                    sel = combo(ch[ans - 1])
                    if sel is None or not (neg or pos): continue
                    for k, s in its.items():
                        if not is_prop(s): continue
                        truth = (k in sel) if pos else (k not in sel)
                        ox_all.setdefault((y, subj), []).append(dict(id=f'{qid}-{k}', qid=qid, topic=tp, ctx=ctx, s=s, ox=truth, why=f'{"옳은" if pos else "옳지 않은"} 것을 모두 고르는 문제의 정답 「{ch[ans-1]}」 기준'))
                elif (neg or pos) and all(is_prop(c) for c in ch):
                    for k, s in enumerate(ch, 1):
                        truth = (k != ans) if neg else (k == ans)
                        ox_all.setdefault((y, subj), []).append(dict(id=f'{qid}-{k}', qid=qid, topic=tp, ctx=ctx, s=s, ox=truth, why=f'{"옳지 않은" if neg else "옳은"} 것을 고르는 문제, 정답 {CH[ans-1]}'))
    for (y, subj), qs in qs_all.items():
        json.dump({'subject': subj, 'year': y, 'source': 'Q-Net 공개 원본 문제지·최종정답(A형), 공공누리 제1유형', 'questions': qs},
                  open(f'{OUT}/g{y}-{subj}.json', 'w'), ensure_ascii=False, indent=0)
    # 회계: 4개년 말문제 2회 이상 출제 단원만 OX로 (드문 단원은 제외)
    hot = {k for k, v in trend.get('hoegae', {}).items() if sum(a for a, b in v.values()) >= 2 and k != '원가관리'}
    for key in [k for k in ox_all if k[1] == 'hoegae']:
        ox_all[key] = [x for x in ox_all[key] if x['topic'] in hot]
    for (y, subj), xs in ox_all.items():
        json.dump({'subject': subj, 'year': y, 'items': xs}, open(f'{OUT}/ox{y}-{subj}.json', 'w'), ensure_ascii=False, indent=0)
    json.dump({'years': sorted(ANS), 'trend': trend}, open(f'{OUT}/trend.json', 'w'), ensure_ascii=False, indent=1)
    for subj in SUBJ:
        nq = sum(len(v) for (y, s), v in qs_all.items() if s == subj)
        nc = sum(1 for (y, s), v in qs_all.items() if s == subj for q in v if q['kind'] == '계산')
        no = sum(len(v) for (y, s), v in ox_all.items() if s == subj)
        if subj == 'hoegae': print('회계 OX 단원:', sorted(hot))
        print(subj, '문항', nq, '계산', nc, 'OX', no, '이미지누락', sum(1 for (y, s), v in qs_all.items() if s == subj for q in v if q.get('missing_img')))
main()
