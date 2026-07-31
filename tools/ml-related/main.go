package main

import (
	"encoding/json"
	"fmt"
	"math"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"unicode"
)

const (
	contentDir   = "content/posts"
	output       = "data/related.json"
	topN         = 4
	maxFeatures  = 5000
	maxDF        = 0.85
	bodyCharLimit = 5000
)

var vietnameseStopWords = map[string]bool{}

func init() {
	words := strings.Fields(`và của có một trong những được các không với cho là này khi sẽ người
từ tại hoặc đây vào năm ở ra lên xuống đi lại về cũng đã sau trên dưới
bên giữa nếu thì mà để bởi vì nên do vẫn chưa rất quá hơn kém nhất
nhưng còn đang bị bị đã từng nào đều vậy thế nhé ạ nhỉ mà cũng được
để phải hay qua đến với đã từ nào mọi mỗi các vài những đều cùng
the to and of in for that with its from this are was been were have
has had more than their them they what about
khiến giúp mang đến làm vào theo giữa thông qua vì thế do đó
tuy nhiên vậy nên bởi vì chính vì thế`)
	for _, w := range words {
		vietnameseStopWords[w] = true
	}
}

type Post struct {
	Slug  string
	Title string
	Tags  []string
	Cats  []string
	Body  string
}

var (
	htmlTagRE = regexp.MustCompile(`<[^>]+>`)
	junkRE = regexp.MustCompile("[#*\\-\\[\\]()>`|~]")
	spaceRE   = regexp.MustCompile(`\s+`)
)

// tokenize mimics sklearn's default token pattern `(?u)\b\w\w+\b` + lowercase.
func tokenize(s string) []string {
	var tokens []string
	var cur []rune
	flush := func() {
		if len(cur) >= 2 {
			tokens = append(tokens, strings.ToLower(string(cur)))
		}
		cur = nil
	}
	for _, r := range s {
		if unicode.IsLetter(r) || unicode.IsNumber(r) || r == '_' {
			cur = append(cur, r)
		} else {
			flush()
		}
	}
	flush()
	return tokens
}

func buildText(p *Post) string {
	var sb strings.Builder
	// title x3, tags x2, categories x2 (joined by space), then cleaned body
	sb.WriteString(p.Title)
	for i := 0; i < 2; i++ {
		sb.WriteString(" ")
		sb.WriteString(p.Title)
	}
	tags := strings.Join(p.Tags, " ")
	sb.WriteString(" ")
	sb.WriteString(tags)
	sb.WriteString(" ")
	sb.WriteString(tags)
	cats := strings.Join(p.Cats, " ")
	sb.WriteString(" ")
	sb.WriteString(cats)
	sb.WriteString(" ")
	sb.WriteString(cats)

	body := htmlTagRE.ReplaceAllString(p.Body, " ")
	body = junkRE.ReplaceAllString(body, " ")
	body = spaceRE.ReplaceAllString(body, " ")
	body = strings.TrimSpace(body)
	// Python slices by code point (len(body) counts Unicode chars), not bytes
	runes := []rune(body)
	if len(runes) > bodyCharLimit {
		runes = runes[:bodyCharLimit]
	}
	body = string(runes)
	sb.WriteString(" ")
	sb.WriteString(body)
	return sb.String()
}

func tokenCounts(text string) (map[string]int, map[string]int) {
	counts := make(map[string]int)
	seen := make(map[string]int)
	for _, t := range tokenize(text) {
		if vietnameseStopWords[t] {
			continue
		}
		counts[t]++
		if _, ok := seen[t]; !ok {
			seen[t] = len(seen)
		}
	}
	return counts, seen
}

