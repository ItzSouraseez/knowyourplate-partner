"use client";

import { useState } from 'react';
import FoodForm from './FoodForm';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';

export default function FoodItem({ food, onUpdate, restaurantId, sectionId, sections }) {
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = () => {
    console.log('FoodItem edit:', { id: food.id, sectionId, foodType: food.foodType, ...food });
    setIsEditing(true);
  };

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
          sectionId={sectionId}
        />
      ) : (
        <>
          {food.images && food.images.length > 0 ? (
            <div className="carousel-container">
              <Carousel showThumbs={false} showStatus={true} infiniteLoop autoPlay interval={1000}>
                {food.images.map((url, index) => (
                  <div key={index} className="carousel-image-wrapper">
                    <img src={url} alt={`${food.name} ${index}`} />
                  </div>
                ))}
              </Carousel>
            </div>
          ) : (
            <div className="no-image">
              No Images
            </div>
          )}
          <h3>{food.name}</h3>
          <p><strong>Section:</strong> {food.foodType}</p>
          <p><strong>Ingredients:</strong> {food.ingredients || 'N/A'}</p>
          <p><strong>Calories:</strong> {food.calories || 'N/A'} kcal</p>
          <p><strong>Protein:</strong> {food.protein || 'N/A'}g</p>
          <p><strong>Carbs:</strong> {food.carbs || 'N/A'}g</p>
          <p><strong>Fat:</strong> {food.fat || 'N/A'}g</p>
          <p><strong>Price:</strong> ${food.price || 'N/A'}</p>
          <p><strong>Vitamins:</strong> {food.vitamins || 'N/A'}</p>
          <p><strong>Allergens:</strong> {food.allergens || 'N/A'}</p>
          <button onClick={handleEdit} className="button">Edit</button>
          <button onClick={handleDelete} className="button button-danger">Delete</button>
        </>
      )}
    </div>
  );
}