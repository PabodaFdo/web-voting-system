import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { NavLink } from "react-router-dom";
import { getStudents, createStudent, updateStudent, deleteStudent } from "../api";
import "./Students.css";

/* ==================== Admin-Home style Toast ==================== */
function useToast() {
  const [toast, setToast] = useState(null); // {message, kind}
  const tRef = useRef(null);
  const show = useCallback((message, kind = "info", ms = 3000) => {
    setToast({ message, kind });
    if (tRef.current) clearTimeout(tRef.current);
    if (ms > 0) tRef.current = setTimeout(() => setToast(null), ms);
  }, []);
  const close = useCallback(() => setToast(null), []);
  useEffect(() => () => { if (tRef.current) clearTimeout(tRef.current); }, []);
  return { toast, show, close };
}

function Toast({ toast, onClose }) {
  if (!toast?.message) return null;
  const klass =
    toast.kind === "success" ? "toast toast--success" :
    toast.kind === "error"   ? "toast toast--error"   :
                               "toast toast--info";
  return (
    <div className="toast-area">
      <div className={klass} role="status" aria-live="polite" onClick={onClose}>
        <span aria-hidden="true">✓</span>
        <span>{toast.message}</span>
      </div>
    </div>
  );
}

/* ==================== Admin-Home Glassy Navbar ==================== */
const Icon = {
  Star: (p) => (
    <svg viewBox="0 0 24 24" width="24" height="24" {...p}>
      <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ),
  Home: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M12 3l9 8h-3v10h-5V14H11v7H6V11H3l9-8z"/>
    </svg>
  ),
  Dashboard: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
    </svg>
  ),
  Chart: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M3 3h2v18H3V3zm16 18h2V9h-2v12zM7 21h2V13H7v8zm8 0h2V5h-2v16z"/>
    </svg>
  ),
  Award: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M17 4a2 2 0 0 1 2 2v4l2 2-2 2v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-4l-2-2 2-2V6a2 2 0 0 1 2-2h10zm-5 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
    </svg>
  ),
  User: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z"/>
    </svg>
  ),
  Logout: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M16 13v-2H7V8l-5 4 5 4v-3h9zM20 3h-8v2h8v14h-8v2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/>
    </svg>
  ),
};

function StudentsHeader({ onLogout }) {
  const linkCls = "subnav-link";
  return (
    <nav className="subnav" role="navigation" aria-label="Admin Navigation">
      <div className="subnav__inner">
        {/* Brand (matches Admin Home) */}
        <div className="subnav__brand">
          <div className="subnav__logo"><Icon.Star /></div>
          <span className="subnav__title">Voting Admin</span>
        </div>

        {/* Center Links (same order/sizing) */}
        <div className="subnav__links">
          <NavLink to="/admin" end className={linkCls} title="Home">
            <Icon.Home /><span className="subnav__text">Home</span>
          </NavLink>
          <NavLink to="/admin/dashboard" className={linkCls} title="Dashboard">
            <Icon.Dashboard /><span className="subnav__text">Dashboard</span>
          </NavLink>
          <NavLink to="/admin/results-analytics" className={linkCls} title="Analytics">
            <Icon.Chart /><span className="subnav__text">Analytics</span>
          </NavLink>
          <NavLink to="/admin/results" className={linkCls} title="Results">
            <Icon.Award /><span className="subnav__text">Publish Winners</span>
          </NavLink>
          <NavLink to="/admin/students" className={linkCls} title="Students">
            <Icon.User /><span className="subnav__text">Students</span>
          </NavLink>
        </div>

        {/* Logout (same pill) */}
        <button type="button" className="subnav__logout" onClick={onLogout} title="Logout">
          <Icon.Logout /> Logout
        </button>
      </div>
    </nav>
  );
}

/* ==================== Students Page ==================== */
const GENDERS = ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"];

