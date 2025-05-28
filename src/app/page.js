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
  const [editingSection, setEditingSection] = useState(null);
  const [newSectionName, setNewSectionName] = useState('');
  const [error, setError] = useState('');
  const contentRefs = useRef({});

  const auth = getAuth();
  const provider = new GoogleAuthProvider();

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
        initialCollapsed[sectionName] = false;
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
      setError('Failed to load menu.');
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to sign in.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setFoods({});
      setSections([]);
      setCollapsedSections({});
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to sign out.');
    }
  };

  const handleFoodUpdate = () => {
    if (user) {
      fetchSectionsAndFoods(user.uid);
    }
  };

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleEditSection = (section) => {
    setEditingSection(section);
    setNewSectionName(section);
    setError('');
  };

  const handleSaveSection = async (oldSection) => {
    if (!newSectionName || newSectionName === oldSection) {
      setEditingSection(null);
      return;
    }

    try {
      const oldSectionId = oldSection.trim().replace(/\s+/g, '_').toLowerCase();
      const newSectionId = newSectionName.trim().replace(/\s+/g, '_').toLowerCase();
      console.log(`Sending PATCH to /api/sections: oldSectionId=${oldSectionId}, newSectionId=${newSectionId}`);
      const response = await fetch('/api/sections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: user.uid,
          oldSectionId,
          newSectionId,
          newSectionName
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('PATCH response error:', errorData);
        throw new Error(errorData.error || `Failed to update section (status: ${response.status})`);
      }
      console.log('Section updated successfully');
      handleFoodUpdate();
      setEditingSection(null);
      setNewSectionName('');
      setError('');
    } catch (error) {
      console.error('Error editing section:', error.message);
      setError(`Failed to update section: ${error.message}`);
    }
  };

  const handleDeleteSection = async (section) => {
    if (!confirm(`Are you sure you want to delete the "${section}" section and all its items?`)) return;

    try {
      const sectionId = section.trim().replace(/\s+/g, '_').toLowerCase();
      console.log(`Sending DELETE to /api/sections: sectionId=${sectionId}`);
      const response = await fetch('/api/sections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId: user.uid, sectionId })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete section');
      }
      handleFoodUpdate();
      setError('');
    } catch (error) {
      console.error('Error deleting section:', error);
      setError(`Failed to delete section: ${error.message}`);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container">
      <h1>Restaurant Food Management</h1>
      {error && <p className="error">{error}</p>}
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
                  <div className="section-header-container">
                    {editingSection === section ? (
                      <div className="section-edit-form">
                        <input
                          type="text"
                          value={newSectionName}
                          onChange={(e) => setNewSectionName(e.target.value)}
                          placeholder="New section name"
                        />
                        <button
                          className="button"
                          onClick={() => handleSaveSection(section)}
                        >
                          Save
                        </button>
                        <button
                          className="button button-danger"
                          onClick={() => setEditingSection(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
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
                        <div className="section-actions">
                          <button
                            className="button"
                            onClick={() => handleEditSection(section)}
                          >
                            Edit Section
                          </button>
                          <button
                            className="button button-danger"
                            onClick={() => handleDeleteSection(section)}
                          >
                            Delete Section
                          </button>
                        </div>
                      </>
                    )}
                  </div>
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
                      <div className="food-grid">
                        {foods[section].map(food => (
                          <FoodItem 
                            key={food.id} 
                            food={food} 
                            onUpdate={handleFoodUpdate} 
                            restaurantId={user.uid} 
                            sectionId={section.replace(/\s+/g, '_').toLowerCase()}
                            sections={sections}
                          />
                        ))}
                      </div>
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