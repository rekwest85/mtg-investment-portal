#!/usr/bin/env python3
"""Test all store suggest.json and variant fetching for Barbed Field foil PCY."""
import urllib.request, json, sys

def test_store(base, card_name, set_code):
    query = urllib.parse.quote(f"{card_name} {set_code} foil")
    url = f"{base}/search/suggest.json?q={query}&resources%5Btype%5D=product&resources%5Blimit%5D=5"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read())
        products = data.get("resources", {}).get("results", {}).get("products", [])
        if not products:
            print(f"  ❌ {base.split('.')[0]}: 0 suggest results")
            return
        p = products[0]
        url_path = p.get("url", "")
        handle = url_path.split("/products/")[-1].split("?")[0]
        title = p.get("title", "")
        has_foil = "foil" in title.lower() and "non-foil" not in title.lower()
        print(f"  ✅ {base.split('.')[0]}: handle={handle} | foil_in_title={has_foil}")
        # Now fetch variants
        var_url = f"{base}/products/{handle}.js"
        var_req = urllib.request.Request(var_url, headers={"User-Agent": "Mozilla/5.0"})
        var_resp = urllib.request.urlopen(var_req, timeout=10)
        var_data = json.loads(var_resp.read())
        variants = var_data.get("variants", [])
        available = [v for v in variants if v.get("available")]
        foil_variants = [v for v in available if "foil" in v.get("title", "").lower()]
        print(f"     Variants: {len(variants)} total, {len(available)} avail, {len(foil_variants)} foil-variant")
        if foil_variants:
            cheapest = min(foil_variants, key=lambda v: float(v["price"]))
            price = float(cheapest["price"])
            # cents check
            if all(float(v["price"]) == int(float(v["price"])) for v in variants) and price > 0.5:
                price = price / 100
            print(f"     Cheapest foil: ${price:.2f} | title={cheapest['title']} | qty={cheapest.get('inventory_quantity',0)}")
    except urllib.error.HTTPError as e:
        print(f"  ❌ {base.split('.')[0]}: HTTP {e.code}")
    except Exception as e:
        print(f"  ❌ {base.split('.')[0]}: {str(e)[:80]}")

if __name__ == "__main__":
    import urllib.parse
    stores = [
        ("Taps Games", "https://tapsgames.com"),
        ("Cardboard Classics", "https://cardboardclassics.ca"),
        ("Hobbiesville", "https://hobbiesville.com"),
        ("Wizard's Tower", "https://store.wizardtower.com"),
        ("Hairy Tarantula", "https://hairytarantula.com"),
        ("Gamezilla", "https://gamezilla.ca"),
        ("Level Up Games", "https://levelupgames.ca"),
        ("Game Knight", "https://gameknight.ca"),
    ]
    print(f"Testing all 8 stores for Barbed Field (PCY) foil variants:")
    for name, base in stores:
        print(f"\n{name}:")
        test_store(base, "Barbed Field", "PCY")
