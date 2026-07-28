#!/usr/bin/env python3
"""
Build a locale file from a flat {"a.b.c": "translation"} map, using en.json's
exact shape.

Writing nine nested JSON files by hand is nine chances to drop a key or nest
one a level too deep, and the failure mode is a screen that silently prints
"settings.themes.night" to a user. This takes the English file as the
structural source of truth and refuses to write anything that does not match
it key for key.

    python3 scripts/build-locale.py de < de.flat.json
"""

import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
LOCALES = os.path.join(HERE, "..", "locales")


def flatten(obj, prefix=""):
    out = {}
    for k, v in obj.items():
        key = f"{prefix}{k}"
        if isinstance(v, dict):
            out.update(flatten(v, key + "."))
        else:
            out[key] = v
    return out


def rebuild(shape, flat, path=""):
    """Walk en.json's shape, pulling each leaf from `flat`."""
    out = {}
    for k, v in shape.items():
        key = f"{path}{k}"
        if isinstance(v, dict):
            out[k] = rebuild(v, flat, key + ".")
        else:
            out[k] = flat[key]
    return out


def main():
    lang = sys.argv[1]
    english = json.load(open(os.path.join(LOCALES, "en.json"), encoding="utf-8"))
    flat_en = flatten(english)
    flat_new = json.load(sys.stdin)

    missing = sorted(set(flat_en) - set(flat_new))
    extra = sorted(set(flat_new) - set(flat_en))
    if missing or extra:
        if missing:
            print(f"[{lang}] MISSING {len(missing)}:", missing[:12], file=sys.stderr)
        if extra:
            print(f"[{lang}] UNKNOWN {len(extra)}:", extra[:12], file=sys.stderr)
        sys.exit(1)

    # Interpolation placeholders are the one thing a translator can silently
    # break; a dropped {{minutes}} renders as a sentence with a hole in it.
    import re

    for key, source in flat_en.items():
        want = set(re.findall(r"\{\{(\w+)\}\}", source))
        got = set(re.findall(r"\{\{(\w+)\}\}", flat_new[key]))
        if want != got:
            print(f"[{lang}] placeholder mismatch at {key}: {want} vs {got}", file=sys.stderr)
            sys.exit(1)

    path = os.path.join(LOCALES, f"{lang}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(rebuild(english, flat_new), f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"wrote locales/{lang}.json ({len(flat_new)} keys)")


if __name__ == "__main__":
    main()
