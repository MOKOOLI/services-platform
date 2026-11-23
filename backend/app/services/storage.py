"""S3-compatible object storage (Cloudflare R2 / AWS S3 / Backblaze / MinIO) via presigned URLs.

Browsers upload/download directly to the bucket, so large files never pass through
Vercel (4.5 MB body limit) or the Render web service. The bucket must stay PRIVATE.
"""
from functools import lru_cache
from urllib.parse import quote

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from ..config import settings


def enabled() -> bool:
    return bool(settings.s3_bucket and settings.s3_access_key_id and settings.s3_secret_access_key)


@lru_cache(maxsize=4)
def _client(endpoint: str):
    custom = bool(endpoint)
    return boto3.client(
        "s3",
        endpoint_url=endpoint or None,
        region_name=settings.s3_region,
        aws_access_key_id=settings.s3_access_key_id,
        aws_secret_access_key=settings.s3_secret_access_key,
        config=Config(signature_version="s3v4", s3={"addressing_style": "path" if custom else "auto"}),
    )


def _internal():
    return _client(settings.s3_endpoint_url)


def _public():
    # Presigning is offline (no network); only the host in the URL matters to the browser.
    return _client(settings.s3_public_endpoint_url or settings.s3_endpoint_url)


def presign_put(key: str, content_type: str, expires: int = 600) -> str:
    return _public().generate_presigned_url(
        "put_object",
        Params={"Bucket": settings.s3_bucket, "Key": key, "ContentType": content_type},
        ExpiresIn=expires,
    )


def presign_get(key: str, filename: str, expires: int = 300) -> str:
    disposition = f"attachment; filename*=UTF-8''{quote(filename)}"
    return _public().generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.s3_bucket, "Key": key, "ResponseContentDisposition": disposition},
        ExpiresIn=expires,
    )


def head(key: str) -> int | None:
    """Size in bytes if the object exists, else None."""
    try:
        return int(_internal().head_object(Bucket=settings.s3_bucket, Key=key)["ContentLength"])
    except ClientError as exc:
        if exc.response.get("Error", {}).get("Code") in ("404", "NoSuchKey", "NotFound"):
            return None
        raise


def delete(key: str) -> None:
    _internal().delete_object(Bucket=settings.s3_bucket, Key=key)
