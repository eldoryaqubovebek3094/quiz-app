import React, { useContext, useState, useEffect } from 'react';
import DataContext from '../context/dataContext';

const Leaderboard = () => {
    const { getLeaderboard, showLeaderboard } = useContext(DataContext);
    const [leaders, setLeaders] = useState([]);

    useEffect(() => {
        if (showLeaderboard) {
            getLeaderboard().then(data => setLeaders(data));
        }
    }, [showLeaderboard, getLeaderboard]);

    return (
        <div className="container">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="glass-container p-5">
                        <h2 className="text-center mb-4 text-warning">🏆 Reyting (Top 10)</h2>
                        <div className="table-responsive">
                            <table className="table table-dark table-hover">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Foydalanuvchi</th>
                                        <th>Kasbi</th>
                                        <th>Jami Ball</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaders.map((user, index) => (
                                        <tr key={user.id}>
                                            <td>{index + 1} {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''}</td>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    {user.photoURL ? <img src={user.photoURL} alt="" className="rounded-circle" width="30" height="30"/> : <span>👤</span>}
                                                    {user.firstName} {user.lastName}
                                                </div>
                                            </td>
                                            <td>{user.profession}</td>
                                            <td className="fw-bold text-info">{user.totalScore || 0}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;