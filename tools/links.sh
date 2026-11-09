#!/bin/bash
# Writes my-links.md: your admin, set-up, big-screen and test card links.
# The file stays on your computer (it's in .gitignore), so your keys never go in a chat.
#
#   bash tools/links.sh                                  links for testing on this computer
#   bash tools/links.sh https://your-cards.netlify.app   adds your live links (remembered)
cd "$(dirname "$0")/.." || exit 1
[ -f .env ] || { echo "No .env yet: run 'npm run setup' first."; exit 1; }
get() { grep "^$1=" .env | head -n 1 | cut -d= -f2-; }

# Remember the live address in .env so the next run (and the card lists) use it.
if [ -n "$1" ]; then
  live="${1%/}"
  if grep -q '^SITE_URL=' .env; then
    sed -i.bak "s#^SITE_URL=.*#SITE_URL=$live#" .env && rm -f .env.bak
  else
    echo "SITE_URL=$live" >> .env
  fi
fi
live=$(get SITE_URL)
admin=$(get ADMIN_KEY)

{
  echo "# My tap card links"
  echo
  echo "Private: don't share the admin link with anyone. It shows people's private emails."
  for base in $live http://localhost:8888; do
    echo
    if [ "$base" = "http://localhost:8888" ]; then
      echo "## Testing on this computer (run \`npm run dev\` first)"
      card1=$(node tools/card-list.mjs --local --show 1)
      card2=$(node tools/card-list.mjs --local --show 2)
    else
      echo "## Live"
      card1=$(node tools/card-list.mjs --show 1)
      card2=$(node tools/card-list.mjs --show 2)
    fi
    echo
    echo "- Admin (you only): $base/admin#key=$admin"
    echo "- Set-up page (what the big-screen QR opens): $base/cards"
    echo "- Big-screen page (TV or projector, press F): $base/screen"
    echo "- Test card 1: $card1"
    echo "- Test card 2: $card2"
  done
  echo
  echo "Card lists for NFC Tools: download them from your LIVE admin page on your iPhone,"
  echo "or ask Claude to make them (they land in the card-lists folder)."
} > my-links.md
echo "Saved your links in my-links.md (open it from the file list)."
