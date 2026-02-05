# Marketplace fee and Stripe Connect

## Schema

- **profiles** (lookup by `user_id`): `seller_fee_rate` (numeric), `fee_plan` (text), `fee_start_at`, `fee_end_at`, plus `fee_override_code`, `fee_free_until`, etc.
- **orders**: `amount`, `seller_fee_rate` (snapshot at order time), `platform_fee_amount`, `seller_payout_amount`
- **listings** table: used to get `seller_id`, `price` for the order; fee rate comes from **profiles**

## Order creation (fee calculation)

When an order is created (API or webhook):

1. Look up the seller’s **current** `seller_fee_rate` from `profiles` (by `user_id` = `seller_id`).
2. **platform_fee_amount** = `amount × seller_fee_rate` (dollars).
3. **Stripe processing** (estimate): `amount × 0.029 + 0.30` (dollars).
4. **seller_payout_amount** = `amount - platform_fee_amount - stripe_processing_fee` (dollars).
5. Store on the order: `seller_fee_rate`, `platform_fee_amount`, `seller_payout_amount`.

`seller_fee_rate` is stored on the order so history stays correct if the profile rate changes later.

## Stripe Connect: how sellers get paid

Payment flow (already in place):

1. **Create Payment Intent** (`create-payment-intent`):
   - Reads `profiles.seller_fee_rate` for the listing’s seller (from **listings** table `seller_id` → **profiles** `user_id`).
   - `application_fee_amount` (cents) = `amountInCents × seller_fee_rate`.
   - `transfer_data.destination` = seller’s Stripe Connect account ID.
   - Stripe charges the buyer `amount`; the platform keeps `application_fee_amount`; the **transfer** to the connected account is `amount - application_fee_amount` (cents).

2. **What the seller actually receives**:
   - Stripe sends **transfer amount** = sale amount minus application fee.
   - Stripe then deducts **its own processing** (e.g. 2.9% + $0.30) from the connected account’s balance.
   - So the seller’s net is approximately: transfer amount − processing ≈ **seller_payout_amount** as stored in `orders`.

We do **not** change the transfer amount to “pay the seller exactly seller_payout_amount.” The transfer is always `amount - application_fee_amount`. The column `orders.seller_payout_amount` is the **expected net** after estimated Stripe processing, for reporting and seller dashboards.

## Beta

- Set `profiles.seller_fee_rate = 0` for beta sellers (no platform fee).
- Later set e.g. `0.04` (4%) for standard sellers.

## Optional: fee windows

If you use `fee_start_at` / `fee_end_at` (or `fee_plan`) to change rates by period, you can in the future:

- In **create-payment-intent** and **create-order**: compute an “effective” rate for “now” from `seller_fee_rate` and the current date vs `fee_start_at` / `fee_end_at`.
- Still store that effective rate on the order as `seller_fee_rate` so each order has a clear snapshot.
