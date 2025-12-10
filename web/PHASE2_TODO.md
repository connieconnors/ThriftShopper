# Phase 2 Todo List - ThriftShopper Beta Launch

## Security & Infrastructure
- [ ] Enable Auth security features: Leaked Password Protection and MFA (TOTP) in Supabase Dashboard
- [ ] Run Performance Advisor in Supabase - optimize slow queries, add indexes if needed
- [ ] Set up error monitoring and logging (Sentry, LogRocket, or similar)
- [ ] Verify database backups are configured and test restore process

## Product & Content
- [ ] Reach 250 products goal - continue uploading listings with proper mood/intent/style tags
- [ ] Optimize image loading - implement lazy loading, proper sizing, and CDN if needed

## Features & Functionality
- [ ] Test semantic search with complex queries across all 250 products - refine if needed
- [ ] Test mood wheel filtering with larger product set - verify AND logic works correctly
- [ ] Fix mobile modal persistence issue (mood wheel table disappearing) - test on real devices
- [ ] Test and verify favorites/bookmark functionality works correctly with RLS policies
- [ ] Complete seller onboarding flow - test full upload process from image to published listing
- [ ] **Set up Stripe Connect Standard Accounts for seller payouts**
- [ ] **Implement "Set up payouts" button in seller dashboard**
- [ ] **Generate Stripe Connect onboarding links for sellers**
- [ ] **Test complete Stripe payout flow end-to-end**
- [ ] Implement email notifications for order confirmations, favorites, follows (if needed)

## Testing & Quality
- [ ] Add comprehensive error handling and user-friendly error messages throughout the app
- [ ] Improve loading states and skeleton screens for better UX during data fetching
- [ ] Audit and improve accessibility (ARIA labels, keyboard navigation, screen reader support)

## Launch Prep
- [ ] Recruit and onboard beta testers - create feedback collection system
- [ ] Create user documentation/help guides for buyers and sellers
- [ ] Add proper SEO metadata, Open Graph tags, and structured data for listings
- [ ] Set up analytics tracking (user behavior, search patterns, popular items)

---

## Stripe Integration Details

### Approach: Stripe Connect Standard Accounts

**What ThriftShopper Needs:**
- Generate Stripe Connect onboarding link for sellers
- Integrate "Set up payouts" button in seller dashboard
- Handle webhook events for account status updates

**What Sellers Do:**
1. Click "Set up payouts" in seller dashboard
2. Redirected to Stripe's secure onboarding page
3. Enter: Name, Address, Bank account/debit card, EIN/SSN
4. Confirm identity
5. Done - payouts route automatically

**Compliance Language:**
"ThriftShopper uses Stripe to process payouts. You must complete Stripe's secure onboarding to receive sales proceeds."

---

*Last updated: [Current Date]*

