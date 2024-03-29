import { useContext, useEffect, useState } from 'react';
import styles from './Homepage.module.css'
import Navbar from '../../components/Navbar/Navbar';
import loud from "../../assets/loud.svg"
import Comment from '../../components/Comment/Comment';
import Modal from '../../components/Modal/Modal';
import Filter from '../../components/Filter/Filter';
import { UserContext } from '../../UserContext';
import jwt_decode from "jwt-decode"
import Product from '../../components/Product/Product';
import axios from 'axios';

function Homepage() {

    const { editProductModal, setEditProductModal, loginModal, signupModal, setSignupModal,
        addProductModal, setAddProductModal, product, setProduct, user_token, BASE_URL } = useContext(UserContext)

    const [clickedProductId, setClickedProductId] = useState(null);
    const [sortOption, setSortOption] = useState('vote')

    const [isLoading, setIsLoading] = useState(false)

    const [selectedCategory, setSelectedCategory] = useState('') // filter Category save here
    const [sortedProducts, setSortedProducts] = useState([]);
    const [userComments, setUserComments] = useState({})
    const [showComments, setShowComments] = useState(false); // Toggle state for comments

    const decodedToken = user_token ? jwt_decode(user_token) : null; //Token decode
    const userId = decodedToken ? decodedToken.id : null // Get User Id from Token

    const [editProduct, setEditProduct] = useState(null) // Product to edit
    const [showEditModal, setShowEditModal] = useState(false) // Check edit modal open/close

    // Fetch Products
    const getProducts = async () => {
        try {
            let response
            if (selectedCategory) {
                response = await axios.get(`${BASE_URL}/api/product/all`, {
                    params: { category: selectedCategory }
                })
                if (response) {
                    setIsLoading(false)
                    const data = await response.data
                    if (response) {
                        setSortedProducts(data || []);
                    }
                }
            } else {
                response = await axios.get(`${BASE_URL}/api/product/all`)
                if (response) {
                    setIsLoading(false)
                    const data = await response.data
                    setProduct(data || []);
                }
            }
        } catch (error) {
            console.log('Error Getting products', error);
        }
    }

    // click id get
    const filterClickBoxId = (id) => {
        setClickedProductId(prevId => prevId === id ? null : id);
        setShowComments(prevShow => prevShow && clickedProductId !== id);
    };

    // Handel vote count
    const handelVoteCount = async (e, id) => {
        e.stopPropagation();
        try {
            const clickedProduct = product.find((pro) => pro._id === id);
            if (!clickedProduct) {
                return console.log('clicked product not found');
            }

            const productId = clickedProduct._id;
            const updatedVoteCount = clickedProduct.vote + 1;

            const res = await axios.patch(`/api/product/${productId}`, {
                vote: updatedVoteCount
            });

            if (res.status === 200) {
                // Update the product's vote count locally
                setProduct((prevProducts) =>
                    prevProducts.map((product) => {
                        if (product._id === productId) {
                            return { ...product, vote: updatedVoteCount };
                        }
                        return product;
                    })
                );
            }
        } catch (error) {
            console.log('Error in increasing vote:', error);
        }
    }

    // set Filter state value(category)
    const handleCategoryClick = (category) => {
        setSelectedCategory(category);
    };

    // filter fun
    const filterProductByCategory = product.filter((pro) => {
        if (selectedCategory === '') {
            return true; // Return all products if no category is selected
        }
        return pro.category.includes(selectedCategory);
    });

    // calculate user comments function for (total) suggestion
    useEffect(() => {
        const calculateUserComments = () => {
            const commentsPerUser = {};
            product.forEach((pro) => {
                const userId = pro.user_id;

                if (pro.comments && Array.isArray(pro.comments)) {
                    const commentCount = pro.comments.length;
                    commentsPerUser[userId] = (commentsPerUser[userId] || 0) + commentCount;
                }
            });
            setUserComments(commentsPerUser);
        };
        calculateUserComments();
    }, [product])

    // Count number of comments - Total Suggestion
    const totalComments = Object.values(userComments).reduce((total, count) => total + count, 0);

    // open Edit modal 
    const handelEditClick = (product) => {
        setEditProduct(product)
        setShowEditModal(true)
        setEditProductModal(true)
    }

    useEffect(() => {
        setIsLoading(true)
        getProducts()
    }, [selectedCategory])

    useEffect(() => {
        //SOrt Based on Selected dropdown value
        const sortProducts = () => {
            let sortedProducts = [...product]; // Here copy of the products array
            if (sortOption === 'vote') {
                sortedProducts = sortedProducts.sort((a, b) => b.vote - a.vote);
            }
            else if (sortOption === 'comment') {
                sortedProducts = sortedProducts.sort((a, b) => b.comments.length - a.comments.length);
            }

            if (selectedCategory) {
                sortedProducts = sortedProducts.filter(
                    (pro) => pro.category.includes(selectedCategory)
                );
            }

            setSortedProducts(sortedProducts); // Update the sortedProducts state
        };
        sortProducts()
    }, [sortOption, selectedCategory, product])


    return (
        <div className={styles.bodyMain}>

            <div className={styles.bodyContainer}>

                <Navbar />

                {/* Poster Container */}
                <div className={styles.posterCotainer}>
                    <img src={loud} alt="poster" />
                    <div className={styles.heading}>
                        <h3>Add your products and give your valuable feedback</h3>
                        <p>Easily give your feedback in a matter of minutes. Access your audience on all platforms.
                            <br />Observe result manually in real time</p>
                    </div>
                </div>

                {/* DrownContainer */}
                <div className={styles.mainContainer}>

                    {/* Filter Container */}
                    <Filter handleCategoryClick={handleCategoryClick} selectedCategory={selectedCategory} categories={product ? product.map((pro) => pro.category) : []} isLoading={isLoading}/>

                    {/* Project Container */}
                    <div className={styles.projectsContainer}>

                        {/* Top Bar */}
                        <div className={styles.projectsTopBar}>

                            <div className={styles.projectsTopBarLeft}>
                                <h5>{totalComments} Suggestions</h5>

                                <div className={styles.sortDiv}>

                                    <p>Sort by:</p>
                                    <select name="vote" value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                                        <option value="vote" >Upvotes</option>
                                        <option value="comment">Comments</option>
                                    </select>

                                </div>

                            </div>

                            {/* Add Product Button */}
                            <div className={styles.projectsTopBarRight}>

                                {user_token ?
                                    <button onClick={() => setAddProductModal(true)}>+ Add Product</button> :
                                    <button onClick={() => setSignupModal(true)}>+ Add Product</button>}
                            </div>

                        </div>

                        {/* Product Boxs Container */}
                        <div className={styles.productsBoxContainer} >

                            {isLoading ?
                                <>
                                    <div className={styles.productLoading} />
                                    <div className={styles.productLoading} />
                                </>
                                :
                                sortedProducts.map((product) => {
                                    const isActive = product._id === clickedProductId

                                    return <Product key={product._id} product={product} userId={userId} isActive={isActive}
                                        filterClickBoxId={filterClickBoxId} getProducts={getProducts} handelVoteCount={handelVoteCount}
                                        user_token={user_token} handelEditClick={handelEditClick} />

                                })}

                        </div>

                    </div >

                </div >

            </div >

            {/* Modal Show If True */}
            {loginModal && <Modal type='login' />}

            {signupModal && <Modal type='signup' />}

            {addProductModal && <Modal type='add-Product' />}

            {editProductModal && <Modal type='edit-Product' editProduct={editProduct} />}


        </div >

    )
}
export default Homepage;