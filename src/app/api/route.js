import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const docRef = await addDoc(collection(db, 'foods'), body);
    return NextResponse.json({ id: docRef.id }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add food item' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    await updateDoc(doc(db, 'foods', id), data);
    return NextResponse.json({ message: 'Food item updated' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update food item' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    const { id } = body;
    await deleteDoc(doc(db, 'foods', id));
    return NextResponse.json({ message: 'Food item deleted' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete food item' }, { status: 500 });
  }
}