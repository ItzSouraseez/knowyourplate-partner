import { db } from '@/lib/firebase';
import { collection, addDoc, setDoc, deleteDoc, doc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function POST(request) {
  console.log('POST request received at /api/foods');
  try {
    const body = await request.json();
    console.log('POST body:', JSON.stringify(body, null, 2));
    const { restaurantId, sectionId, ...foodData } = body;
    if (!restaurantId) {
      console.error('Missing restaurantId');
      return NextResponse.json({ error: 'Missing restaurantId' }, { status: 400 });
    }
    if (!sectionId) {
      console.error('Missing sectionId');
      return NextResponse.json({ error: 'Missing sectionId' }, { status: 400 });
    }
    if (!foodData.name) {
      console.error('Missing food name');
      return NextResponse.json({ error: 'Missing food name' }, { status: 400 });
    }
    const docRef = await addDoc(
      collection(db, 'restaurants', restaurantId, 'sections', sectionId, 'foodItems'),
      {
        name: foodData.name,
        ingredients: foodData.ingredients || '',
        calories: foodData.calories || '',
        protein: foodData.protein || '',
        carbs: foodData.carbs || '',
        fat: foodData.fat || '',
        vitamins: foodData.vitamins || '',
        allergens: foodData.allergens || '',
        foodType: foodData.foodType || sectionId,
        price: foodData.price || '',
        images: foodData.images || []
      }
    );
    console.log('Food item added with ID:', docRef.id);
    return NextResponse.json({ id: docRef.id }, { status: 200 });
  } catch (error) {
    console.error('POST error:', error.message, error.stack);
    return NextResponse.json({ error: `Failed to add food item: ${error.message}` }, { status: 500 });
  }
}

export async function PUT(request) {
  console.log('PUT request received at /api/foods');
  try {
    const body = await request.json();
    console.log('PUT body:', JSON.stringify(body, null, 2));
    const { id, restaurantId, sectionId, originalSectionId, ...foodData } = body;
    if (!id) {
      console.error('Missing id');
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    if (!restaurantId) {
      console.error('Missing restaurantId');
      return NextResponse.json({ error: 'Missing restaurantId' },Slice);
    }
    if (!sectionId) {
      console.error('Missing sectionId');
      return NextResponse.json({ error: 'Missing sectionId' }, { status: 400 });
    }
    if (!foodData.name) {
      console.error('Missing food name');
      return NextResponse.json({ error: 'Missing food name' }, { status: 400 });
    }

    // If section changed, move the food item
    if (originalSectionId && originalSectionId !== sectionId) {
      console.log(`Moving food item ${id} from section ${originalSectionId} to ${sectionId}`);
      // Create food item in new section
      await setDoc(
        doc(db, 'restaurants', restaurantId, 'sections', sectionId, 'foodItems', id),
        {
          name: foodData.name,
          ingredients: foodData.ingredients || '',
          calories: foodData.calories || '',
          protein: foodData.protein || '',
          carbs: foodData.carbs || '',
          fat: foodData.fat || '',
          vitamins: foodData.vitamins || '',
          allergens: foodData.allergens || '',
          foodType: foodData.foodType || sectionId,
          price: foodData.price || '',
          images: foodData.images || []
        }
      );
      // Delete from old section
      console.log(`Deleting food item ${id} from section ${originalSectionId}`);
      await deleteDoc(
        doc(db, 'restaurants', restaurantId, 'sections', originalSectionId, 'foodItems', id)
      );
    } else {
      // Update in same section
      console.log(`Updating food item ${id} in section ${sectionId}`);
      await setDoc(
        doc(db, 'restaurants', restaurantId, 'sections', sectionId, 'foodItems', id),
        {
          name: foodData.name,
          ingredients: foodData.ingredients || '',
          calories: foodData.calories || '',
          protein: foodData.protein || '',
          carbs: foodData.carbs || '',
          fat: foodData.fat || '',
          vitamins: foodData.vitamins || '',
          allergens: foodData.allergens || '',
          foodType: foodData.foodType || sectionId,
          price: foodData.price || '',
          images: foodData.images || []
        }
      );
    }

    console.log('Food item updated:', id);
    return NextResponse.json({ message: 'Food item updated', id }, { status: 200 });
  } catch (error) {
    console.error('PUT error:', error.message, error.stack);
    return NextResponse.json({ error: `Failed to update food item: ${error.message}` }, { status: 500 });
  }
}

export async function DELETE(request) {
  console.log('DELETE request received at /api/foods');
  try {
    const body = await request.json();
    console.log('DELETE body:', JSON.stringify(body, null, 2));
    const { id, restaurantId, sectionId } = body;
    if (!id) {
      console.error('Missing id');
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    if (!restaurantId) {
      console.error('Missing restaurantId');
      return NextResponse.json({ error: 'Missing restaurantId' }, { status: 400 });
    }
    if (!sectionId) {
      console.error('Missing sectionId');
      return NextResponse.json({ error: 'Missing sectionId' }, { status: 400 });
    }
    await deleteDoc(
      doc(db, 'restaurants', restaurantId, 'sections', sectionId, 'foodItems', id)
    );
    console.log('Food item deleted:', id);
    return NextResponse.json({ message: 'Food item deleted', id }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error.message, error.stack);
    return NextResponse.json({ error: `Failed to delete food item: ${error.message}` }, { status: 500 });
  }
}