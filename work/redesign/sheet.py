import sys, glob, os
from PIL import Image
files = sys.argv[2:]
ims = [Image.open(f).convert('RGB') for f in files]
h = 900
ims = [i.resize((int(i.width*h/i.height), h)) for i in ims]
W = sum(i.width for i in ims) + 10*(len(ims)-1)
out = Image.new('RGB', (W, h), (60,60,60)); x=0
for i in ims: out.paste(i,(x,0)); x+=i.width+10
out.save(sys.argv[1])
