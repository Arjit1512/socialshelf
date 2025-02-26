import React, { useEffect, useState } from 'react';
import '../stylings/Home.css';
import axios from 'axios';
import { FaUserPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const userId = localStorage.getItem('userId');
  const [posts, setPosts] = useState([]);
  const [image, setImage] = useState(null);
  const [description, setDescription] = useState('');
  const [flagarray, setFlagarray] = useState([]);
  const [entireObject, setEntireObject] = useState({});
  const [companies, setCompanies] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/${userId}/feed`);
        setPosts(response.data);
      } catch (error) {
        console.error('Error fetching feed:', error);
      }
    };
    fetchFeed();

    const getUsers = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/users`);
        const usersObject = response.data.reduce((acc, user) => {
          acc[user._id] = user;
          return acc;
        }, {});

        setEntireObject(usersObject);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    getUsers();

    const getCompanies = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/companies`);
        const compsObject = response.data.reduce((acc, comp) => {
          acc[comp._id] = comp;
          return acc;
        }, {});

        setCompanies(compsObject);
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };
    getCompanies();



  }, [userId, flagarray]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('description', description);

      await axios.post(`${process.env.REACT_APP_API_URL}/${userId}/createPost`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setImage(null);
      setDescription('');
      document.querySelector(".file-input").value = "";
      setFlagarray((prevarray) => [...prevarray, 1]);
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleAddFriend = async (friendId) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/${userId}/addFriend/${friendId}`);
      if(response.data.message===" Already friends!"){
        const response2 = await axios.post(`${process.env.REACT_APP_API_URL}/${userId}/removeFriend/${friendId}`);
        alert(response2.data.message);
        setFlagarray((prevarray) => [...prevarray, 1]);
        return;
      }
      alert(response.data.message);
      setFlagarray((prevarray) => [...prevarray, 1]);
      

    } catch (error) {
      console.error('Error adding friend:', error);
    }
  };

  return (
    <div className="home-container">
      <div className="create-post">
        <h2>Create a Post</h2>
        <input type="file" className="file-input" onChange={(e) => setImage(e.target.files[0])} />
        <textarea
          className="description-input"
          placeholder="Write something..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button className="post-button" onClick={handleCreatePost}>Post</button>
      </div>

      <div className="content">
        {/* Feed Section */}
        <div className="feed">
          <h2>Feed</h2>
          {posts.length > 0 ? posts.map((post) => (
            <div key={post._id} className="post">
              <div className='flex-row'>
                <img className="post-dp" src={entireObject[post.userId]?.dp} alt="dp" />
                <h2>{entireObject[post.userId]?.userName || "Unknown User"}</h2>
              </div>
              <p className="post-description">{post.description}</p>
              {post.image && <img src={post.image} alt="Post" className="post-image" />}
            </div>
          )) : <p className="no-posts">No posts available</p>}
        </div>

        {/* Users Section */}
        <div className="users-section">
          <h2>Users</h2>
          {Object.values(entireObject).map(user => (
            <div key={user._id} className="user-item">
              <img className="user-dp" src={user.dp} alt="User DP" />
              <span>{user.userName}</span>
              <button className="add-friend-button" onClick={() => handleAddFriend(user._id)}>
                <FaUserPlus />
              </button>
            </div>
          ))}
        </div>

        {/* Companies Section */}
        <div className="users-section sec2">
          <h2>Companies</h2>
          {Object.values(companies).map(company => (
            <div key={company._id} className="user-item">
              <img className="user-dp" src={company.dp} alt="Company Logo" />
              <span>{company.userName}</span>
              <button className="add-friend-button" onClick={() => navigate(`/company/${company._id}`)}>
                View
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>

  );
};

export default Home;
