/*
  # Allow reading collections of users visible in ranking

  ## Changes
  - Adds a SELECT policy on `collections` allowing any authenticated user to read
    collections belonging to profiles that have `show_in_nearby = true`.
    This is required for the ranking feature to calculate progress for other users.

  ## Security
  - Only collections of users who explicitly opted in (show_in_nearby = true) are readable.
  - The user's own collection remains readable via the existing policy.
*/

CREATE POLICY "Authenticated users can read collections of visible profiles"
  ON collections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = collections.user_id
        AND profiles.show_in_nearby = true
    )
  );
