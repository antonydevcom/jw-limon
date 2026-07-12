-- Migration: 0006_user_accent_preferences
-- Stores each user's visual accent preference.

alter table public.profiles
  add column if not exists accent_preference text
    check (accent_preference in ('purple', 'green', 'blue', 'pink', 'orange'));
