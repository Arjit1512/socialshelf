import React,{useState} from 'react'
import '../stylings/Login.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [dp, setDp] = useState(null); 
  const navigate = useNavigate();

  const handleSubmit = async(e) => {
    e.preventDefault(); 
    try{
      const formData = new FormData();
      formData.append("userName", username);
      formData.append("password", password);
      if (dp) formData.append("dp", dp);

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/register`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.data.message === "Registartion successful!") {
        localStorage.setItem('userId',response.data.userId);
        navigate("/home");
        setUsername('');
        setPassword('');
        setDp(null);
      } else {
        alert(response.data.message);
      }
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
        <div className="input-group">
          <label className="input-label">Profile Picture</label>
          <input type="file" className="input-field" onChange={(e) => setDp(e.target.files[0])} />
        </div>
        <button type='submit' className="login-button">Register</button>
        <p className="register-text">Already have an account? <a className="register-link" onClick={() => navigate("/")}>Login</a></p>
      </form>
    </div>
  )
}

export default Register