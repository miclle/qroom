import { GET, POST } from "./lib/http";
import { IUser } from "models";

export function create(user: Partial<IUser>): Promise<IUser> {
  return POST<IUser>('/user', user);
}

export function overview(): Promise<IUser> {
  return GET<IUser>('/user/overview');
}