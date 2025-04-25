import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import '../Styles/Chat.css'; // Chat stílusok importálása
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
// KOMPONENS IMPORTÁLÁSA
import ProfilePopupMenu from './ProfilePopupMenu'; // A kis popup menü komponens
import '../Styles/ProfilePopupMenu.css'; // A popup menü CSS-e (vagy a fő CSS-ben van)

// --- Helper függvények: Token és User ID lekérése ---
const getAuthToken = () => {
    // Helyi tárolóból olvassa a tokent
    const token = localStorage.getItem('accessToken');
    // Itt lehetne további ellenőrzés, pl. lejárat
    return token;
};

const getCurrentUserId = () => {
    try {
        const token = getAuthToken();
        if (!token) {
            console.error("Nincs authentikációs token.");
            return null;
        }
        // Token dekódolása
        const decoded = jwtDecode(token);
        // Ellenőrizzük, hogy a dekódolt objektum tartalmazza-e az 'id'-t
        if (!decoded || typeof decoded.id === 'undefined') {
            console.error("A dekódolt token nem tartalmaz 'id' mezőt.");
            return null;
        }
        // User ID visszaadása számként
        return Number(decoded.id);
    } catch (error) {
        // Hiba kezelése (pl. lejárt vagy érvénytelen token)
        console.error("Hiba a token dekódolása közben:", error);
        // Fontos lehet itt a felhasználó kijelentkeztetése
        // localStorage.removeItem('accessToken');
        return null;
    }
};
// ---

