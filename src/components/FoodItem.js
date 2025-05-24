"use client";

import { useState } from 'react';
import FoodForm from './FoodForm';

export default function FoodItem({ food, onUpdate, restaurantId }) {
  const [isEditing, setIsEditing] = useState(false);

  const handleDelete = async () => {
    try {
      await fetch('/api/foods', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: food.id }),
      });
      onUpdate();
    } catch (error) {
      console.error('Error deleting food:', error);
    }
  };

  return (
    <div className="food-item">
      {isEditing ? (
        <FoodForm food={food} onFoodAdded={onUpdate} restaurantId={restaurantId} />
      ) : (
        <>
          <h3>{food.name}</h3>
          <p><strong>Ingredients:</strong> {food.ingredients}</p>
          <p><strong>Calories:</strong> {food.calories} kcal</p>
          <p><strong>Protein:</strong> {food.protein}g</p>
          <p><strong>Carbs:</strong> {food.carbs}g</p>
          <p><strong>Fat:</strong> {food.fat}g</p>
          <p><strong>Vitamins:</strong> {food.vitamins || 'N/A'}</p>
          <p><strong>Allergens:</strong> {food.allergens || 'N/A'}</p>
          <button onClick={() => setIsEditing(true)} className="button">Edit</button>
          <button onClick={handleDelete} className="button button-danger">Delete</button>
        </>
      )}
    </div>
  );
}