"""
Thin wrapper around the Groq client used for all AI generation tasks.
"""

import json
import logging

from groq import Groq

from app.core.config import settings

logger = logging.getLogger(__name__)

_client = None


def get_client():
    global _client

    if _client is None:
        if not settings.GROQ_API_KEY:
            logger.warning("GROQ_API_KEY is not set.")
        _client = Groq(api_key=settings.GROQ_API_KEY)

    return _client


class AIGenerationError(Exception):
    pass


def generate_json(system_prompt: str, user_prompt: str, temperature: float = 0.4) -> dict:
    client = get_client()

    try:
        response = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            temperature=temperature,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": user_prompt,
                },
            ],
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content

        return json.loads(content)

    except json.JSONDecodeError as exc:
        raise AIGenerationError(
            f"LLM returned invalid JSON: {exc}"
        ) from exc

    except Exception as exc:
        raise AIGenerationError(
            f"LLM call failed: {exc}"
        ) from exc