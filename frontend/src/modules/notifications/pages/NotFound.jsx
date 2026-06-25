import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{ textAlign:"center", padding:"64px 0" }}>
      <h1 style={{ margin:0, fontSize:56, fontWeight:900 }}>404</h1>
      <p style={{ opacity:.7, marginTop:8 }}>The page you're looking for does not exist.</p>
      <Link className="btn btn-primary" to="/admin/notifications/compose" style={{ marginTop:16 }}>Go to Compose</Link>
    </div>
  );
}
