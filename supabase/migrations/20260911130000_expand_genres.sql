-- The genre column is actually a TEXT column with a CHECK constraint, not a Postgres ENUM type.
-- To add new valid genres, we must drop the old constraint and add a new one with the expanded list.

ALTER TABLE public.recommendations DROP CONSTRAINT IF EXISTS recommendations_genre_check;

ALTER TABLE public.recommendations 
ADD CONSTRAINT recommendations_genre_check 
CHECK (genre IN (
  'Romance',
  'Social',
  'Mystery',
  'Historical',
  'Fantasy',
  'Islamic/Spiritual',
  'Family Drama',
  'Crime/Thriller',
  'Tragedy',
  'Comedy/Humor',
  'Adventure',
  'Classic',
  'Self Help',
  'Other'
));
