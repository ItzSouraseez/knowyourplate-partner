"use client";

import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import FoodForm from '@/components/FoodForm';
import FoodItem from '@/components/FoodItem';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export default function Home() {
  const [user, setUser] = useState(null);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  const auth = getAuth();
  const provider = new GoogleAuthProvider();

  // Monitor auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        fetchFoods(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, [auth]);

  // Fetch food items for the logged-in restaurant
  const fetchFoods = async (uid) => {
    try {
      const q = query(collection(db, 'foods'), where('restaurantId', '==', uid));
      const querySnapshot = await getDocs(q);
      const foodList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFoods(foodList);
    } catch (error) {
      console.error('Error fetching foods:', error);
    }
  };

  // Handle Google login
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setFoods([]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Handle food creation or update
  const handleFoodUpdate = () => {
    if (user) {
      fetchFoods(user.uid);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container">
      <h1>Restaurant Food Management</h1>
      {user ? (
        <>
          <div className="header">
            <span>Welcome, {user.displayName}</span>
            <button onClick={handleLogout} className="button">Logout</button>
          </div>
          <FoodForm onFoodAdded={handleFoodUpdate} restaurantId={user.uid} />
          <div className="food-list">
            <h2>Your Menu</h2>
            {foods.length === 0 ? (
              <p>No food items yet. Add some!</p>
            ) : (
              foods.map(food => (
                <FoodItem key={food.id} food={food} onUpdate={handleFoodUpdate} restaurantId={user.uid} />
              ))
            )}
          </div>
        </>
      ) : (
        <button onClick={handleLogin} className="button">Sign in with Google</button>
      )}
    </div>
  );
}