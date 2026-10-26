# Publish the v2 ("quiet photo") renders into console/public/social-v2/<id>/ (the current look in social/ is untouched).
# Usage: python3 social-tools/ig/publish-v2.py [ids…]   (renders come from /home/claude/ig/out-v2, made by render-v2.js)
# Reels without a v2 cover (their text is in the footage) are copied from social/<id>/ so both versions show the full month.
import sys, os, glob, shutil
from PIL import Image, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__))
PUB = os.path.join(HERE, '..', '..', 'console', 'public')
OUT, CUR = os.path.join(PUB, 'social-v2'), os.path.join(PUB, 'social')
SRC = os.environ.get('V2_RENDERS', '/home/claude/ig/out-v2')
KEEP_REELS = ['05-a-season', '10-just-one-week', '14-three-ways-in', '23-day-1-vs-day-30', '24-cost-nothing']

def previews(d):
    os.makedirs(os.path.join(d, 'p'), exist_ok=True)
    for f in sorted(glob.glob(os.path.join(d, '[0-9][0-9].jpg'))):
        n = os.path.basename(f)[:2]; im = Image.open(f).convert('RGB')
        im.resize((540, round(im.height * 540 / im.width)), Image.LANCZOS).save(os.path.join(d, 'p', n + '.webp'), quality=80, method=6)
        if n == '01': im.resize((160, round(im.height * 160 / im.width)), Image.LANCZOS).save(os.path.join(d, 'p', 't.webp'), quality=78, method=6)

ids = sys.argv[1:] or sorted(os.listdir(SRC))
for pid in ids:
    d = os.path.join(OUT, pid); shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
    files = sorted(glob.glob(os.path.join(SRC, pid, '*.png')))
    for f in files:
        n = f.rsplit('-', 1)[1].replace('.png', '')
        im = Image.open(f).convert('RGB').resize((1080, 1350), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=0.6, percent=40, threshold=2))
        im.save(os.path.join(d, n + '.jpg'), quality=95, subsampling=0, optimize=True)
    previews(d); print(pid, len(files))
if not sys.argv[1:]:
    for pid in KEEP_REELS:
        d = os.path.join(OUT, pid); shutil.rmtree(d, ignore_errors=True)
        shutil.copytree(os.path.join(CUR, pid), d); print(pid, 'copied (reel)')
