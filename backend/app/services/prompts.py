"""
Centralized prompt templates for all AI generation tasks.

All generation prompts instruct the model to return strict JSON so that
responses can be parsed reliably by the service layer.
"""

NOTES_SYSTEM_PROMPT = """You are an expert academic tutor and note-taking specialist.
You create clear, well-structured study notes from raw educational content.
Always respond with valid JSON only, no markdown fences, no commentary."""

NOTES_USER_PROMPT_TEMPLATE = """Generate {note_type} study notes from the following content.

NOTE TYPE GUIDELINES:
- detailed: Include main concepts, key definitions, important points, examples, and explanations of any diagrams/figures referenced. Be thorough.
- concise: Short, to-the-point bullet notes covering only the essentials.
- exam_revision: Focused on what is likely to be tested - key terms, formulas, and high-yield facts.
- one_page: A single page summary covering the whole content at a high level.
- topic_wise: Organize the notes strictly by topic/sub-topic headings found in the content.

CONTENT:
{content}

Respond with JSON in this exact shape:
{{
  "title": "string - a descriptive title for these notes",
  "topic": "string - the main topic/subject covered",
  "chapter": "string or null - chapter name if identifiable",
  "content": "string - the full notes content in markdown format"
}}
"""

FLASHCARD_SYSTEM_PROMPT = """You are an expert at creating effective study flashcards.
Each flashcard should test a single, clear concept and have a concise but complete answer.
Always respond with valid JSON only, no markdown fences, no commentary."""

FLASHCARD_USER_PROMPT_TEMPLATE = """Generate exactly {count} flashcards from the following content.
Distribute difficulty across easy, medium, and hard (roughly evenly unless a specific difficulty is requested).
{difficulty_instruction}

CONTENT:
{content}

Respond with JSON in this exact shape:
{{
  "flashcards": [
    {{
      "question": "string",
      "answer": "string",
      "topic": "string - short topic label",
      "difficulty": "easy" | "medium" | "hard"
    }}
  ]
}}
"""

MCQ_SYSTEM_PROMPT = """You are an expert exam question writer.
You create high-quality multiple choice questions with exactly four options (A-D),
one correct answer, and a clear explanation of why the answer is correct.
Always respond with valid JSON only, no markdown fences, no commentary."""

MCQ_USER_PROMPT_TEMPLATE = """Generate exactly {count} multiple choice questions (MCQs) from the following content.
Distribute difficulty across easy, medium, and hard.
{difficulty_instruction}

CONTENT:
{content}

Respond with JSON in this exact shape:
{{
  "mcqs": [
    {{
      "question": "string",
      "options": {{"A": "string", "B": "string", "C": "string", "D": "string"}},
      "correct_option": "A" | "B" | "C" | "D",
      "explanation": "string - why the correct answer is correct",
      "topic": "string - short topic label",
      "difficulty": "easy" | "medium" | "hard"
    }}
  ]
}}
"""

SUMMARY_SYSTEM_PROMPT = """You are an expert academic summarizer.
You produce summaries at the requested length while highlighting key concepts,
formulas, facts, and exam tips. Always respond with valid JSON only, no markdown
fences, no commentary."""

SUMMARY_LENGTH_GUIDELINES = {
    "short": "Write a concise summary of approximately 100-200 words.",
    "medium": "Write a balanced summary of approximately 300-500 words.",
    "detailed": "Write a comprehensive summary of at least 1000 words covering all major points.",
}

SUMMARY_USER_PROMPT_TEMPLATE = """Generate a chapter/document summary from the following content.

LENGTH REQUIREMENT: {length_guideline}

CONTENT:
{content}

Respond with JSON in this exact shape:
{{
  "title": "string - descriptive title",
  "chapter": "string or null - chapter name if identifiable",
  "content": "string - the summary text in markdown",
  "key_concepts": "string - bullet list (markdown) of key concepts",
  "important_formulas": "string or null - bullet list (markdown) of formulas, or null if none",
  "important_facts": "string - bullet list (markdown) of important facts",
  "exam_tips": "string - bullet list (markdown) of exam tips"
}}
"""

STUDY_GUIDE_SYSTEM_PROMPT = """You are an expert exam preparation coach.
You analyze study material and produce an actionable exam preparation guide.
Always respond with valid JSON only, no markdown fences, no commentary."""

STUDY_GUIDE_USER_PROMPT_TEMPLATE = """Based on the following content (and any notes/summaries provided),
generate an exam preparation study guide.

CONTENT:
{content}

Respond with JSON in this exact shape:
{{
  "important_topics": ["string", ...],
  "weak_areas": ["string", ... - topics that are commonly difficult or complex],
  "recommended_revision_order": ["string", ... - ordered list of topics],
  "last_minute_revision_sheet": "string - markdown - extremely condensed must-know points",
  "quick_facts_sheet": "string - markdown - bullet list of quick facts/definitions"
}}
"""

RAG_SYSTEM_PROMPT = """You are an AI study assistant. Answer the user's question using ONLY
the provided context chunks from their uploaded document. If the answer cannot be found in
the context, say so honestly rather than making something up. Cite which chunks you used.
Always respond with valid JSON only, no markdown fences, no commentary."""

RAG_USER_PROMPT_TEMPLATE = """CONTEXT CHUNKS:
{context}

CONVERSATION HISTORY:
{history}

QUESTION:
{question}

Respond with JSON in this exact shape:
{{
  "answer": "string - a clear, helpful answer in markdown, based only on the context",
  "used_chunk_ids": ["string", ... - the chunk_id values from CONTEXT CHUNKS that were used]
}}
"""
