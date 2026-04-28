# 🧬 AI Context: Clean-Odoo Architecture

## 🛠️ Execution Rules
- **The 150-Line Rule**: Break files > 150 lines into sub-components.
- **The "No-Borders" Rule**: Prefer surface-low vs surface coloring over hard borders.
- **Naming Convention**: PascalCase for components, camelCase for hooks/functions.
- **Mobile-First Directive**: All UI MUST be designed for mobile (375px-414px) primarily, using max-width on desktop containers.

## 📂 Folder Anatomy
- `app/nexus/`: API & Service layer (includes AI services).
- `app/hooks/`: Business logic & shared state.
- `app/components/`:
  - `/ui`: Atomic, stateless components.
  - `/core`: Global layout (BottomNav, Header).
  - `/features`: Feature-specific UI (ReceiptScan, SplitBill).
- `app/constants/`: Static data & Config.
- `app/schemas/`: Zod validation.
- `app/types/`: Domain TypeScript types.
- `app/utils/`: Pure helper functions.
- `app/routes/`: Route handlers.

## 🎨 Color Palette (Modern Finance)
- **Primary**: #00674F (Deep Emerald)
- **Secondary**: #54D3AD (Mint Green)
- **Tertiary**: #1A1A1A (Rich Black)
- **Background**: #F8F9FA (Off White)
- **Surface**: #FFFFFF
- **Accent**: #FFB800 (Gold)

## 🤖 AI Guidelines
- **Receipt Extraction**: Use Gemini 1.5 Pro/Flash to extract JSON from receipt images.
- **Structured Output**: AI must return consistent object: `{ merchant, date, items: [{name, qty, price}], total }`.
