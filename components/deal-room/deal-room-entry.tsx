"use client";

import { useI18n } from "../providers/language-provider";
import { Badge, Button, Card } from "../ui/primitives";
import type { AccountState } from "../../lib/accounts/types";
import type { DealRoomState } from "../../lib/deal-room/types";
import { getAccountRooms, getPendingProposalCount, getProjectRoom, getRoomMessages } from "../../lib/deal-room/selectors";

export function DealRoomEntry({ state, accounts, accountId, projectId, onOpen, onCreate }: {
  state: DealRoomState; accounts: AccountState; accountId: string; projectId?: number;
  onOpen: (id: string) => void; onCreate: () => void;
}) {
  const { t, text } = useI18n();
  const rooms = projectId === undefined ? getAccountRooms(state, accounts, accountId) : [getProjectRoom(state, projectId)].filter((room) => room !== undefined);
  return <Card className="deal-entry">
    <div className="deal-entry-head"><div><small>TEAM COLLABORATION / DEAL ROOM</small><h2>{t("deal.title")}</h2><p>{t("deal.subtitle")}</p></div><Button variant="secondary" onClick={onCreate}>＋ {t("deal.create")}</Button></div>
    {rooms.length ? <div className="deal-entry-list">{rooms.map((room) => {
      const last = getRoomMessages(state, room.id).at(-1);
      const count = getPendingProposalCount(state, room.id);
      return <button key={room.id} className="deal-entry-row" onClick={() => onOpen(room.id)}><span className="deal-entry-icon">◎</span><span className="deal-entry-copy"><strong>{text(room.title)}</strong><small>{last ? text(last.content) : t("deal.emptyMessages")}</small></span>{count > 0 && <Badge tone="amber">{count} {t("deal.suggestions")}</Badge>}<span aria-hidden="true">→</span></button>;
    })}</div> : <p className="deal-entry-empty">{t("deal.emptyMessages")}</p>}
    <p className="deal-entry-note">{t("deal.noAuto")}</p>
  </Card>;
}
