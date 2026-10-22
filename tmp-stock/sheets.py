import json, urllib.request, io, os
from PIL import Image, ImageDraw, ImageFont
from concurrent.futures import ThreadPoolExecutor
C = json.load(open('tmp-stock/cands.json')); os.makedirs('tmp-stock/out', exist_ok=True)
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22)
def fetch(pid):
    try: return Image.open(io.BytesIO(urllib.request.urlopen(f'https://images.unsplash.com/photo-{pid}?w=640&q=75&fm=jpg', timeout=30).read())).convert('RGB')
    except Exception as e: print('fail', pid, e); return None
for g, ids in C.items():
    ids = ids.split()
    with ThreadPoolExecutor(8) as ex: ims = list(ex.map(fetch, ids))
    W, H = 320, 400; cols = 4
    sheet = Image.new('RGB', (W * cols, H * ((len(ids) + cols - 1) // cols)), 'black'); d = ImageDraw.Draw(sheet)
    for i, im in enumerate(ims):
        if im is None: continue
        s = max(W / im.width, H / im.height); im = im.resize((int(im.width * s) + 1, int(im.height * s) + 1))
        l, t = (im.width - W) // 2, (im.height - H) // 2; x, y = (i % cols) * W, (i // cols) * H
        sheet.paste(im.crop((l, t, l + W, t + H)), (x, y)); d.rectangle((x, y, x + 40, y + 30), fill='black'); d.text((x + 8, y + 3), str(i), fill='yellow', font=font)
    sheet.save(f'tmp-stock/out/{g}.jpg', quality=82); print(g)