// --- Fő Chat Komponens ---
const Chat = () => {
    // State változók definiálása
    const [userId, setUserId] = useState(null); // Aktuális felhasználó ID
    const [partners, setPartners] = useState([]); // Partnerek (matchek) listája
    const [selectedPartner, setSelectedPartner] = useState(null); // Kiválasztott partner adatai
    const [newMessage, setNewMessage] = useState(''); // Üzenetküldő input tartalma
    const [messages, setMessages] = useState({}); // Üzenetek tárolása (matchId kulcsokkal)
    const [socket, setSocket] = useState(null); // Socket.IO kapcsolat
    const [isLoadingPartners, setIsLoadingPartners] = useState(false); // Partnerek betöltési állapota
    const [partnerError, setPartnerError] = useState(null); // Hiba partnerek lekérésekor
    const [isLoadingMessages, setIsLoadingMessages] = useState(false); // Üzenetek betöltési állapota
    const [messageError, setMessageError] = useState(null); // Hiba üzenetekkel kapcsolatban
    const [authError, setAuthError] = useState(null); // Authentikációs hiba
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false); // Popup menü láthatósága

    // Ref-ek DOM elemekhez vagy értékek tárolásához
    const currentMatchIdRef = useRef(null); // Aktuális chat szoba ID-ja
    const messagesEndRef = useRef(null); // Üzenetek aljára görgetéshez

    // React Router navigáció
    const navigate = useNavigate();

    // Backend URL meghatározása
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

    // --- useEffect Hookok ---

    // 1. User ID beállítása mountoláskor
    useEffect(() => {
        const id = getCurrentUserId();
        if (id) {
            setUserId(id);
            setAuthError(null);
        } else {
            setAuthError("Felhasználó azonosítása sikertelen. Jelentkezz be újra.");
            // navigate('/login'); // Opcionális átirányítás
        }
    }, [navigate]); // navigate függőség (bár ritkán változik)

    // 2. Partnerek lekérése és Socket kapcsolat indítása
    useEffect(() => {
        if (!userId || authError) return; // Ne fusson, ha nincs ID vagy hiba van

        const abortController = new AbortController();
        const signal = abortController.signal;

        const fetchPartnersAndConnectSocket = async () => {
            // Partnerek lekérése
            setIsLoadingPartners(true);
            setPartnerError(null);
            try {
                const token = getAuthToken();
                if (!token) throw new Error("Authentikációs token hiányzik.");
                // *** FONTOS: Győződj meg róla, hogy az API válasz tartalmazza a partnerUserId-t! ***
                const response = await fetch(`${BACKEND_URL}/api/matches`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    signal
                });
                if (!response.ok) {
                    const errorData = await response.text();
                    throw new Error(`Partnerek lekérése sikertelen (${response.status}). ${errorData}`);
                }
                const data = await response.json();
                if (!signal.aborted) {
                     if (data && data.length > 0 && typeof data[0].partnerUserId === 'undefined') {
                        console.warn("FIGYELEM: A /api/matches válasz nem tartalmazza a 'partnerUserId' mezőt! A profilra navigálás a menüből nem fog működni.");
                    }
                    setPartners(data || []);
                }
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error("Hiba a partnerek lekérésekor:", error);
                    setPartnerError(error.message || "Ismeretlen hiba történt.");
                    setPartners([]);
                }
            } finally {
                if (!signal.aborted) setIsLoadingPartners(false);
            }

            if (signal.aborted) return; // Ha a fetch megszakadt, ne csatlakozzunk

            // Socket kapcsolat
            const token = getAuthToken();
            if (!token) {
                console.error("Socket nem csatlakoztatható: Token hiányzik.");
                return;
            }
            if (socket) socket.disconnect(); // Korábbi kapcsolat bontása

            console.log("Socket csatlakozás kísérlete...");
            const newSocket = io(BACKEND_URL, {
                auth: { token: token },
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });
            setSocket(newSocket);

            // Socket eseményfigyelők
            newSocket.on('connect', () => console.log('Socket csatlakozva:', newSocket.id));
            newSocket.on('disconnect', (reason) => console.log('Socket bontva:', reason));
            newSocket.on('connect_error', (err) => console.error("Socket csatlakozási hiba:", err));
            newSocket.on('send_error', (error) => {
                console.error('Szerveroldali küldési hiba:', error.message);
                setMessageError(`Üzenet küldési hiba: ${error.message}`);
            });
        };

        fetchPartnersAndConnectSocket();

        // Cleanup függvény
        return () => {
            console.log("Chat komponens cleanup: fetch megszakítása, socket bontása.");
            abortController.abort(); // Fetch megszakítása
            if (socket) {
                socket.off(); // Összes listener eltávolítása
                socket.disconnect();
                setSocket(null);
            }
        };
    }, [userId, authError, BACKEND_URL]); // socket függőséget kivettük

    // 3. Új üzenetek figyelése a socketen
    useEffect(() => {
        if (!socket || !userId) return;

        const handleNewMessage = (message) => {
            console.log('Új üzenet:', message);
            // Validáció és formázás
            if (!message?.match_id || !message?.sender_id || !message?.id) {
                 console.error("Érvénytelen üzenet formátum:", message);
                 return;
            }
            const formattedMessage = { ...message, senderType: message.sender_id === userId ? 'me' : 'other' };
            // Üzenet hozzáadása a state-hez (duplikáció ellenőrzéssel)
            setMessages(prevMessages => {
                const currentMatchMessages = prevMessages[message.match_id] || [];
                if (currentMatchMessages.some(msg => msg.id === formattedMessage.id)) {
                    return prevMessages; // Már létezik, ne adjuk hozzá újra
                }
                return { ...prevMessages, [message.match_id]: [...currentMatchMessages, formattedMessage] };
            });
        };

        socket.on('new_message', handleNewMessage);
        // Cleanup: listener eltávolítása
        return () => { if (socket) socket.off('new_message', handleNewMessage); };
    }, [socket, userId]);

    // 4. Szobakezelés és üzenetelőzmények lekérése partner választásakor
    useEffect(() => {
        if (!selectedPartner || !socket || !selectedPartner.matchId || !userId) return;

        const matchId = selectedPartner.matchId;
        const previousMatchId = currentMatchIdRef.current;

        // Szoba váltás
        if (previousMatchId && previousMatchId !== matchId) {
            socket.emit('leave_match', previousMatchId);
            console.log(`Elhagyva: ${previousMatchId}`);
        }
        if (previousMatchId !== matchId) {
            socket.emit('join_match', matchId);
            currentMatchIdRef.current = matchId;
            console.log(`Csatlakozva: ${matchId}`);
        }

        // Előzmények lekérése (ha még nincs betöltve)
        const abortController = new AbortController();
        const signal = abortController.signal;
        if (!messages[matchId] || messages[matchId].length === 0) {
            const fetchMessages = async () => {
                console.log(`Előzmények lekérése: ${matchId}`);
                setIsLoadingMessages(true);
                setMessageError(null);
                try {
                    const token = getAuthToken();
                    if (!token) throw new Error("Token hiányzik.");
                    const response = await fetch(`${BACKEND_URL}/api/matches/${matchId}/messages`, { headers: { 'Authorization': `Bearer ${token}` }, signal });
                    if (!response.ok) { const txt = await response.text(); throw new Error(`Üzenetek lekérése sikertelen (${response.status}). ${txt}`); }
                    const history = await response.json();
                    if (!signal.aborted) {
                        const formatted = history.map(msg => ({ ...msg, senderType: msg.sender_id === userId ? 'me' : 'other' }));
                        setMessages(prev => ({ ...prev, [matchId]: formatted || [] }));
                    }
                } catch (error) {
                    if (error.name !== 'AbortError') {
                        console.error(`Üzenet lekérési hiba (${matchId}):`, error);
                        setMessageError(error.message || "Üzenetek betöltése sikertelen.");
                        setMessages(prev => ({ ...prev, [matchId]: [] })); // Hiba esetén is beállítjuk (üresre)
                    }
                } finally {
                    if (!signal.aborted) setIsLoadingMessages(false);
                }
            };
            fetchMessages();
        } else {
            // Ha már van adat, csak a loading state-et állítjuk
            setIsLoadingMessages(false);
            setMessageError(null);
        }
        // Cleanup
        return () => abortController.abort();
    }, [selectedPartner, socket, userId, BACKEND_URL]); // messages kivéve a függőségből

    // 5. Automatikus görgetés
    useEffect(() => {
       if (selectedPartner && !isLoadingMessages && messages[selectedPartner.matchId]) {
           const timer = setTimeout(() => {
               messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
           }, 150);
           return () => clearTimeout(timer);
       }
   }, [messages, selectedPartner, isLoadingMessages]);
    // ---

    // --- Callback Függvények (Eseménykezelők) ---

    // Üzenet küldése
    const handleSendMessage = (e) => {
         e.preventDefault();
        if (!newMessage.trim() || !selectedPartner || !socket?.connected || !selectedPartner.matchId) return;
        setMessageError(null);
        socket.emit('send_message', { matchId: selectedPartner.matchId, content: newMessage.trim() });
        setNewMessage('');
    };

    // Partner kiválasztása a listából
    const handleSelectPartner = useCallback((partner) => {
        if (selectedPartner?.matchId === partner.matchId) return;
        setSelectedPartner(partner);
        setMessageError(null);
        setIsLoadingMessages(true);
        setIsProfileMenuOpen(false); // Menü bezárása
    }, [selectedPartner]); // Csak selectedPartner függőség

    // Visszalépés a listához
    const handleGoBackToList = () => {
        if (socket && currentMatchIdRef.current) {
             socket.emit('leave_match', currentMatchIdRef.current);
        }
        setSelectedPartner(null);
        currentMatchIdRef.current = null;
        setIsProfileMenuOpen(false); // Menü bezárása
    };

    // Profil oldalra navigáló függvény (menüből hívódik)
    const handleViewProfile = (partnerUserId) => {
        if (!partnerUserId) {
            console.error("Profil nem tekinthető meg: Hiányzó Partner User ID.", selectedPartner);
            setMessageError("A partner profilja nem érhető el.");
            closeProfileMenu();
            return;
        }
        console.log(`Navigálás ide: /profile/${partnerUserId}`);
        closeProfileMenu(); // Menü bezárása
        navigate(`/profile/${partnerUserId}`); // Navigálás
    };

    // Popup menü nyitása
    const openProfileMenu = () => {
        if (selectedPartner) setIsProfileMenuOpen(true);
    };
    // Popup menü bezárása
    const closeProfileMenu = () => {
        setIsProfileMenuOpen(false);
    };
    // ---

    // --- Renderelés ---
    if (authError) {
        // Authentikációs hiba esetén csak hibaüzenet
        return <div className="chat-container error-container">{authError}</div>;
    }

    // Fő chat felület renderelése
    return (
        <div className={`chat-container ${selectedPartner ? 'chat-active' : ''}`}>

            {/* Sidebar (Partner Lista - itt definiálva) */}
            <div className="chat-sidebar">
                 <div className="contacted-section">
                     <div className="section-title">Matches</div>
                     {/* Betöltés / Hiba / Lista */}
                     {isLoadingPartners && <div className="loading-indicator">Partnerek betöltése...</div>}
                     {partnerError && <div className="error-message">{partnerError}</div>}
                     {!isLoadingPartners && !partnerError && (
                         <div className="contact-list">
                             {partners.map(partner => (
                                 <div
                                     key={partner.matchId}
                                     className={`contact-item ${selectedPartner?.matchId === partner.matchId ? 'active' : ''}`}
                                     onClick={() => handleSelectPartner(partner)}
                                     role="button" // Jobb accessibilitás
                                     tabIndex={0} // Fókuszálható
                                     onKeyDown={(e) => e.key === 'Enter' && handleSelectPartner(partner)} // Enterrel is kiválasztható
                                 >
                                     <div className="avatar-container">
                                         <img
                                             src={partner.profileImageUrl || `https://avatar.iran.liara.run/username?username=${encodeURIComponent(partner.username)}&length=1`}
                                             alt={partner.username}
                                             className="avatar-image"
                                             onError={(e) => { e.target.onerror = null; e.target.src='https://via.placeholder.com/40/cccccc/ffffff?text=?'; }}
                                         />
                                         {/* Itt lehetne online státusz jelző */}
                                     </div>
                                     <div className="contact-info">
                                         <div className="contact-name">{partner.username}</div>
                                         <div className="last-message">
                                             {/* Utolsó üzenet logikája */}
                                             {messages[partner.matchId]?.length > 0
                                                 ? (messages[partner.matchId].slice(-1)[0].senderType === 'me' ? 'Te: ' : '') +
                                                   messages[partner.matchId].slice(-1)[0].content.substring(0, 25) +
                                                   (messages[partner.matchId].slice(-1)[0].content.length > 25 ? '...' : '')
                                                 : 'Még nincs üzenet'}
                                         </div>
                                     </div>
                                 </div>
                             ))}
                             {partners.length === 0 && <div className="no-matches">Nincsenek matcheitek.</div>}
                         </div>
                     )}
                 </div>
            </div>

            {/* Chat Ablak */}
            <div className="chat-window">
                {selectedPartner ? (
                    // Ha van kiválasztott partner
                    // Konténer a relatív pozícióhoz a popup menü miatt
                    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {/* Chat Fejléc -> Menü nyitása onClick-re */}
                        <div className="chat-header">
                             <button className="back-button" onClick={handleGoBackToList} aria-label="Vissza a listához">
                                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                             </button>
                             {/* Avatar -> Menü nyitása */}
                             <div className="header-avatar" onClick={openProfileMenu} style={{ cursor: 'pointer' }} title={`Opciók: ${selectedPartner.username}`}>
                                 <img
                                    src={selectedPartner.profileImageUrl || `https://avatar.iran.liara.run/username?username=${encodeURIComponent(selectedPartner.username)}&length=1`}
                                    alt={selectedPartner.username}
                                    className="avatar-image"
                                    onError={(e) => { e.target.onerror = null; e.target.src='https://via.placeholder.com/40/cccccc/ffffff?text=?'; }}
                                 />
                             </div>
                             {/* Név -> Menü nyitása */}
                             <div className="header-info" onClick={openProfileMenu} style={{ cursor: 'pointer' }} title={`Opciók: ${selectedPartner.username}`}>
                                 <div className="contact-name">{selectedPartner.username}</div>
                                 {/* Itt lehetne online státusz */}
                             </div>
                         </div>

                        {/* Üzenetek Megjelenítése */}
                        <div className="messages-container">
                            {isLoadingMessages && <div className="loading-indicator">Üzenetek betöltése...</div>}
                            {messageError && !isLoadingMessages && <div className="error-message">{messageError}</div>}
                            {!isLoadingMessages && !messageError && (
                                <>
                                    {(messages[selectedPartner.matchId] || []).map((message) => (
                                        <div key={message.id || `msg-${message.createdAt}-${message.sender_id}`} className={`message ${message.senderType === 'me' ? 'sent' : 'received'}`}>
                                            {/* Avatar a bejövő üzenetekhez (opcionális) */}
                                            <div className="message-content">
                                                {message.content}
                                                <div className="message-timestamp">{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                            <div ref={messagesEndRef} /> {/* Scroll célpont */}
                        </div>

                        {/* Üzenetküldő Input Form */}
                        <form className="message-input" onSubmit={handleSendMessage}>
                             <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Írj üzenetet..."
                                disabled={!socket?.connected || isLoadingMessages || !!messageError}
                                aria-label="Üzenet szövege"
                             />
                             <button
                                type="submit"
                                disabled={!socket?.connected || !newMessage.trim() || isLoadingMessages || !!messageError}
                                aria-label="Üzenet küldése"
                             >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"> <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/> </svg>
                             </button>
                         </form>

                        {/* FELTÉTELESEN MEGJELENŐ POPUP MENÜ */}
                        {/* Most a ProfilePopupMenu komponenst rendereljük */}
                        {isProfileMenuOpen && (
                            <ProfilePopupMenu
                                partner={selectedPartner}      // Partner adatai
                                onClose={closeProfileMenu}       // Bezáró függvény
                                onViewProfile={handleViewProfile} // Navigáló függvény
                            />
                        )}

                    </div> // end flex container for chat window content
                ) : (
                    // Üres állapot (ha nincs kiválasztott partner)
                    <div className="empty-chat">
                         <div className="empty-icon">💬</div>
                         {isLoadingPartners
                            ? "Partnerek betöltése..."
                            : (partners.length > 0 ? "Válassz egy beszélgetést a kezdéshez" : "Nincsenek aktív beszélgetéseid")}
                     </div>
                )}
            </div> {/* end chat-window */}

            {/* A Modal komponens már nincs itt */}

        </div> // end chat-container
    );
};

export default Chat;