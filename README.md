# Neerali Creations

A boutique catalog site. You (the owner) sign in with a password to upload
and remove dress photos; everyone else just browses. Sizes: M(38), L(40),
XL(42), XXL(44), XXXL(46), 4XL(48), 5XL(50) — each split into Cotton /
Coat Set / Muslin. Lehenga is a separate section shared across all sizes.

Images are stored as binary data directly in PostgreSQL, one row per photo.

## Folder structure

```
neerali-creations/
  backend/    FastAPI + PostgreSQL API
  frontend/   React (Vite) site
```

## 1. Database

Install PostgreSQL, then create a database and user:

```sql
CREATE DATABASE neerali;
CREATE USER neerali_user WITH PASSWORD 'neerali_pass';
GRANT ALL PRIVILEGES ON DATABASE neerali TO neerali_user;
```

## 2. Backend

```
cd backend
python -m venv venv
source venv/bin/activate        # on Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Generate your owner password hash and paste it into `.env`:

```
python generate_password_hash.py
```

Edit `.env`:
- `DATABASE_URL` — match what you created in step 1
- `OWNER_PASSWORD_HASH` — output from the command above
- `JWT_SECRET` — any long random string
- `ALLOWED_ORIGIN` — the frontend URL (`http://localhost:5173` for local dev)

Run the API:

```
uvicorn app.main:app --reload
```

It starts on `http://localhost:8000` and creates the database table on
first run.

## 3. Frontend

```
cd frontend
npm install
cp .env.example .env
npm run dev
```

Opens on `http://localhost:5173`. Click the lock icon top-right to sign in
as the owner.

## Deploying

- Backend: any host that runs Python (Render, Railway, a VPS). Point
  `DATABASE_URL` at a managed Postgres instance and set `ALLOWED_ORIGIN`
  to your live frontend URL.
- Frontend: `npm run build` produces a static `dist/` folder — deploy it
  to Netlify, Vercel, or any static host, with `VITE_API_URL` pointing at
  your deployed backend.

## Notes

- The owner token is a JWT stored in the browser; it expires after 12
  hours (change `jwt_expire_minutes` in `backend/app/config.py`).
- Large photo libraries: Postgres handles many rows fine since each
  photo is its own row and the gallery only loads one size/category at
  a time. If the catalog grows very large, moving images to object
  storage (S3-style) with just a reference in the database is the next
  step up — the database schema barely changes for that migration.
