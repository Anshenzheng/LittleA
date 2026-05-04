import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import { MessageOutlined, SettingOutlined, CalendarOutlined } from '@ant-design/icons';
import ChatPage from './pages/ChatPage';
import ConfigPage from './pages/ConfigPage';
import TasksPage from './pages/TasksPage';

const { Header, Sider, Content } = Layout;

const menuItems = [
  {
    key: 'chat',
    icon: <MessageOutlined />,
    label: '智能助理',
    path: '/chat',
  },
  {
    key: 'tasks',
    icon: <CalendarOutlined />,
    label: '任务中心',
    path: '/tasks',
  },
  {
    key: 'config',
    icon: <SettingOutlined />,
    label: '系统配置',
    path: '/config',
  },
];

function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const getSelectedKey = () => {
    const path = location.pathname;
    const item = menuItems.find(m => m.path === path);
    return item ? item.key : 'chat';
  };

  const selectedKey = getSelectedKey();

  const handleMenuClick = ({ key }) => {
    const item = menuItems.find(m => m.key === key);
    if (item) {
      navigate(item.path);
    }
  };

  return (
    <Layout className="layout-container">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        theme="light"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000,
        }}
      >
        <div style={{
          height: 64,
          margin: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: collapsed ? 14 : 18,
          color: '#1890ff',
        }}>
          {collapsed ? 'AI' : '个人智能助理'}
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.3s', minHeight: '100vh' }}>
        <Header style={{ padding: 0, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 999 }}>
          <div style={{
            padding: '0 24px',
            fontSize: 16,
            fontWeight: 500,
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            height: '100%',
          }}>
            {menuItems.find(item => item.key === selectedKey)?.label || '个人智能助理'}
          </div>
        </Header>
        <Content style={{ margin: '24px', minHeight: 0, paddingBottom: 24 }}>
          <Routes>
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/config" element={<ConfigPage />} />
            <Route path="/" element={<Navigate to="/chat" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

function App() {
  return (
    <Router>
      <MainLayout />
    </Router>
  );
}

export default App;
