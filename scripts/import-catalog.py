from pathlib import Path
import json
from urllib.request import urlopen
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageOps
import numpy as np
from scipy import ndimage
source=Path('artifacts/stylist/fashion-source');source.mkdir(parents=True,exist_ok=True)
def download(n):
 p=source/f'{n:04d}.jpg'
 if not p.exists():
  with urlopen(f'https://huggingface.co/datasets/Humanbased-AI/Fashion-1K/resolve/main/images/{n:04d}.jpg',timeout=60) as response: p.write_bytes(response.read())
list(ThreadPoolExecutor(8).map(download,range(1,97)))
out=Path('public/images/catalog');out.mkdir(parents=True,exist_ok=True)
# Human-reviewed normalized crop boxes. Each reference contains one product.
annotations='''
1|Tops|Áo crop đen họa tiết|0,0,.45,.52
1|Bottoms|Quần short xanh neon|0,.53,.49,1
2|Tops|Áo len cổ V xám|0,0,.55,.49
2|Bottoms|Chân váy dệt xám|.03,.49,.57,1
3|Tops|Áo crop hoa hồng|0,0,.53,.43
3|Bottoms|Chân váy đỏ|0,.44,.53,1
4|Tops|Áo blouse tay phồng nâu|0,0,.51,.43
4|Bottoms|Chân váy maxi đen|.57,0,1,1
5|Bottoms|Đầm đen ánh kim|0,0,.57,1
6|Tops|Áo corset denim xanh|0,0,.53,.51
6|Bottoms|Chân váy denim bất đối xứng|.54,0,1,1
7|Tops|Áo crop hoa tím|0,0,.48,.48
7|Bottoms|Chân váy xòe tím|.51,.42,1,1
8|Bottoms|Đầm satin tím cổ V|0,0,.57,1
9|Bottoms|Đầm hồng tay phồng|0,0,.59,1
10|Bottoms|Đầm hoa vàng|0,0,.56,1
11|Bottoms|Đầm đỏ chấm bi|0,0,.57,1
12|Bottoms|Đầm cam đất thắt eo|0,0,.57,1
13|Bottoms|Đầm blazer xanh satin|0,0,.55,1
14|Outerwear|Áo khoác trench xanh nhạt|0,0,.56,1
15|Tops|Áo crop hai dây nâu|0,0,.48,.43
15|Outerwear|Áo blazer nâu ngắn|.61,0,1,.52
15|Bottoms|Quần short họa tiết nâu|.52,.55,1,1
16|Bottoms|Đầm satin đỏ cổ yếm|0,0,.55,1
17|Bottoms|Đầm hồng cổ yếm|0,0,.55,1
18|Tops|Áo crop đen dài tay|0,0,.59,.48
18|Bottoms|Chân váy caro vàng|.06,.49,.54,1
19|Tops|Áo hai dây hồng|0,0,.5,.42
19|Bottoms|Chân váy hoa vàng|0,.43,.53,1
20|Tops|Áo crop hoa pastel|0,0,.52,.41
20|Bottoms|Chân váy maxi xanh pastel|.52,0,1,1
21|Tops|Áo blouse tím tay phồng|0,0,.58,.39
21|Bottoms|Chân váy caro tím|.52,.48,1,1
22|Tops|Áo sơ mi trắng|0,0,.5,.52
22|Bottoms|Quần dài đen basic|.51,0,1,1
23|Tops|Áo blouse cam tay bồng|0,0,.57,.54
23|Bottoms|Chân váy hoa xanh|.1,.55,.54,1
24|Bottoms|Đầm hoa hồng pastel|0,0,.6,1
25|Bottoms|Đầm đen phối tay xanh|0,0,.6,1
26|Bottoms|Đầm hoa vàng nền đen|0,0,.61,1
27|Tops|Áo sơ mi satin đỏ|0,0,.61,1
28|Bottoms|Đầm ren tím|0,0,.59,1
29|Tops|Áo len crop tím xanh|0,0,.54,.36
29|Bottoms|Chân váy tím pastel|0,.37,.55,1
30|Bottoms|Đầm blazer hồng|0,0,.58,1
31|Outerwear|Áo khoác tím cổ vest|0,0,.58,1
33|Outerwear|Áo blazer be thắt eo|0,0,.58,1
34|Tops|Áo len crop caro hồng|0,0,.48,.52
34|Bottoms|Chân váy caro hồng|.57,.46,1,1
35|Bottoms|Đầm họa tiết xanh đen|0,0,.6,1
36|Bottoms|Đầm sơ mi xanh olive|0,0,.59,1
37|Bottoms|Đầm hoa kem|0,0,.58,1
38|Tops|Áo crop sơ mi hoa|0,0,.56,.36
38|Bottoms|Chân váy maxi đen xếp ly|.57,.39,1,1
39|Bottoms|Đầm hai dây hoa kem|0,0,.59,1
40|Tops|Áo corset kem|0,0,.45,.44
40|Bottoms|Đầm hai dây hoa đỏ|.54,0,1,1
41|Outerwear|Áo khoác thể thao xanh|0,0,.55,1
42|Tops|Áo blouse họa tiết ngựa vằn|0,0,.56,.73
42|Bottoms|Chân váy satin kem|.6,0,1,1
43|Outerwear|Áo khoác lông đen|0,0,.6,.62
43|Bottoms|Quần dài đen ống rộng|.58,0,1,1
44|Outerwear|Áo cardigan xanh nhạt|0,0,.54,.39
44|Bottoms|Chân váy caro xanh|.06,.42,.51,1
45|Bottoms|Đầm xanh chấm bi|0,0,.57,1
46|Outerwear|Áo vest crop caro|0,0,.58,.51
46|Bottoms|Chân váy đen xòe|.54,.5,1,1
47|Tops|Áo crop họa tiết nâu|0,0,.62,.47
47|Bottoms|Quần short xanh neon dáng rộng|.02,.48,.54,1
51|Bottoms|Quần jeans phối đen|.04,.04,.35,.94
51|Tops|Áo crop đen sát nách|.36,.04,.61,.33
51|Outerwear|Áo khoác biker bạc|.59,.19,.94,.68
52|Tops|Áo sơ mi xanh sage|.19,.15,.55,.58
52|Bottoms|Chân váy kem đính nút|.61,.28,.82,.64
53|Outerwear|Áo khoác trench tím|.02,.1,.45,.99
53|Bottoms|Chân váy đen xẻ tà|.7,.39,.96,.97
54|Bottoms|Đầm hoa nhiều màu|0,0,.55,1
56|Outerwear|Áo khoác biker đen|.15,.08,.53,.52
56|Bottoms|Quần trắng ống rộng|.55,.11,.87,.91
57|Bottoms|Đầm blazer hồng thắt eo|0,0,.59,1
58|Tops|Áo sơ mi sọc xanh|.27,0,.84,.47
58|Bottoms|Chân váy xanh lá nút trước|.37,.48,.73,.97
59|Bottoms|Đầm blazer kem|0,0,.59,1
60|Bottoms|Đầm vàng ánh kim|.1,.04,.37,.7
60|Outerwear|Áo khoác dài đen|.52,.04,.93,.8
61|Bottoms|Quần họa tiết đỏ đen|.02,.1,.33,.94
61|Tops|Áo crop trắng lệch vai|.37,.34,.75,.63
62|Outerwear|Áo khoác caro đen trắng|.03,.31,.4,.69
63|Outerwear|Áo khoác crop hồng hoa|.02,0,.54,.72
63|Bottoms|Chân váy hồng ánh kim|.54,.53,1,1
64|Outerwear|Áo khoác trench hồng nhạt|0,0,.53,1
64|Bottoms|Đầm đen hai dây|.5,.02,.76,.96
65|Tops|Áo crop tím tay phồng|.03,.12,.57,.61
65|Bottoms|Chân váy tím xếp tầng|.6,.5,.96,.94
66|Tops|Áo crop dài tay họa tiết xanh|0,0,.58,.61
66|Bottoms|Quần xanh navy ống loe|.6,0,1,1
67|Bottoms|Đầm trắng hoa nhẹ|0,0,.6,1
68|Tops|Áo crop hai dây đen|0,0,.5,.47
68|Bottoms|Chân váy họa tiết bò sữa|.53,.5,1,1
69|Tops|Áo cardigan caro hồng|0,0,.51,.67
69|Bottoms|Quần jeans xanh ống rộng|.56,0,1,1
70|Bottoms|Đầm đen họa tiết hồng xanh|0,0,.56,1
71|Tops|Áo crop đính hạt vàng|0,0,.55,.44
71|Bottoms|Chân váy họa tiết vintage|.54,.49,1,1
72|Outerwear|Áo blazer đen cổ điển|.06,.03,.42,.57
72|Bottoms|Chân váy maxi đen|.46,.19,.69,.87
73|Bottoms|Đầm hoa vàng tay phồng|0,0,.61,1
74|Outerwear|Áo blazer caro xám|.08,.04,.43,.6
74|Bottoms|Đầm trắng dáng dài|.52,.04,.9,.96
75|Outerwear|Áo khoác crop nâu|.08,.13,.35,.63
75|Tops|Áo bralette đen|.42,.21,.61,.48
75|Bottoms|Quần nâu ống loe|.66,.17,.9,.9
76|Tops|Áo len caro xanh|0,0,.52,.49
76|Bottoms|Quần jeans xanh bạc|.54,0,1,1
77|Outerwear|Áo blazer đỏ|.04,.08,.44,.74
77|Bottoms|Chân váy đỏ dáng dài|.63,.1,.96,.92
78|Bottoms|Đầm tím xếp tầng|0,0,.66,1
79|Tops|Áo len crop xanh|0,0,.49,.48
79|Bottoms|Chân váy họa tiết xanh|.5,0,1,1
80|Outerwear|Áo khoác tím cổ lông|0,0,.6,1
81|Bottoms|Đầm hai dây hoa đỏ nền kem|0,0,.6,1
82|Tops|Áo blouse kem buộc eo|0,0,.59,.6
82|Bottoms|Quần nâu ống rộng|.64,0,1,1
83|Tops|Áo len xanh cổ lọ sát nách|0,0,.51,.59
83|Bottoms|Chân váy xanh nhạt|0,.6,.53,1
84|Outerwear|Áo blazer sọc đen|.03,.09,.54,.64
84|Bottoms|Quần da đen|.57,.07,.95,.73
85|Outerwear|Áo khoác lông xanh|0,0,.53,.65
85|Bottoms|Quần jeans xanh olive|.56,0,1,1
86|Tops|Áo crop hai dây kem|0,0,.5,.44
86|Bottoms|Quần da nâu|.53,0,1,1
87|Bottoms|Đầm sơ mi hồng pastel|0,0,.58,1
88|Tops|Áo crop nâu dài tay|0,0,.52,.54
88|Bottoms|Chân váy maxi xếp ly nâu|.56,0,1,1
89|Bottoms|Đầm cam nhạt lệch vai|0,0,.62,1
90|Tops|Áo sơ mi trắng dài tay|.04,.05,.4,.64
90|Bottoms|Quần jeans đen xám|.39,.13,.62,.89
90|Tops|Áo hoodie crop đỏ|.62,.02,.98,.67
91|Tops|Áo blouse đen nơ lớn|0,0,.57,.64
91|Bottoms|Quần caro đỏ|.62,0,1,1
92|Bottoms|Đầm polo xanh nhạt|0,0,.55,1
93|Tops|Áo crop hoa vàng|0,0,.55,.47
93|Bottoms|Chân váy vàng xếp tầng|.54,.55,1,1
94|Tops|Áo crop đỏ tay phồng|0,0,.6,.41
94|Bottoms|Chân váy ánh kim bạc|0,.43,.63,1
95|Outerwear|Áo blazer caro pastel|0,0,.59,.56
95|Bottoms|Chân váy xanh xếp ly|0,.57,.55,1
96|Outerwear|Áo blazer hồng đậm|.01,.09,.52,.72
96|Bottoms|Chân váy hồng đậm|.62,.41,.97,.8
'''
shoe_annotations='''
1|Boots đen dây xanh|.51,.5,1,1
2|Sandal cao gót đen|.58,.68,1,1
3|Sandal đế cao hoa đỏ|.6,.63,1,1
4|Giày cao gót đen|.14,.61,.51,1
5|Giày cao gót đen đính đá|.61,.52,1,1
6|Boots xanh ánh kim|.07,.59,.52,1
7|Giày cao gót tím|0,.67,.47,1
8|Boots satin tím|.61,.66,1,1
9|Giày cao gót hồng|.56,.66,1,1
10|Sandal cao gót kem|.65,.66,1,1
11|Sandal trắng|.63,.65,1,1
12|Sandal cao gót ánh kim|.64,.67,1,1
13|Giày cao gót xanh satin|.6,.67,1,1
14|Boots đen cổ cao|.63,.57,1,1
15|Sandal họa tiết nâu|0,.67,.48,1
16|Giày cao gót đỏ satin|.58,.66,1,1
17|Boots cao gót hồng|.58,.69,1,1
18|Boots đen cổ thấp|.62,.58,1,1
19|Sandal cao gót kem|.55,.66,1,1
20|Boots lông hồng|.07,.68,.49,1
21|Sandal cao gót tím|0,.67,.49,1
22|Sneaker trắng cổ cao|0,.65,.38,1
23|Giày cao gót đen đính hoa|.64,.71,1,1
24|Giày cao gót hoa hồng|.67,.69,1,1
25|Sandal đen đế cao|.58,.63,1,1
26|Boots cao gót họa tiết vàng|.59,.63,1,1
27|Giày cao gót đỏ mũi nhọn|.64,.68,1,1
28|Giày cao gót tím bóng|.61,.64,1,1
29|Sandal cao gót tím trong|.62,.67,1,1
30|Giày cao gót hồng nhạt|.61,.6,1,1
31|Boots tím họa tiết|.61,.64,1,1
'''
records=[]
for line in annotations.strip().splitlines():
 n,category,title,box=line.split('|');records.append((int(n),category,title,tuple(map(float,box.split(',')))))
