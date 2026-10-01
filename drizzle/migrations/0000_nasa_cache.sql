CREATE TABLE public.nasa_cache (
  key text PRIMARY KEY,
  payload jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.nasa_cache TO service_role;
ALTER TABLE public.nasa_cache ENABLE ROW LEVEL SECURITY;