/*
  # Update Stripe Price IDs

  1. Changes
    - Update subscription tiers with correct Stripe price IDs from dashboard
    - Maintain existing tier features and perks
*/

-- Update subscription tiers with correct price IDs
INSERT INTO subscription_tiers (
  name,
  price,
  tutor_limit,
  questions_per_week,
  stripe_price_id,
  features,
  perks
) VALUES
  (
    'Single Tutor Plan',
    4.99,
    1,
    -1,
    'prod_S44obWuTp3m86f',
    '{"curriculum": true, "games": true, "flashcards": true, "challenges": true}'::jsonb,
    '{}'::jsonb
  ),
  (
    '5 Tutor Plan',
    19.99,
    5,
    -1,
    'prod_S44qmcQsAF4yyU',
    '{"curriculum": true, "games": true, "flashcards": true, "challenges": true, "analytics": true}'::jsonb,
    '{}'::jsonb
  ),
  (
    'All Access Plan',
    29.99,
    -1,
    -1,
    'prod_S45LA5uEvqGDm1',
    '{"curriculum": true, "games": true, "flashcards": true, "challenges": true, "analytics": true}'::jsonb,
    '{"premium_features": true}'::jsonb
  ),
  (
    'Elite Legend Squad',
    49.99,
    -1,
    -1,
    'prod_S45MNphHMSIXeq',
    '{"curriculum": true, "games": true, "flashcards": true, "challenges": true, "analytics": true}'::jsonb,
    '{"premium_features": true, "double_xp": true, "exclusive_cosmetics": true, "beta_access": true}'::jsonb
  )
ON CONFLICT ON CONSTRAINT subscription_tiers_stripe_price_id_key
DO UPDATE SET
  price = EXCLUDED.price,
  tutor_limit = EXCLUDED.tutor_limit,
  features = EXCLUDED.features,
  perks = EXCLUDED.perks;