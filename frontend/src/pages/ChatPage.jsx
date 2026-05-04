import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Card, Spin, message } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined, SearchOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatAPI } from '../services/api';

const { TextArea } = Input;

function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const chatMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage.content },
      ];

      const response = await chatAPI.sendMessage(chatMessages);

      if (response.success) {
        const assistantMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: response.data.response,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        message.error(response.message || '发送消息失败');
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessage = (msg) => {
    const isUser = msg.role === 'user';

    return (
      <div key={msg.id} className={`chat-message ${isUser ? 'user' : 'assistant'}`}>
        <div className="avatar">
          {isUser ? <UserOutlined /> : <RobotOutlined />}
        </div>
        <div className="content">
          {isUser ? (
            <div>{msg.content}</div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  if (inline) {
                    return <code className={className} {...props}>{children}</code>;
                  }
                  return (
                    <pre className={className} {...props}>
                      <code>{children}</code>
                    </pre>
                  );
                },
              }}
            >
              {msg.content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="chat-page-wrapper">
      <Card
        className="chat-card"
        bodyStyle={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        <div className="chat-messages-container" ref={chatContainerRef}>
          {messages.length === 0 && (
            <div className="chat-welcome">
              <RobotOutlined className="welcome-icon" />
              <h3 className="welcome-title">欢迎使用个人智能助理</h3>
              <p className="welcome-subtitle">我可以帮助您：</p>
              <ul className="welcome-features">
                <li>回答各种问题，提供信息咨询</li>
                <li>自动搜索网络并整理成专业报告</li>
                <li>设置定时任务，定期推送感兴趣的资讯</li>
                <li>支持 Markdown 格式的富文本显示</li>
              </ul>
            </div>
          )}
          {messages.map(renderMessage)}
          {loading && (
            <div className="chat-message assistant">
              <div className="avatar">
                <RobotOutlined />
              </div>
              <div className="content">
                <Spin size="small" />
                <span style={{ marginLeft: 8 }}>思考中...</span>
              </div>
            </div>
          )}
        </div>
        <div className="chat-input-wrapper">
          <div className="chat-input-container">
            <div style={{ display: 'flex', gap: 12 }}>
              <TextArea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入您的问题... (Enter 发送，Shift+Enter 换行)"
                autoSize={{ minRows: 1, maxRows: 4 }}
                style={{ flex: 1, resize: 'none' }}
                disabled={loading}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                loading={loading}
                size="large"
              >
                发送
              </Button>
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: '#999', display: 'flex', gap: 20, alignItems: 'center' }}>
              <Button type="text" size="small" icon={<SearchOutlined />} disabled>
                搜索网络
              </Button>
              <span>💡 提示：支持 Markdown 格式显示</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default ChatPage;
