import { useEffect, useState } from "react";
import { api } from "../api.js";
import StatusBadge from "./StatusBadge.jsx";

/*
 * Portal is the researcher-facing view: a form to request a compute job, and
 * a live list of all jobs below it.
 *
 * Two React ideas to notice here:
 *   useState  - remembers values between renders (form fields, the job list)
 *   useEffect - runs side effects; here we fetch data when the view loads
 */

const GPU_TYPES = ["B200", "RTX"];

export default function Portal() {
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({
    user_id: "",
    project: "",
    gpu_type: "B200",
    gpu_count: 1,
    hours: 4,
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    try {
      const [u, j] = await Promise.all([api.getUsers(), api.getJobs()]);
      setUsers(u);
      setJobs(j);
      // Default the form's user to the first researcher, once.
      setForm((f) => (f.user_id ? f : { ...f, user_id: u[0]?.id || "" }));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit() {
    setError("");
    if (!form.project.trim()) {
      setError("Add a project name before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      await api.createJob({
        ...form,
        user_id: Number(form.user_id),
        gpu_count: Number(form.gpu_count),
        hours: Number(form.hours),
      });
      setForm((f) => ({ ...f, project: "" }));
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="stack">
      <section className="card">
        <h2 className="card-title">Request compute</h2>
        <p className="card-subtitle">
          Submit a job to the cluster. Requests start as pending and wait for an
          admin to approve them.
        </p>

        <div className="form-grid">
          <label className="field">
            <span>Researcher</span>
            <select
              value={form.user_id}
              onChange={(e) => updateField("user_id", e.target.value)}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field field-wide">
            <span>Project</span>
            <input
              type="text"
              placeholder="e.g. Vision transformer pretrain"
              value={form.project}
              onChange={(e) => updateField("project", e.target.value)}
            />
          </label>

          <label className="field">
            <span>GPU type</span>
            <select
              value={form.gpu_type}
              onChange={(e) => updateField("gpu_type", e.target.value)}
            >
              {GPU_TYPES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>GPU count</span>
            <input
              type="number"
              min="1"
              value={form.gpu_count}
              onChange={(e) => updateField("gpu_count", e.target.value)}
            />
          </label>

          <label className="field">
            <span>Hours</span>
            <input
              type="number"
              min="1"
              value={form.hours}
              onChange={(e) => updateField("hours", e.target.value)}
            />
          </label>
        </div>

        {error && <p className="error">{error}</p>}

        <button className="btn-primary" onClick={submit} disabled={submitting}>
          {submitting ? "Submitting..." : "Submit request"}
        </button>
      </section>

      <section className="card">
        <h2 className="card-title">All jobs</h2>
        <JobTable jobs={jobs} />
      </section>
    </div>
  );
}

function JobTable({ jobs }) {
  if (jobs.length === 0) {
    return <p className="empty">No jobs yet. Submit a request to get started.</p>;
  }
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Project</th>
          <th>Researcher</th>
          <th>GPUs</th>
          <th>Hours</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {jobs.map((job) => (
          <tr key={job.id}>
            <td>{job.project}</td>
            <td>{job.user_name}</td>
            <td className="mono">
              {job.gpu_count} × {job.gpu_type}
            </td>
            <td className="mono">{job.hours}</td>
            <td>
              <StatusBadge status={job.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
