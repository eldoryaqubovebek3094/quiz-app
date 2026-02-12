import React, { useContext, useState } from 'react';
import DataContext from '../context/dataContext';
import { toast } from 'react-toastify';

const Login = () => {
    const { login, loginWithGoogle, loginWithGithub, setAuthView } = useContext(DataContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await login(email, password);
            if (!userCredential.user.emailVerified) {
                toast.warning("Iltimos, avval emailingizni tasdiqlang! Pochtangizni tekshiring.");
                // Agar tasdiqlanmagan bo'lsa, tizimga kiritmaslik uchun:
                // await logout(); 
                // return;
            } else {
                toast.success("Xush kelibsiz!");
            }
        } catch (err) {
            toast.error("Login xatosi: " + err.message);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await loginWithGoogle();
            toast.success("Google orqali muvaffaqiyatli kirildi!");
        } catch (err) {
            toast.error("Google xatosi: " + err.message);
        }
    }

    const handleGithubLogin = async () => {
        try {
            await loginWithGithub();
            toast.success("GitHub orqali muvaffaqiyatli kirildi!");
        } catch (err) {
            toast.error("GitHub xatosi: " + err.message);
        }
    }

    return (
        <div className="container">
            <div className="row justify-content-center align-items-center py-5">
                <div className="col-md-6 col-lg-5">
                    <div className="glass-container p-4 p-md-5">
                        <h2 className="text-center mb-4 fw-bold">Kirish</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <input type="email" className="form-control py-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <div className="mb-3">
                                <input type="password" className="form-control py-2" placeholder="Parol" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            </div>
                            <button type="submit" className="btn btn-custom w-100 mb-3">Kirish</button>
                        </form>
                        
                        <div className="d-flex gap-2 mb-3">
                            <button onClick={handleGoogleLogin} className="btn btn-light w-50 fw-bold border">Google</button>
                            <button onClick={handleGithubLogin} className="btn btn-dark w-50 fw-bold border">GitHub</button>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mt-4">
                            <button className="btn btn-outline-info btn-sm rounded-pill px-3 fw-bold" onClick={() => setAuthView('register')}>Ro'yxatdan o'tish</button>
                            <button className="btn btn-outline-light btn-sm rounded-pill px-3" onClick={() => setAuthView('forgot')}>Parolni unutdingizmi?</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;