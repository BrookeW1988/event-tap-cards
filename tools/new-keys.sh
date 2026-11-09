#!/bin/bash
# Makes your two secret keys and saves them in .env (only if you don't have them yet).
#   ADMIN_KEY   unlocks your admin page
#   CARD_SECRET makes the secret code at the end of each card's address
# ⚠ Once you've written cards, never change CARD_SECRET: the cards would stop working.
cd "$(dirname "$0")/.." || exit 1
[ -f .env ] || cp .env.example .env
for pair in "ADMIN_KEY:12" "CARD_SECRET:16"; do
  name="${pair%%:*}"
  bytes="${pair##*:}"
  if grep -q "^$name=.\+" .env; then
    echo "$name: already set, leaving it alone"
  else
    key=$(openssl rand -hex "$bytes")
    # Replace the empty line if it's there, otherwise add one.
    if grep -q "^$name=" .env; then
      sed -i.bak "s/^$name=.*/$name=$key/" .env && rm -f .env.bak
    else
      echo "$name=$key" >> .env
    fi
    echo "$name: made a new one"
  fi
done
echo "Saved in .env (that file stays on your computer)."
