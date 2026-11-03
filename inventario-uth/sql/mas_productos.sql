-- =====================================================================
-- Agrega más productos con existencias iniciales
-- Pegar en Supabase > SQL Editor > Run (una sola vez)
-- Las existencias entran como movimientos, así quedan en la bitácora
-- a nombre del administrador.
-- =====================================================================

do $$
declare
  admin_id uuid;
begin
  -- Usamos la cuenta del administrador como autor de las entradas
  select id into admin_id from public.perfiles where correo = 'cesia+admin@gmail.com';
  if admin_id is null then
    raise exception 'No se encontró la cuenta cesia+admin@gmail.com';
  end if;
  perform set_config('request.jwt.claims', json_build_object('sub', admin_id, 'role', 'authenticated')::text, true);

  insert into public.productos (codigo, nombre, minimo) values
    ('P-0103', 'Monitor 24 pulgadas', 4),
    ('P-0104', 'Audífonos con micrófono', 8),
    ('P-0105', 'Cámara web HD', 5),
    ('P-0216', 'Cable de red Cat6 (3 m)', 15),
    ('P-0217', 'Adaptador USB-C a HDMI', 6),
    ('P-0218', 'Regleta con protector', 5),
    ('P-0331', 'Memoria RAM 8 GB DDR4', 6),
    ('P-0332', 'Disco SSD 500 GB', 5),
    ('P-0333', 'Fuente de poder 500 W', 3),
    ('P-0401', 'Memoria USB 32 GB', 20),
    ('P-0402', 'Router inalámbrico', 3),
    ('P-0403', 'Cargador universal para laptop', 4)
  on conflict (codigo) do nothing;

  insert into public.movimientos (producto_id, tipo, cantidad, nota)
  select p.id, 'entrada', v.cantidad, 'Inventario inicial'
  from (values
    ('P-0103', 12),
    ('P-0104', 6),
    ('P-0105', 9),
    ('P-0216', 40),
    ('P-0217', 4),
    ('P-0218', 11),
    ('P-0331', 14),
    ('P-0332', 7),
    ('P-0333', 2),
    ('P-0401', 55),
    ('P-0402', 5),
    ('P-0403', 3)
  ) as v(codigo, cantidad)
  join public.productos p on p.codigo = v.codigo
  where p.cantidad = 0;  -- no vuelve a cargar si ya tienen existencias

  -- Algunas salidas de ejemplo para que las gráficas tengan datos
  insert into public.movimientos (producto_id, tipo, cantidad, nota)
  select p.id, 'salida', v.cantidad, 'Venta de ejemplo'
  from (values
    ('P-0401', 18),
    ('P-0216', 12),
    ('P-0103', 3),
    ('P-0331', 5)
  ) as v(codigo, cantidad)
  join public.productos p on p.codigo = v.codigo
  where p.cantidad >= v.cantidad;
end $$;
