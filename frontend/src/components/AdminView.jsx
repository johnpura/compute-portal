import { useEffect, useState } from "react";
import { api } from "../api.js";

/*
 * AdminView is the administrator-facing tool: it lists pending requests and
 * lets an admin approve or deny each one. After an action it re-fetches so the
 * list stays in sync with the backend.
 */

export default function AdminView() {
  const [pending, setPending] = useState([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function load() {
    try {
      setPending(await api.getJobs("pending"));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function act(id, action) {
    setBusyId(id);
    setError("");
    try {
      if (action === "approve") await api.approveJob(id);
      else await api.denyJob(id);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="card">
      <h2 className="card-title">Pending requests</h2>
      <p className="card-subtitle">
        Approve to allocate the requested GPUs, or deny to reject the job.
      </p>

      {error && <p className="error">{error}</p>}

      {pending.length === 0 ? (
        <p className="empty">Nothing pending. The queue is clear.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Researcher</th>
              <th>Request</th>
              <th>Hours</th>
              <th className="right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((job) => (
              <tr key={job.id}>
                <td>{job.project}</td>
                <td>{job.user_name}</td>
                <td className="mono">
                  {job.gpu_count} × {job.gpu_type}
                </td>
                <td className="mono">{job.hours}</td>
                <td className="right">
                  <button
                    className="btn-approve"
                    disabled={busyId === job.id}
                    onClick={() => act(job.id, "approve")}
                  >
                    Approve
                  </button>
                  <button
                    className="btn-deny"
                    disabled={busyId === job.id}
                    onClick={() => act(job.id, "deny")}
                  >
                    Deny
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
