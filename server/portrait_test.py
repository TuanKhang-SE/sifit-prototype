import unittest
from PIL import Image, ImageDraw
from portrait import compose_portrait


class PortraitTest(unittest.TestCase):
    def person(self):
        image = Image.new('RGBA', (864, 1296))
        draw = ImageDraw.Draw(image)
        # Deliberately off-center, plus one detached background artifact.
        draw.rectangle((65, 260, 240, 1100), fill='#963344')
        draw.ellipse((95, 100, 205, 270), fill='#d9a777')
        draw.rectangle((760, 650, 790, 680), fill='#c0d3e5')
        return image

    def test_centering_floor_and_face_only(self):
        original = self.person()
        image, face = compose_portrait(original, {'x': 110 / 864, 'y': 130 / 1296, 'width': 80 / 864, 'height': 100 / 1296})
        self.assertEqual(image.size, (864, 1296))
        # Centered silhouette, grounded at 1134; background remains white.
        self.assertEqual(image.getpixel((432, 800)), (150, 51, 68))
        self.assertEqual(image.getpixel((30, 250)), (255, 255, 255))
        self.assertEqual(image.getpixel((834, 250)), (255, 255, 255))
        self.assertEqual(image.getpixel((432, 1130)), (150, 51, 68))
        self.assertEqual(image.getpixel((432, 1190)), (255, 255, 255))
        self.assertNotEqual(image.getpixel((432, 1220)), (255, 255, 255))
        center = (round((face['x'] + face['width'] / 2) * 864), round((face['y'] + face['height'] / 2) * 1296))
        self.assertNotEqual(image.getpixel(center), (238, 237, 234))
        clean, _ = compose_portrait(original, {'x': 110 / 864, 'y': 130 / 1296, 'width': 80 / 864, 'height': 100 / 1296}, apply_mask=False)
        self.assertEqual(image.getpixel((432, 800)), clean.getpixel((432, 800)))
        # Same height as face but outside the face has no masking stripe.
        self.assertEqual(image.getpixel((30, center[1])), (255, 255, 255))

    def test_empty_foreground_rejected(self):
        with self.assertRaises(ValueError):
            compose_portrait(Image.new('RGBA', (864, 1296)))


if __name__ == '__main__':
    unittest.main()
