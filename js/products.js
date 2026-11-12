/* ==========================================================================
   REGULAR GEARS — STORE DATA
   --------------------------------------------------------------------------
   This is the only file you need to edit to update the shop.
   - STORE:      contact handles, social links, store info
   - CATEGORIES: the five category cards
   - PRODUCTS:   every product shown on the page (order = display order)
   See README.md for a step-by-step guide.
   ========================================================================== */

const STORE = {
  name: "Regular Gears",

  // Telegram: username only, without "@".
  // Facebook: the Page's username, or its numeric ID from facebook.com/profile.php?id=…
  telegram: "regulargears", // → https://t.me/regulargears
  facebook: "61595875872174", // → https://m.me/61595875872174 (Messenger)
  facebookLabel: "Regular Gears on Messenger", // shown on the contact card instead of the raw ID

  currency: "$",
  location: "Phnom Penh, Cambodia",
  hours: "Daily · 9:00 – 21:00",
  responseTime: "Usually replies within 1 hour",

  socials: {
    facebook: "https://www.facebook.com/profile.php?id=61595875872174",
    telegram: "https://t.me/regulargears",
    tiktok: "https://www.tiktok.com/@regulargears.cambodia",
    instagram: "https://www.instagram.com/regulargears_cambodia",
  },
};

const CATEGORIES = [
  {
    id: "keyboards",
    name: "Keyboards",
    blurb: "Mechanical, hot-swap, built to be typed on.",
    image: "assets/products/rog-azoth.webp",
  },
  {
    id: "mice",
    name: "Mice",
    blurb: "Light shells. Flawless sensors.",
    image: "assets/products/akko-dash-v9.webp",
  },
  {
    id: "mousepads",
    name: "Mousepads",
    blurb: "Smooth, consistent glide for every sensor.",
    image: "assets/products/logitech-g240.webp",
  },
  {
    id: "audio",
    name: "Audio",
    blurb: "Headsets and mics. Hear footsteps before they hear you.",
    image: "assets/products/razer-barracuda-x.webp",
  },
  {
    id: "accessories",
    name: "Accessories",
    blurb: "Desk gadgets and the finishing touches.",
    image: "assets/products/divoom-ditoo-pro.webp",
  },
];

/*  PRODUCT FIELDS
    id          unique, lowercase-with-dashes
    name        product name
    category    one of the CATEGORIES ids above
    tagline     one short line shown under the name
    description 1–2 sentences, shown in the order window
    price       number in USD, or null → shows "Ask for price"
    oldPrice    optional — shows a strikethrough "was" price
    badge       optional — e.g. "New", "Best seller", "Sale", "Limited"
    specs       up to ~4 short tags
    image       path to image (transparent WEBP/PNG cut-outs look best on the shelf)
    inStock     true / false — sold-out items show "Notify me"
    featured    true = shown first when sorting by "Featured"

    PRICES (researched Nov 2026): set just at or slightly under what Phnom Penh shops
    charge where a local listing existed, otherwise US/official price + a small import
    margin. Review them against your actual buying cost before going live.            */
