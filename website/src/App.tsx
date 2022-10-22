import React, { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { QueryParamProvider } from 'use-query-params';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';
import { parse, stringify } from 'query-string';
import { useQuery } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import { IconContext } from 'react-icons';

import { WaitingComponent } from 'common/WaitingComponent';

import { GlobalContext, GlobalStore } from 'GlobalStore';

const Home = WaitingComponent(React.lazy(() => import(/* webpackChunkName: "home" */ 'components/Home')));
const Room = WaitingComponent(React.lazy(() => import(/* webpackChunkName: "room" */ 'components/Room')));

const App = observer(() => {

  const store = useMemo<GlobalStore>(() => new GlobalStore(), []);

  useQuery(['overview'], () => store.loadOverview())

  return (
    <GlobalContext.Provider value={store}>
      <ConfigProvider locale={zhCN}>
        <IconContext.Provider value={{ className: 'app-icon' }}>
          <BrowserRouter>
            <QueryParamProvider
              adapter={ReactRouter6Adapter}
              options={{
                searchStringToObject: parse,
                objectToSearchString: stringify,
              }}
            >
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/room/:uuid" element={<Room />} />
              </Routes>
            </QueryParamProvider>
          </BrowserRouter>
        </IconContext.Provider>
      </ConfigProvider>
    </GlobalContext.Provider>
  );
})

export default App;
