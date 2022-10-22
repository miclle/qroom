import { GET, POST } from "./lib/http";

import { IRoom } from "models/room";

export function create(args?: Partial<IRoom>): Promise<IRoom> {
  return POST<IRoom>('/rooms', args);
}

export function info(uuid: string): Promise<IRoom> {
  return GET<IRoom>(`/rooms/${uuid}`);
}