import json
from collections import Counter, defaultdict

data = json.load(open("_review_inputs/extracted.json", encoding="utf-8"))

print(f"PDF pages: {len(data['pdf'])}")
print("Sheets:", ", ".join(data["xlsx"]))

keywords = [
    "목표",
    "추진",
    "개발",
    "성과",
    "실증",
    "예산",
    "AI",
    "메타버스",
    "PWA",
    "KPI",
    "개인정보",
    "보안",
    "교사",
    "학부모",
    "Vision",
    "멀티모달",
]

for page in data["pdf"]:
    text = page["text"]
    hits = [word for word in keywords if word in text]
    if hits:
        snippet = text[:700].replace("\n", " ")
        print(f"\nPAGE {page['page']} hits={','.join(hits)}")
        print(snippet)

rows = data["xlsx"]["기능정의서"][3:]
priority = Counter()
category = Counter()
phase = Counter()
ai_api = []
for row in rows:
    if len(row) < 10 or not row[1]:
        continue
    priority[row[7]] += 1
    category[row[2]] += 1
    phase[row[9]] += 1
    if "AI" in row[8] or "API" in row[8] or "AI" in row[6] or "API" in row[6]:
        ai_api.append(row)

print("\nFeature priorities:", dict(priority))
print("Feature categories:", dict(category))
print("Feature phases:", dict(phase))
print("\nAI/API feature rows:")
for row in ai_api:
    print(" | ".join(row[1:10]))
