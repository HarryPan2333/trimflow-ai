import { Badge, Card } from "../ui/primitives";
import type { Contact } from "../../lib/mock-data";
import { useI18n } from "../providers/language-provider";

const relationTone: Record<string, string> = { Strong: "green", Developing: "blue", Weak: "red", Unknown: "neutral" };

export function StakeholderMap({ contacts }: { contacts: Contact[] }) {
  const { language, t, label, formatDate } = useI18n();
  return (
    <Card className="command-detail-section stakeholder-section">
      <div className="compact-section-head"><div><h2>{t("project.keyPeople")}</h2><p>{language === "zh" ? "客户内部决策与影响角色" : "Client decision-makers and influencers"}</p></div><span>{language === "zh" ? `${contacts.length} 位已识别` : `${contacts.length} identified`}</span></div>
      <div className="stakeholder-table-wrap"><table className="stakeholder-table"><thead><tr><th>{language === "zh" ? "姓名" : "Name"}</th><th>{language === "zh" ? "职位 / 部门" : "Title / Department"}</th><th>{language === "zh" ? "决策角色" : "Decision Role"}</th><th>{language === "zh" ? "影响力" : "Influence"}</th><th>{language === "zh" ? "关系强度" : "Relationship"}</th><th>{t("common.lastContact")}</th></tr></thead><tbody>
        {contacts.map((contact) => <tr key={contact.id}><td><strong>{contact.name}</strong>{contact.isPrimary && <small>{language === "zh" ? "主要联系人" : "Primary"}</small>}</td><td>{contact.title}<small>{contact.department ?? t("common.notConfirmed")}</small></td><td><Badge>{label(contact.decisionRole ?? "Unknown")}</Badge></td><td>{label(contact.influenceLevel ?? "Unknown")}</td><td><Badge tone={relationTone[contact.relationshipStrength ?? "Unknown"]}>{label(contact.relationshipStrength ?? "Unknown")}</Badge></td><td>{contact.lastContactAt ? formatDate(contact.lastContactAt) : t("common.notConfirmed")}</td></tr>)}
        {contacts.length === 0 && <tr><td colSpan={6}>{language === "zh" ? "当前项目材料中尚未确认关键人。" : "Key stakeholders are not confirmed in the current project materials."}</td></tr>}
      </tbody></table></div>
    </Card>
  );
}
