"use client";

import { useState } from 'react';

export default function FoodForm({ onFoodAdded, restaurantId, food, onFormClose }) {
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
    }
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...formData, restaurantId };
    try {
      if (food) {
        // Update existing food item
        await fetch('/api/foods', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: food.id, ...data }),
        });
        onFormClose(); // Close the form after update
      } else {
        // Create new food item
        await fetch('/api/foods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
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
        });
      }
      onFoodAdded(); // Refresh the food list
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="food-form">
      <h2>{food ? 'Edit Food Item' : 'Add New Food Item'}</h2>
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