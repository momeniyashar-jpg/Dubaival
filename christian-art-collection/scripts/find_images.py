import requests, json, sys

API = "https://commons.wikimedia.org/w/api.php"
HEADERS = {"User-Agent": "ChristianArtPDFResearch/1.0 (educational, non-commercial)"}

def search(term, limit=8):
    r = requests.get(API, params={
        "action": "query", "list": "search", "srsearch": term,
        "srnamespace": 6, "srlimit": limit, "format": "json"
    }, headers=HEADERS, timeout=30)
    r.raise_for_status()
    return [x["title"] for x in r.json()["query"]["search"]]

def imageinfo(titles):
    if not titles:
        return {}
    r = requests.get(API, params={
        "action": "query", "titles": "|".join(titles), "prop": "imageinfo",
        "iiprop": "url|size|mime|extmetadata", "format": "json"
    }, headers=HEADERS, timeout=30)
    r.raise_for_status()
    pages = r.json()["query"]["pages"]
    out = {}
    for pid, p in pages.items():
        if "imageinfo" not in p:
            continue
        ii = p["imageinfo"][0]
        out[p["title"]] = {
            "url": ii.get("url"),
            "width": ii.get("width"),
            "height": ii.get("height"),
            "mime": ii.get("mime"),
        }
    return out

queries = [
    "Christ Pantocrator Sinai Saint Catherine Monastery icon 6th century",
    "Piero della Francesca Baptism of Christ National Gallery London",
    "Leonardo da Vinci Last Supper Santa Maria delle Grazie",
    "Matthias Grunewald Isenheim Altarpiece Crucifixion Unterlinden",
    "Raphael Transfiguration Vatican Museums",
    "El Greco Christ Carrying the Cross",
    "Diego Velazquez Christ Crucified Prado",
    "Caravaggio Incredulity of Saint Thomas",
    "Piero della Francesca Resurrection Sansepolcro",
    "Salvador Dali Christ of Saint John of the Cross Kelvingrove",
]

for q in queries:
    print("="*100)
    print("QUERY:", q)
    titles = search(q)
    info = imageinfo(titles)
    for t in titles:
        d = info.get(t)
        if d and d.get("mime","").startswith("image"):
            print(f"  {t}  -> {d['width']}x{d['height']}  {d['url']}")
