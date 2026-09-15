import { Badge } from "../ui/primitives";
import type { DashboardData } from "./dashboard-data";
import { getDashboardReferenceTime, percentage } from "./dashboard-data";
import { useI18n } from "../providers/language-provider";

const DAY = 86_400_000;

export function SalesPerformance({ data }: { data: DashboardData }) {
  const { language, t } = useI18n();
  const reference = getDashboardReferenceTime(data);
  const sampleProjects = new Set(data.samples.map((item) => item.projectId));
  const quoteProjects = new Set(data.quotations.map((item) => item.projectId));
  const poProjects = new Set(data.purchaseOrders.map((item) => item.projectId));
  const productCategories = new Set(data.projects.flatMap((item) => item.product.split(/[、+]/).map((part) => part.trim())));
  const accountCoverage = percentage(data.clients.filter((item) => reference - new Date(item.lastContactAt).getTime() <= 7 * DAY).length, data.clients.length);
  const healthyOrders = data.purchaseOrders.filter((item) => item.health === "良好").length;

  const activity = language === "zh" ? [
    ["新客户开发", data.timelineEvents.filter((item) => item.type === "inquiry").length], ["客户跟进", data.communications.length], ["报价发出", data.quotations.filter((item) => item.status !== "Draft").length], ["客户会议", data.communications.filter((item) => item.type === "电话记录").length], ["样品提交", data.sampleVersions.filter((item) => Boolean(item.sentDate)).length],
  ] as const : [
    ["New Client Development", data.timelineEvents.filter((item) => item.type === "inquiry").length], ["Client Follow-ups", data.communications.length], ["Quotations Sent", data.quotations.filter((item) => item.status !== "Draft").length], ["Client Meetings", data.communications.filter((item) => item.type === "电话记录").length], ["Samples Submitted", data.sampleVersions.filter((item) => Boolean(item.sentDate)).length],
  ] as const;
  const outcome = language === "zh" ? [
    ["样品 → 报价", percentage([...sampleProjects].filter((id) => quoteProjects.has(id)).length, sampleProjects.size)], ["报价 → PO", percentage([...quoteProjects].filter((id) => poProjects.has(id)).length, quoteProjects.size)], ["订单健康度", percentage(healthyOrders, data.purchaseOrders.length)],
  ] as const : [
    ["Sample → Quotation", percentage([...sampleProjects].filter((id) => quoteProjects.has(id)).length, sampleProjects.size)], ["Quotation → PO", percentage([...quoteProjects].filter((id) => poProjects.has(id)).length, quoteProjects.size)], ["Order Health", percentage(healthyOrders, data.purchaseOrders.length)],
  ] as const;

  return (
    <section className="card command-section command-span-8">
      <div className="command-section-head">
        <div><h2>{t("dashboard.performance")}</h2><p>{t("dashboard.performanceSubtitle")}</p></div>
        <Badge tone="blue">{t("dashboard.prototypeMetrics")}</Badge>
      </div>
      <div className="performance-columns">
        <div><h3><span>A</span> Activity</h3>{activity.map(([label, value]) => <p key={label}><span>{label}</span><strong>{value}</strong></p>)}</div>
        <div><h3><span>O</span> Opportunity</h3><p><span>{language === "zh" ? "战略客户" : "Strategic Accounts"}</span><strong>{data.clients.filter((item) => item.status === "活跃").length}</strong></p><p><span>{language === "zh" ? "产品品类" : "Product Categories"}</span><strong>{productCategories.size}</strong></p><p><span>{language === "zh" ? "进入样品阶段" : "Reached Sample Stage"}</span><strong>{sampleProjects.size}</strong></p><p><span>{language === "zh" ? "客户覆盖率" : "Account Coverage"}</span><strong>{accountCoverage}%</strong></p></div>
        <div><h3><span>R</span> Result</h3>{outcome.map(([label, value]) => <div className="performance-result" key={label}><p><span>{label}</span><strong>{value}%</strong></p><i><b style={{ width: `${value}%` }} /></i></div>)}</div>
      </div>
      <p className="prototype-note">{language === "zh" ? "以上指标根据当前原型模拟数据计算，仅用于演示销售管理框架。" : "These indicators are calculated from prototype mock data and demonstrate the sales management framework only."}</p>
    </section>
  );
}
