import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function POST(request) {
  console.log('POST request received at /api/foods');
  try {
    const body = await request.json();
    console.log('POST body:', body);
    const docRef = await addDoc(collection(db, 'foods'), body);
    return NextResponse.json({ id: docRef.id }, { status: 200 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ error: 'Failed to add food item' }, { status: 500 });
  }
}

export async function PUT(request) {
  console.log('PUT request received at /api/foods');
  try {
    const body = await request.json();
    console.log('PUT body:', body);
    const { id, ...data } = body;
    await updateDoc(doc(db, 'foods', id), data);
    return NextResponse.json({ message: 'Food item updated' }, { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ error: 'Failed to update food item' }, { status: 500 });
  }
}

export async function DELETE(request) {
  console.log('DELETE request received at /api/foods');
  try {
    const body = await request.json();
    console.log('DELETE body:', body);
    const { id } = body;
    await deleteDoc(doc(db, 'foods', id));
    return NextResponse.json({ message: 'Food item deleted' }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete food item' }, { status: 500 });
  }
}