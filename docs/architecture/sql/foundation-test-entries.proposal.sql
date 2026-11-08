-- DESIGN ONLY. NOT EXECUTED. Not a CLI migration; requires separate approval.
-- Target: kllghkmudpcwbnjsodtx. Stop if the table already exists.
BEGIN;
CREATE TABLE public.foundation_test_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX foundation_test_entries_user_id_idx
  ON public.foundation_test_entries (user_id);

ALTER TABLE public.foundation_test_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foundation_test_entries FORCE ROW LEVEL SECURITY;

-- Remove defaults on this new relation only. Do not alter global defaults.
REVOKE ALL PRIVILEGES ON TABLE public.foundation_test_entries
  FROM PUBLIC, anon, authenticated;
GRANT SELECT, DELETE ON TABLE public.foundation_test_entries TO authenticated;
GRANT INSERT (user_id, content) ON public.foundation_test_entries TO authenticated;
GRANT UPDATE (content, user_id) ON public.foundation_test_entries TO authenticated;

CREATE POLICY foundation_entries_select_own
  ON public.foundation_test_entries FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);
CREATE POLICY foundation_entries_insert_own
  ON public.foundation_test_entries FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);
CREATE POLICY foundation_entries_update_own
  ON public.foundation_test_entries FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);
CREATE POLICY foundation_entries_delete_own
  ON public.foundation_test_entries FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);
COMMIT;
