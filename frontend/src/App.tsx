import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import LeftSidebar from './components/LeftSidebar';
import Feed from './pages/Feed';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import PostDetails from './pages/PostDetails';
import ForumDetails from './pages/ForumDetails';

function App() {
  return (
    <Router>
      <Navbar />
      <main style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '0', 
        minHeight: '100vh'
      }}>
        <LeftSidebar />
        <div style={{ 
          flex: 1, 
          maxWidth: '600px',
          minWidth: '0', // Important for flex child with overflow
          borderLeft: '1px solid var(--border)',
          borderRight: '1px solid var(--border)'
        }}>
          <Routes>
            <Route path="/" element={<Feed />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/posts/:id" element={<PostDetails />} />
            <Route path="/f/:forumName" element={<ForumDetails />} />
          </Routes>
        </div>
        <div className="hide-mobile" style={{ width: '250px', position: 'sticky', top: '70px', height: 'calc(100vh - 70px)' }}>
          {/* Optional Right Sidebar Content could go here */}
        </div>
      </main>
      <BottomNav />
    </Router>
  );
}

export default App;
