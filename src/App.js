import React, {useState} from 'react';
import './App.css';
import { Layout, Menu, } from 'antd';
import { DatabaseFilled, AppstoreOutlined } from '@ant-design/icons';
import { Switch, Route, Link} from 'react-router-dom';

import tableDataDonwload from './component/TableDataDownload'
import mapDataDownload from './component/MapDataDownload'

// const { SubMenu } = Menu;
const { Content, Sider } = Layout;

export default function App() {
  const [navigateKey, setNavigateKey] = useState("")

  return(
  <Layout>
      <Layout style={{minHeight: '100vh'}}>
        <Sider width={200} className="site-layout-background">
          <Menu
            mode="inline"
            selectedKeys = {navigateKey}
            style={{ height: '100%', borderRight: 0 }}
            onClick={(e) => setNavigateKey(e.key)}
            theme="dark"
          >
              <Menu.Item key="dataDownload" icon={<DatabaseFilled />}><Link to='/dataDownload'/>Table Data Download</Menu.Item>
              <Menu.Item key="mapDataDownload" icon={<AppstoreOutlined />}><Link to='/mapDataDownload'/>Map Data Download</Menu.Item>
          </Menu>
        </Sider>
        <Layout style={{ padding: '0 24px 24px' }}>
          <Content
            className="site-layout-background" style={{ padding: 24, margin: 0, minHeight: 280}}
          >
            <Switch>
              <Route exact path="/dataDownload" component={tableDataDonwload} />
              <Route exact path="/mapDataDownload" component={mapDataDownload} />
            </Switch>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}