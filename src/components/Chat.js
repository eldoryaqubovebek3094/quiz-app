import React, { useState, useEffect, useContext } from 'react';
import { db } from '../firebase';
import { 
    collection, 
    query, 
    where, 
    onSnapshot, 
    addDoc, 
    setDoc, 
    doc, 
    getDoc, 
    serverTimestamp, 
    orderBy 
} from 'firebase/firestore';
import DataContext from '../context/dataContext';
import { toast } from 'react-toastify';

const Chat = () => {
    const { user } = useContext(DataContext); // Tizimga kirgan foydalanuvchi
    const [users, setUsers] = useState([]);
    const [chatUser, setChatUser] = useState(null);
    const [text, setText] = useState('');
    const [messages, setMessages] = useState([]);

    // 1. Barcha foydalanuvchilarni yuklash (o'zidan tashqari)
    useEffect(() => {
        const usersRef = collection(db, 'users');
        // Real loyihada bu yerda pagination yoki limit bo'lishi kerak
        const unsub = onSnapshot(usersRef, (snapshot) => {
            let usersList = [];
            snapshot.forEach((doc) => {
                const userData = doc.data();
                const uid = userData.uid || doc.id; // uid yo'q bo'lsa doc.id ni olamiz
                if (uid !== user?.uid) {
                    usersList.push({ ...userData, uid });
                }
            });
            setUsers(usersList);
        });
        return () => unsub();
    }, [user]);

    // 2. Chatni tanlash va xabarlarni yuklash
    const selectUser = async (u) => {
        setChatUser(u);
        
        // Ikkita user uchun unikal chat ID yaratish (alfavit tartibida)
        const id = user.uid > u.uid ? `${user.uid}_${u.uid}` : `${u.uid}_${user.uid}`;

        try {
            // Chat hujjati mavjudligini tekshirish, yo'q bo'lsa yaratish
            const chatDocRef = doc(db, 'chats', id);
            const chatDoc = await getDoc(chatDocRef);
            
            if (!chatDoc.exists()) {
                await setDoc(chatDocRef, {
                    participants: [user.uid, u.uid],
                    createdAt: serverTimestamp()
                });
            }
        } catch (error) {
            console.error("Chat yaratishda xatolik:", error);
        }

        // Xabarlarni tinglash
        const msgsRef = collection(db, 'chats', id, 'messages');
        const q = query(msgsRef, orderBy('createdAt', 'asc'));

        onSnapshot(q, (querySnapshot) => {
            let msgs = [];
            querySnapshot.forEach((doc) => {
                msgs.push(doc.data());
            });
            setMessages(msgs);
        });
    };

    // 3. Xabar yuborish
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;

        const id = user.uid > chatUser.uid ? `${user.uid}_${chatUser.uid}` : `${chatUser.uid}_${user.uid}`;

        try {
            await addDoc(collection(db, 'chats', id, 'messages'), {
                text,
                senderId: user.uid,
                createdAt: serverTimestamp(),
            });
            setText('');
        } catch (err) {
            toast.error("Xabar yuborishda xatolik");
        }
    };

    return (
        <div className="container py-5" style={{ minHeight: '100vh' }}>
            <div className="row glass-container p-3" style={{ height: '80vh' }}>
                {/* Chap taraf: Foydalanuvchilar ro'yxati */}
                <div className="col-md-4 border-end border-secondary overflow-auto h-100">
                    <h4 className="text-white mb-3">Foydalanuvchilar</h4>
                    <div className="list-group">
                        {users.map((u) => (
                            <button 
                                key={u.uid} 
                                className={`list-group-item list-group-item-action ${chatUser?.uid === u.uid ? 'active' : ''} bg-transparent text-white border-secondary`}
                                onClick={() => selectUser(u)}
                            >
                                {u.displayName || u.email}
                                <br/>
                                <small className="text-muted">{u.profession}</small>
                            </button>
                        ))}
                    </div>
                </div>

                {/* O'ng taraf: Chat oynasi */}
                <div className="col-md-8 d-flex flex-column h-100">
                    {chatUser ? (
                        <>
                            <div className="chat-header border-bottom border-secondary pb-2 mb-2 text-white">
                                <strong>{chatUser.displayName}</strong> bilan suhbat
                            </div>
                            <div className="chat-messages flex-grow-1 overflow-auto mb-3 d-flex flex-column gap-2">
                                {messages.map((m, index) => (
                                    <div key={index} className={`p-2 rounded text-white ${m.senderId === user.uid ? 'bg-primary align-self-end' : 'bg-secondary align-self-start'}`} style={{ maxWidth: '70%' }}>
                                        {m.text}
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={handleSubmit} className="d-flex gap-2">
                                <input type="text" className="form-control" placeholder="Xabar yozing..." value={text} onChange={(e) => setText(e.target.value)} />
                                <button type="submit" className="btn btn-custom">Yuborish</button>
                            </form>
                        </>
                    ) : (
                        <div className="text-white m-auto">Suhbatlashish uchun foydalanuvchi tanlang</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Chat;