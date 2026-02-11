import React, { useContext, useEffect } from 'react';
import Start from './components/Start';
import Quiz from './components/Quiz';
import Result from './components/Result';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import Header from './components/Header';
import Footer from './components/Footer';
import Profile from './components/Profile';
import AdminDashboard from './components/AdminDashboard';
import Leaderboard from './components/Leaderboard';
import DataContext, { DataProvider } from './context/dataContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function AppContent() {
  const { user, authView, theme, showProfile, showAdmin, showLeaderboard, authLoading } = useContext(DataContext);

  // Apply theme class to body
  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  if (authLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Yuklanmoqda...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      <ToastContainer position="top-right" autoClose={3000} theme={theme} />
      <Header />
      
      <main className="flex-grow-1 d-flex flex-column justify-content-center pt-5 mt-4">
        {!user ? (
          <>
            {authView === 'login' && <Login />}
            {authView === 'register' && <Register />}
            {authView === 'forgot' && <ForgotPassword />}
          </>
        ) : (
          <>
            {showProfile ? <Profile /> : 
             showAdmin ? <AdminDashboard /> : 
             showLeaderboard ? <Leaderboard /> : (
              <>
                <Start/>
                <Quiz/>
                <Result/>
              </>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}

export default App;
