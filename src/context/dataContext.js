import { createContext, useState, useEffect, useCallback } from "react";
import { auth, googleProvider, githubProvider, db, storage } from "../firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithPopup,
  updateProfile,
  sendEmailVerification,
  deleteUser,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from "firebase/auth";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, setDoc, query, where, orderBy, limit, getDoc, serverTimestamp, getCountFromServer } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from 'react-toastify';

const DataContext = createContext({});

const initialTopics = ['React', 'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Go', 'Rust', 'Swift', 'Kotlin', 'Ruby', 'TypeScript', 'HTML', 'CSS', 'SQL', 'Angular', 'Vue', 'Node.js', 'Flutter'];

const fileMap = {
  'React': '/quiz.json',
  'JavaScript': '/javascript.json',
  'Python': '/python.json',
  'Java': '/java.json',
  'C++': '/cpp.json',
  'C#': '/csharp.json',
  'PHP': '/php.json',
  'Go': '/go.json',
  'Rust': '/rust.json',
  'Swift': '/swift.json',
  'Kotlin': '/kotlin.json',
  'Ruby': '/ruby.json',
  'TypeScript': '/typescript.json',
  'HTML': '/html.json',
  'CSS': '/css.json',
  'SQL': '/sql.json',
  'Angular': '/angular.json',
  'Vue': '/vue.json',
  'Node.js': '/nodejs.json',
  'Flutter': '/flutter.json'
};

