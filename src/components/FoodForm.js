"use client";

import { useState, useRef } from 'react';
import { db, storage } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export default function FoodForm({ onFoodAdded, restaurantId, food, onFormClose, sections = [], sectionId }) {
  console.log('FoodForm food:', food);

  const [formData, setFormData] = useState(
    food
      ? {
          id: food.id || '',
          sectionId: sectionId || '',
          name: food.name || '',
          ingredients: food.ingredients || '',
          calories: food.calories || '',
          protein: food.protein || '',
          carbs: food.carbs || '',
          fat: food.fat || '',
          vitamins: food.vitamins || '',
          allergens: food.allergens || '',
          foodType: food.foodType || '',
          price: food.price || '',
          images: food.images || []
        }
      : {
          name: '',
          ingredients: '',
          calories: '',
          protein: '',
          carbs: '',
          fat: '',
          vitamins: '',
          allergens: '',
          foodType: '',
          price: '',
          images: []
        }
  );
  const [isCustomSection, setIsCustomSection] = useState(false);
  const [customSection, setCustomSection] = useState('');
  const [error, setError] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [canTriggerInput, setCanTriggerInput] = useState(true);
  const [inputKey, setInputKey] = useState(Date.now());
  const fileInputRef = useRef(null);

  const WARN_IMAGES = 20;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSectionChange = (e) => {
    const value = e.target.value;
    setError('');
    if (value === 'custom') {
      setIsCustomSection(true);
      setFormData({ ...formData, foodType: '', sectionId: '' });
    } else {
      setIsCustomSection(false);
      setFormData({ 
        ...formData, 
        foodType: value, 
        sectionId: value.trim().replace(/\s+/g, '_').toLowerCase() 
      });
    }
  };

  const handleCustomSectionChange = (e) => {
    const value = e.target.value;
    setCustomSection(value);
    setFormData({ 
      ...formData, 
      foodType: value, 
      sectionId: value.trim().replace(/\s+/g, '_').toLowerCase() 
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (imageFiles.length >= WARN_IMAGES) {
      setError(`You’ve added ${imageFiles.length} images. Adding more may slow performance.`);
    }

    try {
      setImageFiles((prev) => [...prev, { file, id: `${file.name}-${Date.now()}` }]);
      e.target.value = '';
      setInputKey(Date.now());
    } catch (error) {
      setError(`Failed to process image: ${error.message}`);
    }
  };

  const removeNewImage = (id) => {
    setCanTriggerInput(false);
    setImageFiles((prev) => prev.filter((item) => item.id !== id));
    setInputKey(Date.now());
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setCanTriggerInput(true);
    }, 0);
  };

  const removeExistingImage = async (index) => {
    const imageUrl = formData.images[index];
    try {
      console.log('Attempting to delete image with URL:', imageUrl);
      const decodedUrl = decodeURIComponent(imageUrl);
      const pathMatch = decodedUrl.match(/\/o\/([^?]+)/);
      if (!pathMatch || !pathMatch[1]) {
        throw new Error('Invalid image URL format');
      }
      const storagePath = pathMatch[1];
      console.log('Extracted storage path:', storagePath);
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
      setFormData((prev) => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    } catch (error) {
      console.error('Error deleting existing image:', error.message);
      setError(`Failed to delete image: ${error.message}`);
    }
  };

  const addImage = () => {
    console.log('addImage called');
    if (canTriggerInput && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.foodType || !formData.sectionId) {
      setError('Please select or enter a section.');
      return;
    }
    if (!formData.name) {
      setError('Please enter a food name.');
      return;
    }

    const requestData = {
      restaurantId,
      sectionId: formData.sectionId,
      id: formData.id,
      name: formData.name,
      ingredients: formData.ingredients,
      calories: formData.calories,
      protein: formData.protein,
      carbs: formData.carbs,
      fat: formData.fat,
      vitamins: formData.vitamins,
      allergens: formData.allergens,
      foodType: formData.foodType,
      price: formData.price,
      images: formData.images || [],
      originalSectionId: food ? sectionId : null // For edits, track original section
    };

    console.log('Submitting food item:', JSON.stringify(requestData, null, 2));

    try {
      if (!food && isCustomSection && !sections.includes(formData.foodType)) {
        console.log('Creating new section:', formData.foodType);
        await setDoc(doc(db, 'restaurants', restaurantId, 'sections', formData.sectionId), {
          name: formData.foodType
        });
      }

      const imageUrls = [...requestData.images];
      for (const item of imageFiles.filter(item => item.file)) {
        const storageRef = ref(storage, `restaurants/${restaurantId}/foodItems/${Date.now()}_${item.file.name}`);
        try {
          await uploadBytes(storageRef, item.file);
          const url = await getDownloadURL(storageRef);
          imageUrls.push(url);
        } catch (uploadError) {
          console.error('Image upload error:', uploadError.message);
          throw new Error(`Failed to upload image ${item.file.name}: ${uploadError.message}`);
        }
      }

      requestData.images = imageUrls;

      if (food) {
        console.log('Updating food item:', requestData);
        const response = await fetch('/api/foods', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update food item');
        }
      } else {
        console.log('Creating new food item:', requestData);
        const response = await fetch('/api/foods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to add food item');
        }
      }

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
        sectionId: '',
        price: '',
        images: []
      });
      setImageFiles([]);
      setCustomSection('');
      setIsCustomSection(false);
      onFoodAdded();
      onFormClose();
    } catch (error) {
      console.error('Form submission error:', error.message);
      setError(`Failed to save food item: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="food-form">
      <h2>{food ? 'Edit Food Item' : 'Add New Food Item'}</h2>
      {error && <p className="error">{error}</p>}
      <label>
        Section:
        <select
          name="foodType"
          value={isCustomSection ? 'custom' : formData.foodType}
          onChange={handleSectionChange}
          required
        >
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
        <input type="text" name="calories" value={formData.calories} onChange={handleChange} required />
      </label>
      <label>
        Protein (g):
        <input type="text" name="protein" value={formData.protein} onChange={handleChange} required />
      </label>
      <label>
        Carbs (g):
        <input type="text" name="carbs" value={formData.carbs} onChange={handleChange} required />
      </label>
      <label>
        Fat (g):
        <input type="text" name="fat" value={formData.fat} onChange={handleChange} required />
      </label>
      <label>
        Price ($):
        <input type="text" name="price" value={formData.price} onChange={handleChange} required />
      </label>
      <label>
        Vitamins:
        <input type="text" name="vitamins" value={formData.vitamins} onChange={handleChange} />
      </label>
      <label>
        Allergens:
        <input type="text" name="allergens" value={formData.allergens} onChange={handleChange} />
      </label>
      <label>
        Images:
        <div className="image-preview-container">
          <input
            key={inputKey}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
            ref={fileInputRef}
          />
          {imageFiles.map((item) => (
            <div key={item.id} className="image-item">
              <img src={URL.createObjectURL(item.file)} alt={`Preview ${item.id}`} />
              <button type="button" onClick={() => removeNewImage(item.id)}>Remove</button>
            </div>
          ))}
          <button type="button" className="add-image-button" onClick={addImage}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="#0070f3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Add Image
          </button>
        </div>
      </label>
      {formData.images.length > 0 && (
        <div className="existing-images">
          <h4>Existing Images:</h4>
          <div className="image-preview-container">
            {formData.images.map((url, index) => (
              <div key={index} className="image-item">
                <img src={url} alt={`Existing ${index}`} />
                <button type="button" onClick={() => removeExistingImage(index)}>Remove</button>
              </div>
            ))}
          </div>
        </div>
      )}
      <button type="submit" className="button">{food ? 'Update' : 'Add'} Food Item</button>
    </form>
  );
}