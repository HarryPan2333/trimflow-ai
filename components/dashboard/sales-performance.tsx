import { Badge } from "../ui/primitives";
import type { DashboardData } from "./dashboard-data";
import { getDashboardReferenceTime, percentage } from "./dashboard-data";

const DAY = 86_400_000;

export function SalesPerformance({ data }: { data: DashboardData }) {
  const reference = getDashboardReferenceTime(data);
  const sampleProjects = new Set(data.samples.map((item) => item.projectId));
  const quoteProjects = new Set(data.quotations.map((item) => item.projectId));
  const poProjects = new Set(data.purchaseOrders.map((item) => item.projectId));
  const productCategories = new Set(data.projects.flatMap((item) => item.product.split(/[、+]/).map((part) => part.trim())));
  const accountCoverage = percentage(data.clients.filter((item) => reference - new Date(item.lastContactAt).getTime() <= 7 * DAY).length, data.clients.length);
  const healthyOrders = data.purchaseOrders.filter((item) => item.health === "良好").length;

  const activity = [
    ["新客户开发", data.timelineEvents.filter((item) => item.type === "inquiry").length],
    ["客户跟进", data.communications.length],
    ["报价发出", data.quotations.filter((item) => item.status !== "Draft").length],
    ["客户会议", data.communications.filter((item) => item.type === "电话记录").length],
    ["样品提交", data.sampleVersions.filter((item) => Boolean(item.sentDate)).length],
  ] as const;
  const outcome = [
    ["样品 → 报价", percentage([...sampleProjects].filter((id) => quoteProjects.has(id)).length, sampleProjects.size)],
    ["报价 → PO", percentage([...quoteProjects].filter((id) => poProjects.has(id)).length, quoteProjects.size)],
    ["订单健康度", percentage(healthyOrders, data.purchaseOrders.length)],
  ] as const;

  return (
    <section className="card command-section command-span-8">
      <div className="command-section-head">
        <div><h2>销售表现</h2><p>Sales Performance · Activity / Opportunity / Result</p></div>
        <Badge tone="blue">原型指标</Badge>
      </div>
      <div className="performance-columns">
        <div><h3><span>A</span> Activity</h3>{activity.map(([label, value]) => <p key={label}><span>{label}</span><strong>{value}</strong></p>)}</div>
        <div><h3><span>O</span> Opportunity</h3><p><span>战略客户</span><strong>{data.clients.filter((item) => item.status === "活跃").length}</strong></p><p><span>产品品类</span><strong>{productCategories.size}</strong></p><p><span>进入样品阶段</span><strong>{sampleProjects.size}</strong></p><p><span>客户覆盖率</span><strong>{accountCoverage}%</strong></p></div>
        <div><h3><span>R</span> Result</h3>{outcome.map(([label, value]) => <div className="performance-result" key={label}><p><span>{label}</span><strong>{value}%</strong></p><i><b style={{ width: `${value}%` }} /></i></div>)}</div>
      </div>
      <p className="prototype-note">以上指标根据当前原型 Mock Data 计算，仅用于演示销售管理框架。</p>
    </section>
  );
}