export const DataProvider = ({children}) => {
      // All quizzes, Current Question, Index of Current Question, Answer, Selected Answer, Total Marks
  const [quizzes, setquizzes] = useState([]);
  const [question, setQuestion] = useState({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [marks, setMarks] = useState(0);
  const [timer, setTimer] = useState(15);
  
  // Topics
  const [selectedTopic, setSelectedTopic] = useState('');
  const [topics, setTopics] = useState(initialTopics);
  const [topicCounts, setTopicCounts] = useState({});

  // Auth & Theme States
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authView, setAuthView] = useState('login'); // login, register, forgot
  const [theme, setTheme] = useState('dark'); // dark, light
  const [isAdmin, setIsAdmin] = useState(false);

  // Display Controlling States
  const [showStart, setShowStart] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Bookmark states
  const [bookmarks, setBookmarks] = useState([]);

  // Sound State
  const [isSoundOn, setIsSoundOn] = useState(true);
  const toggleSound = () => setIsSoundOn(prev => !prev);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // Admin tekshiruvi
      if (currentUser && currentUser.email === 'ebek3094@gmail.com') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }

      // Last Seen (Oxirgi marta onlayn) ni yangilash
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        setDoc(userRef, { 
            lastSeen: serverTimestamp()
        }, { merge: true }).catch(err => console.error("Last seen update error:", err));
      }

      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Auth Functions
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  }

  const register = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  const verifyEmail = (currentUser) => {
    return sendEmailVerification(currentUser);
  }

  const logout = () => {
    returnToHome(); // Reset quiz state on logout
    setShowProfile(false);
    setShowAdmin(false);
    setShowLeaderboard(false);
    return signOut(auth);
  }

  const deleteAccount = () => {
    return deleteUser(auth.currentUser);
  }

  const updateUserPassword = async (currentPassword, newPassword) => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Foydalanuvchi tizimga kirmagan.");
    }
    
    // Re-authenticate the user for security reasons
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    // Update the password
    await updatePassword(user, newPassword);
  }

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  }

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }

  // Firestore Functions
  const addQuestion = async (newQuestion) => {
    try {
      const questionWithTopic = { 
        ...newQuestion, 
        topic: selectedTopic || 'React',
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, "quizzes"), questionWithTopic);
      // Qayta fetch qilish o'rniga, state'ga qo'shib qo'yamiz
      setquizzes(prevQuizzes => [...prevQuizzes, { id: docRef.id, ...questionWithTopic }]);
      
      // Yangi: Topic countni real vaqtda yangilash
      setTopicCounts(prev => ({
        ...prev,
        [questionWithTopic.topic]: (prev[questionWithTopic.topic] || 0) + 1
      }));
      toast.success("Savol muvaffaqiyatli qo'shildi!");
      return true;
    } catch (error) {
      console.error("Error adding question:", error);
      toast.error("Savol qo'shishda xatolik: " + error.message);
      return false;
    }
  }

  const addTopic = async (topicName) => {
    if (!topicName || topicName.trim() === '') {
      toast.warn("Yo'nalish nomini kiriting!");
      return false;
    }
    const trimmedName = topicName.trim();
    // Check if topic already exists (case-insensitive)
    if (topics.some(t => t && t.toLowerCase() === trimmedName.toLowerCase())) {
      toast.error(`"${trimmedName}" nomli yo'nalish allaqachon mavjud!`);
      return false;
    }

    try {
      // Add to firestore
      await addDoc(collection(db, "topics"), { name: trimmedName });
      // Add to local state
      const updatedTopics = [...topics, trimmedName].sort();
      setTopics(updatedTopics);
      // Initialize count
      setTopicCounts(prev => ({ ...prev, [trimmedName]: 0 }));
      toast.success(`"${trimmedName}" yo'nalishi qo'shildi!`);
      return true;
    } catch (error) {
      console.error("Error adding topic:", error);
      toast.error("Yo'nalish qo'shishda xatolik: " + error.message);
      return false;
    }
  }

  const deleteTopic = async (topicName) => {
    if (!window.confirm(`"${topicName}" yo'nalishini o'chirmoqchimisiz?`)) return;

    try {
      const q = query(collection(db, "topics"), where("name", "==", topicName));
      const snapshot = await getDocs(q);
      
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      setTopics(prev => prev.filter(t => t !== topicName));
      toast.success("Yo'nalish o'chirildi");
    } catch (error) {
      console.error("Error deleting topic:", error);
      toast.error("O'chirishda xatolik: " + error.message);
    }
  }

  const deleteQuestion = async (id) => {
    try {
      await deleteDoc(doc(db, "quizzes", id));
      setquizzes(prev => prev.filter(q => q.id !== id));
      toast.success("Savol o'chirildi");
    } catch (error) {
      toast.error("O'chirishda xatolik: " + error.message);
    }
  }

  const updateQuestion = async (id, updatedData) => {
    try {
      await updateDoc(doc(db, "quizzes", id), updatedData);
      setquizzes(prev => prev.map(q => q.id === id ? { ...q, ...updatedData } : q));
      toast.success("Savol yangilandi");
      return true;
    } catch (error) {
      console.error("Error updating question:", error);
      toast.error("Yangilashda xatolik: " + error.message);
      return false;
    }
  }

  const getAllUsers = useCallback(async () => {
    const querySnapshot = await getDocs(collection(db, "users"));
    return querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
  }, []);

  const updateUserData = async (userId, data) => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, data);
  }

  const deleteUserDocument = async (id) => {
    try {
      await deleteDoc(doc(db, "users", id));
      toast.success("Foydalanuvchi o'chirildi");
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("O'chirishda xatolik: " + error.message);
      return false;
    }
  }

  const adminAddUser = async (userData) => {
    try {
        await addDoc(collection(db, "users"), userData);
        toast.success("Foydalanuvchi qo'shildi");
        return true;
    } catch (error) {
        console.error("Error adding user:", error);
        toast.error("Qo'shishda xatolik: " + error.message);
        return false;
    }
  }

  const getUserHistory = useCallback(async () => {
    if (!user) return [];
    try {
        const q = query(collection(db, "users", user.uid, "history"), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
    } catch (error) {
        console.error("Error fetching history:", error);
        return [];
    }
  }, [user]);

  const deleteHistoryItem = async (id) => {
    if (!user) return;
    try {
        await deleteDoc(doc(db, "users", user.uid, "history", id));
        toast.success("Tarix o'chirildi");
        return true;
    } catch (error) {
        console.error("Error deleting history:", error);
        toast.error("O'chirishda xatolik");
        return false;
    }
  }

  const getLeaderboard = async () => {
    try {
        const q = query(collection(db, "users"), orderBy("totalScore", "desc"), limit(10));
        const querySnapshot = await getDocs(q);
        
        // Agar totalScore bo'yicha hech kim chiqmasa (eski userlar), oddiygina userlarni olib kelib o'zimiz saralaymiz
        if (querySnapshot.empty) {
            const allUsersQ = query(collection(db, "users"), limit(20));
            const allUsersSnap = await getDocs(allUsersQ);
            const allUsers = allUsersSnap.docs.map(doc => ({id: doc.id, ...doc.data()}));
            // Ball bo'yicha kamayish tartibida saralash (ball yo'q bo'lsa 0 deb olinadi)
            return allUsers.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0)).slice(0, 10);
        }

        return querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        return [];
    }
  }

  const getBookmarks = useCallback(async () => {
    if (!user) return;
    try {
        const bookmarksCollection = collection(db, "users", user.uid, "bookmarks");
        const snapshot = await getDocs(bookmarksCollection);
        const userBookmarks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBookmarks(userBookmarks);
    } catch (error) {
        console.error("Error fetching bookmarks:", error);
    }
  }, [user]);

  const toggleBookmark = async (question) => {
    if (!user || !question?.id) return;

    const isBookmarked = bookmarks.some(b => b.id === question.id);
    const bookmarkRef = doc(db, "users", user.uid, "bookmarks", question.id);

    if (isBookmarked) {
        // Remove
        try {
            await deleteDoc(bookmarkRef);
            setBookmarks(prev => prev.filter(b => b.id !== question.id));
            toast.info("Belgi olib tashlandi");
        } catch (error) {
            console.error("Error removing bookmark:", error);
            toast.error("Belgini olib tashlashda xatolik");
        }
    } else {
        // Add
        try {
            const { ...questionData } = question;
            await setDoc(bookmarkRef, questionData);
            setBookmarks(prev => [...prev, question]);
            toast.success("Savol belgilandi");
        } catch (error) {
            console.error("Error adding bookmark:", error);
            toast.error("Belgilashda xatolik");
        }
    }
  };

  const saveQuizResult = useCallback(async () => {
      if (!user) return;
      try {
          // Tarixga yozish
          await addDoc(collection(db, "users", user.uid, "history"), {
              topic: selectedTopic,
              score: marks,
              totalQuestions: quizzes.length,
              date: new Date().toISOString()
          });

          // Umumiy ballni yangilash (Leaderboard uchun)
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
              const currentScore = userSnap.data().totalScore || 0;
              await updateDoc(userRef, {
                  totalScore: currentScore + marks
              });
          }
      } catch (error) {
          console.error("Error saving result:", error);
          if (error.code === 'permission-denied') {
              toast.error("Natijani saqlash uchun ruxsat yo'q. (Firestore Rules)");
          } else {
              toast.error("Natijani saqlashda xatolik!");
          }
      }
  }, [user, selectedTopic, marks, quizzes.length]);

  const importQuestions = async (questionsData) => {
    if (!selectedTopic) {
        toast.warn("Iltimos, avval yo'nalishni tanlang!");
        return false;
    }

    let count = 0;
    try {
        const promises = questionsData.map(async (q) => {
            // Basic validation
            if (!q.question || !Array.isArray(q.options) || !q.answer) return;

            const newQ = {
                question: q.question,
                options: q.options,
                answer: q.answer,
                topic: selectedTopic,
                createdAt: new Date().toISOString()
            };
            await addDoc(collection(db, "quizzes"), newQ);
            count++;
        });

        await Promise.all(promises);
        
        if (count > 0) {
            toast.success(`${count} ta savol muvaffaqiyatli import qilindi!`);
            fetchQuestionsByTopic(selectedTopic);
            setTopicCounts(prev => ({
                ...prev,
                [selectedTopic]: (prev[selectedTopic] || 0) + count
            }));
        } else {
            toast.warn("Faylda yaroqli savollar topilmadi.");
        }
        return true;
    } catch (error) {
        console.error("Import error:", error);
        toast.error("Import xatoligi: " + error.message);
        return false;
    }
  }

  const uploadUserImage = async (file) => {
    if (!file || !auth.currentUser) return null;
    try {
        // Rasm hajmini kichraytirish (Compression)
        const compressedFile = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 600; // Optimal kenglik
                    const scaleSize = MAX_WIDTH / img.width;
                    const width = (scaleSize < 1) ? MAX_WIDTH : img.width;
                    const height = (scaleSize < 1) ? img.height * scaleSize : img.height;

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob((blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error("Canvas error"));
                    }, 'image/jpeg', 0.7); // 70% sifat
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });

        const fileRef = ref(storage, `profile_images/${auth.currentUser.uid}/${Date.now()}_compressed.jpg`);
        await uploadBytes(fileRef, compressedFile);
        const photoURL = await getDownloadURL(fileRef);
        return photoURL;
    } catch (error) {
        console.error("Error uploading image:", error);
        throw error;
    }
  }

  const loginWithGoogle = () => {
    return signInWithPopup(auth, googleProvider);
  }

  const loginWithGithub = () => {
    return signInWithPopup(auth, githubProvider);
  }

  const updateUser = (profileData) => {
    return updateProfile(auth.currentUser, profileData);
  }

  const markChatAsRead = async (chatId) => {
    if (!user || !chatId) return;
    const chatRef = doc(db, 'chats', chatId);
    try {
        // updateDoc faqat kerakli maydonni yangilaydi (kamroq trafik)
        await updateDoc(chatRef, {
            [`lastRead.${user.uid}`]: serverTimestamp()
        });
    } catch (error) {
        console.error("Error marking chat as read:", error);
    }
  }

  // Chat Functions (wrapped in useCallback)
  const sendMessage = async (receiverId, text) => {
    if (!user || !text.trim()) return;
    // Chat ID har doim ikki ID ning alfabet tartibida qo'shilishidan hosil bo'ladi (unique bo'lishi uchun)
    const chatId = [user.uid, receiverId].sort().join('_');
    const chatRef = doc(db, 'chats', chatId);
    const messagesRef = collection(chatRef, 'messages');

    await addDoc(messagesRef, {
        text,
        senderId: user.uid,
        createdAt: serverTimestamp()
    });

    // Chat metadata yangilash (ro'yxatda ko'rinishi uchun)
    await setDoc(chatRef, {
        participants: [user.uid, receiverId],
        lastMessage: text,
        updatedAt: serverTimestamp(),
        lastSenderId: user.uid
    }, { merge: true });
  }

  const sendFileMessage = async (receiverId, file) => {
    if (!user || !file) return false;
    const chatId = [user.uid, receiverId].sort().join('_');
    
    try {
        // 1. Faylni Storage ga yuklash
        const storageRef = ref(storage, `chat_files/${chatId}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const fileURL = await getDownloadURL(storageRef);
        const fileType = file.type;

        // 2. Xabarni Firestore ga yozish
        const chatRef = doc(db, 'chats', chatId);
        const messagesRef = collection(chatRef, 'messages');

        await addDoc(messagesRef, {
            senderId: user.uid,
            createdAt: serverTimestamp(),
            fileURL: fileURL,
            fileType: fileType,
            text: '' // Fayl bo'lganda matn bo'sh bo'lishi mumkin
        });

        // 3. Chatni yangilash
        await setDoc(chatRef, {
            participants: [user.uid, receiverId],
            lastMessage: fileType.startsWith('image/') ? '📷 Rasm' : '📎 Fayl',
            updatedAt: serverTimestamp(),
            lastSenderId: user.uid
        }, { merge: true });
        
        toast.success("Fayl yuborildi");
        return true;
    } catch (error) {
        console.error("Error sending file:", error);
        toast.error("Fayl yuborishda xatolik");
        return false;
    }
  }

  const updateMessage = async (receiverId, messageId, newText) => {
    if (!user || !newText.trim()) return false;
    const chatId = [user.uid, receiverId].sort().join('_');
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
    
    try {
        await updateDoc(messageRef, {
            text: newText,
            updatedAt: serverTimestamp()
        });
        toast.success("Xabar tahrirlandi");
        return true;
    } catch (error) {
        console.error("Error updating message:", error);
        toast.error("Xabarni tahrirlashda xatolik");
        return false;
    }
  }

  const deleteMessage = async (receiverId, messageId) => {
    if (!user) return false;
    const chatId = [user.uid, receiverId].sort().join('_');
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);

    try {
        await deleteDoc(messageRef);
        toast.success("Xabar o'chirildi");
        return true;
    } catch (error) {
        console.error("Error deleting message:", error);
        toast.error("Xabarni o'chirishda xatolik");
        return false;
    }
  }

  const getMessages = useCallback(async (receiverId) => {
    if (!user) return [];
    const chatId = [user.uid, receiverId].sort().join('_');
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }, [user]);

  const getConversations = useCallback(async () => {
    if (!user) return [];
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid), orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }, [user]);

  // Load JSON Data
  // Bu funksiyani useEffect dan tashqariga chiqaramiz, shunda uni qayta chaqirish mumkin bo'ladi
  const fetchQuestionsByTopic = useCallback(async (topic) => {
    if (!topic) return;
    
    try {
      const quizzesCollection = collection(db, "quizzes");
      const q = query(quizzesCollection, where("topic", "==", topic));
      
      // Parallel Fetching: DB va JSON ni bir vaqtda yuklaymiz (Tezlik uchun)
      const [querySnapshot, jsonResponse] = await Promise.all([
        getDocs(q),
        fileMap[topic] ? fetch(fileMap[topic]).catch(e => null) : Promise.resolve(null)
      ]);
      
      // 1. Bazadagi ma'lumotlarni qayta ishlash
      const dbData = querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
      
      // 2. JSON ma'lumotlarni qayta ishlash
      let jsonData = [];
      if (jsonResponse && jsonResponse.ok) {
         try {
             jsonData = await jsonResponse.json();
             jsonData = jsonData.map(item => ({ ...item, topic }));
         } catch (e) { console.warn(`JSON parsing error for ${topic}`, e); }
      }

      // 3. Birlashtirish va Dublikatlarni tozalash (Merge & Deduplicate)
      // Bazadagi savollarni solishtirish uchun tayyorlab olamiz (kichik harflarda, bo'sh joylarsiz)
      const dbQuestionSet = new Set(dbData.map(item => item.question?.trim().toLowerCase()));
      
      const mergedData = [...dbData];
      const newQuestions = [];

      jsonData.forEach(jsonItem => {
        const normalizedQ = jsonItem.question?.trim().toLowerCase();
        // Agar savol bazada bo'lmasa, uni ro'yxatga qo'shamiz
        if (normalizedQ && !dbQuestionSet.has(normalizedQ)) {
          const displayItem = { ...jsonItem, id: jsonItem.id ? `json_${jsonItem.id}` : `json_${Date.now()}_${Math.random()}` };
          mergedData.push(displayItem);
          newQuestions.push(jsonItem);
        }
      });

      setquizzes(mergedData);

      if (mergedData.length === 0) {
         toast.info(`"${topic}" bo'yicha hozircha savollar yo'q. Admin panel orqali qo'shishingiz mumkin.`);
      } else if (newQuestions.length > 0) {
         // Background Sync: Yangi savollarni orqa fonda bazaga yuklash
         // Promise.all yordamida tezroq yuklaymiz
         const uploadPromises = newQuestions.map(question => {
             const { id, ...questionData } = question; 
             return addDoc(quizzesCollection, { ...questionData, topic });
         });
         
         Promise.all(uploadPromises).catch(e => console.error("Background sync error:", e));
      }

    } catch (error) {
      console.error("Error fetching quizzes:", error);
      toast.error("Xatolik: " + error.message);
    }
  }, []);

  useEffect(() => {
    if (user && selectedTopic) {
      setquizzes([]); // Yangi mavzu tanlanganda eski savollarni tozalash
      setQuestion({}); // Eski savolni tozalash
      fetchQuestionsByTopic(selectedTopic);
    }
  }, [user, selectedTopic, fetchQuestionsByTopic]);

  // Load Topics from Firestore
  useEffect(() => {
    const topicsCollection = collection(db, "topics");
    const initializeTopics = async () => {
      try {
        const snapshot = await getDocs(topicsCollection);
        if (snapshot.empty) {
          toast.info("Yo'nalishlar ro'yxati yaratilmoqda...");
          for (const topicName of initialTopics) {
            await addDoc(topicsCollection, { name: topicName });
          }
          setTopics(initialTopics.sort());
        } else {
          const dbTopics = snapshot.docs.map(doc => doc.data().name).filter(name => name);
          // Firebase va Local (initialTopics) ni birlashtiramiz
          const mergedTopics = [...new Set([...initialTopics, ...dbTopics])].sort();
          setTopics(mergedTopics);
        }
      } catch (error) {
        console.error("Error fetching topics:", error);
        toast.error("Yo'nalishlarni yuklashda xatolik!");
        setTopics(initialTopics.sort()); // Xatolik bo'lsa ham local ro'yxatni chiqaramiz
      }
    };
    initializeTopics();
  }, []);

  // Fetch bookmarks on user login
  useEffect(() => {
    if (user) {
        getBookmarks();
    } else {
        setBookmarks([]); // Clear on logout
    }
  }, [user, getBookmarks]);

  // Calculate Topic Counts
  useEffect(() => {
    const calculateCounts = async () => {
      const counts = {};
      
      const promises = topics.map(async (topic) => {
        const q = query(collection(db, "quizzes"), where("topic", "==", topic));
        
        let count = 0;
        try {
            // 1. Serverdan faqat sonini olish (Arzonroq: 1 ta o'qish)
            const snapshot = await getCountFromServer(q);
            count = snapshot.data().count;
        } catch (e) {
            console.error("Error fetching count for", topic, e);
        }

        // 2. Agar baza bo'sh bo'lsa, JSON fayldan tekshirish (Bepul)
        if (count === 0 && fileMap[topic]) {
            try {
                const res = await fetch(fileMap[topic]);
                if (res.ok) {
                    const data = await res.json();
                    count = data.length;
                }
            } catch (e) { /* ignore */ }
        }
        counts[topic] = count;
      });

      await Promise.all(promises);
      setTopicCounts(counts);
    };
    calculateCounts();
  }, [topics]); // Mavzular ro'yxati o'zgarganda qayta hisoblash

  // Shuffle Helper Function
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Set a Single Question with Shuffled Options
  useEffect(() => {
    if (quizzes.length > questionIndex) {
      const currentQuiz = quizzes[questionIndex];
      // Variantlarni aralashtiramiz, lekin to'g'ri javob matni o'zgarmaydi
      if (currentQuiz?.options) {
        setQuestion({ ...currentQuiz, options: shuffleArray(currentQuiz.options) });
      } else {
        setQuestion(currentQuiz);
      }
    }
  }, [quizzes, questionIndex])

  // Next Quesion
  const nextQuestion = useCallback(() => {
    setCorrectAnswer('');
    setSelectedAnswer('');
    const wrongBtn = document.querySelector('button.bg-danger');
    wrongBtn?.classList.remove('bg-danger');
    const rightBtn = document.querySelector('button.bg-success');
    rightBtn?.classList.remove('bg-success');
    setQuestionIndex(questionIndex + 1);
    setTimer(15);
  }, [questionIndex]);

  // Show Result
  const showTheResult = useCallback(() => {
    setShowResult(true);
    setShowStart(false);
    setShowQuiz(false);
    if (user) saveQuizResult();
  }, [user, saveQuizResult]);

  // Timer Logic
  useEffect(() => {
    let interval;
    if (showQuiz && !selectedAnswer) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev === 0) {
            // Agar oxirgi savol bo'lmasa keyingisiga o'tish, aks holda natijani ko'rsatish
            if (questionIndex + 1 < quizzes.length) {
              nextQuestion();
            } else {
              showTheResult();
            }
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showQuiz, selectedAnswer, questionIndex, quizzes.length, nextQuestion, showTheResult]);

  // Start Quiz
  const startQuiz = () => {
    setShowStart(false);
    setShowQuiz(true);
    setTimer(15);
    setShowProfile(false);
    setShowAdmin(false);
    setShowLeaderboard(false);
  }

  // Check Answer
  const checkAnswer = (event, selected) => {
    if (!selectedAnswer) {
      setCorrectAnswer(question.answer);
      setSelectedAnswer(selected);

      if (selected === question.answer) {
        event.target.classList.add('bg-success');
        setMarks(marks + 5);
      } else {
        event.target.classList.add('bg-danger');
      }
    }
  }

  // Start Over
  const startOver = () => {
    setShowStart(false);
    setShowResult(false);
    setShowQuiz(true);
    setCorrectAnswer('');
    setSelectedAnswer('');
    setQuestionIndex(0);
    setMarks(0);
    const wrongBtn = document.querySelector('button.bg-danger');
    wrongBtn?.classList.remove('bg-danger');
    const rightBtn = document.querySelector('button.bg-success');
    rightBtn?.classList.remove('bg-success');
    setTimer(15);
    setShowProfile(false);
    setShowAdmin(false);
    setShowLeaderboard(false);
    // setSelectedTopic(''); // Olib tashlandi: Qayta boshlashda mavzu saqlanib qolishi kerak
  }

  // Return To Home (Bosh sahifaga qaytish)
  const returnToHome = () => {
    setShowStart(true);
    setShowResult(false);
    setShowQuiz(false);
    setCorrectAnswer('');
    setSelectedAnswer('');
    setQuestionIndex(0);
    setMarks(0);
    const wrongBtn = document.querySelector('button.bg-danger');
    wrongBtn?.classList.remove('bg-danger');
    const rightBtn = document.querySelector('button.bg-success');
    rightBtn?.classList.remove('bg-success');
    setTimer(15);
    setShowProfile(false);
    setShowAdmin(false);
    setShowLeaderboard(false);
    setSelectedTopic(''); // Topicni reset qilish
    setquizzes([]); // Savollarni tozalash
    setQuestion({}); // Hozirgi savolni tozalash
  }
    return (
        <DataContext.Provider value={{
            startQuiz,showStart,showQuiz,question,quizzes,checkAnswer,correctAnswer,
            selectedAnswer,questionIndex,nextQuestion,showTheResult,showResult,marks,
            startOver, returnToHome, timer, 
            user, login, register, logout, resetPassword, updateUserPassword, loginWithGoogle, loginWithGithub, 
            updateUser, verifyEmail, deleteAccount, authLoading, isAdmin, 
            authView, setAuthView, theme, toggleTheme,
            showProfile, setShowProfile, showAdmin, setShowAdmin, showLeaderboard, setShowLeaderboard,
            addQuestion, deleteQuestion, updateQuestion, getAllUsers, updateUserData, deleteUserDocument, adminAddUser, getUserHistory, deleteHistoryItem, getLeaderboard, uploadUserImage, addTopic, deleteTopic,
            bookmarks, toggleBookmark, getBookmarks, importQuestions,
            topics, selectedTopic, setSelectedTopic, topicCounts, 
            sendMessage, getMessages, getConversations, markChatAsRead, updateMessage, deleteMessage, sendFileMessage,
            isSoundOn, toggleSound
        }} >
            {children}
        </DataContext.Provider>
    );
}

export default DataContext;
