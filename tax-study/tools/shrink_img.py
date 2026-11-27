# 문항 이미지 여백 제거 + 16단계 회색으로 줄여 용량 축소
import sys, glob
from PIL import Image, ImageOps
for f in [g for a in sys.argv[1:] for g in glob.glob(a + '/*.png')]:
    im = Image.open(f).convert('L')
    box = ImageOps.invert(im).point(lambda v: 255 if v > 40 else 0).getbbox()
    if box: im = im.crop((0, max(box[1] - 8, 0), im.width, min(box[3] + 10, im.height)))
    im.quantize(16, dither=Image.Dither.NONE).save(f, optimize=True)
