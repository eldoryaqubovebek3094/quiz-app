import React, { useContext } from 'react';
import DataContext from '../context/dataContext';

const Start = () => {
    const {startQuiz, showStart, topics, setSelectedTopic, selectedTopic, topicCounts} = useContext(DataContext);

    const handleTopicSelect = (topic) => {
        setSelectedTopic(topic);
    };

    return (
        <section className='text-white text-center' style={{ display: `${showStart ? 'block' : 'none'}` }}>
            <div className="container">
                <div className="row py-5 align-items-center justify-content-center">
                    <div className="col-lg-10">
                        <div className="glass-container">
                            <h1 className='fw-bold mb-4 display-5 display-md-4'>Dasturlash Quiz</h1>
                            <p className="mb-4 lead">O'z bilimlaringizni sinab ko'rish uchun yo'nalish tanlang:</p>
                            
                            {!selectedTopic ? (
                                <div className="row g-3 justify-content-center">
                                    {topics.map((topic) => (
                                        <div key={topic} className="col-6 col-md-4 col-lg-3">
                                            <button onClick={() => handleTopicSelect(topic)} className="btn topic-btn w-100 py-3 fw-bold">
                                                {topic} <br/>
                                                <span className="badge bg-secondary rounded-pill mt-2">{topicCounts[topic] || 0} ta</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div>
                                    <h2 className="mb-4 text-info">{selectedTopic}</h2>
                                    <button onClick={startQuiz} className="btn btn-custom fs-5 px-5">Testni Boshlash</button>
                                    <button onClick={() => setSelectedTopic('')} className="btn btn-link text-white d-block mx-auto mt-3">Boshqa yo'nalish tanlash</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Start;