func main() {
	dirs, err := filepath.Glob(filepath.Join(contentDir, "*/index.md"))
	if err != nil {
		fmt.Fprintln(os.Stderr, "glob error:", err)
		os.Exit(1)
	}
	sort.Strings(dirs)
	if len(dirs) == 0 {
		fmt.Println("No posts found.")
		return
	}

	var posts []*Post
	for _, f := range dirs {
		data, err := os.ReadFile(f)
		if err != nil {
			fmt.Fprintln(os.Stderr, "read error:", f, err)
			os.Exit(1)
		}
		p := parseFrontmatter(string(data), filepath.Base(filepath.Dir(f)))
		posts = append(posts, p)
		fmt.Printf("  %s\n", p.Slug)
	}

	n := len(posts)

	// Document frequencies
	df := make(map[string]int)
	firstSeen := make(map[string]int)
	order := 0
	for _, p := range posts {
		text := buildText(p)
		counts, _ := tokenCounts(text)
		// firstSeen: iterate tokens in document order (map iteration is random)
		for _, t := range tokenize(text) {
			if vietnameseStopWords[t] {
				continue
			}
			if _, ok := firstSeen[t]; !ok {
				firstSeen[t] = order
				order++
			}
		}
		for t := range counts {
			df[t]++
		}
	}

	// max_df filter
	maxDocCount := int(math.Floor(maxDF*float64(n))) + 1
	vocab := make(map[string]int)
	{
		terms := make([]string, 0, len(firstSeen))
		for t := range firstSeen {
			terms = append(terms, t)
		}
		sort.Slice(terms, func(i, j int) bool { return firstSeen[terms[i]] < firstSeen[terms[j]] })
		for _, t := range terms {
			if df[t] >= maxDocCount {
				continue
			}
			vocab[t] = len(vocab)
		}
	}

	// max_features: keep top 5000 by corpus count (ties by first occurrence)
	if os.Getenv("NO_MAX_FEATURES") == "" && len(vocab) > maxFeatures {
		corpus := make(map[string]int)
		for _, p := range posts {
			counts, _ := tokenCounts(buildText(p))
			for t, c := range counts {
				corpus[t] += c
			}
		}
		type termScore struct {
			term  string
			count int
			first int
		}
		scores := make([]termScore, 0, len(vocab))
		for t := range vocab {
			scores = append(scores, termScore{t, corpus[t], firstSeen[t]})
		}
		sort.Slice(scores, func(i, j int) bool {
			if scores[i].count != scores[j].count {
				return scores[i].count > scores[j].count
			}
			return scores[i].first < scores[j].first
		})
		vocab = make(map[string]int)
		for i, s := range scores[:maxFeatures] {
			vocab[s.term] = i
		}
	}

	// TF-IDF vectors (sublinear tf, smooth idf, L2 normalized)
	idf := make(map[string]float64)
	for t := range vocab {
		idf[t] = math.Log(float64(1+n)/float64(1+df[t])) + 1.0
	}

	vectors := make([][]float64, n)
	for i, p := range posts {
		counts, _ := tokenCounts(buildText(p))
		v := make([]float64, len(vocab))
		for t, c := range counts {
			if idx, ok := vocab[t]; ok {
				// sublinear_tf = 1 + log(tf)
				v[idx] = (1.0 + math.Log(float64(c))) * idf[t]
			}
		}
		norm := 0.0
		for _, x := range v {
			norm += x * x
		}
		norm = math.Sqrt(norm)
		if norm > 0 {
			for j := range v {
				v[j] /= norm
			}
		}
		vectors[i] = v
	}

	related := make(map[string][]map[string]any)
	slugs := make([]string, n)
	for i, p := range posts {
		slugs[i] = p.Slug
	}
	for i := 0; i < n; i++ {
		type scored struct {
			idx   int
			score float64
		}
		scores := make([]scored, 0, n-1)
		for j := 0; j < n; j++ {
			if i == j {
				continue
			}
			dot := 0.0
			vi, vj := vectors[i], vectors[j]
			for k := range vi {
				dot += vi[k] * vj[k]
			}
			scores = append(scores, scored{j, dot})
		}
		sort.Slice(scores, func(a, b int) bool { return scores[a].score > scores[b].score })
		if len(scores) > topN {
			scores = scores[:topN]
		}
		list := make([]map[string]any, 0, len(scores))
		for _, s := range scores {
			list = append(list, map[string]any{
				"slug":  slugs[s.idx],
				"score": round4(s.score),
			})
		}
		related[slugs[i]] = list
	}

	if err := os.MkdirAll(filepath.Dir(output), 0o755); err != nil {
		fmt.Fprintln(os.Stderr, "mkdir error:", err)
		os.Exit(1)
	}
	f, err := os.Create(output)
	if err != nil {
		fmt.Fprintln(os.Stderr, "create error:", err)
		os.Exit(1)
	}
	defer f.Close()

	enc := json.NewEncoder(f)
	enc.SetIndent("", "  ")
	enc.SetEscapeHTML(false)
	if err := enc.Encode(related); err != nil {
		fmt.Fprintln(os.Stderr, "encode error:", err)
		os.Exit(1)
	}
	if os.Getenv("DUMP_VOCAB") != "" {
		dumpVocab(vocab, firstSeen)
	}

	fmt.Printf("\nDone. %d posts, top %d related each → %s\n", n, topN, output)
}


