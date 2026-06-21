import { NextRequest, NextResponse } from "next/server";

const STORES = [
  { name: "Face to Face Games", domain: "www.facetofacegames.com", base: "https://www.facetofacegames.com", cart_url: "https://www.facetofacegames.com/cart" },
  { name: "401 Games", domain: "store.401games.ca", base: "https://store.401games.ca", cart_url: "https://store.401games.ca/cart" },
  { name: "Wizard's Tower", domain: "store.wizardtower.com", base: "https://store.wizardtower.com", cart_url: "https://store.wizardtower.com/cart" },
  { name: "Taps Games", domain: "tapsgames.com", base: "https://tapsgames.com", cart_url: "https://tapsgames.com/cart" },
  { name: "Hairy Tarantula", domain: "hairytarantula.com", base: "https://hairytarantula.com", cart_url: "https://hairytarantula.com/cart" },
  { name: "Cardboard Classics", domain: "cardboardclassics.ca", base: "https://cardboardclassics.ca", cart_url: "https://cardboardclassics.ca/cart" },
  { name: "Gamezilla", domain: "gamezilla.ca", base: "https://gamezilla.ca", cart_url: "https://gamezilla.ca/cart" },
  { name: "Hobbiesville", domain: "hobbiesville.com", base: "https://hobbiesville.com", cart_url: "https://hobbiesville.com/cart" },
  { name: "Level Up Games", domain: "levelupgames.ca", base: "https://levelupgames.ca", cart_url: "https://levelupgames.ca/cart" },
  { name: "Game Knight", domain: "gameknight.ca", base: "https://gameknight.ca", cart_url: "https://gameknight.ca/cart" },
];

async function fetchJSON(url: string, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
    clearTimeout(id);
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

function normalizeStoreDomain(domain: string): string {
  const d = domain.replace(/^www\./, '');
  return d;
}

async function searchStore(store: any, cardName: string, setCode: string) {
  const query = store.domain.includes('facetoface')
    ? `${cardName} foil`
    : `${cardName} ${setCode} foil`;
  const encoded = encodeURIComponent(query);
  const suggestUrl = `${store.base}/search/suggest.json?q=${encoded}&resources%5Btype%5D=product&resources%5Blimit%5D=10`;

  const data = await fetchJSON(suggestUrl);
  if (!data) return [];

  const products = data?.resources?.results?.products || [];
  const results: any[] = [];

  for (const p of products) {
    const title = (p.title || '').toLowerCase();
    const nameLower = cardName.toLowerCase();

    // Check name match
    if (!(title.startsWith(nameLower + " [") || title.startsWith(nameLower + " ("))) continue;

    // Skip non-foil
    if (title.includes('non-foil')) continue;

    const handle = (p.url || '').split('/products/').pop()?.split('?')[0] || '';
    if (!handle) continue;

    // Fetch product variants
    const productData = await fetchJSON(`${store.base}/products/${handle}.js`);
    if (!productData) continue;

    const variants = (productData.variants || []).filter((v: any) => v.available);
    if (variants.length === 0) continue;

    // Find foil variant
    let foilVariant = variants.find((v: any) => v.title?.toLowerCase().includes('foil'));
    if (!foilVariant) foilVariant = variants[0];

    // Detect cents-mode pricing
    let price = parseFloat(foilVariant.price);
    if (variants.every((v: any) => parseFloat(v.price) === Math.floor(parseFloat(v.price))) && price > 0.5) {
      price = price / 100;
    }

    results.push({
      title: p.title,
      price,
      available: foilVariant.available,
      condition: foilVariant.title || '',
      variant_id: foilVariant.id,
      quantity: foilVariant.inventory_quantity || 0,
      product_url: `${store.base}${p.url.split('?')[0]}`,
      cart_url: `${store.cart_url}/${foilVariant.id}:1`,
    });
    break; // One product per card per store
  }

  return results.map((r) => ({ ...r, store: store.name, store_domain: store.domain, currency: 'CAD' }));
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cardName = searchParams.get('name');
  const setCode = searchParams.get('set') || '';

  if (!cardName) {
    return NextResponse.json({ error: 'Missing card name' }, { status: 400 });
  }

  // Fetch price from Scryfall
  const scryfallUrl = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}${setCode ? `&set=${setCode}` : ''}`;
  const scryfallData = await fetchJSON(scryfallUrl);

  // Search all stores (in parallel batches of 3)
  const allResults: any[] = [];
  const chunks: any[][] = [];
  for (let i = 0; i < STORES.length; i += 3) {
    chunks.push(STORES.slice(i, i + 3));
  }
  for (const chunk of chunks) {
    const batch = await Promise.all(chunk.map((s) => searchStore(s, cardName, setCode)));
    for (const res of batch) allResults.push(...res);
  }

  const available = allResults.filter((r) => r.available).sort((a, b) => a.price - b.price);

  return NextResponse.json({
    name: cardName,
    set: setCode || scryfallData?.set || '',
    set_name: scryfallData?.set_name || '',
    rarity: scryfallData?.rarity || '',
    type_line: scryfallData?.type_line || '',
    image_uri: scryfallData?.image_uris?.large || null,
    foil_price: parseFloat(scryfallData?.prices?.usd_foil || '0') || null,
    nonfoil_price: parseFloat(scryfallData?.prices?.usd || '0') || null,
    scryfall_uri: scryfallData?.scryfall_uri || null,
    stores: available,
    total_in_stock: available.length,
    cheapest_price: available.length > 0 ? available[0].price : null,
    cheapest_store: available.length > 0 ? available[0].store : null,
  });
}
