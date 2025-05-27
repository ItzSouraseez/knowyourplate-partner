"use client";

import { useState } from 'react';
import FoodForm from './FoodForm';

export default function FoodItem({ food, onUpdate, restaurantId, sectionId, sections }) {
  const [isEditing, setIsEditing] = useState(false);

  const handleDelete = async () => {
    try {
      await fetch('/api/foods', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: food.id, restaurantId, sectionId }),
      });
      onUpdate();
    } catch (error) {
      console.error('Error deleting food:', error);
    }
  };

  const handleFormClose = () => {
    setIsEditing(false);
  };

  return (
    <div className="food-item">
      {isEditing ? (
        <FoodForm 
          food={food} 
          onFoodAdded={onUpdate} 
          restaurantId={restaurantId} 
          onFormClose={handleFormClose} 
          sections={sections}
        />
      ) : (
        <>
          <h3>{food.name}</h3>
          <p><strong>Section:</strong> {food.foodType}</p>
          <p><strong>Ingredients:</strong> {food.ingredients}</p>
          <p><strong>Calories:</strong> {food.calories} kcal</p>
          <p><strong>Protein:</strong> {food.protein}g</p>
          <p><strong>Carbs:</strong> {food.carbs}g</p>
          <p><strong>Fat:</strong> {food.fat}g</p>
          <p><strong>Price:</strong> ${food.price}</p>
          <p><strong>Vitamins:</strong> {food.vitamins || 'N/A'}</p>
          <p><strong>Allergens:</strong> {food.allergens || 'N/A'}</p>
          <button onClick={() => setIsEditing(true)} className="button">Edit</button>
          <button onClick={handleDelete} className="button button-danger">Delete</button>
        </>
      )}
    </div>
  );
}