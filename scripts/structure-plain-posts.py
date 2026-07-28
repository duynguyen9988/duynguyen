#!/usr/bin/env python3
"""Add a light editorial hierarchy to posts that have no Markdown headings.

This is deliberately an authoring tool, not a deployment check. It is
idempotent: only posts marked with the editorial-structure comment are changed.
"""

from __future__ import annotations

import re
from pathlib import Path


POSTS_DIRECTORY = Path("content/posts")
MARKER = "<!-- editorial-structure -->"

SECTION_TITLES = {
    "am-thuc": [
        "Câu chuyện và bối cảnh",
        "Hương vị và trải nghiệm",
        "Điểm nhấn đáng nhớ",
        "Giá trị văn hóa còn lại",
    ],
    "cong-nghe": [
        "Bối cảnh và hành trình phát triển",
        "Những chuyển biến đáng chú ý",
        "Tác động trong thực tế",
        "Góc nhìn về tương lai",
    ],
    "du-lich": [
        "Điểm đến và bối cảnh",
        "Những trải nghiệm nổi bật",
        "Điều đáng lưu ý cho hành trình",
        "Dư vị của chuyến đi",
    ],
    "giai-tri": [
        "Bối cảnh và nội dung",
        "Những điểm đáng chú ý",
        "Dấu ấn và sức ảnh hưởng",
        "Góc nhìn tổng quan",
    ],
    "kinh-nghiem-song": [
        "Vấn đề và bối cảnh",
        "Cách thực hành hiệu quả",
        "Điều cần ghi nhớ",
        "Bước tiếp theo phù hợp",
    ],
    "mua-sam": [
        "Bối cảnh và lựa chọn",
        "Những điểm cần so sánh",
        "Gợi ý trước khi quyết định",
        "Điều đáng cân nhắc",
    ],
    "phim": [
        "Bối cảnh và nội dung",
        "Những điểm nhấn đáng chú ý",
        "Dấu ấn của tác phẩm",
        "Đánh giá tổng quan",
    ],
    "van-hoa": [
        "Nguồn gốc và bối cảnh",
        "Những giá trị nổi bật",
        "Dấu ấn trong đời sống",
        "Điều còn đọng lại",
    ],
}
DEFAULT_TITLES = [
    "Bối cảnh và câu chuyện",
    "Những điểm đáng chú ý",
    "Góc nhìn sâu hơn",
    "Điều còn đọng lại",
]


def extract_category(front_matter: str) -> str | None:
    inline = re.search(r"^categories:\s*\[([^]]+)\]", front_matter, flags=re.MULTILINE)
    candidates = inline.group(1).split(",") if inline else []

    if not candidates:
        block = re.search(r"^categories:\s*\n((?:\s*-\s*.+\n?)+)", front_matter, flags=re.MULTILINE)
        if block:
            candidates = re.findall(r"^\s*-\s*(.+?)\s*$", block.group(1), flags=re.MULTILINE)

    for candidate in candidates:
        category = candidate.strip().strip("'\"")
        if category in SECTION_TITLES:
            return category
    return None


def heading_positions(paragraph_count: int) -> list[int]:
    if paragraph_count <= 2:
        return [1]
    if paragraph_count <= 6:
        return [1, 3]
    if paragraph_count <= 10:
        return [1, 3, 6]
    return [1, 4, 7, 10]


def add_inline_emphasis(block: str) -> str:
    """Highlight concise lead labels such as 'Thói quen đầu tiên:' without noise."""
    if block.startswith(("#", "- ", "* ", ">", "**")):
        return block

    match = re.match(r"^([^\n:]{3,72}:)(\s+)", block)
    if not match:
        return block
    return f"**{match.group(1)}**{match.group(2)}{block[match.end():]}"


def structure_post(path: Path) -> bool:
    source = path.read_text(encoding="utf-8")
    parts = source.split("---", 2)
    if len(parts) != 3:
        raise ValueError(f"Unexpected front matter in {path}")

    _, front_matter, body = parts
    if MARKER in body or re.search(r"^#{2,6}\s+", body, flags=re.MULTILINE):
        return False

    paragraphs = [block.strip() for block in re.split(r"\n\s*\n", body.strip()) if block.strip()]
    if len(paragraphs) < 2:
        return False

    titles = SECTION_TITLES.get(extract_category(front_matter), DEFAULT_TITLES)
    positions = [position for position in heading_positions(len(paragraphs)) if position < len(paragraphs)]
    position_to_title = dict(zip(positions, titles, strict=False))

    structured_blocks = [MARKER]
    for index, paragraph in enumerate(paragraphs):
        if index in position_to_title:
            structured_blocks.append(f"## {position_to_title[index]}")
        structured_blocks.append(add_inline_emphasis(paragraph))

    path.write_text(f"---{front_matter}---\n\n" + "\n\n".join(structured_blocks) + "\n", encoding="utf-8")
    return True


def add_parent_heading(path: Path) -> bool:
    """Give legacy H3-only posts the missing H2 level below the post H1."""
    source = path.read_text(encoding="utf-8")
    if re.search(r"^##\s+", source, flags=re.MULTILINE) or not re.search(r"^###\s+", source, flags=re.MULTILINE):
        return False

    updated = re.sub(r"^(###\s+)", "## Tổng quan\n\n\\1", source, count=1, flags=re.MULTILINE)
    path.write_text(updated, encoding="utf-8")
    return True


def main() -> None:
    paths = sorted(POSTS_DIRECTORY.glob("*/index.md"))
    structured = [path for path in paths if structure_post(path)]
    parent_headings = [path for path in paths if add_parent_heading(path)]
    print(
        "Added editorial structure to "
        f"{len(structured)} post(s) and parent H2 headings to {len(parent_headings)} post(s)."
    )


if __name__ == "__main__":
    main()
