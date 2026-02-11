import React, { useState } from 'react';

const Footer = () => {
    const [feedback, setFeedback] = useState('');

    const handleSend = (e) => {
        e.preventDefault();
        // Haqiqiy email dasturini ochish
        const subject = "QuizApp Feedback";
        window.location.href = `mailto:ebek3094@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(feedback)}`;
    };

    return (
        <footer className="text-white py-4 mt-5">
            <div className="container">
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <h5>Platforma haqida</h5>
                        <p className="small text-muted">
                            Bu platforma React.js bilimlarini mustahkamlash uchun yaratilgan. 
                            Turli xil qiyinlik darajasidagi savollar orqali o'z darajangizni aniqlang.
                        </p>
                        <p className="mt-3">&copy; {new Date().getFullYear()} Yaqubov Eldor. Barcha huquqlar himoyalangan.</p>
                    </div>
                    <div className="col-md-6">
                        <h5>Biz bilan aloqa / Feedback</h5>
                        <form onSubmit={handleSend} className="d-flex gap-2">
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Fikr yoki taklifingizni yozing..." 
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                required
                            />
                            <button type="submit" className="btn btn-custom px-4">Yuborish</button>
                        </form>
                        <small className="text-muted mt-2 d-block">Email: ebek3094@gmail.com</small>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;