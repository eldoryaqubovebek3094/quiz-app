import React, { useContext, useState } from 'react';
import DataContext from '../context/dataContext';
import { toast } from 'react-toastify';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

const Register = () => {
    const { register, updateUser, verifyEmail, logout, setAuthView, uploadUserImage } = useContext(DataContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [profession, setProfession] = useState('');
    const [level, setLevel] = useState('');
    const [gender, setGender] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [otherProfession, setOtherProfession] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            toast.error("Parollar mos kelmadi!");
            return;
        }

        const finalProfession = profession === 'Boshqa' ? otherProfession : profession;

        if (profession === 'Boshqa' && !otherProfession.trim()) {
            toast.error("Iltimos, kasbingizni kiriting!");
            return;
        }

        try {
            // 1. Ro'yxatdan o'tish
            const userCredential = await register(email, password);
            
            // 2. Rasm yuklash (agar tanlangan bo'lsa)
            let photoURL = '';
            if (avatar) {
                try {
                    photoURL = await uploadUserImage(avatar);
                } catch (e) {
                    console.error("Rasm yuklashda xatolik:", e);
                }
            }

            // 3. Profilni yangilash (Ism, Familiya va Rasm)
            await updateUser({ displayName: `${firstName} ${lastName}`, photoURL });
            
            // 4. Firestore-ga foydalanuvchi ma'lumotlarini saqlash
            await setDoc(doc(db, "users", userCredential.user.uid), {
                uid: userCredential.user.uid,
                firstName,
                lastName,
                email,
                profession: finalProfession,
                level: profession === 'Dasturchi' ? level : '',
                gender,
                role: 'user', // Default role
                totalScore: 0, // Reyting uchun boshlang'ich ball
                photoURL // Reytingda rasm chiqishi uchun
            });

            // 5. Email tasdiqlash kodi yuborish
            await verifyEmail(userCredential.user);
            
            toast.success("Muvaffaqiyatli ro'yxatdan o'tdingiz! Emailingizga tasdiqlash havolasi yuborildi.");
            
            // 6. Avtomatik kirishni oldini olish uchun chiqaramiz (tasdiqlashni majburlash uchun)
            await logout();
            setAuthView('login');

        } catch (err) {
            toast.error("Xatolik: " + err.message);
        }
    };

    return (
        <div className="container">
            <div className="row justify-content-center align-items-center py-5">
                <div className="col-md-6 col-lg-5">
                    <div className="glass-container p-4 p-md-5">
                        <h2 className="text-center mb-4 fw-bold">Ro'yxatdan o'tish</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="row">
                                <div className="col-6 mb-3">
                                    <input type="text" className="form-control py-2" placeholder="Ism" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                                </div>
                                <div className="col-6 mb-3">
                                    <input type="text" className="form-control py-2" placeholder="Familiya" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                                </div>
                            </div>

                            <div className="mb-3">
                                <input type="email" className="form-control py-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <div className="mb-3">
                                <input type="password" className="form-control py-2" placeholder="Parol" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            </div>
                            <div className="mb-3">
                                <input type="password" className="form-control py-2" placeholder="Parolni tasdiqlang" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                            </div>

                            {/* Kasb tanlash */}
                            <div className="mb-3">
                                <select className="form-control py-2" value={profession} onChange={(e) => setProfession(e.target.value)} required>
                                    <option value="">Kasbingizni tanlang</option>
                                    <option value="Dasturchi">Dasturchi</option>
                                    <option value="O'qituvchi">O'qituvchi</option>
                                    <option value="Talaba">Talaba</option>
                                    <option value="Boshqa">Boshqa</option>
                                </select>
                            </div>

                            {/* Agar Boshqa tanlansa, input chiqadi */}
                            {profession === 'Boshqa' && (
                                <div className="mb-3">
                                    <input type="text" className="form-control py-2" placeholder="Kasbingizni kiriting" value={otherProfession} onChange={(e) => setOtherProfession(e.target.value)} required />
                                </div>
                            )}

                            {/* Agar Dasturchi bo'lsa, daraja chiqadi */}
                            {profession === 'Dasturchi' && (
                                <div className="mb-3">
                                    <select className="form-control py-2" value={level} onChange={(e) => setLevel(e.target.value)} required>
                                        <option value="">Darajangiz</option>
                                        <option value="Junior">Junior</option>
                                        <option value="Middle">Middle</option>
                                        <option value="Senior">Senior</option>
                                    </select>
                                </div>
                            )}

                            {/* Jins */}
                            <div className="mb-3 d-flex gap-3 text-white">
                                <label className="d-flex align-items-center gap-2">
                                    <input type="radio" name="gender" value="Erkak" onChange={(e) => setGender(e.target.value)} required /> Erkak
                                </label>
                                <label className="d-flex align-items-center gap-2">
                                    <input type="radio" name="gender" value="Ayol" onChange={(e) => setGender(e.target.value)} required /> Ayol
                                </label>
                            </div>

                            {/* Rasm yuklash */}
                            <div className="mb-4">
                                <label className="form-label text-white small">Profil rasmi</label>
                                <input type="file" className="form-control" accept="image/*" onChange={(e) => setAvatar(e.target.files[0])} />
                            </div>
                            <button type="submit" className="btn btn-custom w-100 mb-3">Yuborish</button>
                        </form>
                        <div className="text-center mt-3">
                            <button className="btn btn-link text-decoration-none text-info" onClick={() => setAuthView('login')}>Kirish sahifasiga qaytish</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;