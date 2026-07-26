import json
import os
import re
import sys
from pathlib import Path

try:
    import frontmatter
except ImportError:
    print("pip install python-frontmatter")
    sys.exit(1)

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
except ImportError:
    print("pip install scikit-learn")
    sys.exit(1)


CONTENT_DIR = "content/posts"
OUTPUT = "data/related.json"
TOP_N = 4

VIETNAMESE_STOP_WORDS = frozenset(
    "và của có một trong những được các không với cho là này khi sẽ người "
    "từ tại hoặc đây vào năm ở ra lên xuống đi lại về cũng đã sau trên dưới "
    "bên giữa nếu thì mà để bởi vì nên do vẫn chưa rất quá hơn kém nhất "
    "nhưng còn đang bị bị đã từng nào đều vậy thế nhé ạ nhỉ mà cũng được "
    "để phải hay qua đến với đã từ nào mọi mỗi các vài những đều cùng "
    "the to and of in for that with its from this are was been were have "
    "has had more than their them they what about "
    "khiến giúp mang đến làm vào theo giữa thông qua vì thế do đó "
    "tuy nhiên vậy nên bởi vì chính vì thế"
)


def extract_slug(filepath: Path) -> str:
    post = frontmatter.loads(filepath.read_text(encoding="utf-8"))
    slug = post.metadata.get("slug")
    if slug:
        return slug
    return filepath.parent.name


def build_text(filepath: Path) -> str:
    post = frontmatter.loads(filepath.read_text(encoding="utf-8"))

    title = post.metadata.get("title", "")
    tags = " ".join(post.metadata.get("tags", []))
    categories = " ".join(post.metadata.get("categories", []))
    body = post.content

    body_clean = re.sub(r"<[^>]+>", " ", body)
    body_clean = re.sub(r"[#*\-\[\]()>`|~]", " ", body_clean)
    body_clean = re.sub(r"\s+", " ", body_clean).strip()[:5000]

    return f"{title} {title} {title} {tags} {tags} {categories} {categories} {body_clean}"


def main():
    files = sorted(Path(CONTENT_DIR).glob("*/index.md"))
    if not files:
        print("No posts found.")
        return

    texts = []
    slugs = []
    for f in files:
        text = build_text(f)
        slug = extract_slug(f)
        texts.append(text)
        slugs.append(slug)
        print(f"  {slug}")

    vec = TfidfVectorizer(
        max_features=5000,
        stop_words=sorted(VIETNAMESE_STOP_WORDS),
        min_df=1,
        max_df=0.85,
        sublinear_tf=True,
    )

    tfidf = vec.fit_transform(texts)
    sim = cosine_similarity(tfidf)

    related = {}
    for i, slug in enumerate(slugs):
        scores = [(j, float(sim[i][j])) for j in range(len(slugs)) if i != j]
        scores.sort(key=lambda x: -x[1])
        related[slug] = [
            {"slug": slugs[j], "score": round(s, 4)} for j, s in scores[:TOP_N]
        ]

    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(related, f, indent=2, ensure_ascii=False)

    print(f"\nDone. {len(slugs)} posts, top {TOP_N} related each → {OUTPUT}")


if __name__ == "__main__":
    main()
