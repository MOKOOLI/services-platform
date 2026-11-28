"""Tiny in-memory sliding-window limiter (per process). Good enough to stop casual abuse on a
single Render instance; use Cloudflare/WAF rules for anything stronger."""
import time
from collections import defaultdict, deque

_hits: dict[str, deque] = defaultdict(deque)


def allow(key: str, limit: int, window: int = 3600) -> bool:
    now = time.monotonic()
    q = _hits[key]
    while q and now - q[0] > window:
        q.popleft()
    if len(q) >= limit:
        return False
    q.append(now)
    return True


def reset() -> None:
    _hits.clear()
