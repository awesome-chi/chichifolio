-- ChiChiFolio Supabase Schema
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- Drop existing objects first
DROP FUNCTION IF EXISTS public.fn_admin_login(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.fn_delete_user(TEXT);
DROP FUNCTION IF EXISTS public.fn_update_user(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.fn_add_user(TEXT, TEXT, TEXT, BOOLEAN, TEXT);
DROP FUNCTION IF EXISTS public.fn_save_holdings(TEXT, JSON);
DROP FUNCTION IF EXISTS public.fn_load_users();
DROP FUNCTION IF EXISTS public.fn_login(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.fn_signup(TEXT, TEXT, TEXT, TEXT);
DROP TABLE IF EXISTS public.holdings;
DROP TABLE IF EXISTS public.users;

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── Tables ─────────────────────────────────────────────────

CREATE TABLE public.users (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  color TEXT DEFAULT '#06b6d4',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.holdings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  shares REAL NOT NULL DEFAULT 0,
  avg_price REAL NOT NULL DEFAULT 0,
  avg_cost REAL NOT NULL DEFAULT 0,
  purchase_rate REAL NOT NULL DEFAULT 1,
  currency TEXT DEFAULT 'USD'
);

CREATE INDEX idx_holdings_user ON public.holdings(user_id);

-- Enable RLS (all access goes through SECURITY DEFINER functions)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;

-- ─── RPC: Signup ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_signup(p_id TEXT, p_name TEXT, p_password TEXT, p_color TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE rec public.users%ROWTYPE;
BEGIN
  INSERT INTO public.users(id, name, password_hash, is_admin, color)
  VALUES(p_id, p_name, crypt(p_password, gen_salt('bf')), FALSE, p_color)
  RETURNING * INTO rec;
  RETURN json_build_object('id', rec.id, 'name', rec.name, 'isAdmin', rec.is_admin, 'color', rec.color);
EXCEPTION WHEN unique_violation THEN
  RETURN NULL;
END;
$$;

-- ─── RPC: Login ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_login(p_name TEXT, p_password TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE rec public.users%ROWTYPE; h JSON;
BEGIN
  SELECT * INTO rec FROM public.users
  WHERE name = p_name AND password_hash = crypt(p_password, password_hash);
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT COALESCE(json_agg(json_build_object(
    'id', id, 'ticker', ticker, 'shares', shares,
    'avgPrice', avg_price, 'avgCost', avg_cost,
    'purchaseRate', purchase_rate, 'currency', currency
  )), '[]'::json) INTO h FROM public.holdings WHERE user_id = rec.id;

  RETURN json_build_object(
    'id', rec.id, 'name', rec.name,
    'isAdmin', rec.is_admin, 'color', rec.color,
    'holdings', h
  );
END;
$$;

-- ─── RPC: Load All Users ───────────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_load_users()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result JSON;
BEGIN
  SELECT COALESCE(json_agg(row_data ORDER BY created_at), '[]'::json)
  INTO result
  FROM (
    SELECT json_build_object(
      'id', u.id, 'name', u.name,
      'isAdmin', u.is_admin, 'color', u.color,
      'holdings', COALESCE(
        (SELECT json_agg(json_build_object(
          'id', h.id, 'ticker', h.ticker, 'shares', h.shares,
          'avgPrice', h.avg_price, 'avgCost', h.avg_cost,
          'purchaseRate', h.purchase_rate, 'currency', h.currency
        )) FROM public.holdings h WHERE h.user_id = u.id),
        '[]'::json
      )
    ) AS row_data, u.created_at
    FROM public.users u
  ) sub;
  RETURN result;
END;
$$;

-- ─── RPC: Save Holdings (replace all for a user) ───────────

CREATE OR REPLACE FUNCTION public.fn_save_holdings(p_user_id TEXT, p_holdings JSON)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.holdings WHERE user_id = p_user_id;

  IF p_holdings IS NOT NULL AND json_array_length(p_holdings) > 0 THEN
    INSERT INTO public.holdings(id, user_id, ticker, shares, avg_price, avg_cost, purchase_rate, currency)
    SELECT
      COALESCE(NULLIF(h->>'id',''), substr(md5(random()::text), 1, 7)),
      p_user_id,
      h->>'ticker',
      COALESCE((h->>'shares')::REAL, 0),
      COALESCE((h->>'avgPrice')::REAL, 0),
      COALESCE((h->>'avgCost')::REAL, 0),
      COALESCE((h->>'purchaseRate')::REAL, 1),
      COALESCE(h->>'currency', 'USD')
    FROM json_array_elements(p_holdings) AS h;
  END IF;
END;
$$;

-- ─── RPC: Add User (admin) ─────────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_add_user(p_id TEXT, p_name TEXT, p_password TEXT, p_is_admin BOOLEAN, p_color TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE rec public.users%ROWTYPE;
BEGIN
  INSERT INTO public.users(id, name, password_hash, is_admin, color)
  VALUES(p_id, p_name, crypt(p_password, gen_salt('bf')), p_is_admin, p_color)
  RETURNING * INTO rec;
  RETURN json_build_object('id', rec.id, 'name', rec.name, 'isAdmin', rec.is_admin, 'color', rec.color);
EXCEPTION WHEN unique_violation THEN
  RETURN NULL;
END;
$$;

-- ─── RPC: Update User (admin) ──────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_update_user(p_user_id TEXT, p_name TEXT, p_password TEXT, p_color TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_password IS NOT NULL AND p_password <> '' THEN
    UPDATE public.users
    SET name = COALESCE(NULLIF(p_name,''), name),
        password_hash = crypt(p_password, gen_salt('bf')),
        color = COALESCE(NULLIF(p_color,''), color)
    WHERE id = p_user_id;
  ELSE
    UPDATE public.users
    SET name = COALESCE(NULLIF(p_name,''), name),
        color = COALESCE(NULLIF(p_color,''), color)
    WHERE id = p_user_id;
  END IF;
END;
$$;

-- ─── RPC: Delete User (admin) ──────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_delete_user(p_user_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.users WHERE id = p_user_id;
END;
$$;

-- ─── RPC: Admin Login ──────────────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_admin_login(p_id TEXT, p_name TEXT, p_password TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE rec public.users%ROWTYPE; h JSON;
BEGIN
  SELECT * INTO rec FROM public.users WHERE is_admin = TRUE LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.users(id, name, password_hash, is_admin, color)
    VALUES(p_id, p_name, crypt(p_password, gen_salt('bf')), TRUE, '#06b6d4')
    RETURNING * INTO rec;
  END IF;

  SELECT COALESCE(json_agg(json_build_object(
    'id', id, 'ticker', ticker, 'shares', shares,
    'avgPrice', avg_price, 'avgCost', avg_cost,
    'purchaseRate', purchase_rate, 'currency', currency
  )), '[]'::json) INTO h FROM public.holdings WHERE user_id = rec.id;

  RETURN json_build_object(
    'id', rec.id, 'name', rec.name,
    'isAdmin', rec.is_admin, 'color', rec.color,
    'holdings', h
  );
END;
$$;