export default function Students({ onLogout }) {
  const { toast, show, close } = useToast();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const emptyForm = {
    indexNo: "",
    fullName: "",
    email: "",
    rawPassword: "",
    active: true,
    gender: "PREFER_NOT_TO_SAY",
  };
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const isEditing = useMemo(() => editId !== null, [editId]);

  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const errorShownRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getStudents();
      setList(Array.isArray(rows) ? rows : []);
      setError(null);
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || "Failed to load students";
      setError(msg);
      if (!errorShownRef.current) {
        show(msg, "error");
        errorShownRef.current = true;
      }
    } finally {
      setLoading(false);
    }
  }, [show]);

  useEffect(() => { load(); }, [load]);

  // One-shot welcome toast.
  useEffect(() => {
    if (sessionStorage.getItem("students_toast") === "1") {
      show("Student module ready.", "success");
      sessionStorage.removeItem("students_toast");
    }
  }, [show]);

  const filteredStudents = useMemo(() => {
    let arr = list;
    if (showPendingOnly) arr = arr.filter((s) => !s.active);
    const q = (searchTerm || "").toLowerCase();
    if (!q) return arr;
    return arr.filter(
      (s) =>
        (s?.indexNo || "").toLowerCase().includes(q) ||
        (s?.fullName || "").toLowerCase().includes(q) ||
        (s?.email || "").toLowerCase().includes(q)
    );
  }, [list, searchTerm, showPendingOnly]);

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    try {
      if (!isEditing) {
        await createStudent(form);
        show("Student created", "success");
      } else {
        const payload = {
          fullName: form.fullName,
          email: form.email,
          rawPassword: form.rawPassword, // blank keeps existing
          active: form.active,
          gender: form.gender,
        };
        await updateStudent(editId, payload);
        show("Student updated", "success");
      }
      setForm(emptyForm);
      setEditId(null);
      await load();
    } catch (e2) {
      const msg = e2?.response?.data?.message || e2.message || "Request failed";
      setError(msg);
      show(msg, "error");
    }
  }

  function startEdit(s) {
    setEditId(s.id);
    setForm({
      indexNo: s.indexNo,
      fullName: s.fullName,
      email: s.email,
      rawPassword: "",
      active: !!s.active,
      gender: s.gender || "PREFER_NOT_TO_SAY",
    });
  }

  async function remove(id) {
    if (confirm("Delete this student?")) {
      try {
        await deleteStudent(id);
        show("Student deleted", "success");
        await load();
      } catch (e) {
        const msg = e?.response?.data?.message || e.message || "Delete failed";
        setError(msg);
        show(msg, "error");
      }
    }
  }

  function cancelEdit() {
    setEditId(null);
    setForm(emptyForm);
  }

  async function quickApprove(s) {
    try {
      await updateStudent(s.id, { fullName: s.fullName, email: s.email, active: true, gender: s.gender });
      show("Student approved", "success");
      await load();
    } catch (e2) {
      const msg = e2?.response?.data?.message || e2.message || "Approve failed";
      setError(msg);
      show(msg, "error");
    }
  }

  return (
    <div className="students">
      {/* Admin-Home style nav */}
      <StudentsHeader onLogout={onLogout} />

      {/* Toast */}
      <Toast toast={toast} onClose={close} />

      {error && <div className="error-banner">Request failed: {error}</div>}

      <div className="students__header">
        <h1 className="students__title">Student Management</h1>
        <p className="students__subtitle">Manage student accounts and access</p>
      </div>

      <div className="students__grid">
        {/* LEFT: Form */}
        <div className="students__form-section">
          <div className="students__form-card">
            <div className="students__form-header">
              <h3 className="students__form-title">
                <span className="students__form-icon">{isEditing ? "✏️" : "👥"}</span>
                {isEditing ? "Edit Student" : "Add New Student"}
              </h3>
              {isEditing && <button className="students__cancel-btn" onClick={cancelEdit}>Cancel</button>}
            </div>

            <form onSubmit={onSubmit} className="students__form">
              {!isEditing && (
                <div className="students__form-group">
                  <label className="students__label">Index Number</label>
                  <input className="students__input" name="indexNo" value={form.indexNo} onChange={onChange} required placeholder="IT2410xxxx" />
                </div>
              )}

              <div className="students__form-group">
                <label className="students__label">Full Name</label>
                <input className="students__input" name="fullName" value={form.fullName} onChange={onChange} required placeholder="John Doe" />
              </div>

              <div className="students__form-group">
                <label className="students__label">Email Address</label>
                <input className="students__input" type="email" name="email" value={form.email} onChange={onChange} required placeholder="john.doe@university.edu" />
              </div>

              <div className="students__form-group">
                <label className="students__label">
                  Password {isEditing && <span className="students__optional">(leave blank to keep current)</span>}
                </label>
                <input className="students__input" type="password" name="rawPassword" value={form.rawPassword} onChange={onChange} placeholder={isEditing ? "••••••" : "Enter password"} {...(isEditing ? {} : { required: true })} />
              </div>

              <div className="students__form-group">
                <label className="students__label">Gender</label>
                <select className="students__input students__select" name="gender" value={form.gender} onChange={onChange} required>
                  {GENDERS.map((g) => (<option key={g} value={g}>{g.replaceAll("_", " ")}</option>))}
                </select>
              </div>

              <div className="students__checkbox-group">
                <label className="students__checkbox-label">
                  <input type="checkbox" name="active" checked={!!form.active} onChange={onChange} className="students__checkbox" />
                  <span className="students__checkmark"></span>
                  Active Account
                </label>
              </div>

              <button type="submit" className="students__submit-btn">
                <span className="students__btn-icon">{isEditing ? "💾" : "➕"}</span>
                {isEditing ? "Update Student" : "Create Student"}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT: Directory */}
        <div className="students__list-section">
          <div className="students__list-card">
            <div className="students__list-header">
              <h3 className="students__list-title">
                <span className="students__list-icon">📋</span> Student Directory
              </h3>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="students__search">
                  <input type="text" placeholder="Search students..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="students__search-input" />
                </div>

                {/* Pending-only toggle */}
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <input type="checkbox" checked={showPendingOnly} onChange={(e) => setShowPendingOnly(e.target.checked)} />
                  <span>Pending only</span>
                </label>
              </div>
            </div>

            {loading ? (
              <div className="students__loading">
                <div className="students__spinner"></div>
                <p>Loading students...</p>
              </div>
            ) : (
              <div className="students__table-container">
                <table className="students__table">
                  <thead className="students__table-header">
                    <tr>
                      <th>Index No</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Gender</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="students__table-body">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="students__table-row">
                        <td className="students__index-cell">
                          <span className="students__index-badge">{student.indexNo}</span>
                        </td>
                        <td className="students__name-cell">{student.fullName}</td>
                        <td className="students__email-cell">{student.email}</td>
                        <td className="students__status-cell">
                          <span className={`students__status-badge ${student.active ? "students__status-badge--active" : "students__status-badge--inactive"}`}>
                            {student.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="students__gender-cell">
                          {(student.gender || "PREFER_NOT_TO_SAY").replaceAll("_", " ")}
                        </td>
                        <td className="students__actions-cell">
                          <div className="students__actions">
                            {!student.active && (
                              <button
                                onClick={() => quickApprove(student)}
                                className="students__action-btn"
                                style={{ background: "rgba(34,197,94,0.2)", color: "#059669", border: "1px solid rgba(34,197,94,0.3)" }}
                                title="Activate this student"
                              >
                                ✅ Approve
                              </button>
                            )}
                            <button onClick={() => startEdit(student)} className="students__action-btn students__action-btn--edit">✏️ Edit</button>
                            <button onClick={() => remove(student.id)} className="students__action-btn students__action-btn--delete">🗑️ Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredStudents.length === 0 && (
                      <tr className="students__empty-row">
                        <td colSpan={6}>
                          <div className="students__empty-state">
                            <span className="students__empty-icon">👥</span>
                            <p>No students found</p>
                            {searchTerm && <p className="students__empty-subtitle">Try adjusting your search</p>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
