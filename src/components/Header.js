import React, { useContext } from 'react';
import DataContext from '../context/dataContext';
import { Dropdown } from 'react-bootstrap';

const Header = () => {
    const { user, logout, theme, toggleTheme, isAdmin, setShowProfile, setShowAdmin, setShowLeaderboard, returnToHome } = useContext(DataContext);

    const handleHome = () => {
        returnToHome();
        setShowProfile(false);
        setShowAdmin(false);
        setShowLeaderboard(false);
    }

    const handleViewChange = (view) => {
        setShowProfile(view === 'profile');
        setShowAdmin(view === 'admin');
        setShowLeaderboard(view === 'leaderboard');
    };

    return (
        <header className="p-2 p-md-3 fixed-top" style={{ zIndex: 1000 }}>
            <style>
                {`
                    @keyframes dropdownAnimation {
                        from {
                            opacity: 0;
                            transform: translateY(-10px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                `}
            </style>
            <div className="container d-flex justify-content-between align-items-center glass-container py-2 px-3 px-md-4" style={{ borderRadius: '50px', overflow: 'visible' }}>
                <div className="d-flex align-items-center gap-3" style={{cursor: 'pointer'}} onClick={handleHome}>
                    <img 
                        src="/rasmlar/logo.png" 
                        alt="logo" 
                        style={{ 
                            height: '40px', 
                            width: '40px', 
                            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' 
                        }} 
                    />
                    <div className="fw-bold fs-5 fs-md-4">Quizzes-dev</div>
                </div>
                <div className="d-flex align-items-center gap-2 gap-md-3">
                    <button onClick={toggleTheme} className="btn btn-sm btn-outline-light rounded-circle" style={{ width: '40px', height: '40px' }}>
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                    {user && (
                        <>
                            {/* Desktop buttons */}
                            <div className="d-none d-md-flex align-items-center gap-2 gap-md-3">
                                {isAdmin && (
                                    <button onClick={() => handleViewChange('admin')} className="btn btn-sm btn-warning fw-bold" title="Admin">
                                        Admin
                                    </button>
                                )}
                                
                                <button onClick={() => handleViewChange('leaderboard')} className="btn btn-sm btn-outline-warning fw-bold" title="Reyting">
                                    🏆 Reyting
                                </button>

                                <button onClick={() => handleViewChange('profile')} className="btn btn-sm btn-info text-white fw-bold" title="Profil">
                                    Profil
                                </button>

                                <button onClick={logout} className="btn btn-sm btn-danger rounded-pill px-3" title="Chiqish">
                                    Chiqish
                                </button>
                            </div>

                            {/* Mobile dropdown */}
                            <div className="d-md-none">
                                <Dropdown align="end">
                                    <Dropdown.Toggle as="button" className="btn btn-sm btn-outline-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-three-dots-vertical" viewBox="0 0 16 16">
                                            <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>
                                        </svg>
                                    </Dropdown.Toggle>

                                    <Dropdown.Menu 
                                        variant="dark"
                                        style={{
                                            backgroundColor: 'rgba(33, 37, 41, 0.9)',
                                            backdropFilter: 'blur(10px)',
                                            WebkitBackdropFilter: 'blur(10px)', // Safari uchun
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            borderRadius: '0.75rem',
                                            zIndex: 1055, // Boshqa elementlar ustida ko'rinishi uchun
                                            animation: 'dropdownAnimation 0.3s ease-out',
                                        }}
                                    >
                                        {isAdmin && <Dropdown.Item onClick={() => handleViewChange('admin')}>⚙️ Admin</Dropdown.Item>}
                                        <Dropdown.Item onClick={() => handleViewChange('leaderboard')}>🏆 Reyting</Dropdown.Item>
                                        <Dropdown.Item onClick={() => handleViewChange('profile')}>👤 Profil</Dropdown.Item>
                                        <Dropdown.Divider />
                                        <Dropdown.Item onClick={logout} className="text-danger fw-bold">✕ Chiqish</Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;