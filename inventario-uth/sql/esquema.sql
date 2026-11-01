-- =====================================================================
-- Gestor de inventario con privilegios
-- Pegar completo en Supabase > SQL Editor > Run
-- =====================================================================

-- ---------- 1. Tablas ----------

create table public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  correo text,
  rol text not null default 'consulta' check (rol in ('admin', 'bodega', 'consulta')),
  creado_en timestamptz not null default now()
);

create table public.productos (
  id bigint generated always as identity primary key,
  codigo text not null unique,
  nombre text not null,
  cantidad integer not null default 0 check (cantidad >= 0),
  minimo integer not null default 0 check (minimo >= 0),
  creado_en timestamptz not null default now()
);

-- La bitácora: cada entrada o salida queda guardada con quién y cuándo
create table public.movimientos (
  id bigint generated always as identity primary key,
  producto_id bigint not null references public.productos(id) on delete restrict,
  tipo text not null check (tipo in ('entrada', 'salida')),
  cantidad integer not null check (cantidad > 0),
  nota text,
  usuario_id uuid not null default auth.uid() references public.perfiles(id),
  fecha timestamptz not null default now()
);

-- ---------- 2. Funciones de apoyo ----------

-- Devuelve el rol del usuario que hace la consulta
create or replace function public.mi_rol()
returns text
language sql stable security definer set search_path = public
as $$
  select rol from public.perfiles where id = auth.uid();
$$;

-- true solo si la sesión ya pasó el código de 6 dígitos (nivel aal2)
create or replace function public.mfa_ok()
returns boolean
language sql stable
as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;

-- ---------- 3. Triggers ----------

-- Crea el perfil automáticamente cuando se crea un usuario (rol consulta)
create or replace function public.crear_perfil()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre, correo)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger trg_crear_perfil
after insert on auth.users
for each row execute function public.crear_perfil();

-- Suma o resta existencias al registrar un movimiento
create or replace function public.aplicar_movimiento()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  actual integer;
begin
  select cantidad into actual
  from public.productos
  where id = new.producto_id
  for update;

  if actual is null then
    raise exception 'El producto no existe';
  end if;

  if new.tipo = 'salida' and new.cantidad > actual then
    raise exception 'No hay suficiente existencia: hay % y se quieren sacar %', actual, new.cantidad;
  end if;

  update public.productos
  set cantidad = cantidad + case when new.tipo = 'entrada' then new.cantidad else -new.cantidad end
  where id = new.producto_id;

  new.usuario_id := auth.uid();  -- nadie puede registrar a nombre de otro
  return new;
end;
$$;

create trigger trg_aplicar_movimiento
before insert on public.movimientos
for each row execute function public.aplicar_movimiento();

-- ---------- 4. Permisos por columna ----------
-- La cantidad solo cambia con movimientos, así siempre queda en la bitácora

revoke insert, update on public.productos from authenticated;
grant insert (codigo, nombre, minimo) on public.productos to authenticated;
grant update (codigo, nombre, minimo) on public.productos to authenticated;

revoke update on public.perfiles from authenticated;
grant update (nombre, rol) on public.perfiles to authenticated;

-- ---------- 5. Row Level Security ----------

alter table public.perfiles enable row level security;
alter table public.productos enable row level security;
alter table public.movimientos enable row level security;

-- Perfiles
create policy "Leer perfiles con MFA"
on public.perfiles for select to authenticated
using (mfa_ok());

create policy "Solo admin cambia perfiles"
on public.perfiles for update to authenticated
using (mfa_ok() and mi_rol() = 'admin')
with check (mfa_ok() and mi_rol() = 'admin');

-- Productos
create policy "Leer productos con MFA"
on public.productos for select to authenticated
using (mfa_ok());

create policy "Solo admin crea productos"
on public.productos for insert to authenticated
with check (mfa_ok() and mi_rol() = 'admin');

create policy "Solo admin edita productos"
on public.productos for update to authenticated
using (mfa_ok() and mi_rol() = 'admin')
with check (mfa_ok() and mi_rol() = 'admin');

create policy "Solo admin borra productos"
on public.productos for delete to authenticated
using (mfa_ok() and mi_rol() = 'admin');

-- Movimientos (sin políticas de update ni delete: la bitácora no se puede alterar)
create policy "Leer movimientos con MFA"
on public.movimientos for select to authenticated
using (mfa_ok());

create policy "Admin y bodega registran movimientos"
on public.movimientos for insert to authenticated
with check (mfa_ok() and mi_rol() in ('admin', 'bodega'));

-- ---------- 6. Datos de ejemplo ----------

insert into public.productos (codigo, nombre, minimo) values
  ('P-0101', 'Mouse USB', 10),
  ('P-0102', 'Teclado', 10),
  ('P-0215', 'Cable HDMI', 5),
  ('P-0330', 'Pasta térmica', 4);

-- Las existencias iniciales se cargan como entradas desde la app,
-- así quedan en la bitácora. (Ver LEEME.md)
