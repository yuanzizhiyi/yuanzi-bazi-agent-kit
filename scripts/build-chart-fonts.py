"""Build portable OFL font subsets and exact advance metrics for the chart renderer.

Requires fonttools. Pass Noto Sans CJK SC Regular and Noto Serif CJK SC SemiBold
as OTF files or TTC collections; collections select the SC face automatically.
"""
import argparse
import json
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTCollection, TTFont


def load_font(path):
    if path.suffix.lower() == '.ttc':
        return next(font for font in TTCollection(path).fonts
                    if ' SC' in font['name'].getDebugName(1))
    return TTFont(path)


def build_font(source, output, family, chars):
    font = load_font(source)
    available = font.getBestCmap()
    options = subset.Options()
    options.recalc_timestamp = False
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=[ord(c) for c in chars if ord(c) in available])
    subsetter.subset(font)
    for record in font['name'].names:
        if record.nameID in (1, 3, 4, 6, 16):
            value = family.replace(' ', '') if record.nameID == 6 else family
            record.string = value.encode(record.getEncoding())
    # Font identity is fixed, retaining the upstream font's copyright/license records.
    font.save(output)
    units = font['head'].unitsPerEm
    return {chr(code): round(font['hmtx'][glyph][0] / units, 4)
            for code, glyph in sorted(font.getBestCmap().items())}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sans', type=Path, required=True)
    parser.add_argument('--serif', type=Path, required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    chars = set(chr(c) for c in range(32, 127))
    for file in (root / 'src').glob('*.ts'):
        chars.update(file.read_text())
    # Preserve the existing public font's coverage across renderer revisions.
    chars.update(chr(c) for c in TTFont(root / 'assets/YuanziChartSans.otf').getBestCmap())
    chars.update('〇一二三四五六七八九十正冬腊臘闰閏月年初廿卅甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥—·→%')
    metrics = {
        'sans': build_font(args.sans, root / 'assets/YuanziChartSans.otf', 'Yuanzi Chart Sans', chars),
        'serif': build_font(args.serif, root / 'assets/YuanziChartSerif.otf', 'Yuanzi Chart Serif', chars),
    }
    (root / 'assets/chart-font-metrics.json').write_text(json.dumps(metrics, ensure_ascii=False, separators=(',', ':')) + '\n')
    print('Built two portable chart fonts and advance metrics.')


if __name__ == '__main__':
    main()
