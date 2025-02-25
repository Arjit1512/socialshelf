import React, { useState } from 'react'
import '../stylings/Login.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async(e) => {
    e.preventDefault(); 
    try{
      console.log(process.env.REACT_APP_API_URL);
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/login`,{
        userName: username,password:password
      });
      if(response.data.message==="Login successful!"){
        localStorage.setItem('userId',response.data.userId);
        navigate("/home");
        setUsername('');
        setPassword('');
      }
      else
      alert(response.data.message);
    }catch(error){
      alert(error);
    }
  }
  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2 className="login-title">Welcome!</h2>
        <div className="input-group">
          <label className="input-label">User Name</label>
          <input className="input-field" onChange={(e) => setUsername(e.target.value)} value={username} placeholder='username*' />
        </div>
        <div className="input-group">
          <label className="input-label">Password</label>
          <input className="input-field" type="password" onChange={(e) => setPassword(e.target.value)} value={password} placeholder='password*' />
        </div>
        <button type='submit' className="login-button">Login</button>
        <p className="register-text">Don't have an account? <a className="register-link" onClick={() => navigate("/register")}>Register</a></p>
      </form>
    </div>
  )
}

export default Login