const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, writeBatch } = require('firebase/firestore');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const fs = require('fs');
const path = require('path');

// Firebase configuration from your .env.local
const firebaseConfig = {
  apiKey: "AIzaSyDK-e-PqxJIR2PexUaiFXwCIpnFb8sZr54",
  authDomain: "edumark-ff569.firebaseapp.com",
  projectId: "edumark-ff569",
  storageBucket: "edumark-ff569.appspot.com",
  messagingSenderId: "918183463515",
  appId: "1:918183463515:web:ddea0a9aff0ae9d0d30d7e",
  measurementId: "G-Y89SMJDS0M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function setupDemoData() {
  try {
    console.log('Setting up demo data...');
    
    // Read sample data
    const sampleDataPath = path.join(__dirname, '..', 'sample-data.json');
    const sampleData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf8'));
    
    const batch = writeBatch(db);
    
    // Setup Users
    console.log('Creating users...');
    for (const user of sampleData.users) {
      try {
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, user.email, 'password123');
        const firebaseUser = userCredential.user;
        
        // Add user document to Firestore
        const userRef = doc(db, 'users', firebaseUser.uid);
        batch.set(userRef, {
          ...user,
          id: firebaseUser.uid,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        console.log(`Created user: ${user.email}`);
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          console.log(`User ${user.email} already exists, skipping...`);
        } else {
          console.error(`Error creating user ${user.email}:`, error);
        }
      }
    }
    
    // Setup Classes
    console.log('Creating classes...');
    for (const classData of sampleData.classes) {
      const classRef = doc(collection(db, 'classes'));
      batch.set(classRef, {
        ...classData,
        id: classRef.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Setup Departments
    console.log('Creating departments...');
    for (const department of sampleData.departments) {
      const deptRef = doc(collection(db, 'departments'));
      batch.set(deptRef, {
        ...department,
        id: deptRef.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Commit all changes
    await batch.commit();
    console.log('Demo data setup completed successfully!');
    
    console.log('\n=== Login Credentials ===');
    console.log('Admin: admin@pict.edu / password123');
    console.log('Faculty: faculty@pict.edu / password123');
    console.log('Student: student@pict.edu / password123');
    console.log('========================\n');
    
  } catch (error) {
    console.error('Error setting up demo data:', error);
  }
}

// Alternative: Manual user creation without Firebase Auth
async function createUserDocumentsOnly() {
  try {
    console.log('Creating user documents only...');
    
    const sampleDataPath = path.join(__dirname, '..', 'sample-data.json');
    const sampleData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf8'));
    
    const batch = writeBatch(db);
    
    // Create user documents with predefined IDs
    for (const user of sampleData.users) {
      const userRef = doc(db, 'users', user.id);
      batch.set(userRef, {
        ...user,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Created user document: ${user.email}`);
    }
    
    // Setup other collections
    for (const classData of sampleData.classes) {
      const classRef = doc(db, 'classes', classData.id);
      batch.set(classRef, {
        ...classData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    for (const department of sampleData.departments) {
      const deptRef = doc(db, 'departments', department.id);
      batch.set(deptRef, {
        ...department,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    await batch.commit();
    console.log('User documents created successfully!');
    
  } catch (error) {
    console.error('Error creating user documents:', error);
  }
}

// Run the setup
if (require.main === module) {
  setupDemoData();
}

module.exports = { setupDemoData, createUserDocumentsOnly };