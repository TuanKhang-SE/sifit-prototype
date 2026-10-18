from pathlib import Path
from urllib.request import urlopen
folder=Path(__file__).resolve().parent.parent/'server/models'
folder.mkdir(exist_ok=True)
target=folder/'face_detection_yunet_2026may.onnx'
if not target.exists():
    with urlopen('https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/face_detection_yunet/face_detection_yunet_2026may.onnx',timeout=60) as r:
        target.write_bytes(r.read())
if target.stat().st_size<100000: raise ValueError('Incomplete YuNet download')
license_file=folder/'YUNET-LICENSE.txt'
if not license_file.exists():
    with urlopen('https://raw.githubusercontent.com/opencv/opencv_zoo/main/models/face_detection_yunet/LICENSE',timeout=30) as r:
        license_file.write_bytes(r.read())
print('Local YuNet face model ready')
