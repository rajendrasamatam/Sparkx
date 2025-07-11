import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div>
      <h1>Welcome to the Home Page</h1>
      <p>This is a public page accessible to everyone.</p>
      <nav>
        <Link to="/signup" style={{ marginRight: '10px' }}>Sign Up</Link>
        <Link to="/login">Log In</Link>
      </nav>
    </div>
  );
};

export default Home;