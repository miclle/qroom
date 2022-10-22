import { GET, POST } from "./lib/http";

import { IRoom, IRTCInfo } from "models";

export function create(args?: Partial<IRoom>): Promise<IRoom> {
  return POST<IRoom>('/rooms', args);
}

export function info(uuid: string): Promise<IRoom> {
  return GET<IRoom>(`/rooms/${uuid}`);
}

export function rtc(uuid: string): Promise<IRTCInfo> {
  return GET<IRTCInfo>(`/rooms/${uuid}/rtc`);
}