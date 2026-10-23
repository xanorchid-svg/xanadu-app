# Small WebP previews for the console Instagram page, so it doesn't load full-size slides.
# Writes console/public/social/<post>/p/NN.webp (540px wide) and p/t.webp (160px cover thumb).
# Run after adding or re-rendering any post:  python3 social-tools/previews.py [post-id …]
import sys, os, glob
from PIL import Image
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'console', 'public', 'social')
ids = sys.argv[1:] or sorted(d for d in os.listdir(ROOT) if os.path.isdir(os.path.join(ROOT, d)))
for pid in ids:
    d = os.path.join(ROOT, pid); os.makedirs(os.path.join(d, 'p'), exist_ok=True)
    for f in sorted(glob.glob(os.path.join(d, '[0-9][0-9].jpg'))):
        n = os.path.basename(f)[:2]
        im = Image.open(f).convert('RGB')
        w = 540; h = round(im.height * w / im.width)
        im.resize((w, h), Image.LANCZOS).save(os.path.join(d, 'p', n + '.webp'), quality=80, method=6)
        if n == '01':
            t = im.resize((160, round(im.height * 160 / im.width)), Image.LANCZOS)
            t.save(os.path.join(d, 'p', 't.webp'), quality=78, method=6)
    print(pid)
