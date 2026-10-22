import json, urllib.request, urllib.parse, time, os, io
from PIL import Image, ImageDraw, ImageFont
Q = json.load(open('tmp-stock/queries.json'))
UA = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36', 'Accept': 'application/json'}
def get(url, tries=4):
    for t in range(tries):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read()
        except Exception as e:
            print('retry', url[:80], e); time.sleep(3 + 4 * t)
    return None
os.makedirs('tmp-stock/out', exist_ok=True)
meta = {}
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22)
for key, q in Q.items():
    raw = get('https://unsplash.com/napi/search/photos?' + urllib.parse.urlencode({'query': q, 'per_page': 30}))
    if not raw: continue
    res = [r for r in json.loads(raw)['results'] if not r.get('premium') and 'plus.unsplash' not in r['urls']['raw'] and min(r['width'], r['height']) >= 2400][:16]
    items = []
    W, H = 300, 375
    sheet = Image.new('RGB', (W * 4, H * 4), 'black'); d = ImageDraw.Draw(sheet)
    for i, r in enumerate(res):
        b = get(r['urls']['raw'] + '&w=600&q=70&fm=jpg')
        if not b: continue
        im = Image.open(io.BytesIO(b)).convert('RGB')
        s = max(W / im.width, H / im.height); im = im.resize((int(im.width * s) + 1, int(im.height * s) + 1))
        l, t = (im.width - W) // 2, (im.height - H) // 2
        x, y = (i % 4) * W, (i // 4) * H
        sheet.paste(im.crop((l, t, l + W, t + H)), (x, y))
        d.rectangle((x, y, x + 46, y + 30), fill='black'); d.text((x + 6, y + 3), str(i), fill='yellow', font=font)
        items.append({'i': i, 'id': r['id'], 'w': r['width'], 'h': r['height'], 'alt': r.get('alt_description'), 'raw': r['urls']['raw'].split('?')[0], 'user': r['user']['name']})
        time.sleep(0.2)
    sheet.save(f'tmp-stock/out/{key}.jpg', quality=80)
    meta[key] = items
    print(key, len(items)); time.sleep(1.5)
json.dump(meta, open('tmp-stock/out/meta.json', 'w'), indent=1)
