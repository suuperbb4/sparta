# 최소 HWP5 본문 텍스트 추출기 (외부 패키지 없이 OLE/CFB + zlib 해석)
import struct, zlib, sys
def cfb_streams(data):
    ssz = 1 << struct.unpack_from('<H', data, 30)[0]; mss = 1 << struct.unpack_from('<H', data, 32)[0]
    nfat, dir0, _, cutoff, mfat0, nmfat, difat0, ndifat = struct.unpack_from('<IIIIIIII', data, 44)
    sec = lambda i: data[512 + i * ssz: 512 + (i + 1) * ssz]
    difat = list(struct.unpack_from('<109I', data, 76)); d = difat0
    for _ in range(ndifat):
        s = sec(d); difat += struct.unpack_from('<%dI' % (ssz // 4 - 1), s); d = struct.unpack_from('<I', s, ssz - 4)[0]
    fat = []
    for f in difat[:nfat]: fat += struct.unpack('<%dI' % (ssz // 4), sec(f))
    def chain(i):
        out = b''
        while i < 0xFFFFFFFA: out += sec(i); i = fat[i]
        return out
    dirs = chain(dir0); ents = []
    for k in range(len(dirs) // 128):
        e = dirs[k * 128:(k + 1) * 128]; nl = struct.unpack_from('<H', e, 64)[0]
        ents.append(dict(name=e[:max(nl - 2, 0)].decode('utf-16le'), type=e[66], l=struct.unpack_from('<I', e, 68)[0],
            r=struct.unpack_from('<I', e, 72)[0], c=struct.unpack_from('<I', e, 76)[0], start=struct.unpack_from('<I', e, 116)[0], size=struct.unpack_from('<I', e, 120)[0]))
    root = ents[0]; ministream = chain(root['start'])
    mfat = []; i = mfat0
    while i < 0xFFFFFFFA and nmfat: mfat += struct.unpack('<%dI' % (ssz // 4), sec(i)); i = fat[i]
    def read(e):
        if e['size'] < cutoff:
            out = b''; i = e['start']
            while i < 0xFFFFFFFA: out += ministream[i * mss:(i + 1) * mss]; i = mfat[i]
            return out[:e['size']]
        return chain(e['start'])[:e['size']]
    res = {}
    def walk(idx, path):
        if idx >= 0xFFFFFFFA: return
        e = ents[idx]; walk(e['l'], path); walk(e['r'], path)
        p = path + [e['name']]
        if e['type'] == 2: res['/'.join(p)] = read(e)
        elif e['type'] == 1: walk(e['c'], p)
    walk(root['c'], []); return res
def hwp_text(path):
    st = cfb_streams(open(path, 'rb').read())
    comp = st['FileHeader'][36] & 1
    out = []
    for k in sorted(x for x in st if x.startswith('BodyText/')):
        b = st[k]; b = zlib.decompress(b, -15) if comp else b; i = 0
        while i < len(b):
            h = struct.unpack_from('<I', b, i)[0]; tag, size = h & 0x3FF, h >> 20; i += 4
            if size == 0xFFF: size = struct.unpack_from('<I', b, i)[0]; i += 4
            if tag == 67:
                t = b[i:i + size]; j = 0; s = ''
                while j < len(t):
                    c = struct.unpack_from('<H', t, j)[0]
                    if c < 32:
                        if c in (9, 10, 13): s += '\t' if c == 9 else '\n'
                        j += 16 if c not in (0, 10, 13, 24, 25, 26, 27, 28, 29, 30, 31) else 2; continue
                    s += chr(c); j += 2
                out.append(s.strip())
            i += size
    return '\n'.join(out)
if __name__ == '__main__': print(hwp_text(sys.argv[1]))
