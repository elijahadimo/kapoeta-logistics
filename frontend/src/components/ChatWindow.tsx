import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000';

function ChatWindow({ userId, userName, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const response = await axios.get(`${API_URL}/messages/conversation/${currentUser.id}/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const token = localStorage.getItem('access_token');
    try {
      await axios.post(`${API_URL}/messages/send`, {
        senderId: currentUser.id,
        receiverId: userId,
        content: newMessage,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '350px',
      height: '500px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000
    }}>
      <div style={{
        padding: '12px',
        backgroundColor: '#FF6B35',
        color: 'white',
        borderRadius: '12px 12px 0 0',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>Chat with {userName}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {messages.map((msg: any) => (
          <div key={msg.id} style={{
            textAlign: msg.senderId === currentUser.id ? 'right' : 'left',
            marginBottom: '8px'
          }}>
            <div style={{
              display: 'inline-block',
              padding: '8px 12px',
              borderRadius: '12px',
              backgroundColor: msg.senderId === currentUser.id ? '#FF6B35' : '#f0f0f0',
              color: msg.senderId === currentUser.id ? 'white' : '#333',
              maxWidth: '80%'
            }}>
              {msg.content}
            </div>
            <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
              {new Date(msg.createdAt).toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={sendMessage} style={{ padding: '12px', borderTop: '1px solid #eee', display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1, padding: '8px', borderRadius: '20px', border: '1px solid #ddd' }}
        />
        <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#FF6B35', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer' }}>Send</button>
      </form>
    </div>
  );
}

export default ChatWindow;
