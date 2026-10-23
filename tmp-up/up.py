import sys, os, glob, torch, numpy as np
from PIL import Image
from spandrel import ModelLoader
torch.set_num_threads(4)
shard, n = int(sys.argv[1]), int(sys.argv[2])
model = ModelLoader().load_from_file('x2plus.pth').model.eval()
os.makedirs('tmp-up/out', exist_ok=True)
files = sorted(glob.glob('tmp-up/in/*.jpg'))[shard::n]
T, P = 384, 24  # tile with overlap
for f in files:
    im = np.asarray(Image.open(f).convert('RGB')).astype(np.float32) / 255
    h, w, _ = im.shape
    out = np.zeros((h * 2, w * 2, 3), np.float32)
    x = torch.from_numpy(im).permute(2, 0, 1)[None]
    with torch.no_grad():
        for y0 in range(0, h, T):
            for x0 in range(0, w, T):
                ya, xa = max(0, y0 - P), max(0, x0 - P); yb, xb = min(h, y0 + T + P), min(w, x0 + T + P)
                o = model(x[:, :, ya:yb, xa:xb])[0].permute(1, 2, 0).clamp(0, 1).numpy()
                oy, ox = (y0 - ya) * 2, (x0 - xa) * 2
                th, tw = min(T, h - y0) * 2, min(T, w - x0) * 2
                out[y0*2:y0*2+th, x0*2:x0*2+tw] = o[oy:oy+th, ox:ox+tw]
    Image.fromarray((out * 255 + .5).astype(np.uint8)).save('tmp-up/out/' + os.path.basename(f)[:-4] + '.jpg', quality=96, subsampling=0)
    print('done', f, flush=True)
# rerun
