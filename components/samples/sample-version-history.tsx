import { Badge, Card } from "../ui/primitives";
import { SampleStatusBadge } from "./sample-list";
import { compareVersions, emptyValue, isFeedbackOpen } from "./sample-data";
import type { SampleContext } from "./sample-data";

export function SampleVersionHistory({ context }: { context: SampleContext }) {
  return <Card className="sample-section"><div className="sample-section-head"><div><h2>版本演进 / Version History</h2><p>每一次修改都有来源，每一次反馈都有去向。</p></div><Badge>{context.versions.length} 个版本</Badge></div><ol className="sample-version-timeline">{context.versions.map((version, index) => {
    const feedback = context.feedback.filter((item) => item.sampleVersionId === version.id);
    const inherited = context.feedback.filter((item) => version.revisionFeedbackIds?.includes(item.id));
    return <li key={version.id} className={version.id === context.current?.id ? "current-version" : ""}><span className="version-node">{version.version}</span><div className="version-content"><div className="version-heading"><h3>{version.summary}</h3><SampleStatusBadge status={version.status === "已确认" ? "Approved" : version.status === "需修改" ? "Revision Required" : version.sentDate ? "Client Reviewing" : version.status === "待制作" ? "Requested" : "In Development"} /></div><p className="version-dates">创建 / Created {version.createdAt}　·　寄出 / Sent {version.sentDate ?? "尚未寄出"}</p><p className="version-reason"><b>修改原因 / Why</b>{version.reasonForChange ?? (index ? "当前项目材料中尚未确认" : "初始开发申请")}</p><ul className="version-changes">{version.changes.map((change) => <li key={change}>{change}</li>)}</ul>{inherited.length > 0 && <div className="revision-requirements"><b>修改要求 / Revision Requirements</b>{inherited.map((item) => <p key={item.id}><span>{isFeedbackOpen(item) ? "○ Open" : "✓ Resolved"}</span>{item.requiredAction ?? item.summary}</p>)}</div>}{version.internalNote && <p className="version-internal">内部说明 / Internal Note · {version.internalNote}</p>}{feedback.map((item) => <div className="version-feedback-bridge" key={item.id}><span>↳ 客户反馈 / Client Feedback · {item.receivedAt} · {item.author}</span><strong>{item.summary}</strong><p>{item.details}</p><small>{item.resolvedInVersionId ? `已关联处理版本 ${item.resolvedInVersionId.split("-").at(-1)}` : isFeedbackOpen(item) ? "待处理 · 影响下一轮评审" : "已记录确认结果"}</small></div>)}</div></li>;
  })}</ol></Card>;
}

export function SampleVersionComparison({ context }: { context: SampleContext }) {
  const changes = compareVersions(context);
  return <Card className="sample-section"><div className="sample-section-head"><div><h2>版本比较 / Compare Versions</h2><p>{context.versions.at(-2)?.version ?? "Previous"} → {context.current?.version} · 仅显示值或确认状态发生变化的字段</p></div><Badge>{changes.length} 项变化</Badge></div>{changes.length ? <div className="sample-comparison-scroll"><table className="sample-comparison-table"><thead><tr><th>变化字段 / Field</th><th>上一版 / Previous</th><th>当前版 / Current</th></tr></thead><tbody>{changes.map((row) => <tr key={row.key}><td>{row.label}</td><td>{row.previous.value || emptyValue}<small>{row.previous.status}</small></td><td>{row.value || emptyValue}<small>{row.status}</small></td></tr>)}</tbody></table></div> : <p className="sample-empty">{context.versions.length < 2 ? "只有一个版本，暂无可比较的上一版。" : "规格继承自上一版，目前没有字段变化；修改要求可在版本记录中查看。"}</p>}</Card>;
}