for line in shoe_annotations.strip().splitlines():
 n,title,box=line.split('|');records.append((int(n),'Footwear',title,tuple(map(float,box.split(',')))))
for line in '''
1|Túi đen quai ngắn|.5,.22,1,.65
2|Túi xách họa tiết xám|.57,.28,1,.66
7|Túi ánh kim bạc|.5,0,1,.43
8|Túi xách họa tiết nhiều màu|.62,.38,1,.65
9|Túi hồng chần bông|.59,.37,1,.67
10|Túi kem quai cong|.61,.35,1,.66
11|Túi cói vàng|.57,.39,1,.65
12|Túi hoa hồng vàng|.6,.35,1,.63
13|Túi đen đính dây xích|.55,.3,1,.62
14|Túi đen dáng hộp|.59,.28,1,.55
'''.strip().splitlines():
 n,title,box=line.split('|');records.append((int(n),'Accessories',title,tuple(map(float,box.split(',')))))
print('crops',len(records))
# Add only as many individual products as requested, never cloned colour variants.
records=records[:190]
# Reject sources with overlapping garments; split references would be misleading.
records=[r for r in records if r[0] not in {2,47,58,77,83,87,90} and not (r[0] in {43,60,85} and r[1]=='Outerwear') and not (r[0]==88 and r[1]=='Tops')]
# The skirt in board 44 is at bottom right, not below the cardigan.
records=[(n,c,t,(.53,.46,1,1) if n==44 and c=='Bottoms' else b) for n,c,t,b in records]

