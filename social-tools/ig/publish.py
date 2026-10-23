# Downsample 2x renders (2160x2700) to crisp 1080x1350 JPGs for Instagram: Lanczos, light sharpen, q95, no chroma subsampling.
import sys, os, glob
from PIL import Image, ImageFilter
OUT = '/home/claude/xanadu-app/console/public/social'
for pid in sys.argv[1:]:
    files = sorted(glob.glob(f'/home/claude/ig/out/{pid}/*.png'))
    os.makedirs(f'{OUT}/{pid}', exist_ok=True)
    for f in files:
        n = f.rsplit('-', 1)[1].replace('.png', '')
        im = Image.open(f).convert('RGB')
        if im.width != 1080: im = im.resize((1080, 1350), Image.LANCZOS)
        im = im.filter(ImageFilter.UnsharpMask(radius=0.6, percent=40, threshold=2))
        im.save(f'{OUT}/{pid}/{n}.jpg', quality=95, subsampling=0, optimize=True)
    print(pid, len(files))

# Small previews for the console page
import subprocess
subprocess.run(['python3', '/home/claude/xanadu-app/social-tools/previews.py', *sys.argv[1:]], check=True)
