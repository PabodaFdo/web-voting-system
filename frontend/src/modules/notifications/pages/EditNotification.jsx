import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import "./EditNotification.css";
import { listActive, updateText } from "../api/notifications";

export default function EditNotification() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const all = await listActive();
        const n = all.find(x => String(x.id) === String(id));
        if (!n) { toast.error("Notification not found"); navigate("/history"); return; }
        setRecipient(n.recipient || ""); setSubject(n.subject || ""); setBody(n.body || "");
      } catch (e) { toast.error(e?.message || "Load failed"); navigate("/history"); }
      finally { setLoading(false); }
    })();
  }, [id, navigate]);

  const handleSave = async () => {
    if (!recipient || !subject || !body) return toast.error("Please fill in all fields");
    setSaving(true);
    try { await updateText(id, { recipient, subject, body }); toast.success("Updated"); navigate("/history"); }
    catch (e) { toast.error(e?.message || "Update failed"); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="edit-page">
        <div className="card edit card--loading">
          <div className="card-body">
            <div className="edit__loader" /><p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-page">
      <div className="card edit">
        <div className="card-header edit__header">
          <button className="btn btn-outline" onClick={()=>navigate("/history")}><ArrowLeft size={16}/> Back</button>
          <div className="edit__title">
            <div className="edit__icon"><Save size={20}/></div>
            <div><h2>Edit Notification</h2><p>Update details before sending</p></div>
          </div>
        </div>

        <div className="card-body edit__body">
          <div className="field"><label>Recipient(s)</label><input className="input" value={recipient} onChange={(e)=>setRecipient(e.target.value)}/></div>
          <div className="field"><label>Subject</label><input className="input" value={subject} onChange={(e)=>setSubject(e.target.value)}/></div>
          <div className="field"><label>Message</label><textarea className="textarea" value={body} onChange={(e)=>setBody(e.target.value)}/></div>
          <div className="edit__actions">
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}><Save size={16}/> {saving?"Saving...":"Save Changes"}</button>
            <button className="btn btn-outline" onClick={()=>navigate("/history")} disabled={saving}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
