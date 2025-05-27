"use client";

import { useState, useEffect, useRef } from 'react';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import FoodForm from '@/components/FoodForm';
import FoodItem from '@/components/FoodItem';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function Home() {
  const [user, setUser] = useState(null);
  const [sections, setSections] = useState([]);
  const [foods, setFoods] = useState({});
  const [loading, setLoading] = useState(true);
  const [collapsedSections, setCollapsedSections] = useState({});
  const contentRefs = useRef({}); // Store refs for section content

  const auth = getAuth();
  const provider = new GoogleAuthProvider();

  // Monitor auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        fetchSectionsAndFoods(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch sections and their food items
  const fetchSectionsAndFoods = async (uid) => {
    try {
      console.log('Fetching sections for restaurant:', uid);
      const sectionsSnapshot = await getDocs(collection(db, 'restaurants', uid, 'sections'));
      const sectionList = [];
      const foodMap = {};
      const initialCollapsed = {};

      for (const sectionDoc of sectionsSnapshot.docs) {
        const sectionId = sectionDoc.id;
        const sectionName = sectionDoc.data().name;
        sectionList.push(sectionName);
        initialCollapsed[sectionName] = false; // Default: expanded
        console.log('Processing section:', sectionId, 'Name:', sectionName);

        const foodItemsSnapshot = await getDocs(
          collection(db, 'restaurants', uid, 'sections', sectionId, 'foodItems')
        );
        foodMap[sectionName] = foodItemsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log(`Found ${foodMap[sectionName].length} items in section ${sectionName}`);
      }

      setSections(sectionList);
      setFoods(foodMap);
      setCollapsedSections(initialCollapsed);
      console.log('Sections:', sectionList);
      console.log('Foods:', foodMap);
    } catch (error) {
      console.error('Error fetching sections and foods:', error);
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
      setFoods({});
      setSections([]);
      setCollapsedSections({});
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Handle food creation or update
  const handleFoodUpdate = () => {
    if (user) {
      fetchSectionsAndFoods(user.uid);
    }
  };

  // Toggle section collapse state
  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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
          <FoodForm onFoodAdded={handleFoodUpdate} restaurantId={user.uid} sections={sections} />
          <div className="food-list">
            <h2>Your Menu</h2>
            {sections.length === 0 ? (
              <p>No sections or food items yet. Add some!</p>
            ) : (
              sections.map(section => (
                <div key={section} className="section">
                  <h3 
                    className="section-header" 
                    onClick={() => toggleSection(section)}
                    role="button"
                    aria-expanded={!collapsedSections[section]}
                    aria-controls={`section-${section}`}
                  >
                    <span className="toggle-icon">
                      {collapsedSections[section] ? '▶' : '▼'}
                    </span>
                    {section}
                  </h3>
                  <div
                    id={`section-${section}`}
                    className={`section-content ${collapsedSections[section] ? 'collapsed' : ''}`}
                    ref={el => (contentRefs.current[section] = el)}
                    style={{
                      height: collapsedSections[section]
                        ? '0'
                        : `${contentRefs.current[section]?.scrollHeight || 'auto'}px`
                    }}
                  >
                    {foods[section]?.length > 0 ? (
                      foods[section].map(food => (
                        <FoodItem 
                          key={food.id} 
                          food={food} 
                          onUpdate={handleFoodUpdate} 
                          restaurantId={user.uid} 
                          sectionId={section.replace(/\s+/g, '_').toLowerCase()}
                          sections={sections}
                        />
                      ))
                    ) : (
                      <p>No items in {section} section.</p>
                    )}
                  </div>
                </div>
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