import React, { useContext } from 'react';
import DataContext from '../context/dataContext';
import { toast } from 'react-toastify';

const Result = () => {
    const { showResult, quizzes, marks, startOver, returnToHome, selectedTopic, user } = useContext(DataContext);
    const passingScore = (quizzes.length * 5) / 2;
    const totalMarks = quizzes.length * 5;
    const percentage = totalMarks > 0 ? (marks / totalMarks) * 100 : 0;

    // SHU YERGA O'Z ISMINGIZNI YOZING
    const signatureName = "Eldor Yaqubov"; 

    const handleShare = async () => {
        const text = `Men ${selectedTopic} bo'yicha testda ${totalMarks} balldan ${marks} ball (${Math.round(percentage)}%) to'pladim!`;
        const shareData = {
            title: 'Quizzes-dev Natijasi',
            text: text,
            url: window.location.origin
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error(err);
            }
        } else {
            navigator.clipboard.writeText(`${text} ${window.location.origin}`);
            toast.info("Natija nusxalandi!");
        }
    };

    const handleCertificate = () => {
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
        const date = new Date().toLocaleDateString();
        
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Sertifikat - ${selectedTopic}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Pinyon+Script&family=Sacramento&family=Poppins:wght@300;400;600;700&display=swap');
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
                    .date-box, .signature-box { text-align: center; position: relative; }
                    .line { width: 150px; height: 1px; background: #2c3e50; margin-bottom: 10px; }
                    .label { font-size: 14px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px; }
                    
                    /* Imzo stili */
                    .signature-text { 
                        font-family: 'Sacramento', cursive; 
                        font-size: 34px; 
                        color: #2c3e50; 
                        margin-bottom: -15px; 
                        transform: rotate(-5deg);
                    }

                    .print-btn { position: fixed; bottom: 20px; right: 20px; padding: 15px 30px; background: #27ae60; color: white; border: none; border-radius: 50px; font-size: 16px; cursor: pointer; box-shadow: 0 4px 15px rgba(39, 174, 96, 0.4); transition: transform 0.2s; }
                    .print-btn:hover { transform: translateY(-2px); }
                    @media print { 
                        body { background: none; -webkit-print-color-adjust: exact; print-color-adjust: exact; } 
                        .certificate-container { box-shadow: none; margin: 0; page-break-inside: avoid; border: 10px solid #2c3e50 !important; } 
                        .print-btn { display: none; } 
                    }
                </style>
            </head>
            <body>
                <div class="certificate-container">
                    <div class="border-inner">
                        <div class="logo">Yaqubov</div>
                        <h1>Sertifikat</h1>
                        <div class="subtitle">Muvaffaqiyatli yakunlandi</div>
                        
                        <div class="present-text">Ushbu sertifikat taqdim etiladi:</div>
                        <div class="name">${userName}</div>
                        
                        <div class="description">
                            <b>${selectedTopic}</b> bo'yicha test sinovlarini a'lo darajada topshirib,<br>
                            <b>${Math.round(percentage)}%</b> natijani qayd etgani uchun.
                        </div>

                        <div class="footer">
                            <div class="date-box">
                                <div style="margin-bottom: 15px; font-weight: 600;">${date}</div>
                                <div class="line"></div>
                                <div class="label">Sana</div>
                            </div>
                            <div class="signature-box">
                                <div class="signature-text">${signatureName}</div>
                                <div class="line"></div>
                                <div class="label">Imzo (Direktor)</div>
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

    return (
        <section className="text-white" style={{ display: `${showResult ? 'block' : 'none'}` }}>
            <div className="container">
                <div className="row py-5 align-items-center justify-content-center">
                    <div className="col-lg-6">
                        <div className={`glass-container text-center ${marks > passingScore ? 'border-success' : 'border-danger'}`}>
                            <h1 className={`mb-3 fw-bold display-3 ${marks > passingScore ? 'text-success' : 'text-danger'}`}>{marks > passingScore ? 'Ajoyib!' : 'Afsus!'}</h1>
                            <h3 className='mb-3 fw-bold'>Sizning natijangiz: {totalMarks} balldan {marks} ball</h3>
                            
                            <div className="mb-4 px-4">
                                <div className="d-flex justify-content-between small text-muted mb-1">
                                    <span>Samaradorlik</span>
                                    <span className={marks > passingScore ? 'text-success fw-bold' : 'text-danger fw-bold'}>{Math.round(percentage)}%</span>
                                </div>
                                <div className="timer-bar-container">
                                    <div 
                                        style={{ width: `${percentage}%`, height: '100%', background: marks > passingScore ? '#198754' : '#dc3545', transition: 'width 1s ease-out' }}
                                    ></div>
                                </div>
                            </div>

                            <p className='mb-4'>{marks > passingScore ? "Siz React bo'yicha yaxshi bilimga egasiz." : "Yana biroz o'rganishingiz kerak."}</p>
                            <div className="d-flex justify-content-center gap-3 flex-wrap">
                                <button onClick={startOver} className='btn btn-custom'>Qayta boshlash</button>
                                <button onClick={returnToHome} className='btn btn-outline-light rounded-pill px-4'>Bosh sahifa</button>
                                <button onClick={handleShare} className='btn btn-warning rounded-pill px-4 text-dark fw-bold'>Ulashish 📤</button>
                                {percentage >= 80 && (
                                    <button onClick={handleCertificate} className='btn btn-success rounded-pill px-4 fw-bold'>📜 Sertifikat</button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Result;