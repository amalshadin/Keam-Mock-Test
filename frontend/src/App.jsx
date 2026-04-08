import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Exam from './pages/Exam';
import Result from './pages/Result';
import Review from './pages/Review';

const PrivateRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        
        <Route path="/exam/:id" element={
          <PrivateRoute>
            <Exam />
          </PrivateRoute>
        } />
        <Route path="/result/:id" element={
          <PrivateRoute>
            <Result />
          </PrivateRoute>
        } />
        <Route path="/review/:id" element={
          <PrivateRoute>
            <Review />
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
