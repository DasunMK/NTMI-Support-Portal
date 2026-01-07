import React, { useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import { Paper, TextField, IconButton, Box, Typography, List, ListItem, ListItemText } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import AuthService from '../services/auth.service';

export default function ChatWindow({ ticketId, onClose }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const stompClientRef = useRef(null);
    const user = AuthService.getCurrentUser();
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Connect to WebSocket
        const socket = new SockJS('http://localhost:8080/ws');
        const stompClient = Stomp.over(socket);

        stompClient.connect({}, () => {
            // Subscribe to this specific ticket's chat
            stompClient.subscribe(`/topic/chat/${ticketId}`, (msg) => {
                const receivedMsg = JSON.parse(msg.body);
                setMessages(prev => [...prev, receivedMsg]);
                scrollToBottom();
            });
        });

        stompClientRef.current = stompClient;

        return () => {
            if (stompClientRef.current) stompClientRef.current.disconnect();
        };
    }, [ticketId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const sendMessage = () => {
        if (input.trim() && stompClientRef.current) {
            const chatMessage = {
                sender: user.username,
                content: input,
                ticketId: ticketId
            };
            // Send to topic (No DB storage, direct broadcast)
            stompClientRef.current.send("/topic/chat/" + ticketId, {}, JSON.stringify(chatMessage));
            setInput('');
        }
    };

    return (
        <Paper elevation={6} sx={{
            position: 'fixed', bottom: 20, right: 20, width: 320, height: 450, 
            display: 'flex', flexDirection: 'column', zIndex: 9999
        }}>
            {/* Header */}
            <Box sx={{ bgcolor: '#1976d2', color: 'white', p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2">Support Chat - Ticket #{ticketId}</Typography>
                <IconButton size="small" onClick={onClose} sx={{ color: 'white' }}><CloseIcon /></IconButton>
            </Box>

            {/* Messages Area */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, bgcolor: '#f5f5f5' }}>
                <List dense>
                    {messages.map((msg, index) => (
                        <ListItem key={index} sx={{ 
                            justifyContent: msg.sender === user.username ? 'flex-end' : 'flex-start' 
                        }}>
                            <Paper sx={{ 
                                p: 1, 
                                bgcolor: msg.sender === user.username ? '#e3f2fd' : 'white',
                                maxWidth: '80%'
                            }}>
                                <Typography variant="caption" color="textSecondary">{msg.sender}</Typography>
                                <Typography variant="body2">{msg.content}</Typography>
                            </Paper>
                        </ListItem>
                    ))}
                    <div ref={messagesEndRef} />
                </List>
            </Box>

            {/* Input Area */}
            <Box sx={{ p: 1, display: 'flex', gap: 1, borderTop: '1px solid #ddd' }}>
                <TextField 
                    size="small" fullWidth placeholder="Type a message..." 
                    value={input} onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <IconButton color="primary" onClick={sendMessage}><SendIcon /></IconButton>
            </Box>
        </Paper>
    );
}