# 연도·과목별 문항 이미지를 세로로 이어 붙인 한 장(sprite)으로 만든다 (아티팩트 파일 수 한도 대응)
# 결과: img/sprite/<연도>-<과목>.png + data/sprites.json {"연도/과목-번호": {"s":경로,"y":..,"h":..,"w":..}}
import sys, glob, json, os
from PIL import Image
years = sys.argv[1:]
out = json.load(open('data/sprites.json')) if os.path.exists('data/sprites.json') else {}
os.makedirs('img/sprite', exist_ok=True)
for y in years:
    for subj in ('jae', 'segae', 'hoegae', 'haeng'):
        fs = sorted(glob.glob(f'img/{y}/{subj}-*.png'))
        # iOS Safari 이미지 픽셀 한도(약 1,670만 px) 아래로 맞추려고 75%로 축소
        ims = [(lambda i: i.resize((int(i.width * .75), int(i.height * .75)), Image.LANCZOS))(Image.open(f).convert('L')) for f in fs]
        W = max(i.width for i in ims); H = sum(i.height for i in ims) + 4 * len(ims)
        sp = Image.new('L', (W, H), 255); yy = 0
        for f, im in zip(fs, ims):
            sp.paste(im, (0, yy)); out[f'{y}/{os.path.basename(f)[:-4]}'] = {'s': f'img/sprite/{y}-{subj}.png', 'y': yy, 'h': im.height, 'w': W}
            yy += im.height + 4
        p = f'img/sprite/{y}-{subj}.png'
        sp.quantize(16, dither=Image.Dither.NONE).save(p, optimize=True)
        print(p, sp.size, os.path.getsize(p) // 1024, 'KB')
json.dump(out, open('data/sprites.json', 'w'), indent=0)
