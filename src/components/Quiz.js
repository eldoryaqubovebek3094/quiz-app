import React, { useContext } from 'react';
import DataContext from '../context/dataContext';

const Quiz = () => {
    const { showQuiz, question, quizzes, checkAnswer, correctAnswer,
            selectedAnswer,questionIndex, nextQuestion, showTheResult, timer, returnToHome,
            bookmarks, toggleBookmark }  = useContext(DataContext);

    const isBookmarked = bookmarks.some(b => b.id === question.id);

    const playSound = (isCorrect) => {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        if (isCorrect) {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
        } else {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.2);
        }
    };

    return (
        <section className="text-white" style={{ display: `${showQuiz ? 'block' : 'none'}` }}>
            <div className="container">
                <div className="row py-5 align-items-center justify-content-center">
                    <div className="col-lg-8">
                        <div className="glass-container pt-4">
                            <div className="d-flex align-items-center gap-3 mb-4">
                                <div className="flex-grow-1">
                                    <div className="d-flex justify-content-between small text-muted mb-1">
                                        <span>Vaqt</span>
                                        <span className={timer < 5 ? 'text-danger fw-bold' : 'text-info fw-bold'}>{timer}s</span>
                                    </div>
                                    <div className="timer-bar-container">
                                        <div 
                                            style={{ width: `${(timer / 15) * 100}%`, height: '100%', background: timer < 5 ? '#ff4b4b' : '#00d2ff', transition: 'width 1s linear' }}
                                        ></div>
                                    </div>
                                </div>
                                <button 
                                    onClick={returnToHome} 
                                    className="btn btn-outline-danger p-2"
                                    style={{borderRadius: '12px', lineHeight: 1}}
                                    title="Chiqish"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="d-flex justify-content-between gap-md-3">
                                <div className="d-flex align-items-start gap-3">
                                    <button 
                                        className={`btn ${isBookmarked ? 'btn-warning' : 'btn-outline-warning'} p-2`}
                                        onClick={() => toggleBookmark(question)}
                                        title={isBookmarked ? "Belgini olib tashlash" : "Savolni belgilash"}
                                        style={{ lineHeight: 1, fontSize: '1.5rem', borderRadius: '12px', borderColor: '#ffc107' }}
                                    >
                                        🔖
                                    </button>
                                    <h4 className='mb-2 fs-normal lh-base'>{question?.question}</h4>
                                </div>
                                <div className='text-end'>
                                    <h5 style={{ color: '#00d2ff' }}>{questionIndex + 1} / {quizzes?.length}</h5>
                                </div>
                            </div>
                            <div>
                                {
                                    question?.options?.map((item, index) => <button
                                        key={item}
                                        className={`option-btn w-100 text-start btn py-3 px-4 mt-3 ${correctAnswer === item && 'bg-success'}`}
                                        onClick={(event) => {
                                            playSound(item === question.answer);
                                            checkAnswer(event, item);
                                        }}
                                        disabled={!!selectedAnswer}
                                    >
                                        {item}
                                    </button>)
                                }
                            </div>

                            {
                                (questionIndex + 1) !== quizzes.length ?
                                    <button className='btn btn-custom w-100 mt-4' onClick={nextQuestion} disabled={!selectedAnswer}>Keyingi savol</button>
                                    :
                                    <button className='btn btn-custom w-100 mt-4' onClick={showTheResult} disabled={!selectedAnswer}>Natijani ko'rish</button>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Quiz;