items=[]
for i,(n,category,title,box) in enumerate(records):
 im=Image.open(source/f'{n:04d}.jpg').convert('RGB');w,h=im.size
 # Select the full connected product around its reviewed region. This keeps
 # long sleeves intact and removes disconnected props from the source board.
 rgb=np.array(im); foreground=np.min(rgb,axis=2)<243
 foreground=ndimage.binary_closing(foreground,iterations=1)
 labels,count=ndimage.label(foreground)
 x0,y0,x1,y1=tuple(round(v*(w if j%2==0 else h)) for j,v in enumerate(box))
 counts=np.bincount(labels[y0:y1,x0:x1].ravel(),minlength=count+1);counts[0]=0
 chosen=int(counts.argmax());mask=labels==chosen
 mask=ndimage.binary_fill_holes(mask);mask=ndimage.binary_dilation(mask,iterations=2)
 ys,xs=np.where(mask)
 if not len(xs): raise ValueError(f'No product in source {n}')
 # Keep an identified product, without inventing occluded fabric.
 cleaned=np.where(mask[:,:,None],rgb,255).astype(np.uint8)
 crop=Image.fromarray(cleaned).crop((max(0,int(xs.min())-8),max(0,int(ys.min())-8),min(w,int(xs.max())+9),min(h,int(ys.max())+9)))
 canvas=Image.new('RGB',(640,850),'white');crop=ImageOps.contain(crop,(592,802),Image.Resampling.LANCZOS);canvas.paste(crop,((640-crop.width)//2,(850-crop.height)//2))
 filename=f'fashion-{i+1:03d}.webp';canvas.save(out/filename,'WEBP',quality=91)
 items.append(dict(_id=f'fashion_{i+1:03d}',title=title,category=category,images=[f'/images/catalog/{filename}'],source=dict(processing='Reviewed region; largest connected product extracted with original colours',platform='Hugging Face / Fashion-1K',url=f'https://huggingface.co/datasets/Humanbased-AI/Fashion-1K/blob/main/images/{n:04d}.jpg',license='OpenRAIL (dataset card)',crop=list(box))))
local_titles=[('Quần ống rộng màu kem','Bottoms'),('Áo sơ mi caro xám','Tops'),('Quần cargo nâu','Bottoms'),('Áo blouse đen thêu hoa','Tops'),('Quần đen ống rộng','Bottoms'),('Quần cargo trắng','Bottoms'),('Áo sơ mi denim xanh đậm','Tops'),('Áo khoác denim đen','Outerwear'),('Đầm sát nách caro trắng','Bottoms'),('Đầm caro cổ V','Bottoms'),('Áo khoác denim đen khóa kéo','Outerwear'),('Quần short denim xanh','Bottoms')]
for i,p in enumerate(sorted(Path('src/image/quanao-image').glob('*'))):
 im=ImageOps.exif_transpose(Image.open(p)).convert('RGB');im.thumbnail((1000,1400),Image.Resampling.LANCZOS);filename=f'local-{i+1:02d}.webp';im.save(out/filename,'WEBP',quality=92)
 title,category=local_titles[i];items.insert(i,dict(_id=f'local_{i+1:02d}',title=title,category=category,images=[f'/images/catalog/{filename}'],source=dict(platform='User supplied',file=p.name)))
Path('src/data/importedCatalog.json').write_text(json.dumps(items,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
Path('public/images/catalog/SOURCES.md').write_text('''# Catalog image sources

12 photos: supplied by the SiFit project owner in src/image/quanao-image.
170 product references: manually selected individual-product crops from Humanbased-AI/Fashion-1K on Hugging Face.
Dataset card and declared OpenRAIL license: https://huggingface.co/datasets/Humanbased-AI/Fashion-1K
Per-image original URL and selection coordinates: src/data/importedCatalog.json.
The originals are outfit boards; the imported images are individual product cutouts selected by reviewed regions and connected foreground components, not generated variants.
Dataset metadata does not establish independent brand endorsement or ownership of every underlying product photograph. This catalog is for the student demo; confirm image rights before commercial publication.
Names describe visible items. Prices, sizes, sellers and condition fields are demo metadata, not real merchant offers.
''',encoding='utf-8')
print('imported',len(items))
