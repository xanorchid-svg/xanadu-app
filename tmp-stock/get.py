# Download chosen photos at high resolution: {"name": "https://images.unsplash.com/photo-..."}
import json, urllib.request, os, time
os.makedirs('tmp-stock/full', exist_ok=True)
UA = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/124 Safari/537.36'}
for name, raw in json.load(open('tmp-stock/get.json')).items():
    for t in range(4):
        try:
            b = urllib.request.urlopen(urllib.request.Request(raw + '?w=2700&q=90&fm=jpg', headers=UA), timeout=60).read()
            open(f'tmp-stock/full/{name}.jpg', 'wb').write(b); print(name, len(b)); break
        except Exception as e:
            print('retry', name, e); time.sleep(4)
