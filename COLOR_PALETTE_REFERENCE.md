# Syber Space — Official Color Palette & History Inventory

This file preserves all active and historical color palettes used in the Syber Space platform to ensure design consistency and prevent any color codes from being lost.

---

## 1. Active Theme: Executive Pure White & Sleek Slate Black
Designed for **clean corporate authority**, high-legibility executive typography, and pristine contrast for **both residential homeowners and enterprise commercial clients**.

### Typography
- **Display & Headlines:** `Plus Jakarta Sans` (`font-weight: 600, 700, 800`) — high-prestige, clean, modern executive geometry.
- **Body & Technical Specs:** `Inter` (`font-weight: 400, 500, 600, 700`) — industry standard clarity and readability.

### Colors
| Element | Hex Code | RGB | CSS Variable / Class | Visual Role |
| :--- | :--- | :--- | :--- | :--- |
| **Pure White Background** | `#ffffff` | `255, 255, 255` | `--base-bg` / `--base-surface` / `html, body` | Main canvas background, product card container fill |
| **Studio Cool White Surface** | `#f8fafc` | `248, 250, 252` | `--calm-primary-light` / `.product-visual-wrap` | Cool neutral studio backdrop for camera hardware |
| **Executive Slate Black** | `#0f172a` | `15, 23, 42` | `--base-dark` / `--calm-primary` / `.btn-pay-now-card` | Primary PAY NOW action buttons, header cart pill, main headlines |
| **Pure Jet Black** | `#000000` | `0, 0, 0` | `.btn-pay-now-card:hover` / `.text-pill.active:hover` | High-contrast hover states, active button elevation |
| **Cool Gray Neutral Hover** | `#f1f5f9` | `241, 245, 249` | `.btn-add-cart:hover` / `.text-pill:hover` | Crisp, clean slate hover tint for secondary actions |
| **Hairline Slate Border** | `rgba(15, 23, 42, 0.08)` | — | `--base-border` | Razor-sharp subtle borders around cards and navigation |
| **Muted Slate Gray Text** | `#475569` | `71, 85, 105` | `--base-dark-muted` | Product brand tags, card descriptions, specifications |
| **Cool Gray 500** | `#64748b` | `100, 116, 139` | `--base-gray-500` | MRP strikethroughs, timestamp labels |

---

## 2. Sandstone Linen & Ivory Palette (Preserved Reference)
*The warm linen / ivory palette tested in v4.7.*

| Element | Hex Code | RGB | Role in Theme |
| :--- | :--- | :--- | :--- |
| **Studio Warm Linen / Ivory** | `#f3f0ea` | `243, 240, 234` | Full canvas warm background |
| **Warm Sand Hover** | `#ede8de` | `237, 232, 222` | Soft neutral hover tint |
| **Charcoal Black** | `#1b1815` | `27, 24, 21` | Action buttons and dark text |
| **Charcoal Muted Text** | `#57534e` | `87, 83, 78` | Subtext and secondary labels |

---

## 3. Sky Blue & White Palette (Preserved Reference)
*The daylight clarity and peace palette tested in v4.4.*

| Element | Hex Code | RGB | Role in Theme |
| :--- | :--- | :--- | :--- |
| **Primary Sky Azure** | `#0284c7` | `2, 132, 199` | Main action buttons, active tabs, cart pill |
| **Sky Blue Hover** | `#0369a1` | `3, 105, 161` | Button hover states |
| **Luminous Sky Accent** | `#0ea5e9` | `14, 165, 233` | Glow indicators, focus outlines |
| **Soft Sky Mist Tint** | `#f0f9ff` | `240, 249, 255` | Savings chip background, button hover fill |
| **Sky Hairline Border** | `#bae6fd` | `186, 230, 253` | Secondary button outline, badge borders |
| **Ice Blue Highlight** | `#e0f2fe` | `224, 242, 254` | Rolling nav hover highlight |

---

## 4. Deep Oceanic Navy & Nordic Sage (Preserved Reference)
*The corporate security palette tested in v4.3.*

| Element | Hex Code | RGB | Role in Theme |
| :--- | :--- | :--- | :--- |
| **Deep Ocean Navy** | `#0e2238` | `14, 34, 56` | Primary action button gradient start, cart pill |
| **Marine Navy** | `#17375e` | `23, 55, 94` | Primary action button gradient end |
| **Executive Slate Navy**| `#153250` | `21, 50, 80` | Sidebar filter borders, title highlights |
| **Nordic Sage Green** | `#236352` | `35, 99, 82` | Calm authentic badges, savings indicators |
| **Nordic Sage Light** | `rgba(35, 99, 82, 0.1)` | — | Savings chip background |

---

## 5. Legacy Cyber / Terminal Accents
*High-contrast green and blue accents used in the initial prototype.*

| Element | Hex Code | RGB | Original Usage | Reason Replaced |
| :--- | :--- | :--- | :--- | :--- |
| **Electric Emerald** | `#10b981` | `16, 185, 129` | Filter accent bar, checkbox active fills, live HUD dot | Too aggressive/crypto-like; lacked executive tranquility |
| **Deep Forest Green** | `#059669` | `5, 150, 105` | Bestseller badges, reset links, WhatsApp highlights | High contrast against ivory |
| **Dark Forest Green** | `#047857` | `4, 120, 87` | Link hover states | Replaced by sky blue |
| **Electric Precision Blue** | `#1d4ed8` | `29, 78, 216` | Flagship badges, interactive links | Replaced by softer sky blue (`#0284c7`) |
| **Royal Blue** | `#2563eb` | `37, 99, 235` | Secondary blue links | Preserved as optional blue tone |

---

## 6. Bank Rails & Verified Third-Party Colors
*Mandatory official brand colors for payment gateway and legal compliance.*

| Entity | Hex Code | Purpose |
| :--- | :--- | :--- |
| **HDFC Bank Official Blue** | `#004c8f` | HDFC Bank SmartGateway™ checkout button, regulatory pills |
| **HDFC Bank Deep Navy** | `#003366` | HDFC button hover state |
| **WhatsApp Official Green** | `#25d366` | WhatsApp concierge floating launcher & direct inquiry button |
| **WhatsApp Dark Hover** | `#128c7e` | WhatsApp button hover state |
