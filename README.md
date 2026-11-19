# Tariff X-Ray

Compare selected Bell Canada and TELUS wholesale fibre access, capacity, and install charges in CRTC orders 2024-261 and 2026-77. Search by tariff item family, provider, province, charge or speed tier. Comparable entries in a details panel have the same published speed tier or charge category across orders.

This is an intentionally small, hand-checked catalogue. Amounts are published order values in Canadian dollars. The displayed effective dates are the rates' headings in the original appendices. The final order also sets retroactive adjustment rules, which are linked in the relevant records. The catalogue does not calculate bills or represent every tariff amendment. The carrier pages and CRTC orders remain the authoritative sources.

<!-- coolcode:guide -->
An internet provider pays Bell or TELUS for use of its Canadian network. For Bell in Ontario and Quebec, the 2026 order lists CAD $68.26 per access in the 3–1,500 Mbps tier, with capacity and installation priced separately.
<!-- /coolcode:guide -->

The market is the service location. Retail subscribers buy a plan from their internet provider. Border duties on goods are a separate use of the word tariff. [CRTC order, Appendix 1](https://web.crtc.gc.ca/eng/archive/2026/2026-77.htm) · [CBSA import duties](https://www.cbsa-asfc.gc.ca/import/guide-3-eng.html)

## Build and edit

Run `python3 scripts/build.py` and serve `dist/`. All browsing and CSV export run locally after loading the generated catalogue. Edit `data/approved-rates.json` when adding a checked order. Verify the exact market, speed range, unit, order status, effective date and any retroactivity against the published appendix. Link original carrier material. The build has no network dependencies or scheduled refresh requirement.

## Sources

- [CRTC 2024-261](https://crtc.gc.ca/eng/archive/2024/2024-261.htm)
- [CRTC 2026-77](https://crtc.gc.ca/eng/archive/2026/2026-77.htm)
- [Bell Canada tariffs](https://www.bce.ca/regulatory/tariffs/bell-canada)
- [TELUS tariffs](https://www.telus.com/en/about/policies-and-disclosures/tariffs)
