#!/bin/bash
# ─────────────────────────────────────────────────────
# SaaS Template Setup — einmalig ausführen
# ─────────────────────────────────────────────────────
set -e

echo "🚀 SaaS Template Setup"
echo "─────────────────────"

# 1. Dependencies installieren
echo "📦 Installiere Dependencies..."
npm install

# 2. .env vorbereiten
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ .env erstellt — bitte ausfüllen!"
else
  echo "⚠️  .env existiert bereits — wird nicht überschrieben"
fi

echo ""
echo "✅ Setup abgeschlossen!"
echo ""
echo "Nächste Schritte:"
echo "  1. .env ausfüllen (Clerk, Supabase, Stripe Keys)"
echo "  2. supabase/schema.sql in Supabase ausführen"
echo "  3. npm run dev — startet Web (3000) + API (3001)"
echo ""
echo "🔑 Keys holen:"
echo "  Clerk:    https://dashboard.clerk.com"
echo "  Supabase: https://supabase.com/dashboard"
echo "  Stripe:   https://dashboard.stripe.com"
