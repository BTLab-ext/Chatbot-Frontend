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


ALLOWED_EXTENSIONS = {
    "plain_text": _load_required("USER_FILE_ALLOWED_EXTENSIONS_PLAIN"),
    "document": _load_required("USER_FILE_ALLOWED_EXTENSIONS_DOC"),
    "image": _load_required("USER_FILE_ALLOWED_EXTENSIONS_IMG"),
}

ALLOWED_EXTENSIONS["all"] = sorted(
    set(
        ALLOWED_EXTENSIONS["plain_text"]
        + ALLOWED_EXTENSIONS["document"]
        + ALLOWED_EXTENSIONS["image"]
    )
)