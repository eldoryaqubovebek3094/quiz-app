import React, { useContext } from 'react';
import DataContext from '../context/dataContext';

const Header = () => {
    const { user, logout, theme, toggleTheme, isAdmin, setShowProfile, setShowAdmin, setShowLeaderboard, returnToHome } = useContext(DataContext);

    const handleHome = () => {
        returnToHome();
        setShowProfile(false);
        setShowAdmin(false);
        setShowLeaderboard(false);
    }

    return (
        <header className="p-2 p-md-3 fixed-top" style={{ zIndex: 1000 }}>
            <div className="container d-flex justify-content-between align-items-center glass-container py-2 px-3 px-md-4" style={{ borderRadius: '50px' }}>
                <div className="fw-bold fs-5 fs-md-4" style={{cursor: 'pointer'}} onClick={handleHome}>QuizApp</div>
                <div className="d-flex align-items-center gap-2 gap-md-3">
                    <button onClick={toggleTheme} className="btn btn-sm btn-outline-light rounded-circle" style={{ width: '40px', height: '40px' }}>
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                    {user && (
                        <div className="d-flex align-items-center gap-2 gap-md-3">
                            {isAdmin && (
                                <button onClick={() => {setShowAdmin(true); setShowProfile(false); setShowLeaderboard(false);}} className="btn btn-sm btn-warning fw-bold" title="Admin">
                                    <span className="d-none d-md-inline">Admin</span>
                                    <span className="d-md-none">⚙️</span>
                                </button>
                            )}
                            
                            <button onClick={() => {setShowLeaderboard(true); setShowProfile(false); setShowAdmin(false);}} className="btn btn-sm btn-outline-warning fw-bold" title="Reyting">
                                <span className="d-none d-md-inline">🏆 Reyting</span>
                                <span className="d-md-none">🏆</span>
                            </button>

                            <button onClick={() => {setShowProfile(true); setShowAdmin(false); setShowLeaderboard(false);}} className="btn btn-sm btn-info text-white fw-bold" title="Profil">
                                <span className="d-none d-md-inline">Profil</span>
                                <span className="d-md-none">👤</span>
                            </button>

                            <button onClick={logout} className="btn btn-sm btn-danger rounded-pill px-3" title="Chiqish">
                                <span className="d-none d-md-inline">Chiqish</span>
                                <span className="d-md-none">✕</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;