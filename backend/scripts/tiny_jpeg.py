"""
A minimal baseline JPEG encoder (greyscale, one component), so the stand-in headset can send a real, decodable
eye-view frame without Pillow on the machine. Annex K tables of ITU T.81; nothing clever.

    jpeg = encode_grey(width, height, pixels)       pixels: bytes/bytearray, row-major, 0..255
    jpeg = render_frame(width, height, lines, progress)   a test picture: text lines in a block font + a bar

The pictures it draws are deliberately plain (grey card, dark text): they exist to prove the pipe, not to look
like a theatre.
"""
from __future__ import annotations

import math
from typing import Dict, Iterable, List, Sequence, Tuple

# --- Annex K.1 luminance quantisation table (quality ~50), in natural order ---------------------------------
_Q50 = [
    16, 11, 10, 16, 24, 40, 51, 61,
    12, 12, 14, 19, 26, 58, 60, 55,
    14, 13, 16, 24, 40, 57, 69, 56,
    14, 17, 22, 29, 51, 87, 80, 62,
    18, 22, 37, 56, 68, 109, 103, 77,
    24, 35, 55, 64, 81, 104, 113, 92,
    49, 64, 78, 87, 103, 121, 120, 101,
    72, 92, 95, 98, 112, 100, 103, 99,
]
_ZIGZAG = [
    0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5, 12, 19, 26, 33, 40, 48, 41, 34, 27, 20, 13, 6, 7, 14, 21,
    28, 35, 42, 49, 56, 57, 50, 43, 36, 29, 22, 15, 23, 30, 37, 44, 51, 58, 59, 52, 45, 38, 31, 39, 46, 53, 60, 61,
    54, 47, 55, 62, 63,
]
# --- Annex K.3 standard luminance Huffman tables ------------------------------------------------------------
_DC_BITS = [0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0]
_DC_VALS = list(range(12))
_AC_BITS = [0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 0x7D]
_AC_VALS = [
    0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07, 0x22, 0x71,
    0x14, 0x32, 0x81, 0x91, 0xA1, 0x08, 0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
    0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x34, 0x35, 0x36, 0x37,
    0x38, 0x39, 0x3A, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
    0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7A, 0x83,
    0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
    0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6, 0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3,
    0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9, 0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
    0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4, 0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA,
]


def _huffman_codes(bits: Sequence[int], vals: Sequence[int]) -> Dict[int, Tuple[int, int]]:
    """symbol -> (code, length), built as Annex C describes."""
    codes: Dict[int, Tuple[int, int]] = {}
    code, k = 0, 0
    for length in range(1, 17):
        for _ in range(bits[length - 1]):
            codes[vals[k]] = (code, length)
            code += 1
            k += 1
        code <<= 1
    return codes


_DC_CODES = _huffman_codes(_DC_BITS, _DC_VALS)
_AC_CODES = _huffman_codes(_AC_BITS, _AC_VALS)
_COS = [[math.cos((2 * x + 1) * u * math.pi / 16) for x in range(8)] for u in range(8)]
_C = [1 / math.sqrt(2)] + [1.0] * 7


def _quant_table(quality: int) -> List[int]:
    quality = max(1, min(100, quality))
    scale = 5000 / quality if quality < 50 else 200 - quality * 2
    return [max(1, min(255, int((q * scale + 50) / 100))) for q in _Q50]


class _Bits:
    def __init__(self):
        self.out = bytearray()
        self.acc = 0
        self.n = 0

    def put(self, code: int, length: int) -> None:
        for i in range(length - 1, -1, -1):
            self.acc = (self.acc << 1) | ((code >> i) & 1)
            self.n += 1
            if self.n == 8:
                self.out.append(self.acc)
                if self.acc == 0xFF:
                    self.out.append(0x00)             # byte stuffing
                self.acc, self.n = 0, 0

    def flush(self) -> bytes:
        while self.n:
            self.put(1, 1)                            # pad with ones
        return bytes(self.out)


def _category(v: int) -> int:
    v = abs(v)
    n = 0
    while v:
        n += 1
        v >>= 1
    return n


def _value_bits(v: int, cat: int) -> int:
    return v if v >= 0 else v + (1 << cat) - 1


def _fdct_quant(block: List[float], qt: List[int]) -> List[int]:
    out = [0] * 64
    for v in range(8):
        for u in range(8):
            s = 0.0
            for y in range(8):
                cy = _COS[v][y]
                row = block[y * 8:(y + 1) * 8]
                for x in range(8):
                    s += row[x] * _COS[u][x] * cy
            coef = 0.25 * _C[u] * _C[v] * s
            out[v * 8 + u] = int(round(coef / qt[v * 8 + u]))
    return out


