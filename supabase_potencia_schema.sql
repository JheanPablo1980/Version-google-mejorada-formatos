-- Execute this script in your Supabase SQL Editor to add the missing columns for the POTENCIA profile type

-- ALTER TABLE perfiles ADD COLUMN tipo text DEFAULT 'INSTRUMENTACION';
-- we are wrapped in block below to ignore errors if it already exists

DO $$
BEGIN
  -- We add the 'tipo' column if it does not exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='perfiles' AND column_name='tipo') THEN
    ALTER TABLE perfiles ADD COLUMN tipo text DEFAULT 'INSTRUMENTACION';
  END IF;

  -- Metadata for Potencia
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='perfiles' AND column_name='pot_codigo') THEN
    ALTER TABLE perfiles ADD COLUMN pot_codigo text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='perfiles' AND column_name='ac1_no') THEN
    ALTER TABLE perfiles ADD COLUMN ac1_no text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='perfiles' AND column_name='hc1_no') THEN
    ALTER TABLE perfiles ADD COLUMN hc1_no text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='perfiles' AND column_name='contratista') THEN
    ALTER TABLE perfiles ADD COLUMN contratista text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='perfiles' AND column_name='area') THEN
    ALTER TABLE perfiles ADD COLUMN area text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='perfiles' AND column_name='locacion') THEN
    ALTER TABLE perfiles ADD COLUMN locacion text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='perfiles' AND column_name='servicio') THEN
    ALTER TABLE perfiles ADD COLUMN servicio text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='perfiles' AND column_name='p_id_no') THEN
    ALTER TABLE perfiles ADD COLUMN p_id_no text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='perfiles' AND column_name='rev_p_id') THEN
    ALTER TABLE perfiles ADD COLUMN rev_p_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='perfiles' AND column_name='paquete_no') THEN
    ALTER TABLE perfiles ADD COLUMN paquete_no text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='perfiles' AND column_name='plano_no') THEN
    ALTER TABLE perfiles ADD COLUMN plano_no text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='perfiles' AND column_name='rev_plano') THEN
    ALTER TABLE perfiles ADD COLUMN rev_plano text;
  END IF;

  -- Checklist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='perfiles' AND column_name='chkl_1_desc') THEN
    ALTER TABLE perfiles ADD COLUMN chkl_1_desc text;
    ALTER TABLE perfiles ADD COLUMN chkl_1_estado text;
    ALTER TABLE perfiles ADD COLUMN chkl_2_desc text;
    ALTER TABLE perfiles ADD COLUMN chkl_2_estado text;
    ALTER TABLE perfiles ADD COLUMN chkl_3_desc text;
    ALTER TABLE perfiles ADD COLUMN chkl_3_estado text;
    ALTER TABLE perfiles ADD COLUMN chkl_4_desc text;
    ALTER TABLE perfiles ADD COLUMN chkl_4_estado text;
    ALTER TABLE perfiles ADD COLUMN chkl_5_desc text;
    ALTER TABLE perfiles ADD COLUMN chkl_5_estado text;
    ALTER TABLE perfiles ADD COLUMN chkl_6_desc text;
    ALTER TABLE perfiles ADD COLUMN chkl_6_estado text;
    ALTER TABLE perfiles ADD COLUMN chkl_7_desc text;
    ALTER TABLE perfiles ADD COLUMN chkl_7_estado text;
    ALTER TABLE perfiles ADD COLUMN chkl_8_desc text;
    ALTER TABLE perfiles ADD COLUMN chkl_8_estado text;
    ALTER TABLE perfiles ADD COLUMN chkl_9_desc text;
    ALTER TABLE perfiles ADD COLUMN chkl_9_estado text;
    ALTER TABLE perfiles ADD COLUMN chkl_10_desc text;
    ALTER TABLE perfiles ADD COLUMN chkl_10_estado text;
    ALTER TABLE perfiles ADD COLUMN chkl_11_desc text;
    ALTER TABLE perfiles ADD COLUMN chkl_11_estado text;
  END IF;

  -- Signatures and related
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='perfiles' AND column_name='pot_compania_1') THEN
    ALTER TABLE perfiles ADD COLUMN pot_compania_1 text;
    ALTER TABLE perfiles ADD COLUMN pot_firma_1 text;
    ALTER TABLE perfiles ADD COLUMN pot_nombre_1 text;
    ALTER TABLE perfiles ADD COLUMN pot_fecha_1 text;
    
    ALTER TABLE perfiles ADD COLUMN pot_compania_2 text;
    ALTER TABLE perfiles ADD COLUMN pot_firma_2 text;
    ALTER TABLE perfiles ADD COLUMN pot_nombre_2 text;
    ALTER TABLE perfiles ADD COLUMN pot_fecha_2 text;
    
    ALTER TABLE perfiles ADD COLUMN pot_compania_3 text;
    ALTER TABLE perfiles ADD COLUMN pot_firma_3 text;
    ALTER TABLE perfiles ADD COLUMN pot_nombre_3 text;
    ALTER TABLE perfiles ADD COLUMN pot_fecha_3 text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='perfiles' AND column_name='pot_com_data') THEN
    ALTER TABLE perfiles ADD COLUMN pot_com_data text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='perfiles' AND column_name='pot_subtipo') THEN
    ALTER TABLE perfiles ADD COLUMN pot_subtipo text DEFAULT 'CABLE_MOTOR';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='perfiles' AND column_name='enabled') THEN
    ALTER TABLE perfiles ADD COLUMN enabled boolean DEFAULT true;
  END IF;

END $$;
