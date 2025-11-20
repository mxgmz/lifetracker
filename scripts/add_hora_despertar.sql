-- Run this script in your Supabase SQL Editor to update the database schema

ALTER TABLE dim_rutina
ADD COLUMN IF NOT EXISTS hora_despertar TIME;

COMMENT ON COLUMN dim_rutina.hora_despertar IS 'Hora real en la que el usuario se despertó';
