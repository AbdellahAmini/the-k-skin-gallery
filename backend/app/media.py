"""Content-addressed catalog media, with local and S3-compatible storage."""
import hashlib
import os
from io import BytesIO
from pathlib import Path


def store_image(data: bytes, filename: str | None = None) -> str:
    from PIL import Image, ImageOps
    Image.MAX_IMAGE_PIXELS = 30_000_000
    with Image.open(BytesIO(data)) as image:
        if image.width * image.height > Image.MAX_IMAGE_PIXELS:
            raise ValueError("Image trop grande (30 mégapixels maximum)")
        image = ImageOps.exif_transpose(image)
        image.thumbnail((1800, 1800))
        image = image.convert("RGBA" if "A" in image.getbands() else "RGB")
        buffer = BytesIO()
        image.save(buffer, "WEBP", quality=88, method=6)
    optimized = buffer.getvalue()
    if filename:
        clean_name = filename.strip("/\\")
        if not clean_name.startswith("assets/catalog/imported/"):
            clean_name = f"assets/catalog/imported/{Path(clean_name).name}"
        key = clean_name
    else:
        key = f"assets/catalog/imported/{hashlib.sha256(optimized).hexdigest()}.webp"
    storage = os.getenv("MEDIA_STORAGE", "local")
    if storage == "local":
        target = Path(__file__).resolve().parents[2] / "public" / key
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(optimized)
        return f"/{key}"
    if storage == "s3":
        import boto3
        bucket = os.environ["MEDIA_S3_BUCKET"]
        base_url = os.environ["MEDIA_PUBLIC_BASE_URL"].rstrip("/")
        client = boto3.client("s3", endpoint_url=os.getenv("MEDIA_S3_ENDPOINT_URL"),
                              region_name=os.getenv("AWS_DEFAULT_REGION", "us-east-1"))
        client.put_object(Bucket=bucket, Key=key, Body=optimized,
                          ContentType="image/webp", CacheControl="public,max-age=31536000,immutable")
        return f"{base_url}/{key}"
    raise ValueError("MEDIA_STORAGE doit être local ou s3")
