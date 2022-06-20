import os
path = 'C:\WORK\8th Sem\Cloud Computing\ccProject\\face-detector\\backend\downloads'
files = os.listdir(path)


for index, file in enumerate(files):
    os.rename(os.path.join(path, file), os.path.join(path, ''.join(['file',str(index), '.jpg'])))