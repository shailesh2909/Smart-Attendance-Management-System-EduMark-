// Simple script to check what users exist in Firestore
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  // Add your Firebase config here
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugUsers() {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    console.log('Total users in Firestore:', snapshot.size);
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log('Document ID:', doc.id);
      console.log('Data:', {
        uid: data.uid,
        email: data.email,
        role: data.role,
        studentId: data.studentId,
        employeeId: data.employeeId,
        approved: data.approved
      });
      console.log('---');
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

debugUsers();