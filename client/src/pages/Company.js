import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import "../stylings/Company.css";

const Company = () => {
    const { companyId } = useParams();
    const [companies, setCompanies] = useState({});
    const [products, setProducts] = useState({});
    const [image, setImage] = useState(null);
    const [openInputs, setOpenInputs] = useState({});
    const [description, setDescription] = useState('');
    const [review, setReview] = useState('');
    const [reviews, setReviews] = useState({});
    const [entireObject, setEntireObject] = useState({});
    const [showReviews, setShowReviews] = useState({});
    const renderId = localStorage.getItem('companyId') !== "null" ? localStorage.getItem('companyId') : null;
    const renderUserId = localStorage.getItem('userId') !== "null" ? localStorage.getItem('userId') : null;

    const [flagarray, setFlagarray] = useState([]);
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/companies`);
                const object = response.data.reduce((acc, comp) => {
                    acc[comp._id] = comp;
                    return acc;
                }, {});
                setCompanies(object);

                const response2 = await axios.get(`${process.env.REACT_APP_API_URL}/${companyId}/products`);
                const productObject = response2.data.reduce((acc, comp) => {
                    acc[comp._id] = comp;
                    return acc;
                }, {});
                setProducts(productObject);

            } catch (error) {
                alert(error);
            }
        }
        fetchCompanies();

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
    }, [flagarray])

    const handleCreatePost = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('image', image);
            formData.append('description', description);

            await axios.post(`${process.env.REACT_APP_API_URL}/${companyId}/createProduct`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setImage(null);
            setDescription('');
            document.querySelector(".file-input").value = "";
            setFlagarray((prevarray) => [...prevarray, 1]);
        } catch (error) {
            alert('Error creating post:', error);
        }
    };

    const handleAddReview = async (postId) => {
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/${renderUserId}/addReview/${postId}`, { review });
            if (response.data.message === "Review added successfully!") {
                setReview('');
            }

            alert(response.data.message);
            setFlagarray((prevarray) => [...prevarray, 1]);

        } catch (error) {
            alert('Error creating review:', error);
        }
    }

    const handleShowReviews = async (postId) => {
        if (showReviews[postId]) {
            setShowReviews(prev => ({ ...prev, [postId]: false }));
            return;
        }
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/${renderUserId}/seeReview/${postId}`);
            if (response.data.message === "Reviews fetched successfully!") {
                setReviews(prevReviews => ({ ...prevReviews, [postId]: response.data.reviews }));
            }
            setShowReviews(prev => ({ ...prev, [postId]: true }));
        } catch (error) {
            alert('Error fetching reviews:', error);
        }
    }

    const toggleInput = (postId) => {
        setOpenInputs((prev) => ({
            ...prev,
            [postId]: !prev[postId],  // Toggle only the clicked post
        }));
    };

    // console.log('Companies: ', companies);
    // console.log('Products: ', products);
    // console.log('renderId: ',renderId)
    console.log('reviews: ', reviews);

    return (
        <div className="company-container">
            <div className="company-header">
                <img src={companies[companyId]?.dp} alt="logo" className="company-logo" />
                <h1>{companies[companyId]?.userName}</h1>
            </div>
            {(renderId !== null) && (
                <div className="create-post p2">
                    <h2>Create a Product</h2>
                    <input type="file" className="file-input" onChange={(e) => setImage(e.target.files[0])} />
                    <textarea
                        className="description-input"
                        placeholder="Name of the product"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <button className="post-button" onClick={handleCreatePost}>Post</button>
                </div>
            )}
            <h2 style={{ textAlign: "left", marginBottom: "2%" }}>Our products: <br /></h2>
            <div className="product-list">
                {companies[companyId]?.posts?.filter(post => products[post] && products[post].description && products[post].image)?.map((post) => (
                    <div className="product-card" key={post}>
                        <h2 className="product-title">{products[post]?.description}</h2>
                        <img src={products[post]?.image} alt="product" className="product-image" />
                        {renderUserId && (
                            <div className="review-section">
                                <button className="review-button" onClick={() => handleShowReviews(post)}>
                                    {showReviews[post] ? "Hide Reviews" : "Show Reviews"}
                                </button>
                                {showReviews[post] && reviews[post] && reviews[post].length > 0 && (
                                    <div className="reviews-container">
                                        {reviews[post].map((review) => (
                                            <div key={review._id} className="review-item">
                                                <p className="review-username"><strong>{entireObject[review.userId].userName}: </strong></p>
                                                <p className="review-text">{review.review}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <button className="review-button" onClick={() => toggleInput(post)}>Add a review</button>
                                {openInputs[post] && (
                                    <div className="review-input-container">
                                        <input
                                            className="review-input"
                                            onChange={(e) => setReview(e.target.value)}
                                            value={review}
                                            placeholder="Write a review"
                                        />
                                        <button className="submit-review-button" onClick={() => handleAddReview(post)}>Submit review</button>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                ))}
            </div>
        </div>
    )
}

export default Company