func dumpVocab(vocab map[string]int, firstSeen map[string]int) {
	terms := make([]string, 0, len(vocab))
	for t := range vocab {
		terms = append(terms, t)
	}
	sort.Slice(terms, func(i, j int) bool { return vocab[terms[i]] < vocab[terms[j]] })
	f, _ := os.Create("/tmp/go-vocab.txt")
	defer f.Close()
	for _, t := range terms {
		fmt.Fprintln(f, t)
	}
}

func round4(x float64) float64 {
	return math.Round(x*10000) / 10000
}

// parseFrontmatter extracts slug/title/tags/categories from YAML frontmatter.
func parseFrontmatter(content string, dirSlug string) *Post {
	p := &Post{Slug: dirSlug}
	lines := strings.Split(content, "\n")
	inFM := false
	var listKey string
	var bodyLines []string
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if !inFM {
			if strings.HasPrefix(trimmed, "---") {
				inFM = true
				continue
			}
		} else {
			if strings.HasPrefix(trimmed, "---") {
				inFM = false
				continue
			}
			if inFM {
				if strings.HasPrefix(trimmed, "-") {
					if listKey != "" {
						item := strings.TrimSpace(strings.TrimPrefix(trimmed, "-"))
						item = strings.Trim(item, `"'`)
						switch listKey {
						case "tags":
							p.Tags = append(p.Tags, item)
						case "categories":
							p.Cats = append(p.Cats, item)
						}
					}
					continue
				}
				// Skip nested keys (e.g. resources block has its own title/name)
				if line != "" && (line[0] == ' ' || line[0] == '\t') {
					continue
				}
				idx := strings.Index(line, ":")
				if idx <= 0 {
					continue
				}
				key := strings.TrimSpace(line[:idx])
				val := strings.TrimSpace(line[idx+1:])
				val = strings.Trim(val, `"'`)
				if strings.HasPrefix(val, "[") && strings.HasSuffix(val, "]") {
					inner := strings.TrimSuffix(strings.TrimPrefix(val, "["), "]")
					for _, item := range strings.Split(inner, ",") {
						item = strings.Trim(strings.TrimSpace(item), `"'`)
						if item == "" {
							continue
						}
						switch key {
						case "tags":
							p.Tags = append(p.Tags, item)
						case "categories":
							p.Cats = append(p.Cats, item)
						}
					}
					listKey = ""
					continue
				}
				if val == "" {
					listKey = key
					continue
				}
				listKey = ""
				switch key {
				case "slug":
					if val != "" {
						p.Slug = val
					}
				case "title":
					p.Title = val
				}
			}
		}
		if !inFM && trimmed != "" {
			bodyLines = append(bodyLines, line)
		}
	}
	p.Body = strings.Join(bodyLines, "\n")
	return p
}
