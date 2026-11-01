# Gestor de inventario con privilegios

Supabase (PostgreSQL, Auth, RLS, código de 6 dígitos) + páginas en HTML y JavaScript publicadas en Vercel.

## Archivos

- `sql/esquema.sql`: tablas, triggers, permisos y políticas RLS.
- `index.html`: correo y contraseña.
- `verificar.html`: código de 6 dígitos (la primera vez muestra el QR).
- `inventario.html`: productos, entradas y salidas.
- `movimientos.html`: bitácora de quién movió qué y cuándo.
- `reportes.html`: productos por pedir y totales de 30 días.
- `usuarios.html`: roles (solo admin).
- `js/config.js`: aquí van la URL y la llave de Supabase.

## 1. Supabase

1. Crea un proyecto en supabase.com (plan gratis).
2. Abre **SQL Editor**, pega todo `sql/esquema.sql` y dale **Run**.
3. En **Authentication > Sign In / Providers**, desactiva "Allow new users to sign up" para que solo el admin cree cuentas.
4. En **Authentication > Multi-Factor**, confirma que TOTP (app autenticadora) esté habilitado.
5. En **Project Settings > API**, copia la *Project URL* y la *anon public key* y pégalas en `js/config.js`.

## 2. Usuarios de prueba

1. En **Authentication > Users > Add user > Create new user**, crea tres cuentas (marca "Auto Confirm User"). Por ejemplo: admin, bodega y consulta.
2. Todas nacen con rol Consulta. Para volver admin a la primera, en SQL Editor:

   ```sql
   update perfiles set rol = 'admin', nombre = 'Cesia' where correo = 'tu-correo@ejemplo.com';
   ```

3. Entra con esa cuenta, ve a **Usuarios** y asigna Bodega a la segunda.

## 3. Probar en tu computadora

Abre la carpeta en VS Code y usa la extensión **Live Server** sobre `index.html`.
La primera vez que cada usuario entra, escanea el QR con Google Authenticator o Microsoft Authenticator.

Los productos de ejemplo empiezan en 0. Con la cuenta admin registra entradas
(Mouse 42, Teclado 8, Cable HDMI 25, Pasta térmica 3) para que se vea como el boceto.

## 4. Publicar en Vercel

1. Sube la carpeta a un repositorio de GitHub.
2. En vercel.com: **Add New > Project**, elige el repositorio, framework **Other**, sin comando de build, y **Deploy**.
3. Cada `git push` vuelve a publicar la página.

La anon key puede ir en el código público: lo que protege los datos son las políticas RLS, no esconder la llave.

## Qué mostrar en la demo

- Entrar con contraseña y que pida el código de 6 dígitos.
- Bodega registra una salida y el estado cambia a "Pedir más".
- Consulta ve la tabla pero no tiene botones.
- Bodega no ve "Usuarios"; si escribe `usuarios.html` en la barra, lo regresa.
- Intentar sacar más de lo que hay y que la base de datos lo rechace.
- En Movimientos aparece quién hizo cada cambio.

## Recordatorio

El plan gratis se pausa después de 7 días sin uso. Entra al proyecto un día antes de presentar.
