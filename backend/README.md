# Backend (Django)

Run locally:

- Create a virtualenv and install:

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

- Configure environment (see .env.example)
- Run migrations and create superuser:

```powershell
python manage.py migrate
python manage.py createsuperuser
python manage.py loaddata  # optional
python manage.py seed_demo
python manage.py runserver
```

API endpoints live under `/api/` and JWT token endpoints are under `/api/auth/token/`.
