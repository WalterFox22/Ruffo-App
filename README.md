# 🐾 Sistema de Gestión de Veterinaria - Prueba Técnica

Aplicación web desarrollada con **Next.js + TypeScript + Supabase + shadcn/ui** para la gestión de **clientes** y **mascotas**, con autenticación y rutas protegidas.

## 🌐 Despliegue

- URL pública: https://ruffo-app-pied.vercel.app/

## 🧰 Tecnologías principales

- Next.js
- TypeScript
- Supabase (Auth + PostgreSQL + RLS)

## 🚀 Instrucciones para correr el proyecto localmente

### 1) Clonar repositorio

```bash
git clone <url-del-repositorio>
cd ruffo_app
```

### 2) Instalar dependencias

```bash
npm install
```

### 3) Configurar variables de entorno

Crear archivo `.env` en la raíz del proyecto usando como referencia [`.env.example`](.env.example):

```env
NEXT_PUBLIC_SUPABASE_URL="AQUI_TU_URL"
NEXT_PUBLIC_SUPABASE_ANON_KEY="AQUI_TU_KEY"
```

### 4) Ejecutar en desarrollo

```bash
npm run dev
```

Luego abrir: `http://localhost:3000`

---

## 🗄️ SQL para crear tablas en Supabase

Ejecutar en el **SQL Editor** de Supabase:

```sql
create table clients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text,
  notes text,
  created_at timestamp default now()
);

create table pets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  name text not null,
  species text not null,
  breed text,
  behavior_notes text,
  created_at timestamp default now()
);

alter table clients enable row level security;
alter table pets enable row level security;

create policy "allow authenticated" on clients
for all using (auth.role() = 'authenticated');

create policy "allow authenticated" on pets
for all using (auth.role() = 'authenticated');
```

---

## 🔐 Credenciales de usuario de prueba

> Usuario creado previamente para testeo (no hay registro público en la app).

- **Email:** `test@ruffo.com`
- **Contraseña:** `123456789`

---

## 🛠️ Decisiones técnicas tomadas

1. **Next.js con middleware para proteger rutas**
   - Se protegieron rutas privadas (dashboard) para permitir acceso solo a usuarios autenticados.
   - Referencia: [`middleware`](middleware.ts).

2. **Supabase Auth + RLS**
   - Se usó Supabase para autenticación y base de datos centralizada.
   - RLS habilitado en `clients` y `pets` para restringir operaciones a usuarios autenticados.

3. **Modelo de datos simple y escalable**
   - Relación `clients (1) -> (N) pets` con `on delete cascade` para mantener consistencia.

4. **Modularización de frontend**
   - Separación de vistas/lógica para facilitar mantenimiento y crecimiento del proyecto.

5. **Validaciones manuales**
   - Para esta prueba técnica, se priorizó velocidad de implementación y control de lógica sin librerías extra.

6. **Herramientas de apoyo IA**
   - Se usaron herramientas permitidas (GitHub Copilot, Youtube y Gemini) para acelerar estructura y refactor puntual.

---

## 📈 Qué mejoraría con más tiempo

- Mejoras de **UX/UI** y pulido visual general.
- Validaciones de formularios más robustas (esquemas).
- Tests unitarios e integración.
- Optimización de rendimiento en cargas y mutaciones.
- Diseño responsive más profundo.
- Nuevas funcionalidades: estadísticas, reportes y gestión avanzada de perfiles.
- Limpieza/refactor adicional de componentes y archivos residuales.

---

## ✅ Estado del proyecto

Proyecto funcional, desplegado y cumpliendo los requisitos principales de la prueba técnica.