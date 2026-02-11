import React, { useContext, useState, useEffect } from 'react';
import DataContext from '../context/dataContext';
import { toast } from 'react-toastify';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const AdminDashboard = () => {
    const { quizzes, addQuestion, deleteQuestion, updateQuestion, addTopic, deleteTopic, getAllUsers, updateUserData, deleteUserDocument, adminAddUser, topics, selectedTopic, setSelectedTopic, importQuestions, topicCounts } = useContext(DataContext);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [users, setUsers] = useState([]);
    
    // Savol qo'shish state-lari
    const [newQ, setNewQ] = useState({ question: '', options: ['', '', '', ''], answer: '' });
    const [editingId, setEditingId] = useState(null);
    // Yo'nalish qo'shish state
    const [newTopicName, setNewTopicName] = useState('');
    // Search and Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [importFile, setImportFile] = useState(null);
    
    // User CRUD states
    const [userForm, setUserForm] = useState({ firstName: '', lastName: '', email: '', profession: '', role: 'user', totalScore: 0 });
    const [isUserEditing, setIsUserEditing] = useState(null);
    const [showUserForm, setShowUserForm] = useState(false);

    // Foydalanuvchilarni yuklash
    useEffect(() => {
        getAllUsers().then(data => setUsers(data));
    }, []);

    const handleAddQuestion = async (e) => {
        e.preventDefault();
        if (!newQ.answer || !newQ.options.includes(newQ.answer)) {
            toast.error("To'g'ri javob variantlar orasida bo'lishi kerak!");
            return;
        }

        let success;
        if (editingId) {
            success = await updateQuestion(editingId, newQ);
        } else {
            success = await addQuestion(newQ);
        }

        if (success) {
            setNewQ({ question: '', options: ['', '', '', ''], answer: '' });
            setEditingId(null);
            if(editingId) toast.success("Savol yangilandi!");
            else toast.success("Savol qo'shildi!");
        }
    };

    const handleOptionChange = (index, value) => {
        const updatedOptions = [...newQ.options];
        // Agar o'zgartirilayotgan variant avval to'g'ri javob deb belgilangan bo'lsa, uni ham yangilaymiz
        const isCorrect = newQ.answer === updatedOptions[index];
        
        updatedOptions[index] = value;
        
        setNewQ(prev => ({ 
            ...prev, 
            options: updatedOptions,
            answer: isCorrect ? value : prev.answer 
        }));
    };

    const startEdit = (quiz) => {
        setNewQ({ question: quiz.question, options: [...quiz.options], answer: quiz.answer });
        setEditingId(quiz.id);
        setActiveTab('questions');
    };

    const handleDeleteQuestion = async (id) => {
        if(window.confirm("Haqiqatan ham bu savolni o'chirmoqchimisiz?")) {
            await deleteQuestion(id);
        }
    }

    const handleAddTopic = async (e) => {
        e.preventDefault();
        const success = await addTopic(newTopicName);
        if (success) {
            setNewTopicName('');
        }
    }

    const isNew = (createdAt) => {
        if (!createdAt) return false;
        const created = new Date(createdAt);
        const now = new Date();
        return (now - created) < 24 * 60 * 60 * 1000; // 24 soat ichida qo'shilgan bo'lsa
    };

    const filteredUsers = users.filter(u => {
        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
        const email = (u.email || '').toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        const matchesSearch = fullName.includes(searchLower) || email.includes(searchLower);
        const matchesRole = filterRole === 'all' || u.role === filterRole;
        
        return matchesSearch && matchesRole;
    });

    const handleExportExcel = () => {
        const headers = ["Ism", "Familiya", "Email", "Kasbi", "Daraja", "Jins", "Rol", "Jami Ball"];
        
        const csvData = filteredUsers.map(u => [
            `"${u.firstName || ''}"`,
            `"${u.lastName || ''}"`,
            `"${u.email || ''}"`,
            `"${u.profession || ''}"`,
            `"${u.level || ''}"`,
            `"${u.gender || ''}"`,
            `"${u.role || ''}"`,
            `"${u.totalScore || 0}"`
        ]);

        const csvContent = "\uFEFF" + [headers.join(","), ...csvData.map(e => e.join(","))].join("\n");
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "users_results.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportJSON = () => {
        if (!importFile) {
            toast.error("Fayl tanlanmagan!");
            return;
        }
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const json = JSON.parse(e.target.result);
                if (!Array.isArray(json)) {
                    toast.error("JSON fayl savollar ro'yxati (array) bo'lishi kerak!");
                    return;
                }
                const success = await importQuestions(json);
                if (success) {
                    setImportFile(null);
                    document.getElementById('jsonFileInput').value = "";
                }
            } catch (err) {
                toast.error("JSON faylni o'qishda xatolik! Format to'g'riligini tekshiring.");
            }
        };
        reader.readAsText(importFile);
    };

    // Chart Data Preparation
    const professionData = {
        labels: [],
        datasets: [{
            label: 'Foydalanuvchilar soni',
            data: [],
            backgroundColor: [
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)',
            ],
            borderColor: [ '#1a1a1a' ],
            borderWidth: 2,
        }]
    };

    if (users.length > 0) {
        const professionCounts = users.reduce((acc, user) => {
            const prof = user.profession || 'Noma\'lum';
            acc[prof] = (acc[prof] || 0) + 1;
            return acc;
        }, {});

        professionData.labels = Object.keys(professionCounts);
        professionData.datasets[0].data = Object.values(professionCounts);
    }

    // User CRUD Functions
    const handleUserSubmit = async (e) => {
        e.preventDefault();
        let success = false;
        if (isUserEditing) {
            try {
                await updateUserData(isUserEditing, userForm);
                toast.success("Foydalanuvchi yangilandi");
                success = true;
            } catch (error) {
                toast.error("Xatolik: " + error.message);
            }
        } else {
            success = await adminAddUser(userForm);
        }

        if (success) {
            setShowUserForm(false);
            setIsUserEditing(null);
            setUserForm({ firstName: '', lastName: '', email: '', profession: '', role: 'user', totalScore: 0 });
            getAllUsers().then(data => setUsers(data));
        }
    };

    const startEditUser = (user) => {
        setUserForm(user);
        setIsUserEditing(user.id);
        setShowUserForm(true);
    };

    const handleDeleteUserBtn = async (id) => {
        if(window.confirm("Haqiqatan ham bu foydalanuvchini o'chirmoqchimisiz?")) {
            const success = await deleteUserDocument(id);
            if(success) setUsers(users.filter(u => u.id !== id));
        }
    };

    return (
        <div className="container">
            <div className="glass-container p-5">
                <h1 className="text-center mb-5 fw-bold text-warning">Admin Dashboard</h1>
                
                {/* Tabs */}
                <ul className="nav nav-pills mb-4 justify-content-center flex-column flex-sm-row gap-2 gap-sm-0">
                    <li className="nav-item">
                        <button className={`nav-link ${activeTab === 'dashboard' ? 'active bg-warning text-dark' : 'text-white'}`} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link ${activeTab === 'questions' ? 'active bg-warning text-dark' : 'text-white'}`} onClick={() => {setActiveTab('questions'); setEditingId(null); setNewQ({ question: '', options: ['', '', '', ''], answer: '' });}}>Savollar</button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link ${activeTab === 'users' ? 'active bg-warning text-dark' : 'text-white'}`} onClick={() => setActiveTab('users')}>Foydalanuvchilar</button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link ${activeTab === 'topics' ? 'active bg-warning text-dark' : 'text-white'}`} onClick={() => setActiveTab('topics')}>Yo'nalishlar</button>
                    </li>
                </ul>

                {/* Dashboard Content */}
                {activeTab === 'dashboard' && (
                    <>
                        <div className="row g-4">
                            <div className="col-md-4">
                                <div className="card bg-dark text-white border-secondary h-100 p-3 text-center">
                                    <h5 className="card-title">Jami Foydalanuvchilar</h5>
                                    <p className="display-4 fw-bold text-info">{users.length}</p>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="card bg-dark text-white border-secondary h-100 p-3 text-center">
                                    <h5 className="card-title">Jami Yo'nalishlar</h5>
                                    <p className="display-4 fw-bold text-warning">{topics.length}</p>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="card bg-dark text-white border-secondary h-100 p-3 text-center">
                                    <h5 className="card-title">Jami Savollar (Bazada)</h5>
                                    <p className="display-4 fw-bold text-success">{Object.values(topicCounts).reduce((a, b) => a + b, 0)}</p>
                                </div>
                            </div>
                        </div>
                        <hr className="my-5" />
                        <div className="row g-4">
                            <div className="col-md-12">
                                <div className="card bg-dark text-white border-secondary h-100 p-3">
                                    <h4 className="card-title mb-3 text-center">Foydalanuvchilar kasbi bo'yicha</h4>
                                    <div style={{ position: 'relative', height: '300px' }}>
                                        {users.length > 0 ? <Doughnut data={professionData} options={{ maintainAspectRatio: false, plugins: { legend: { labels: { color: 'white' } } } }} /> : <p className="text-center text-muted">Ma'lumot yo'q</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Add Question Content */}
                {activeTab === 'questions' && (
                    <div>
                        <div className="mb-4">
                            <label className="form-label text-warning">Yo'nalishni tanlang:</label>
                            <select className="form-control bg-dark text-white" value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)}>
                                <option value="">Tanlang...</option>
                                {topics.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        {selectedTopic && (
                        <>
                        <div className="card bg-dark border-secondary mb-4">
                            <div className="card-body">
                                <h5 className="card-title text-info mb-3">Savollarni import qilish (JSON)</h5>
                                <div className="input-group">
                                    <input 
                                        type="file" 
                                        className="form-control bg-dark text-white border-secondary" 
                                        id="jsonFileInput" 
                                        accept=".json"
                                        onChange={(e) => setImportFile(e.target.files[0])}
                                    />
                                    <button className="btn btn-primary" type="button" onClick={handleImportJSON}>Import</button>
                                </div>
                                <small className="text-muted">Format: <code>[{`{ "question": "...", "options": ["..."], "answer": "..." }`}, ...]</code></small>
                            </div>
                        </div>

                        <h3 className="mb-4">{editingId ? "Savolni tahrirlash" : "Yangi savol qo'shish"} ({selectedTopic})</h3>
                        <form onSubmit={handleAddQuestion}>
                            <div className="mb-3">
                                <label className="form-label">Savol matni</label>
                                <textarea className="form-control" rows="3" value={newQ.question} onChange={(e) => setNewQ({...newQ, question: e.target.value})} required></textarea>
                            </div>
                            <div className="row">
                                {[0, 1, 2, 3].map((i) => (
                                    <div className="col-md-6 mb-3" key={i}>
                                        <label className="form-label">Variant {i + 1}</label>
                                        <div className="input-group">
                                            <div className="input-group-text" style={{ background: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)' }}>
                                                <input 
                                                    className="form-check-input mt-0" 
                                                    type="radio" 
                                                    name="correctAnswer" 
                                                    checked={newQ.answer === newQ.options[i] && newQ.options[i] !== ''}
                                                    onChange={() => setNewQ({...newQ, answer: newQ.options[i]})}
                                                    disabled={!newQ.options[i]}
                                                    required
                                                    title="To'g'ri javob sifatida belgilash"
                                                />
                                            </div>
                                            <input type="text" className="form-control" value={newQ.options[i]} onChange={(e) => handleOptionChange(i, e.target.value)} required placeholder={`Javob varianti ${i+1}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="d-flex gap-2">
                                <button type="submit" className="btn btn-success flex-grow-1 mt-3">{editingId ? "Saqlash" : "Qo'shish"}</button>
                                {editingId && <button type="button" className="btn btn-secondary mt-3" onClick={() => {setEditingId(null); setNewQ({ question: '', options: ['', '', '', ''], answer: '' });}}>Bekor qilish</button>}
                            </div>
                        </form>

                        <hr className="my-5" />
                        
                        <h4 className="mb-3">Mavjud savollar ({quizzes.length})</h4>
                        <div className="list-group">
                            {quizzes.map((q, idx) => (
                                <div key={q.id} className="list-group-item bg-transparent text-white border-secondary d-flex justify-content-between align-items-center">
                                    <div>
                                        <span className="fw-bold text-info me-2">{idx + 1}.</span>
                                        {q.question}
                                        {isNew(q.createdAt) && <span className="badge bg-success ms-2 rounded-pill" style={{fontSize: '0.7em'}}>New</span>}
                                    </div>
                                    <div className="d-flex gap-2">
                                        <button className="btn btn-sm btn-primary" onClick={() => startEdit(q)}>✏️</button>
                                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteQuestion(q.id)}>🗑️</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        </>
                        )}
                    </div>
                )}

                {/* Topics Management Content */}
                {activeTab === 'topics' && (
                    <div>
                        <h3 className="mb-4">Yangi yo'nalish qo'shish</h3>
                        <form onSubmit={handleAddTopic} className="d-flex gap-2 mb-5">
                            <input 
                                type="text" 
                                className="form-control bg-dark text-white" 
                                placeholder="Masalan: Dart" 
                                value={newTopicName}
                                onChange={(e) => setNewTopicName(e.target.value)}
                                required
                            />
                            <button type="submit" className="btn btn-success">Qo'shish</button>
                        </form>

                        <h4 className="mb-3">Mavjud yo'nalishlar ({topics.length})</h4>
                        <div className="list-group">
                            {topics.map((topic) => (
                                <div key={topic} className="list-group-item bg-transparent text-white border-secondary d-flex justify-content-between align-items-center">
                                    {topic}
                                    <button className="btn btn-sm btn-outline-danger" onClick={() => deleteTopic(topic)}>
                                        🗑️
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Users List Content */}
                {activeTab === 'users' && (
                    <div>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h3>Foydalanuvchilar ro'yxati</h3>
                            <button className="btn btn-primary" onClick={() => { setShowUserForm(!showUserForm); setIsUserEditing(null); setUserForm({ firstName: '', lastName: '', email: '', profession: '', role: 'user', totalScore: 0 }); }}>
                                {showUserForm ? "Ro'yxatga qaytish" : "Foydalanuvchi qo'shish"}
                            </button>
                        </div>
                        
                        {showUserForm ? (
                            <div className="card bg-dark border-secondary p-4 mb-4">
                                <h4 className="mb-3">{isUserEditing ? "Foydalanuvchini tahrirlash" : "Yangi foydalanuvchi"}</h4>
                                <form onSubmit={handleUserSubmit}>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Ism</label>
                                            <input type="text" className="form-control" value={userForm.firstName} onChange={(e) => setUserForm({...userForm, firstName: e.target.value})} required />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Familiya</label>
                                            <input type="text" className="form-control" value={userForm.lastName} onChange={(e) => setUserForm({...userForm, lastName: e.target.value})} required />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Email</label>
                                        <input type="email" className="form-control" value={userForm.email} onChange={(e) => setUserForm({...userForm, email: e.target.value})} required />
                                    </div>
                                    <div className="row">
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">Kasbi</label>
                                            <input type="text" className="form-control" value={userForm.profession} onChange={(e) => setUserForm({...userForm, profession: e.target.value})} />
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">Rol</label>
                                            <select className="form-select" value={userForm.role} onChange={(e) => setUserForm({...userForm, role: e.target.value})}>
                                                <option value="user">User</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">Jami Ball</label>
                                            <input type="number" className="form-control" value={userForm.totalScore} onChange={(e) => setUserForm({...userForm, totalScore: parseInt(e.target.value) || 0})} />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-success">{isUserEditing ? "Saqlash" : "Qo'shish"}</button>
                                </form>
                            </div>
                        ) : (
                        <>
                        <div className="row mb-4">
                            <div className="col-md-6 mb-2">
                                <input 
                                    type="text" 
                                    className="form-control bg-dark text-white border-secondary" 
                                    placeholder="Ism yoki Email bo'yicha qidirish..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="col-md-3 mb-2">
                                <select className="form-select bg-dark text-white border-secondary" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                                    <option value="all">Barcha rollar</option>
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="col-md-3 mb-2">
                                <button className="btn btn-success w-100" onClick={handleExportExcel}>
                                    📥 Excelga yuklash
                                </button>
                            </div>
                        </div>

                        <div className="table-responsive">
                            <table className="table table-dark table-hover">
                                <thead>
                                    <tr>
                                        <th>Ism</th>
                                        <th>Email</th>
                                        <th>Kasbi</th>
                                        <th>Rol</th>
                                        <th>Boshqaruv</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(u => (
                                        <tr key={u.id}>
                                            <td>{u.firstName} {u.lastName}</td>
                                            <td>{u.email}</td>
                                            <td>{u.profession} {u.level ? `(${u.level})` : ''}</td>
                                            <td>
                                                <span className={`badge ${u.role === 'admin' ? 'bg-danger' : 'bg-primary'}`}>{u.role}</span>
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <button className="btn btn-sm btn-primary" onClick={() => startEditUser(u)}>✏️</button>
                                                    {u.email !== 'ebek3094@gmail.com' && (
                                                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteUserBtn(u.id)}>🗑️</button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="text-center text-muted">Foydalanuvchi topilmadi</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;