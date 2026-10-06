# Observatorio Ciencias Económicas 4.0

Aplicación institucional para CPCE Delegación La Plata / proyecto de investigación.

## 1. GitHub
Crear un repositorio vacío (sugerido: `observatorio-ciencias-economicas-40`) y subir todo este paquete.

## 2. Vercel
Importar el repositorio en Vercel desde la cuenta institucional. Framework: Next.js. No requiere cambiar Build Command.

## 3. Supabase
Crear un proyecto en Supabase > SQL Editor y ejecutar `supabase.sql`.

En Vercel > Project > Settings > Environment Variables agregar:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_GOOGLE_FORM_URL`

Copiar los tres primeros desde Supabase > Project Settings / API.
El último es la URL pública del Google Form ya aprobado.

## 4. Instrumento actual
La página `/participar` abre el Google Form existente, por lo que el cuestionario no cambia.

### Para tener el dashboard con las respuestas históricas
Hay dos caminos:
A) Migrar/importar las respuestas actuales a `responses` como JSON.
B) En una fase posterior, reemplazar el Google Form por una UI propia que replique exactamente las mismas preguntas y guarde directamente en Supabase.

La opción B es la experiencia final recomendada, pero debe validarse contra el instrumento exacto antes de activarla.

## 5. Rutas
- `/` landing institucional
- `/participar` acceso al instrumento
- `/observatorio` dashboard público
- `/api/dashboard` agregación server-side
- `/api/survey` endpoint de carga futura

## Seguridad
La tabla tiene RLS activado y no tiene políticas públicas. El service role queda únicamente en Vercel (servidor), nunca en el navegador.