const PRODUCTS = [
  // ---------------- Keyboards ----------------
  {
    id: "rog-azoth",
    name: "ROG Azoth",
    category: "keyboards",
    tagline: "75% gasket-mount with OLED display",
    description:
      "ASUS ROG's flagship 75% board: gasket-mounted, hot-swappable switches, a 2-inch OLED screen and a three-way control knob. Connect with 2.4 GHz wireless, Bluetooth or USB-C.",
    price: 205, // KH shops $209 (was $249); US MSRP $249.99
    badge: "Flagship",
    specs: ["75%", "Gasket mount", "OLED display", "Tri-mode"],
    image: "assets/products/rog-azoth.webp",
    inStock: true,
    featured: true,
  },
  {
    id: "aula-s75-pro",
    name: "AULA S75 Pro",
    category: "keyboards",
    tagline: "Gasket-mount 75% with screen and knob",
    description:
      "A gasket-mounted, hot-swappable 75% board with factory-lubed switches, PBT keycaps, a colour screen and a volume knob. Tri-mode wireless with a 4,000 mAh battery.",
    price: 75, // AULA store $65.98–75.90; Amazon ~$68
    badge: "Best value",
    specs: ["75%", "Gasket mount", "Tri-mode", "Screen + knob"],
    image: "assets/products/aula-s75-pro.webp",
    inStock: true,
    featured: true,
  },
  {
    id: "akko-3084b-plus",
    name: "AKKO 3084B Plus",
    category: "keyboards",
    tagline: "Black & Gold, 84 keys, hot-swap",
    description:
      "AKKO's compact 84-key board in the Black & Gold colourway: hot-swappable switches, RGB backlighting, and Bluetooth, 2.4 GHz or wired USB-C.",
    price: 79, // US retailers $74–86
    specs: ["84 keys", "Hot-swap", "Tri-mode", "RGB"],
    image: "assets/products/akko-3084b.webp",
    inStock: true,
    featured: false,
  },

  // ---------------- Mice ----------------
  {
    id: "akko-dash-v9",
    name: "AKKO Dash V9 Ultra",
    category: "mice",
    tagline: "40 g, PAW3950 sensor, 8K polling",
    description:
      "An ultralight 40 g wireless mouse with the flagship PAW3950 sensor (up to 42,000 DPI) and 8K polling. Use it on 2.4 GHz, Bluetooth or wired, with up to 200 hours of battery.",
    price: 65, // AKKO $59.99–69.99
    badge: "New",
    specs: ["40 g", "PAW3950 · 42K DPI", "8K polling", "Tri-mode"],
    image: "assets/products/akko-dash-v9.webp",
    inStock: true,
    featured: true,
  },
  {
    id: "aula-sc620",
    name: "AULA SC620",
    category: "mice",
    tagline: "67 g tri-mode, RGB open shell",
    description:
      "A 67 g open-shell wireless mouse with a PAW3311 sensor (up to 12,000 DPI), 7 programmable buttons and RGB glowing through the frame. 2.4 GHz, Bluetooth or USB-C.",
    price: 32, // retailers $29–37
    specs: ["67 g", "12K DPI", "Tri-mode", "RGB"],
    image: "assets/products/aula-sc620.webp",
    inStock: true,
    featured: false,
  },

  // ---------------- Mousepads ----------------
  {
    id: "logitech-g240",
    name: "Logitech G240",
    category: "mousepads",
    tagline: "Cloth pad, 340 × 280 mm",
    description:
      "Logitech G's medium cloth pad with a performance-tuned surface for consistent tracking and a rubber base that stays put. Thin, light and easy to carry.",
    price: 15, // KH shops $14.99–15
    specs: ["Cloth surface", "340 × 280 mm", "1 mm thin", "Rubber base"],
    image: "assets/products/logitech-g240.webp",
    inStock: true,
    featured: false,
  },

  // ---------------- Audio ----------------
  {
    id: "razer-barracuda-x",
    name: "Razer Barracuda X Chroma",
    category: "audio",
    tagline: "Wireless + Bluetooth, Chroma RGB",
    description:
      "A 285 g wireless headset with 40 mm TriForce drivers, 7.1 surround and Chroma RGB earcups. Connect with the HyperSpeed 2.4 GHz dongle or Bluetooth, up to 70 hours of battery (30 hours with lighting on).",
    price: 145, // KH shops $149–149.99; US MSRP $129.99
    specs: ["40 mm TriForce", "7.1 surround", "HyperSpeed + BT", "70 h battery"],
    image: "assets/products/razer-barracuda-x.webp",
    inStock: true,
    featured: true,
  },
  {
    id: "hyperx-cloud-ii",
    name: "HyperX Cloud II",
    category: "audio",
    tagline: "The classic: 53 mm drivers, 7.1 surround",
    description:
      "The well-loved esports headset: 53 mm drivers, virtual 7.1 surround through the USB sound card, memory-foam cushions and a detachable noise-cancelling mic.",
    price: 79, // KH shops $79–89.99; US list $79.99
    specs: ["53 mm drivers", "7.1 surround", "Detachable mic", "Memory foam"],
    image: "assets/products/hyperx-cloud-ii.webp",
    inStock: true,
    featured: true,
  },
  {
    id: "rog-pelta",
    name: "ROG Pelta",
    category: "audio",
    tagline: "Tri-mode wireless headset, 309 g",
    description:
      "ASUS ROG's lightweight wireless headset with 50 mm titanium-plated drivers, a boom mic and Aura RGB. Connect with the 2.4 GHz SpeedNova dongle, Bluetooth or USB-C.",
    price: 119, // ASUS US $104.99–129.99
    specs: ["50 mm drivers", "Tri-mode", "309 g", "Aura RGB"],
    image: "assets/products/rog-pelta.webp",
    inStock: true,
    featured: false,
  },
  {
    id: "onikuma-m830",
    name: "Onikuma M830",
    category: "audio",
    tagline: "USB-C condenser mic with RGB",
    description:
      "A plug-and-play cardioid condenser mic for streaming, calls and Discord, with one-touch mute, gain control, RGB lighting and a sturdy desk stand.",
    price: 25, // retailers ~$20–30
    specs: ["Cardioid condenser", "USB-C", "Tap to mute", "RGB"],
    image: "assets/products/onikuma-m830.webp",
    inStock: true,
    featured: false,
  },

  // ---------------- Accessories ----------------
  {
    id: "divoom-ditoo-pro",
    name: "Divoom Ditoo Pro",
    category: "accessories",
    tagline: "Retro pixel-art Bluetooth speaker",
    description:
      "A retro mini-PC speaker with a 16 × 16 pixel display you can draw on from the app, mechanical keys, a 15 W speaker, alarms and mini games. A desk-setup favourite.",
    price: 89, // US retailers $79.99–89.99
    badge: "Desk favourite",
    specs: ["16 × 16 pixel display", "15 W speaker", "Bluetooth", "App control"],
    image: "assets/products/divoom-ditoo-pro.webp",
    inStock: true,
    featured: true,
  },
];
