import React, { useContext, useState } from 'react';
import DataContext from '../context/dataContext';

const ForgotPassword = () => {
    const { resetPassword, setAuthView } = useContext(DataContext);
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await resetPassword(email);
            setMessage("Parolni tiklash havolasi emailingizga yuborildi.");
            setError('');
        } catch (err) {
            setError("Xatolik: " + err.message);
            setMessage('');
        }
    };

    return (
        <div className="container">
            <div className="row justify-content-center align-items-center py-5">
                <div className="col-md-5">
                    <div className="glass-container p-5">
                        <h2 className="text-center mb-4 fw-bold">Parolni tiklash</h2>
                        {message && <div className="alert alert-success">{message}</div>}
                        {error && <div className="alert alert-danger">{error}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <input type="email" className="form-control py-2" placeholder="Email kiriting" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <button type="submit" className="btn btn-custom w-100 mb-3">Yuborish</button>
                        </form>
                        <div className="text-center mt-4">
                            <button className="btn btn-outline-light btn-sm rounded-pill px-4" onClick={() => setAuthView('login')}>⬅️ Kirish sahifasiga qaytish</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;