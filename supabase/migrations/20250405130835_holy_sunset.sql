-- Check for quote competition tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('quote_themes', 'quote_entries', 'quote_votes', 'quote_winners');

-- Check for quote competition functions
SELECT proname, proargnames, prosrc 
FROM pg_proc 
WHERE proname IN ('get_active_quote_theme', 'get_entry_vote_count', 'has_voted_today', 'select_quote_winner');

-- Check for RLS policies on quote tables
SELECT tablename, policyname, permissive, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('quote_themes', 'quote_entries', 'quote_votes', 'quote_winners');

-- Check for edge functions
SELECT name, status
FROM supabase_functions.hooks
WHERE name IN ('submit-quote-entry', 'vote-for-quote', 'announce-winner');