import os

def _load_required(key: str) -> list[str]:
    raw = os.environ.get(key)
    if not raw:
        raise RuntimeError(
            f"{key} must be set (comma-separated list)."
        )
    extensions = []
    for part in raw.split(","):
        cleaned = part.strip().lower()
        if not cleaned:
            continue
        if not cleaned.startswith("."):
            cleaned = "." + cleaned
        extensions.append(cleaned)
    if not extensions:
        raise RuntimeError(f"{key} resolved to an empty list. Provide at least one extension.")
    return extensions

ACCEPTED_PLAIN_TEXT_FILE_EXTENSIONS = [
    ".txt",
    ".md",
    ".mdx",
    ".conf",
    ".log",
    ".json",
    ".csv",
    ".tsv",
    ".xml",
    ".yml",
    ".yaml",
    ".sql",
]

ACCEPTED_DOCUMENT_FILE_EXTENSIONS = [
    ".pdf",
    ".docx",
    ".pptx",
    ".xlsx",
    ".eml",
    ".epub",
    ".html",
]

ACCEPTED_IMAGE_FILE_EXTENSIONS = [
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
]

ALLOWED_EXTENSIONS = {
    "plain_text": ACCEPTED_PLAIN_TEXT_FILE_EXTENSIONS,
    "document": ACCEPTED_DOCUMENT_FILE_EXTENSIONS,
    "image": ACCEPTED_IMAGE_FILE_EXTENSIONS,
}

ALLOWED_EXTENSIONS["all"] = sorted(
    set(
        ALLOWED_EXTENSIONS["plain_text"]
        + ALLOWED_EXTENSIONS["document"]
        + ALLOWED_EXTENSIONS["image"]
    )
)