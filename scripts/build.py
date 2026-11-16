#!/usr/bin/env python3
"""Publish the transcribed CRTC subset as a standalone static index."""
from decimal import Decimal
import json
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parent.parent
DATA = json.loads((ROOT / "data/approved-rates.json").read_text())
DIST = ROOT / "dist"
BELL = "https://www.bce.ca/regulatory/tariffs/bell-canada"
TELUS = "https://www.telus.com/en/about/policies-and-disclosures/tariffs"


def row(table, name, kind, amount, unit, qualifier=""):
    carrier, region, item, interim, retro = DATA["markets"][table["market"]]
    order = table["order"]
    final = order == "2026-77"
    date = "2026-04-24" if final else interim
    status = "Final" if final else "Interim"
    money = f"${Decimal(amount):,.2f} CAD"
    explanation = {
        "Fibre access": "Wholesale FTTP access charge for the published speed band.",
        "Capacity billing": (
            "Aggregated FTTN and FTTP traffic capacity charge per 100 Mbps."
            if carrier == "Bell Canada" else "Aggregated FTTP traffic capacity charge per 100 Mbps."
        ),
        "Service charge": "Published charge for an installation or move under the stated visit conditions.",
    }[kind]
    summary = f"{explanation} {unit}."
    fields = {
        "Provider": carrier, "Market": region, "Tariff item family": item, "Charge type": kind,
        "Amount": money, "Billing measure": unit, "Order": f"CRTC {order}", "Order status": status,
        "Published effective date": date,
    }
    if qualifier:
        fields["Speed band"] = qualifier
    if final:
        fields["Retroactivity"] = (
            f"Final order discusses retroactive FTTP adjustments from {retro} for applicable interim amounts. "
            "It gives separate rules for temporary service and FTTN capacity."
        )
    alias = ("BC AB western Alberta British Columbia" if table["market"] == "telus-west" else
             "QC Quebec" if table["market"] == "telus-qc" else "ON QC Ontario Quebec")
    return {
        "title": f"{carrier} · {name}", "date": date, "kicker": f"{region} / {status}",
        "summary": summary, "highlight": money, "a": carrier, "b": kind, "c": region,
        "keywords": f"{alias} fibre fiber broadband wholesale {order} {item} {qualifier}",
        "fields": fields, "compare": f"{table['market']}:{kind}:{name}",
        "links": [
            {"label": f"CRTC order {order}", "url": DATA["proceedings"][order]},
            {"label": f"{carrier} tariffs", "url": BELL if carrier == "Bell Canada" else TELUS},
        ],
    }


def main():
    records = []
    for table in DATA["tables"]:
        records.extend(row(table, speed, "Fibre access", amount, "Per FTTP access", speed)
                       for speed, amount in table["access"])
        records.append(row(table, "Capacity-based billing", "Capacity billing", table["capacity"],
                           "Per 100 Mbps of capacity"))
        for label, amount in zip(("Install or move without a site visit", "Install or move with a site visit"), table["install"], strict=True):
            records.append(row(table, label, "Service charge", amount, "Per eligible service transaction"))
    if len(records) != 28:
        raise ValueError(f"Unexpected number of rate rows: {len(records)}")
    catalog = {
        "slug": "tariffxray", "coverage": f"{len(records)} published rate entries", "updated": DATA["checked"],
        "method": "Amounts are transcribed from the relevant appendices. A history appears for the same carrier, region and charge when the source scope matches. The final order specifies retroactive adjustments for some rates.",
        "facets": ["Carrier", "Charge type", "Market"],
        "examples": ["TELUS BC", "Bell 5460", "capacity", "site visit"],
        "sources": [
            {"label": "2024 interim rate order", "url": DATA["proceedings"]["2024-261"]},
            {"label": "2026 final rate order", "url": DATA["proceedings"]["2026-77"]},
            {"label": "Bell Canada tariffs", "url": BELL},
            {"label": "TELUS tariffs", "url": TELUS},
        ],
        "records": records,
    }
    shutil.copytree(ROOT / "web", DIST, dirs_exist_ok=True)
    (DIST / "catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, separators=(",", ":")))
    print(f"Tariff X-Ray: {len(records)} approved rate entries")


if __name__ == "__main__":
    main()
