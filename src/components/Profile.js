import React, { useContext, useState, useEffect, useCallback } from 'react';
import DataContext from '../context/dataContext';
import { toast } from 'react-toastify';
import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const Profile = () => {
    const { user, updateUser, deleteAccount, logout, getUserHistory, deleteHistoryItem, uploadUserImage, bookmarks, toggleBookmark, getBookmarks, updateUserPassword, sendMessage, getMessages, getConversations, getAllUsers, markChatAsRead } = useContext(DataContext);
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
    const [imageFile, setImageFile] = useState(null);
    const [history, setHistory] = useState([]);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    // Chat states
    const [showChat, setShowChat] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [activeChatUser, setActiveChatUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [allUsers, setAllUsers] = useState([]);
    const [showUserList, setShowUserList] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [chatHeight, setChatHeight] = useState('60vh');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Check if the user has a password provider.
    const hasPasswordAuth = user?.providerData?.some(p => p.providerId === 'password');

    useEffect(() => {
        if (user) {
            getUserHistory().then(data => setHistory(data));
            // Bookmarks might be updated elsewhere, so a re-fetch can be good
            getBookmarks();
        }
    }, [user, getUserHistory, getBookmarks]);

    const isUnread = useCallback((chat) => {
        if (!user || !chat || chat.lastSenderId === user.uid) return false;
        const lastReadTime = chat.lastRead?.[user.uid]?.toDate();
        if (!lastReadTime) return true; // Never opened this chat
        const lastMessageTime = chat.updatedAt?.toDate();
        return lastMessageTime && lastMessageTime > lastReadTime;
    }, [user]);

    // Ma'lumotlarni yuklash funksiyalari
    const loadConversations = useCallback(async () => {
        if (user) {
            const chats = await getConversations();
            const unread = chats.filter(isUnread).length;
            setUnreadCount(unread);
            if (showChat) {
                setConversations(chats);
            }
        }
    }, [user, showChat, isUnread, getConversations]);

    const loadMessages = useCallback(async () => {
        if (activeChatUser) {
            const msgs = await getMessages(activeChatUser.id);
            setMessages(msgs);
        }
    }, [activeChatUser, getMessages]);

    useEffect(() => {
        loadConversations();
        if (showChat) getAllUsers().then(setAllUsers);
    }, [loadConversations, showChat, getAllUsers]);

    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    // Scroll to bottom of chat
    useEffect(() => {
        const chatBox = document.getElementById('chat-box');
        if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
    }, [messages, showChat]);

    // Ekran o'lchamiga qarab chat balandligini moslashtirish
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            setChatHeight(mobile ? '85vh' : '60vh');
        };
        handleResize(); // Dastlabki yuklanishda tekshirish
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const getOtherUserInfo = (participantIds) => {
        const otherId = participantIds.find(id => id !== user.uid);
        return allUsers.find(u => u.id === otherId) || { firstName: 'Foydalanuvchi', lastName: '', email: '...' };
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            let currentPhotoURL = photoURL;

            if (imageFile) {
                const toastId = toast.loading("Rasm yuklanmoqda...");
                try {
                    currentPhotoURL = await uploadUserImage(imageFile);
                    toast.update(toastId, { render: "Rasm yuklandi!", type: "success", isLoading: false, autoClose: 2000 });
                } catch (error) {
                    toast.update(toastId, { render: "Rasm yuklashda xatolik!", type: "error", isLoading: false, autoClose: 3000 });
                }
            }

            await updateUser({ displayName, photoURL: currentPhotoURL });
            toast.success("Profil muvaffaqiyatli yangilandi!");
        } catch (error) {
            toast.error("Xatolik: " + error.message);
        }
    };

    const handleDelete = async () => {
        if (window.confirm("Haqiqatan ham hisobingizni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.")) {
            try {
                await deleteAccount();
                toast.info("Hisobingiz o'chirildi.");
                logout();
            } catch (error) {
                toast.error("O'chirishda xatolik (Qayta kirib urinib ko'ring): " + error.message);
            }
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmNewPassword) {
            toast.error("Yangi parollar mos kelmadi!");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Parol kamida 6 belgidan iborat bo'lishi kerak.");
            return;
        }

        const toastId = toast.loading("Parol o'zgartirilmoqda...");
        try {
            await updateUserPassword(currentPassword, newPassword);
            toast.update(toastId, { render: "Parol muvaffaqiyatli o'zgartirildi!", type: "success", isLoading: false, autoClose: 3000 });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (error) {
            let errorMessage = "Parolni o'zgartirishda xatolik!";
            if (error.code === 'auth/wrong-password') {
                errorMessage = "Joriy parol noto'g'ri kiritildi!";
            } else if (error.code === 'auth/requires-recent-login') {
                errorMessage = "Xavfsizlik uchun qayta tizimga kiring va urinib ko'ring.";
            }
            toast.update(toastId, { render: errorMessage, type: "error", isLoading: false, autoClose: 4000 });
            console.error("Password change error:", error);
        }
    };

    const handleDownloadCertificate = (item) => {
        const width = 800;
        const height = 600;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        
        const certificateWindow = window.open('', 'Certificate', `width=${width},height=${height},top=${top},left=${left}`);
        if (!certificateWindow) {
            toast.error("Pop-up oynasi bloklandi. Iltimos, ruxsat bering.");
            return;
        }

        const userName = user?.displayName || user?.email?.split('@')[0] || "Foydalanuvchi";
        const date = new Date(item.date).toLocaleDateString();
        const percentage = Math.round((item.score / (item.totalQuestions * 5)) * 100);
        
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Sertifikat - ${item.topic}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Pinyon+Script&family=Poppins:wght@300;400;600;700&display=swap');
                    body { margin: 0; padding: 0; background-color: #f0f0f0; font-family: 'Poppins', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                    .certificate-container { width: 800px; height: 560px; background: #fff; padding: 40px; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 10px solid #2c3e50; text-align: center; background-image: radial-gradient(#e0e0e0 1px, transparent 1px); background-size: 20px 20px; }
                    .border-inner { border: 2px solid #c0392b; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; position: relative; }
                    .logo { font-size: 24px; font-weight: bold; color: #2c3e50; position: absolute; top: 20px; left: 30px; }
                    h1 { font-family: 'Pinyon Script', cursive; font-size: 80px; color: #c0392b; margin: 0; line-height: 1; }
                    .subtitle { font-size: 24px; text-transform: uppercase; letter-spacing: 4px; color: #2c3e50; margin-top: 10px; margin-bottom: 40px; }
                    .present-text { font-size: 18px; color: #7f8c8d; margin-bottom: 10px; }
                    .name { font-size: 40px; font-weight: 700; color: #2c3e50; border-bottom: 2px solid #c0392b; display: inline-block; padding: 0 20px 10px; margin-bottom: 30px; min-width: 300px; }
                    .description { font-size: 18px; color: #34495e; max-width: 600px; line-height: 1.6; margin-bottom: 40px; }
                    .footer { display: flex; justify-content: space-between; width: 80%; margin-top: 20px; }
                    .date-box, .signature-box { text-align: center; }
                    .line { width: 150px; height: 1px; background: #2c3e50; margin-bottom: 10px; }
                    .label { font-size: 14px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px; }
                    .print-btn { position: fixed; bottom: 20px; right: 20px; padding: 15px 30px; background: #27ae60; color: white; border: none; border-radius: 50px; font-size: 16px; cursor: pointer; box-shadow: 0 4px 15px rgba(39, 174, 96, 0.4); transition: transform 0.2s; }
                    .print-btn:hover { transform: translateY(-2px); }
                    @media print { body { background: none; -webkit-print-color-adjust: exact; } .certificate-container { box-shadow: none; margin: 0; page-break-inside: avoid; } .print-btn { display: none; } }
                </style>
            </head>
            <body>
                <div class="certificate-container">
                    <div class="border-inner">
                        <div class="logo">Quizzes-dev</div>
                        <h1>Sertifikat</h1>
                        <div class="subtitle">Muvaffaqiyatli yakunlandi</div>
                        
                        <div class="present-text">Ushbu sertifikat taqdim etiladi:</div>
                        <div class="name">${userName}</div>
                        
                        <div class="description">
                            <b>${item.topic}</b> bo'yicha test sinovlarini a'lo darajada topshirib,<br>
                            <b>${percentage}%</b> natijani qayd etgani uchun.
                        </div>

                        <div class="footer">
                            <div class="date-box">
                                <div class="line"></div>
                                <div class="label">${date}</div>
                            </div>
                            <div class="signature-box">
                                <div class="line"></div>
                                <div class="label">Imzo</div>
                            </div>
                        </div>
                    </div>
                </div>
                <button class="print-btn" onclick="window.print()">🖨️ Chop etish / PDF</button>
            </body>
            </html>
        `;

        certificateWindow.document.write(htmlContent);
        certificateWindow.document.close();
    };

    const handleDeleteHistory = async (id) => {
        if(window.confirm("Bu natijani o'chirmoqchimisiz?")) {
            const success = await deleteHistoryItem(id);
            if(success) {
                setHistory(prev => prev.filter(item => item.id !== id));
            }
        }
    };

    const certificates = history.filter(item => {
        const percentage = (item.score / (item.totalQuestions * 5)) * 100;
        return percentage >= 80;
    });

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageText.trim() || !activeChatUser || !activeChatUser.id) return;

        try {
            await sendMessage(activeChatUser.id, messageText);
            // Xabarni lokal ro'yxatga qo'shamiz (real-time bo'lmagani uchun)
            const newMessage = {
                id: Date.now().toString(),
                text: messageText,
                senderId: user.uid,
                createdAt: { seconds: Date.now() / 1000 }
            };
            setMessages(prev => [...prev, newMessage]);
            loadConversations(); // Ro'yxatni yangilash
            setMessageText('');
        } catch (error) {
            console.error("Xabar yuborishda xatolik:", error);
            toast.error("Xabar yuborilmadi: " + error.message);
        }
    };

    const startChatWith = async (targetUser) => {
        if (!targetUser || !targetUser.id) return;

        // Yangi suhbat boshlashdan oldin chat hujjatini yaratamiz
        // Bu listener (subscribeToMessages) xatolik berishini oldini oladi
        const chatId = [user.uid, targetUser.id].sort().join('_');
            
        try {
            const chatDocRef = doc(db, 'chats', chatId);
            const chatDoc = await getDoc(chatDocRef);
            
            if (!chatDoc.exists()) {
            await setDoc(chatDocRef, {
                participants: [user.uid, targetUser.id],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }

        } catch (error) {
            console.error("Chatni boshlashda xatolik:", error);
        }

        setActiveChatUser(targetUser);
        setShowUserList(false);
    };

    const handleConversationClick = async (targetUser, chatId) => {
        setActiveChatUser(targetUser);
        setShowUserList(false);
        const chat = conversations.find(c => c.id === chatId);
        if (isUnread(chat)) {
            await markChatAsRead(chatId);
            loadConversations(); // O'qilganligini yangilash
        }
    };

    return (
        <div className="container">
            <div className="row justify-content-center">
                <div className={showChat ? "col-lg-10" : "col-md-8 col-lg-6"}>
                    <div className="glass-container p-2 p-md-5">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <button onClick={() => setShowChat(!showChat)} className={`btn ${showChat ? 'btn-warning' : 'btn-outline-warning'} rounded-pill position-relative`}>
                                {showChat ? '👤 Profilga qaytish' : '✉️ Xabarlar (SMS)'}
                                {unreadCount > 0 && !showChat && (
                                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                        {unreadCount}
                                        <span className="visually-hidden">unread messages</span>
                                    </span>
                                )}
                            </button>
                        </div>

                        {showChat ? (
                            <div className="d-flex flex-column flex-md-row" style={{ height: chatHeight }}>
                                {/* Sidebar / User List */}
                                <div 
                                    className={`col-md-4 border-end border-secondary flex-column ${isMobile && activeChatUser ? 'd-none' : 'd-flex'}`}
                                    style={{ height: '100%' }}
                                >
                                    <div className="mb-3 d-flex gap-2">
                                        <button className="btn btn-primary w-100 btn-sm" onClick={() => setShowUserList(!showUserList)}>
                                            {showUserList ? 'Yopish' : 'Yangi xabar +'}
                                        </button>
                                        <button className="btn btn-outline-info btn-sm" onClick={loadConversations} title="Yangilash">
                                            🔄
                                        </button>
                                    </div>
                                    
                                    <div className="flex-grow-1 overflow-auto">
                                        {showUserList ? (
                                            <div className="list-group">
                                                {allUsers.filter(u => u.id !== user.uid).map(u => (
                                                    <button key={u.id} className="list-group-item list-group-item-action bg-dark text-white border-secondary" onClick={() => startChatWith(u)}>
                                                        {u.firstName} {u.lastName} <br/>
                                                        <small className="text-muted">{u.role === 'admin' ? '⭐ Admin' : u.profession}</small>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="list-group">
                                                {conversations.length === 0 && <p className="text-muted small text-center">Suhbatlar yo'q</p>}
                                                {conversations.map(chat => {
                                                    const otherUser = getOtherUserInfo(chat.participants);
                                                    const unread = isUnread(chat);
                                                    return (
                                                        <button 
                                                            key={chat.id} 
                                                            className={`list-group-item list-group-item-action bg-transparent text-white border-secondary d-flex justify-content-between align-items-center ${activeChatUser?.id === otherUser.id ? 'active bg-secondary' : ''}`}
                                                            onClick={() => handleConversationClick(otherUser, chat.id)}
                                                        >
                                                            <div>
                                                                <div className={`fw-bold ${unread ? 'text-warning' : ''}`}>{otherUser.firstName} {otherUser.lastName} {otherUser.role === 'admin' && '⭐'}</div>
                                                                <small className="text-muted text-truncate d-block">{chat.lastMessage}</small>
                                                            </div>
                                                            {unread && <span className="badge bg-danger rounded-pill">!</span>}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Chat Area */}
                                <div 
                                    className={`col-md-8 flex-column ${isMobile && !activeChatUser ? 'd-none' : 'd-flex'}`}
                                    style={{ height: '100%' }}
                                >
                                    {activeChatUser ? (
                                        <>
                                            <div className="border-bottom border-secondary pb-2 mb-2 d-flex justify-content-between align-items-center">
                                                <div className="d-flex align-items-center gap-2">
                                                    <button className="btn btn-sm btn-outline-secondary d-md-none" onClick={() => setActiveChatUser(null)}>⬅️</button>
                                                    <div>
                                                        <h5 className="m-0">{activeChatUser.firstName} {activeChatUser.lastName}</h5>
                                                        <small className="text-muted">{activeChatUser.email}</small>
                                                    </div>
                                                </div>
                                                <button className="btn btn-sm btn-outline-secondary" onClick={loadMessages} title="Xabarlarni yangilash">🔄</button>
                                            </div>
                                            <div id="chat-box" className="flex-grow-1 overflow-auto mb-3 p-2" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
                                                {messages.map(msg => (
                                                    <div key={msg.id} className={`d-flex mb-2 ${msg.senderId === user.uid ? 'justify-content-end' : 'justify-content-start'}`}>
                                                        <div className={`p-2 rounded ${msg.senderId === user.uid ? 'bg-primary text-white' : 'bg-secondary text-white'}`} style={{ maxWidth: '75%' }}>
                                                            <div>{msg.text}</div>
                                                            <div style={{ fontSize: '0.7em', opacity: 0.7, textAlign: 'right' }}>
                                                                {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {messages.length === 0 && <p className="text-center text-muted mt-5">Suhbatni boshlang...</p>}
                                            </div>
                                            <form onSubmit={handleSendMessage} className="d-flex gap-2">
                                                <input 
                                                    type="text" 
                                                    className="form-control bg-dark text-white border-secondary" 
                                                    placeholder="Xabar yozing..." 
                                                    value={messageText}
                                                    onChange={(e) => setMessageText(e.target.value)}
                                                />
                                                <button type="submit" className="btn btn-success">➤</button>
                                            </form>
                                        </>
                                    ) : (
                                        <div className="h-100 d-flex align-items-center justify-content-center text-muted">Suhbatlashish uchun yuqoridan kimnidir tanlang</div>
                                    )}
                                </div>
                            </div>
                        ) : (
                        <>
                        <h2 className="text-center mb-4">Shaxsiy Profil</h2>
                        <div className="text-center mb-4">
                            {user?.photoURL ? <img src={user.photoURL} alt="Avatar" className="rounded-circle" width="100" height="100" /> : <div className="rounded-circle bg-secondary d-inline-flex align-items-center justify-content-center" style={{width: 100, height: 100, fontSize: 40}}>👤</div>}
                            <p className="mt-2 text-muted">{user?.email} {user?.emailVerified ? '✅' : '⚠️'}</p>
                        </div>
                        
                        <form onSubmit={handleUpdate}>
                            <div className="mb-3">
                                <label className="form-label">Ism Familiya</label>
                                <input type="text" className="form-control" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Profil rasmini yuklash</label>
                                <input type="file" className="form-control" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Rasm URL (ixtiyoriy)</label>
                                <input type="text" className="form-control" value={photoURL} onChange={(e) => setPhotoURL(e.target.value)} placeholder="https://..." />
                            </div>
                            <button type="submit" className="btn btn-custom w-100 mb-3">Saqlash</button>
                        </form>
                        
                        <hr className="my-4" />
                        <button onClick={handleDelete} className="btn btn-danger w-100">Hisobni o'chirish</button>

                        {hasPasswordAuth && (
                            <>
                                <hr className="my-4" />
                                <h4 className="mb-3">Parolni o'zgartirish</h4>
                                <form onSubmit={handlePasswordChange}>
                                    <div className="mb-3">
                                        <label className="form-label">Joriy parol</label>
                                        <input type="password" placeholder="••••••••" className="form-control" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Yangi parol</label>
                                        <input type="password" placeholder="Kamida 6 belgi" className="form-control" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Yangi parolni tasdiqlang</label>
                                        <input type="password" placeholder="Yangi parolni takrorlang" className="form-control" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required />
                                    </div>
                                    <button type="submit" className="btn btn-warning w-100">Parolni yangilash</button>
                                </form>
                            </>
                        )}

                        <div className="mt-5">
                            <h4 className="mb-3 text-success">📜 Mening Sertifikatlarim</h4>
                            {certificates.length > 0 ? (
                                <div className="row g-3">
                                    {certificates.map(item => (
                                        <div key={item.id} className="col-md-6">
                                            <div className="card bg-dark text-white border-success h-100">
                                                <div className="card-body text-center">
                                                    <h5 className="card-title text-warning">{item.topic}</h5>
                                                    <p className="card-text display-6 fw-bold">{Math.round((item.score / (item.totalQuestions * 5)) * 100)}%</p>
                                                    <p className="text-muted small">{new Date(item.date).toLocaleDateString()}</p>
                                                    <button onClick={() => handleDownloadCertificate(item)} className="btn btn-outline-success btn-sm rounded-pill">
                                                        Yuklab olish 📥
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted text-center">Sizda hali sertifikatlar yo'q. (80% dan yuqori natija kerak)</p>
                            )}
                        </div>

                        <div className="mt-5">
                            <h4 className="mb-3 text-warning">Testlar tarixi</h4>
                            {history.length > 0 ? (
                                <div className="list-group">
                                    {history.map(item => (
                                        <div key={item.id} className="list-group-item bg-dark text-white border-secondary mb-2 rounded">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <h5 className="mb-1 text-info">{item.topic}</h5>
                                                <div className="d-flex align-items-center gap-2">
                                                    <small className="text-muted">{new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString()}</small>
                                                    <button className="btn btn-sm btn-outline-danger py-0 px-1" onClick={() => handleDeleteHistory(item.id)} title="O'chirish">🗑️</button>
                                                </div>
                                            </div>
                                            <p className="mb-1">Natija: <span className={item.score >= (item.totalQuestions * 5 / 2) ? "text-success fw-bold" : "text-danger fw-bold"}>{item.score}</span> / {item.totalQuestions * 5}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted text-center">Hozircha testlar tarixi mavjud emas.</p>
                            )}
                        </div>

                        <div className="mt-5">
                            <h4 className="mb-3 text-warning">🔖 Belgilangan savollar</h4>
                            {bookmarks.length > 0 ? (
                                <div className="list-group">
                                    {bookmarks.map(item => (
                                        <div key={item.id} className="list-group-item bg-dark text-white border-secondary mb-2 rounded">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <p className="mb-1" style={{maxWidth: '85%'}}>{item.question}</p>
                                                <button className="btn btn-sm btn-danger" onClick={() => toggleBookmark(item)} title="Belgini olib tashlash">
                                                    🗑️
                                                </button>
                                            </div>
                                            <small className="text-muted">Fan: {item.topic}</small>
                                            <p className="mt-2 mb-0 text-success small">To'g'ri javob: {item.answer}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted text-center">Hozircha belgilangan savollar yo'q.</p>
                            )}
                        </div>
                        </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;