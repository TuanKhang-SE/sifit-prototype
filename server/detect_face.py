"""YuNet local full-body face detection. Outputs normalized geometry, no image data."""
import sys, json
from pathlib import Path
import cv2
import numpy as np

cv2.setNumThreads(2)
image=cv2.imdecode(np.fromfile(sys.argv[1], dtype=np.uint8), cv2.IMREAD_COLOR)
if image is None: raise ValueError('Invalid image')
h,w=image.shape[:2]
scale=min(1,1200/max(w,h))
pixels=cv2.resize(image,(round(w*scale),round(h*scale)))
detector=cv2.FaceDetectorYN.create(str(Path(__file__).parent/'models/face_detection_yunet_2026may.onnx'),'',(pixels.shape[1],pixels.shape[0]),.55,.3,5000)
_,faces=detector.detect(pixels)
result=None
if faces is not None and len(faces):
    face=max(faces,key=lambda f:float(f[2]*f[3]))
    x,y,fw,fh=[float(n)/scale for n in face[:4]]
    x=max(0,x-fw*.08);y=max(0,y-fh*.06)
    fw=min(w-x,fw*1.16);fh=min(h-y,fh*1.12)
    result=dict(x=x/w,y=y/h,width=fw/w,height=fh/h)
print(json.dumps(result))
