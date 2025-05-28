import { db, storage } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { NextResponse } from 'next/server';

export async function PATCH(request) {
  console.log('PATCH request received at /api/sections');
  try {
    const body = await request.json();
    console.log('PATCH body:', JSON.stringify(body, null, 2));
    const { restaurantId, oldSectionId, newSectionId, newSectionName } = body;
    if (!restaurantId) {
      console.error('Missing restaurantId');
      return NextResponse.json({ error: 'Missing restaurantId' }, { status: 400 });
    }
    if (!oldSectionId || !newSectionId || !newSectionName) {
      console.error('Missing section data');
      return NextResponse.json({ error: 'Missing section data' }, { status: 400 });
    }

    // Get existing food items
    const foodItemsSnapshot = await getDocs(
      collection(db, 'restaurants', restaurantId, 'sections', oldSectionId, 'foodItems')
    );

    // Create new section document
    console.log(`Creating new section document: ${newSectionId}`);
    await setDoc(
      doc(db, 'restaurants', restaurantId, 'sections', newSectionId),
      { name: newSectionName }
    );

    // Copy food items to new section and update foodType
    for (const foodDoc of foodItemsSnapshot.docs) {
      const foodData = foodDoc.data();
      console.log(`Copying food item ${foodDoc.id} to section ${newSectionId}`);
      await setDoc(
        doc(db, 'restaurants', restaurantId, 'sections', newSectionId, 'foodItems', foodDoc.id),
        {
          ...foodData,
          foodType: newSectionName
        }
      );
    }

    // Delete old food items
    for (const foodDoc of foodItemsSnapshot.docs) {
      console.log(`Deleting food item ${foodDoc.id} from old section ${oldSectionId}`);
      await deleteDoc(
        doc(db, 'restaurants', restaurantId, 'sections', oldSectionId, 'foodItems', foodDoc.id)
      );
    }

    // Delete old section document
    console.log(`Deleting old section document: ${oldSectionId}`);
    await deleteDoc(doc(db, 'restaurants', restaurantId, 'sections', oldSectionId));

    console.log(`Section renamed: ${oldSectionId} to ${newSectionId} (${newSectionName})`);
    return NextResponse.json({ message: 'Section updated' }, { status: 200 });
  } catch (error) {
    console.error('PATCH error:', error.message, error.stack);
    return NextResponse.json({ error: `Failed to update section: ${error.message}` }, { status: 500 });
  }
}

export async function DELETE(request) {
  console.log('DELETE request received at /api/sections');
  try {
    const body = await request.json();
    console.log('DELETE body:', JSON.stringify(body, null, 2));
    const { restaurantId, sectionId } = body;
    if (!restaurantId) {
      console.error('Missing restaurantId');
      return NextResponse.json({ error: 'Missing restaurantId' }, { status: 400 });
    }
    if (!sectionId) {
      console.error('Missing sectionId');
      return NextResponse.json({ error: 'Missing sectionId' }, { status: 400 });
    }

    // Get all food items to delete images
    console.log(`Fetching food items for section: ${sectionId}`);
    const foodItemsSnapshot = await getDocs(
      collection(db, 'restaurants', restaurantId, 'sections', sectionId, 'foodItems')
    );
    console.log(`Found ${foodItemsSnapshot.size} food items in section ${sectionId}`);

    for (const foodDoc of foodItemsSnapshot.docs) {
      const foodData = foodDoc.data();
      if (foodData.images && foodData.images.length > 0) {
        for (const imageUrl of foodData.images) {
          try {
            const decodedUrl = decodeURIComponent(imageUrl);
            const pathMatch = decodedUrl.match(/\/o\/([^?]+)/);
            if (pathMatch && pathMatch[1]) {
              const storagePath = pathMatch[1];
              const storageRef = ref(storage, storagePath);
              console.log(`Deleting image: ${storagePath}`);
              await deleteObject(storageRef);
            }
          } catch (imageError) {
            console.error(`Error deleting image: ${imageError.message}`);
          }
        }
      }
      // Delete food item
      console.log(`Deleting food item: ${foodDoc.id}`);
      await deleteDoc(
        doc(db, 'restaurants', restaurantId, 'sections', sectionId, 'foodItems', foodDoc.id)
      );
    }

    // Delete section document
    console.log(`Deleting section document: ${sectionId}`);
    await deleteDoc(doc(db, 'restaurants', restaurantId, 'sections', sectionId));
    console.log(`Section deleted: ${sectionId}`);
    return NextResponse.json({ message: 'Section deleted' }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error.message, error.stack);
    return NextResponse.json({ error: `Failed to delete section: ${error.message}` }, { status: 500 });
  }
}