def encode_grey(width: int, height: int, pixels: Sequence[int], quality: int = 55) -> bytes:
    if width < 1 or height < 1 or len(pixels) != width * height:
        raise ValueError("pixels must be width*height bytes")
    qt = _quant_table(quality)
    bits = _Bits()
    prev_dc = 0
    for by in range(0, height, 8):
        for bx in range(0, width, 8):
            block: List[float] = []
            for y in range(8):
                sy = min(height - 1, by + y)
                for x in range(8):
                    sx = min(width - 1, bx + x)
                    block.append(float(pixels[sy * width + sx]) - 128.0)
            q = _fdct_quant(block, qt)
            zz = [q[_ZIGZAG[i]] for i in range(64)]
            diff = zz[0] - prev_dc
            prev_dc = zz[0]
            cat = _category(diff)
            code, length = _DC_CODES[cat]
            bits.put(code, length)
            if cat:
                bits.put(_value_bits(diff, cat), cat)
            run = 0
            for i in range(1, 64):
                v = zz[i]
                if v == 0:
                    run += 1
                    continue
                while run > 15:
                    code, length = _AC_CODES[0xF0]
                    bits.put(code, length)
                    run -= 16
                cat = _category(v)
                code, length = _AC_CODES[(run << 4) | cat]
                bits.put(code, length)
                bits.put(_value_bits(v, cat), cat)
                run = 0
            if run:
                code, length = _AC_CODES[0x00]
                bits.put(code, length)
    scan = bits.flush()

    def seg(marker: int, payload: bytes) -> bytes:
        return bytes([0xFF, marker]) + (len(payload) + 2).to_bytes(2, "big") + payload

    out = bytearray(b"\xff\xd8")
    out += seg(0xE0, b"JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00")
    out += seg(0xDB, bytes([0]) + bytes(qt[_ZIGZAG[i]] for i in range(64)))
    out += seg(0xC0, bytes([8]) + height.to_bytes(2, "big") + width.to_bytes(2, "big") + bytes([1, 1, 0x11, 0]))
    out += seg(0xC4, bytes([0x00]) + bytes(_DC_BITS) + bytes(_DC_VALS))
    out += seg(0xC4, bytes([0x10]) + bytes(_AC_BITS) + bytes(_AC_VALS))
    out += seg(0xDA, bytes([1, 1, 0x00, 0, 63, 0]))
    out += scan
    out += b"\xff\xd9"
    return bytes(out)


# --- a 3x5 block font, enough to label a test frame ---------------------------------------------------------
_FONT = {
    "0": "111101101101111", "1": "010110010010111", "2": "111001111100111", "3": "111001111001111",
    "4": "101101111001001", "5": "111100111001111", "6": "111100111101111", "7": "111001001001001",
    "8": "111101111101111", "9": "111101111001111", ".": "000000000000010", ":": "000010000010000",
    "#": "101111101111101", "-": "000000111000000", " ": "000000000000000", "_": "000000000000111",
    "A": "010101111101101", "B": "110101110101110", "C": "111100100100111", "D": "110101101101110",
    "E": "111100111100111", "F": "111100111100100", "G": "111100101101111", "H": "101101111101101",
    "I": "111010010010111", "K": "101101110101101", "L": "100100100100111", "M": "101111111101101",
    "N": "110101101101101", "O": "111101101101111", "P": "111101111100100", "R": "111101110101101",
    "S": "111100111001111", "T": "111010010010010", "U": "101101101101111", "V": "101101101101010",
    "W": "101101111111101", "X": "101101010101101", "Y": "101101010010010",
}


def _draw_text(canvas: bytearray, width: int, height: int, x0: int, y0: int, text: str, scale: int, shade: int) -> None:
    x = x0
    for ch in text.upper():
        glyph = _FONT.get(ch, _FONT[" "])
        for gy in range(5):
            for gx in range(3):
                if glyph[gy * 3 + gx] == "1":
                    for sy in range(scale):
                        yy = y0 + gy * scale + sy
                        if 0 <= yy < height:
                            row = yy * width
                            for sx in range(scale):
                                xx = x + gx * scale + sx
                                if 0 <= xx < width:
                                    canvas[row + xx] = shade
        x += 4 * scale


def render_frame(width: int, height: int, lines: Iterable[str], progress: float = 0.0, quality: int = 55) -> bytes:
    """A light-grey card with a dark band, up to four text lines, and a progress bar at the foot."""
    canvas = bytearray([200]) * (width * height)
    band = max(8, height // 6)
    for y in range(band):
        canvas[y * width:(y + 1) * width] = bytes([60]) * width
    scale = max(2, width // 100)
    y = band + scale * 2
    for i, line in enumerate(list(lines)[:4]):
        _draw_text(canvas, width, height, scale * 2, y, line, scale if i else scale + 1, 30)
        y += (scale if i else scale + 1) * 6 + scale
    bar_h = max(4, height // 20)
    y0 = height - bar_h - scale
    fill = int(max(0.0, min(1.0, progress)) * (width - 2 * scale))
    for yy in range(y0, y0 + bar_h):
        canvas[yy * width + scale: yy * width + width - scale] = bytes([150]) * (width - 2 * scale)
        if fill:
            canvas[yy * width + scale: yy * width + scale + fill] = bytes([40]) * fill
    return encode_grey(width, height, canvas, quality)


if __name__ == "__main__":
    import sys
    out = sys.argv[1] if len(sys.argv) > 1 else "tiny_jpeg_sample.jpg"
    data = render_frame(320, 180, ["SCENE 4.2", "STEP P2_02", "#17"], 0.35)
    with open(out, "wb") as f:
        f.write(data)
    print(f"wrote {out}: {len(data)} bytes")
