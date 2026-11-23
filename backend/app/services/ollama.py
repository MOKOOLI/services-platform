import httpx

from ..config import settings


class OllamaUnavailable(Exception):
    pass


async def generate(prompt: str, *, model: str | None = None, system: str | None = None) -> str:
    payload = {
        "model": model or settings.ollama_model_default,
        "prompt": prompt,
        "stream": False,
    }
    if system:
        payload["system"] = system
    try:
        async with httpx.AsyncClient(timeout=settings.ollama_timeout) as client:
            r = await client.post(f"{settings.ollama_base_url}/api/generate", json=payload)
            r.raise_for_status()
            return r.json()["response"]
    except (httpx.HTTPError, KeyError) as exc:
        raise OllamaUnavailable(str(exc)) from exc
