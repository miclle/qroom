import React from 'react';
import { observer } from 'mobx-react-lite';
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { QueryParamProvider } from 'use-query-params';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';
import { parse, stringify } from 'query-string';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';

import { WaitingComponent } from 'common/WaitingComponent';

import { IconContext } from 'react-icons';

const Home = WaitingComponent(React.lazy(() => import(/* webpackChunkName: "home" */ 'components/Home')));

const App = observer(() => {

  return (
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
            </Routes>
          </QueryParamProvider>
        </BrowserRouter>
      </IconContext.Provider>
    </ConfigProvider>
  );
})

export default App;
