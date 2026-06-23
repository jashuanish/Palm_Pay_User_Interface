import json

nb = json.load(open(r'c:\Users\jashu\Downloads\final_MAIL_EL_Palm_Play\palmpaymodel_training(1).ipynb'))
keywords = ['model','train','cnn','siamese','triplet','embedding','epoch','loss','keras','torch','tensorflow','mobilenet','resnet','efficientnet','metric','unet','segmentation','feature','layer','dense','conv']

for i, c in enumerate(nb['cells']):
    src = ''.join(c['source'])
    if any(kw in src.lower() for kw in keywords):
        print(f'=== Cell {i} ({c["cell_type"]}) ===')
        print(src[:1000])
        print()
