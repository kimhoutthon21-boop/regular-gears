# Regular Gears — Landing Page

Static site: HTML + CSS + vanilla JS. No build step, no backend.

## Run it
Double-click `index.html`, or serve the folder (recommended, so clipboard copy works):

```
python -m http.server 5500
```
Then open http://localhost:5500

## Folder layout
```
index.html           page structure (all 8 sections)
css/styles.css       all styling (tokens at the top: colours, fonts, radius)
js/products.js       ← EDIT THIS to update the shop
js/main.js           app logic (rendering, search, order window, animations)
assets/              logo, favicon, product images
```

## Before going live
Open `js/products.js` and set:
- `STORE.telegram`: your Telegram username (no @)
- `STORE.facebook`: your Facebook Page username (used for m.me Messenger links)
- `STORE.socials`: full URLs for Facebook / Telegram / TikTok / Instagram (delete a line to hide that icon)
- `STORE.location`, `STORE.hours`, `STORE.responseTime`

Also check the copy in `index.html` (Why Choose Us, About) matches your real delivery, pricing and warranty policies.

## Add / edit a product
Copy any block in `PRODUCTS` inside `js/products.js` and change the fields:

```js
{
  id: "my-new-mouse",              // unique, lowercase-with-dashes
  name: "My New Mouse",
  category: "mice",                // keyboards | mice | mousepads | audio | accessories
  tagline: "Short one-liner",
  description: "One or two sentences shown in the order window.",
  price: 39,                       // or null → shows "Ask for price"
  oldPrice: 45,                    // optional → shows strikethrough
  badge: "New",                    // optional → "Sale" turns orange
  specs: ["60 g", "Wireless"],
  image: "assets/products/my-new-mouse.jpg",
  inStock: true,                   // false → "Sold out", button becomes "Notify me"
  featured: true,                  // shown first under "Featured" sort
},
```
Category counts, filters, search and order links update automatically.

## The gear wall (shelves)
The lineup shows every product standing on a floating shelf, one shelf per category, with a price
tag clipped to the shelf edge. Shelves are built automatically from `category`:
- A category with more than 4 products wraps onto a second board (2 per board on phones).
- A product whose `category` isn't in `CATEGORIES` goes on a "More gear" shelf.
- Clicking a product (or its tag) lifts it off the shelf into the order window; closing puts it back.
- To add a new shelf, add an entry to `CATEGORIES`.

## Product photos
The included product images are illustrated SVG placeholders. Replace them with real photos in
`assets/products/` and update the `image` path. For the shelf to look right:
- Use **transparent PNG or WEBP** cut-outs (no background), so products appear to stand on the shelf.
- **Crop tight** to the product, with its bottom edge at the bottom of the image. Products are
  bottom-aligned on the shelf, so empty space below the product makes it float.
- Around 1000–1500 px on the long side is plenty.

## How ordering works
"Order" opens a product window with quantity → total. The Telegram/Messenger buttons open a chat
with a pre-written order message (product, qty, total, plus Name/Phone/Address lines). The message
is also copied to the clipboard, in case the app doesn't prefill it.

## Keyboard shortcuts
`/` or `Ctrl/⌘ + K` opens product search. In the hero, typing on your keyboard presses the keys of
the on-screen keyboard.
