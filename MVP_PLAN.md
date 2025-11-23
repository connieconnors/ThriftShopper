# ThriftShopper / RetroThrifter – 3-Day MVP Plan

## Goal
In 3 days, have a public, mobile-friendly marketplace where:
- A buyer lands on a **Buyer Discovery** page.
- They can see **real items** coming from Supabase.
- They can click into a simple **item detail** view.
- There is a basic **“I’m selling something”** intake flow (even if it’s simple).
- Site is live at the Vercel URL and shareable.

---

## Day 1 – Today (Foundation & Clarity)

- [ ] Confirm `retro-thrifter.vercel.app` loads without errors.
- [ ] Confirm Supabase connection is working (no env var errors).
- [ ] Make sure there is a `listings` (or similar) table in Supabase with:
  - [ ] id
  - [ ] title
  - [ ] description
  - [ ] category / room / mood
  - [ ] price (optional for now)
  - [ ] image_url (can be placeholder)
- [ ] Seed at least **10–20 items** into that table.
- [ ] Decide and write down which Figma screen is the **home page**.
- [ ] Note which route that home page should be (e.g. `/`).

---

## Day 2 – Buyer Experience

- [ ] Home page shows items from Supabase (even a simple list or one card at a time).
- [ ] Basic “mood / style” filters working (even if they are simple buttons, not full NLP).
- [ ] Item detail view route (e.g. `/item/[id]`) with title, description, room, mood, image.
- [ ] Simple “favorite” (can just be localStorage or a heart that doesn’t fully save yet).
- [ ] Header/footer: logo, short tagline, and link to seller page.

---

## Day 3 – Seller Intake & Launch

- [ ] **Seller intake page** (e.g. `/sell`) with fields:
  - [ ] Your name
  - [ ] Email or phone
  - [ ] What you’re selling (text)
  - [ ] Optional: photo link
- [ ] Save seller submissions into a `seller_leads` table in Supabase.
- [ ] Add “I’m selling something” CTA from the home page.
- [ ] Light copy polish (tagline, about text, one sentence explaining the magic).
- [ ] Do a quick test on your phone.
- [ ] Share the live link with 1–3 people.

---

## Figma → Routes Map (fill this in as you go)

| Figma screen name              | GitHub file / Next.js route | Notes                |
|--------------------------------|-----------------------------|----------------------|
| buyer_discovery_card           | `/`                         | Home page concept    |
| buyer_discovery_voice          | `/voice` (maybe)           | Optional MVP         |
| buyer_favorites_page           | `/favorites`               | Nice-to-have         |
| seller_create_account          | `/sell` or `/sell/create`  | MVP intake page      |
| seller_login                   | `/login`                   | Later, not MVP       |
| seller_page_total_addnew       | `/sell/add`                | Later                |

(Adjust the routes to match what you actually have or want.)
