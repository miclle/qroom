import React from "react";
import { makeAutoObservable, runInAction } from "mobx";
import { IUser } from "models";
import { User } from "services";

export class GlobalStore {

  user: IUser = {} as IUser

  constructor() {
    makeAutoObservable(this);
  }

  async loadOverview() {
    const info = await User.overview();
    runInAction(() => {
      this.user = info;
    });
    return info
  }

  setUser(user: IUser) {
    runInAction(() => {
      this.user = user;
    });
  }

}

export const GlobalContext = React.createContext<GlobalStore>({} as any);

export const useGlobalContext = () => React.useContext(GlobalContext);
