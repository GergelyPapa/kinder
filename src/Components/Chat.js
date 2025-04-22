import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import '../Styles/Chat.css';
import { jwtDecode } from 'jwt-decode';

const getAuthToken = () => {
    const token = localStorage.getItem('accessToken');
    return token;
};

const getCurrentUserId = () => {
    try {
        const token = getAuthToken();
        if (!token) return null;
        const decoded = jwtDecode(token);
        if (!decoded || typeof decoded.id === 'undefined') {
            console.error("Decoded token does not contain 'id' field.");
            return null;
        }
        return Number(decoded.id);
    } catch (error) {
        console.error("Error decoding token:", error);
        return null;
    }
};

const Chat = () => {
    const [userId, setUserId] = useState(null);
    const [partners, setPartners] = useState([]);
    const [selectedPartner, setSelectedPartner] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [messages, setMessages] = useState({});
    const [socket, setSocket] = useState(null);

    const [isLoadingPartners, setIsLoadingPartners] = useState(false);
    const [partnerError, setPartnerError] = useState(null);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [messageError, setMessageError] = useState(null);
    const [authError, setAuthError] = useState(null);

    const currentMatchIdRef = useRef(null);
    const messagesEndRef = useRef(null);

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

    useEffect(() => {
        const id = getCurrentUserId();
        if (id) {
            setUserId(id);
            setAuthError(null);
        } else {
            console.error("Could not get user ID on component mount.");
            setAuthError("Felhasználó azonosítása sikertelen. Kérjük, jelentkezzen be újra.");
        }
    }, []);

    useEffect(() => {
        if (!userId || authError) return;

        const abortController = new AbortController();
        const signal = abortController.signal;

        const fetchPartnersAndConnectSocket = async () => {
            setIsLoadingPartners(true);
            setPartnerError(null);

            try {
                const token = getAuthToken();
                if (!token) throw new Error("Authentikációs token hiányzik.");

                const response = await fetch(`${BACKEND_URL}/api/matches`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    signal: signal
                });

                if (!response.ok) {
                    const errorData = await response.text();
                    throw new Error(`Nem sikerült betölteni a partnereket (${response.status}). ${errorData}`);
                }
                const data = await response.json();

                if (!signal.aborted) {
                    console.log("Fetched partners:", data);
                    setPartners(data || []);
                }

            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error("Failed to fetch partners:", error);
                    setPartnerError(error.message || "Ismeretlen hiba történt a partnerek betöltésekor.");
                    setPartners([]);
                }
            } finally {
                if (!signal.aborted) setIsLoadingPartners(false);
            }

            if (signal.aborted) return;
            const token = getAuthToken();
            if (!token) {
                console.error("Cannot connect socket: No auth token found.");
                return;
            }

            console.log("Attempting to connect socket...");
            if (socket) socket.disconnect();

            const newSocket = io(BACKEND_URL, {
                auth: { token: token },
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });
            setSocket(newSocket);

            newSocket.on('connect', () => console.log('Socket connected:', newSocket.id));
            newSocket.on('disconnect', (reason) => console.log('Socket disconnected:', reason));
            newSocket.on('connect_error', (err) => console.error("Socket connection error:", err.message));
            newSocket.on('send_error', (error) => {
                console.error('Error sending message (from server):', error.message);
                setMessageError(`Hiba az üzenet küldésekor: ${error.message}`);
            });

        };

        fetchPartnersAndConnectSocket();

        return () => {
            console.log("Cleaning up Chat component effect...");
            abortController.abort();
            if (socket) {
                socket.off('connect');
                socket.off('disconnect');
                socket.off('connect_error');
                socket.off('send_error');
                socket.off('new_message');
                socket.disconnect();
                setSocket(null);
            }
        };
    }, [userId, authError, BACKEND_URL]);

    useEffect(() => {
        if (!socket || !userId) return;

        const handleNewMessage = (message) => {
             console.log('New message received:', message);
            if (!message || !message.match_id || !message.sender_id || !message.id) {
                console.error("Received invalid message data:", message);
                return;
            }
            const formattedMessage = { ...message, senderType: message.sender_id === userId ? 'me' : 'other' };
            setMessages(prevMessages => {
                const currentMatchMessages = prevMessages[message.match_id] || [];
                if (currentMatchMessages.some(msg => msg.id === formattedMessage.id)) {
                    console.warn("Duplicate message received, ignoring:", formattedMessage.id);
                    return prevMessages;
                }
                return { ...prevMessages, [message.match_id]: [...currentMatchMessages, formattedMessage] };
            });
        };

        socket.on('new_message', handleNewMessage);
        return () => { if (socket) socket.off('new_message', handleNewMessage); };
    }, [socket, userId]);

    useEffect(() => {
        if (!selectedPartner || !socket || !selectedPartner.matchId || !userId) return;

        const matchId = selectedPartner.matchId;
        const previousMatchId = currentMatchIdRef.current;

        if (previousMatchId && previousMatchId !== matchId) {
            console.log(`Leaving match room: ${previousMatchId}`);
            socket.emit('leave_match', previousMatchId);
        }
        if (previousMatchId !== matchId) {
            console.log(`Joining match room: ${matchId}`);
            socket.emit('join_match', matchId);
            currentMatchIdRef.current = matchId;
        }

        const abortController = new AbortController();
        const signal = abortController.signal;

        if (!messages[matchId]) {
            const fetchMessages = async () => {
                 console.log(`Fetching messages for match: ${matchId}`);
                setIsLoadingMessages(true);
                setMessageError(null);
                try {
                    const token = getAuthToken();
                    if (!token) { throw new Error("Authentikációs token hiányzik."); }
                    const response = await fetch(`${BACKEND_URL}/api/matches/${matchId}/messages`, { headers: { 'Authorization': `Bearer ${token}` }, signal });
                    if (!response.ok) { const errorText = await response.text(); throw new Error(`Nem sikerült betölteni az üzeneteket (${response.status}). ${errorText}`); }
                    const history = await response.json();
                    if (!signal.aborted) {
                        const formattedHistory = history.map(msg => ({ ...msg, senderType: msg.sender_id === userId ? 'me' : 'other' }));
                        setMessages(prev => ({ ...prev, [matchId]: formattedHistory || [] }));
                    }
                } catch (error) { if (error.name !== 'AbortError') { console.error(`Failed to fetch messages for match ${matchId}:`, error); setMessageError(error.message || "Hiba az üzenetek betöltésekor."); }
                } finally { if (!signal.aborted) setIsLoadingMessages(false); }
            };
            fetchMessages();
        } else {
             setMessageError(null);
             setIsLoadingMessages(false);
        }
        return () => abortController.abort();
    }, [selectedPartner, socket, userId, BACKEND_URL]);

    useEffect(() => {
         if (selectedPartner && !isLoadingMessages) {
            const timer = setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, 150);
            return () => clearTimeout(timer);
         }
    }, [messages, selectedPartner, isLoadingMessages]);

    const handleSendMessage = (e) => {
         e.preventDefault();
        if (!newMessage.trim() || !selectedPartner || !socket || !socket.connected || !selectedPartner.matchId) return;
        setMessageError(null);
        socket.emit('send_message', { matchId: selectedPartner.matchId, content: newMessage.trim() });
        setNewMessage('');
    };
    const handleSelectPartner = useCallback((partner) => {
         setSelectedPartner(partner);
        setMessageError(null);
        setIsLoadingMessages(!!partner);
    }, []);
    const handleGoBackToList = () => {
         setSelectedPartner(null);
        currentMatchIdRef.current = null;
    };

    if (authError) {
        return <div className="chat-container error-container">{authError}</div>;
    }

    return (
        <div className={`chat-container ${selectedPartner ? 'chat-active' : ''}`}>
            <div className="chat-sidebar">
                <div className="contacted-section">
                    <div className="section-title">Matches</div>
                    {isLoadingPartners && <div className="loading-indicator">Partnerek betöltése...</div>}
                    {partnerError && <div className="error-message">{partnerError}</div>}
                    {!isLoadingPartners && !partnerError && (
                        <div className="contact-list">
                            {partners.map(partner => (
                                <div
                                    key={partner.matchId}
                                    className={`contact-item ${selectedPartner?.matchId === partner.matchId ? 'active' : ''}`}
                                    onClick={() => handleSelectPartner(partner)}
                                >
                                    <div className="avatar-container">
                                        <img
                                             src={partner.profileImageUrl || `https://avatar.iran.liara.run/username?username=${encodeURIComponent(partner.username)}`}
                                             alt={partner.username}
                                             className="avatar-image"
                                             onError={(e) => { e.target.onerror = null; e.target.src='https://via.placeholder.com/150/cccccc/808080?text=Err'; }}
                                        />
                                    </div>
                                    <div className="contact-info">
                                        <div className="contact-name">{partner.username}</div>
                                        <div className="last-message">
                                             {messages[partner.matchId] && messages[partner.matchId].length > 0
                                                 ? (messages[partner.matchId][messages[partner.matchId].length - 1].senderType === 'me' ? 'You: ' : '') + messages[partner.matchId][messages[partner.matchId].length - 1].content.substring(0, 25) + (messages[partner.matchId][messages[partner.matchId].length - 1].content.length > 25 ? '...' : '')
                                                 : 'No messages yet'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {partners.length === 0 && <div className="no-matches">Nincsenek matchek.</div>}
                        </div>
                    )}
                </div>
            </div>

            <div className="chat-window">
                {selectedPartner ? (
                    <>
                        <div className="chat-header">
                            <button className="back-button" onClick={handleGoBackToList} aria-label="Vissza a listához">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                                </svg>
                            </button>
                            <div className="header-avatar">
                                <img
                                     src={selectedPartner.profileImageUrl || `https://avatar.iran.liara.run/username?username=${encodeURIComponent(selectedPartner.username)}`}
                                     alt={selectedPartner.username}
                                     className="avatar-image"
                                     onError={(e) => { e.target.onerror = null; e.target.src='https://via.placeholder.com/150/cccccc/808080?text=Err'; }}
                                />
                            </div>
                            <div className="header-info">
                                <div className="contact-name">{selectedPartner.username}</div>
                            </div>
                        </div>

                        <div className="messages-container">
                             {isLoadingMessages && <div className="loading-indicator">Üzenetek betöltése...</div>}
                             {messageError && !isLoadingMessages && <div className="error-message">{messageError}</div>}
                             {!isLoadingMessages && !messageError && (
                                <>
                                    {(messages[selectedPartner.matchId] || []).map((message) => (
                                        <div key={message.id || `msg-${message.createdAt}-${message.sender_id}`} className={`message ${message.senderType === 'me' ? 'sent' : 'received'}`}>
                                            {message.senderType === 'other' && message.sender && ( <div className="message-avatar"><img src={message.sender.profileImageUrl || `https://avatar.iran.liara.run/username?username=${encodeURIComponent(message.sender.username || 'user')}`} alt={message.sender.username || 'avatar'} onError={(e) => { e.target.onerror = null; e.target.src='https://via.placeholder.com/150/cccccc/808080?text=?'; }} /></div> )}
                                            <div className="message-content">{message.content}<div className="message-timestamp">{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div></div>
                                        </div>
                                    ))}
                                </>
                             )}
                            <div ref={messagesEndRef} />
                        </div>
                        <form className="message-input" onSubmit={handleSendMessage}>
                             <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Írj üzenetet..." disabled={!socket || !socket.connected || isLoadingMessages || !!messageError} />
                             <button type="submit" disabled={!socket || !socket.connected || !newMessage.trim() || isLoadingMessages || !!messageError} > <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"> <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/> </svg> </button>
                        </form>
                    </>
                ) : (
                    <div className="empty-chat">
                        <div className="empty-icon">💬</div>
                        {partners.length > 0 ? "Válassz egy beszélgetést a kezdéshez" : "Nincsenek aktív beszélgetéseid"}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;