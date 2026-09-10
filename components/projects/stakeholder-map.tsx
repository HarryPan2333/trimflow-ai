import { Badge, Card } from "../ui/primitives";
import type { Contact } from "../../lib/mock-data";

const relationTone: Record<string, string> = { Strong: "green", Developing: "blue", Weak: "red", Unknown: "neutral" };

export function StakeholderMap({ contacts }: { contacts: Contact[] }) {
  return (
    <Card className="command-detail-section stakeholder-section">
      <div className="compact-section-head"><div><h2>关键人</h2><p>Key People · 客户内部决策与影响角色</p></div><span>{contacts.length} 位已识别</span></div>
      <div className="stakeholder-table-wrap"><table className="stakeholder-table"><thead><tr><th>Name</th><th>Title / Department</th><th>Decision Role</th><th>Influence</th><th>Relationship</th><th>Last Contact</th></tr></thead><tbody>
        {contacts.map((contact) => <tr key={contact.id}><td><strong>{contact.name}</strong>{contact.isPrimary && <small>Primary</small>}</td><td>{contact.title}<small>{contact.department ?? "当前项目材料中尚未确认"}</small></td><td><Badge>{contact.decisionRole ?? "Unknown"}</Badge></td><td>{contact.influenceLevel ?? "Unknown"}</td><td><Badge tone={relationTone[contact.relationshipStrength ?? "Unknown"]}>{contact.relationshipStrength ?? "Unknown"}</Badge></td><td>{contact.lastContactAt ? new Date(contact.lastContactAt).toLocaleDateString("zh-CN") : "尚未确认"}</td></tr>)}
        {contacts.length === 0 && <tr><td colSpan={6}>当前项目材料中尚未确认关键人。</td></tr>}
      </tbody></table></div>
    </Card>
  );
}
