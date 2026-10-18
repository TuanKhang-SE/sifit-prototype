# Catalog image sources

9 currently listed photos (12 originals supplied; the owner omitted three listings): supplied by the SiFit project owner in src/image/quanao-image.
170 product references: manually selected individual-product crops from Humanbased-AI/Fashion-1K on Hugging Face.
Dataset card and declared OpenRAIL license: https://huggingface.co/datasets/Humanbased-AI/Fashion-1K
Per-image original URL and selection coordinates: src/data/importedCatalog.json.
The originals are outfit boards; the imported images are individual product cutouts selected by reviewed regions and connected foreground components, not generated variants.
Dataset metadata does not establish independent brand endorsement or ownership of every underlying product photograph. This catalog is for the student demo; confirm image rights before commercial publication.
Names describe visible items. Prices, sizes, sellers and condition fields are demo metadata, not real merchant offers.

83 currently listed menswear/footwear images (initially 101; 18 redundant T-shirt listings removed): original Myntra product photograph URLs, joined by product ID from https://huggingface.co/datasets/ashraq/fashion-product-images-small and https://huggingface.co/datasets/johko/fashion-products-small-multimodal-embeddings.
Fixed, visually reviewed selection and original URLs: src/data/mensCatalog.json. The folded shirt, outfit board and underwear references were excluded.
These menswear images retain their original backgrounds; only image resizing and high-quality WebP encoding are applied. No segmentation, generated recolouring, or fabricated clothing variants.
The public dataset availability does not establish a blanket commercial license for the underlying retailer photos. These remain student-demo references with demo pricing and sizes.


130 currently listed everyday apparel photos (30 T-shirts, 50 shorts, 50 trousers; 70 T-shirt listings removed from the initial 200): original Myntra product URLs recorded in `src/data/everydayCatalog.json`.
Metadata source: https://huggingface.co/datasets/mecha2019/fashion-product-images-small (image URL, manufacturer gender, article type and colour).
88 men / 42 women in the current everyday selection, distinct product IDs and SHA-256 source-image hashes; existing menswear URLs excluded. Reviewed multipack/babywear, underwear and obvious mislabelled references removed.
Original scene/background retained. Resize and WebP encoding only; no background extraction or AI generation. Photos can show a model wearing the single advertised item, rather than an outfit collage. Fixed import: `scripts/import-everyday-catalog.py`.
These are noncommercial student-demo references, with illustrative prices/sizes/condition. Public availability is not a blanket commercial license or proof that a garment is secondhand.

120 additional varied apparel/bag photos: original-background Myntra retailer images, recorded in `src/data/varietyCatalog.json`, from the same Fashion Product Images metadata above.
60 men: 18 shirts, 10 sweaters, 8 sweatshirts/hoodies, 10 jackets and 14 jeans.
60 women: 16 dresses, 12 skirts, 12 shirts/blouses, 8 jackets, 6 sweaters and 6 handbags.
Reviewed folded shirt and visibly mislabelled garment references excluded. Fixed import: `scripts/import-variety-catalog.py`; resize and WebP encoding only. Price/size/condition remain illustrative demo metadata.
This replaces the T-shirt-heavy assortment: 88 retailer T-shirt listings were removed; 42 remain (30 men / 12 women), plus other original owner/catalog pieces. Owner-supplied photos remain listed.
