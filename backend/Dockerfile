# Backend image: a small Python base with the Flask app and its deps.
FROM python:3.12-slim

WORKDIR /app

# Install dependencies first so Docker can cache this layer when only
# application code changes.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

# Seed the database (idempotent), then start the API.
CMD ["sh", "-c", "python seed.py && python app.py"]
