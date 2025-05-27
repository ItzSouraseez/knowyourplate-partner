"use client";

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function FoodForm({ onFoodAdded, restaurantId, food, onFormClose, sections = [] }) {
  const [formData, setFormData] = useState(
    food || {
      name: '',
      ingredients: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      vitamins: '',
      allergens: '',
      foodType: '',
      price: ''
    }
  );
  const [isCustomSection, setIsCustomSection] = useState(false);
  const [customSection, setCustomSection] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSectionChange = (e) => {
    const value = e.target.value;
    setError('');
    if (value === 'custom') {
      setIsCustomSection(true);
      setFormData({ ...formData, foodType: customSection });
    } else {
      setIsCustomSection(false);
      setFormData({ ...formData, foodType: value });
    }
  };

  const handleCustomSectionChange = (e) => {
    const value = e.target.value;
    setCustomSection(value);
    setFormData({ ...formData, foodType: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate section
    if (!formData.foodType) {
      setError('Please select or enter a section.');
      return;
    }

    // Normalize sectionId (replace spaces with underscores, lowercase)
    const sectionId = formData.foodType.trim().replace(/\s+/g, '_').toLowerCase();
    const data = { ...formData, foodType: formData.foodType, restaurantId };

    try {
      // If creating a new section, save it to Firestore
      if (isCustomSection && !sections.includes(formData.foodType)) {
        console.log('Creating new section:', formData.foodType, 'with ID:', sectionId);
        await setDoc(doc(db, 'restaurants', restaurantId, 'sections', sectionId), {
          name: formData.foodType
        });
      }

      if (food) {
        // Update existing food item
        console.log('Updating food item:', { id: food.id, restaurantId, sectionId, ...data });
        await fetch('/api/foods', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: food.id, restaurantId, sectionId, ...data }),
        });
        onFormClose();
      } else {
        // Create new food item
        console.log('Creating new food item:', { restaurantId, sectionId, ...data });
        await fetch('/api/foods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ restaurantId, sectionId, ...data }),
        });
        setFormData({
          name: '',
          ingredients: '',
          calories: '',
          protein: '',
          carbs: '',
          fat: '',
          vitamins: '',
          allergens: '',
          foodType: '',
          price: ''
        });
        setCustomSection('');
        setIsCustomSection(false);
      }
      onFoodAdded();
    } catch (error) {
      console.error('Error submitting form:', error);
      setError('Failed to save food item. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="food-form">
      <h2>{food ? 'Edit Food Item' : 'Add New Food Item'}</h2>
      {error && <p className="error">{error}</p>}
      <label>
        Section:
        <select name="foodType" value={isCustomSection ? 'custom' : formData.foodType} onChange={handleSectionChange} required>
          <option value="">Select a section</option>
          {sections.map(section => (
            <option key={section} value={section}>{section}</option>
          ))}
          <option value="custom">Add New Section</option>
        </select>
      </label>
      {isCustomSection && (
        <label>
          New Section Name:
          <input
            type="text"
            value={customSection}
            onChange={handleCustomSectionChange}
            placeholder="e.g., Keto, Vegan"
            required
          />
        </label>
      )}
      <label>
        Name:
        <input type="text" name="name" value={formData.name} onChange={handleChange} required />
      </label>
      <label>
        Ingredients:
        <textarea name="ingredients" value={formData.ingredients} onChange={handleChange} required />
      </label>
      <label>
        Calories (kcal):
        <input type="number" name="calories" value={formData.calories} onChange={handleChange} required />
      </label>
      <label>
        Protein (g):
        <input type="number" name="protein" value={formData.protein} onChange={handleChange} required />
      </label>
      <label>
        Carbs (g):
        <input type="number" name="carbs" value={formData.carbs} onChange={handleChange} required />
      </label>
      <label>
        Fat (g):
        <input type="number" name="fat" value={formData.fat} onChange={handleChange} required />
      </label>
      <label>
        Price ($):
        <input type="number" name="price" value={formData.price} onChange={handleChange} required step="0.01" />
      </label>
      <label>
        Vitamins:
        <input type="text" name="vitamins" value={formData.vitamins} onChange={handleChange} />
      </label>
      <label>
        Allergens:
        <input type="text" name="allergens" value={formData.allergens} onChange={handleChange} />
      </label>
      <button type="submit" className="button">{food ? 'Update' : 'Add'} Food Item</button>
    </form>
  );
}