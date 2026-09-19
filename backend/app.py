"""
app.py
------
The Flask application. This is where the REST API lives.

Each @app.route below is one endpoint. You already know REST, so the mental
model is simple: a URL + an HTTP method maps to a Python function that returns
JSON. Flask handles the parsing and routing; you write the logic.

Endpoints:
  GET  /api/health                 -> liveness check
  GET  /api/users                  -> list users (used by the request form)
  GET  /api/jobs                   -> list all jobs (optional ?status=pending)
  POST /api/jobs                   -> create a new job request
  GET  /api/jobs/<id>              -> fetch a single job
  POST /api/jobs/<id>/approve      -> admin: approve a pending job
  POST /api/jobs/<id>/deny         -> admin: deny a pending job
  GET  /api/stats                  -> dashboard summary (utilization, counts)
"""

import os
import time

from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy import func
from sqlalchemy.exc import OperationalError

from db import db
from models import User, Job

# Total GPUs the imaginary cluster has. Used to compute a utilization %.
CLUSTER_GPU_CAPACITY = 64


def create_app():
    app = Flask(__name__)

    # Read the database connection string from the environment. The default
    # matches the docker-compose service name "db", so it works out of the box
    # in containers. Override DATABASE_URL to run against any other Postgres.
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
        "DATABASE_URL", "postgresql+psycopg2://portal:portal@db:5432/portal"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Allow the React dev server (a different origin) to call this API.
    CORS(app)
    db.init_app(app)

    register_routes(app)
    return app


def wait_for_db(app, retries=20, delay=1.5):
    """Postgres may still be starting when this container boots. Retry the
    first connection a few times instead of crashing immediately."""
    for attempt in range(1, retries + 1):
        try:
            with app.app_context():
                db.create_all()
            print("Database is ready.")
            return
        except OperationalError:
            print(f"Database not ready (attempt {attempt}/{retries}), waiting...")
            time.sleep(delay)
    raise RuntimeError("Could not connect to the database in time.")


def register_routes(app):
    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok"})

    @app.route("/api/users")
    def list_users():
        users = User.query.order_by(User.name).all()
        return jsonify([u.to_dict() for u in users])

    @app.route("/api/jobs")
    def list_jobs():
        query = Job.query
        status = request.args.get("status")
        if status:
            query = query.filter_by(status=status)
        jobs = query.order_by(Job.created_at.desc()).all()
        return jsonify([j.to_dict() for j in jobs])

    @app.route("/api/jobs/<int:job_id>")
    def get_job(job_id):
        job = Job.query.get_or_404(job_id)
        return jsonify(job.to_dict())

    @app.route("/api/jobs", methods=["POST"])
    def create_job():
        data = request.get_json(silent=True) or {}

        # Basic validation. In a real app you'd reach for a schema library,
        # but hand-rolled checks keep the example transparent.
        required = ["user_id", "project", "gpu_type"]
        missing = [field for field in required if not data.get(field)]
        if missing:
            return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

        job = Job(
            user_id=data["user_id"],
            project=data["project"],
            gpu_type=data["gpu_type"],
            gpu_count=int(data.get("gpu_count", 1)),
            hours=int(data.get("hours", 1)),
            status="pending",
        )
        db.session.add(job)
        db.session.commit()
        return jsonify(job.to_dict()), 201

    @app.route("/api/jobs/<int:job_id>/approve", methods=["POST"])
    def approve_job(job_id):
        job = Job.query.get_or_404(job_id)
        job.status = "approved"
        db.session.commit()
        return jsonify(job.to_dict())

    @app.route("/api/jobs/<int:job_id>/deny", methods=["POST"])
    def deny_job(job_id):
        job = Job.query.get_or_404(job_id)
        job.status = "denied"
        db.session.commit()
        return jsonify(job.to_dict())

    @app.route("/api/stats")
    def stats():
        # Count jobs grouped by status -> {"pending": 3, "approved": 5, ...}
        rows = (
            db.session.query(Job.status, func.count(Job.id))
            .group_by(Job.status)
            .all()
        )
        by_status = {status: count for status, count in rows}

        # GPUs "in use" = sum of gpu_count for jobs that are approved or running.
        in_use = (
            db.session.query(func.coalesce(func.sum(Job.gpu_count), 0))
            .filter(Job.status.in_(["approved", "running"]))
            .scalar()
        )

        # GPU demand broken down by type -> feeds the dashboard bar chart.
        type_rows = (
            db.session.query(Job.gpu_type, func.coalesce(func.sum(Job.gpu_count), 0))
            .group_by(Job.gpu_type)
            .all()
        )
        by_type = [{"gpu_type": t, "gpus": int(g)} for t, g in type_rows]

        utilization = round(100 * in_use / CLUSTER_GPU_CAPACITY, 1) if CLUSTER_GPU_CAPACITY else 0

        return jsonify(
            {
                "capacity": CLUSTER_GPU_CAPACITY,
                "in_use": int(in_use),
                "utilization_pct": utilization,
                "jobs_by_status": by_status,
                "gpus_by_type": by_type,
                "pending_count": by_status.get("pending", 0),
            }
        )


app = create_app()

if __name__ == "__main__":
    # Make sure tables exist before serving (handy when running directly).
    wait_for_db(app)
    app.run(host="0.0.0.0", port=5000, debug=True)
