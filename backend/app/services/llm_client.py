"""
Thin wrapper around the OpenAI client used for all AI generation tasks.
"""
import json
import logging

from openai import OpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)

_client: OpenAI | None = None


def get_client() -> OpenAI:
    global _client
    if _client is None:
        if not settings.OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY is not set. AI generation calls will fail.")
        _client = OpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


class AIGenerationError(Exception):
    pass


def generate_json(system_prompt: str, user_prompt: str, temperature: float = 0.4) -> dict:
    """
    Call the LLM with a system + user prompt, requesting a JSON object response,
    and parse the result.
    """
    client = get_client()
    try:
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            temperature=temperature,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except json.JSONDecodeError as exc:
        raise AIGenerationError(f"LLM returned invalid JSON: {exc}") from exc
    except Exception as exc:
        raise AIGenerationError(f"LLM call failed: {exc}") from exc
