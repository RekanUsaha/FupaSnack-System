// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyApYdiUlLMb9ihBkLnCjDpLJHqYFRFS3Fw",
  authDomain: "fupa-snack.firebaseapp.com",
  projectId: "fupa-snack",
  storageBucket: "fupa-snack.firebasestorage.app",
  messagingSenderId: "972524876738",
  appId: "1:972524876738:web:dd0d57dd8bf2d8a8dd9c5b"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Cloudinary Configuration
const cloudinaryConfig = {
  cloudName: 'da7idhh4f',
  uploadPreset: 'FupaSnack'
};

// Google Spreadsheet URL
const SPREADSHEET_URL = 'https://script.google.com/macros/s/AKfycbyhQQ1q7XOq_z2wkXZqFvug5BZOu-ApPs3bXiZSrMlCucHsRQu7CEfMdn1T2K4bI9wQ/exec';

class IntegrationManager {
  constructor() {
    this.currentUser = null;
    this.userRole = null;
    this.init();
  }

  async init() {
    await this.initializeFirebase();
    this.setupAuthStateListener();
    this.initializeCloudinary();
  }

  // Firebase Initialization
  async initializeFirebase() {
    try {
      // Enable offline persistence
      await db.enablePersistence();
      console.log('Firebase persistence enabled');
    } catch (err) {
      if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
      } else if (err.code === 'unimplemented') {
        console.warn('The current browser doesn\'t support persistence');
      }
    }
  }

  // Auth State Listener
  setupAuthStateListener() {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        this.currentUser = user;
        await this.getUserRole(user);
        this.onUserSignedIn(user);
      } else {
        this.currentUser = null;
        this.userRole = null;
        this.onUserSignedOut();
      }
    });
  }

  // Get User Role from Custom Claims
  async getUserRole(user) {
    try {
      const idTokenResult = await user.getIdTokenResult();
      this.userRole = idTokenResult.claims.admin ? 'admin' : 'employee';
      console.log(`User role: ${this.userRole}`);
    } catch (error) {
      console.error('Error getting user role:', error);
      this.userRole = 'employee';
    }
  }

  // Cloudinary Initialization
  initializeCloudinary() {
    // Cloudinary will be loaded dynamically when needed
  }

  // Login Function
  async login(email, password) {
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  // Logout Function
  async logout() {
    try {
      await auth.signOut();
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  }

  // Firestore Data Operations
  async addSale(saleData) {
    try {
      const saleWithMetadata = {
        ...saleData,
        ownerId: this.currentUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('sales').add(saleWithMetadata);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error adding sale:', error);
      return { success: false, error: error.message };
    }
  }

  async updateSale(saleId, saleData) {
    try {
      const saleWithMetadata = {
        ...saleData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('sales').doc(saleId).update(saleWithMetadata);
      return { success: true };
    } catch (error) {
      console.error('Error updating sale:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteSale(saleId) {
    try {
      await db.collection('sales').doc(saleId).delete();
      return { success: true };
    } catch (error) {
      console.error('Error deleting sale:', error);
      return { success: false, error: error.message };
    }
  }

  // Real-time Listeners
  setupSalesListener(callback) {
    let query = db.collection('sales');
    
    // Jika user adalah employee, hanya tampilkan data miliknya
    if (this.userRole === 'employee') {
      query = query.where('ownerId', '==', this.currentUser.uid);
    }
    
    return query.orderBy('createdAt', 'desc')
      .onSnapshot((snapshot) => {
        const sales = [];
        snapshot.forEach((doc) => {
          sales.push({ id: doc.id, ...doc.data() });
        });
        callback(sales);
      }, (error) => {
        console.error('Sales listener error:', error);
      });
  }

  // Cloudinary Upload
  async uploadToCloudinary(file) {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', cloudinaryConfig.uploadPreset);
      formData.append('cloud_name', cloudinaryConfig.cloudName);

      fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/upload`, {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.secure_url) {
          resolve({ success: true, url: data.secure_url });
        } else {
          reject({ success: false, error: 'Upload failed' });
        }
      })
      .catch(error => {
        reject({ success: false, error: error.message });
      });
    });
  }

  // Google Spreadsheet Integration
  async saveToSpreadsheet(data, sheetName) {
    try {
      const payload = {
        action: 'append',
        sheetName: sheetName,
        data: data,
        timestamp: new Date().toISOString(),
        user: this.currentUser.email
      };

      const response = await fetch(SPREADSHEET_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error saving to spreadsheet:', error);
      return { success: false, error: error.message };
    }
  }

  // Utility Functions
  onUserSignedIn(user) {
    // Update UI untuk user yang login
    document.dispatchEvent(new CustomEvent('userSignedIn', { 
      detail: { user, role: this.userRole } 
    }));
  }

  onUserSignedOut() {
    // Update UI untuk logout
    document.dispatchEvent(new CustomEvent('userSignedOut'));
  }

  // Check if user is admin
  isAdmin() {
    return this.userRole === 'admin';
  }

  // Get current user ID
  getCurrentUserId() {
    return this.currentUser ? this.currentUser.uid : null;
  }
}

// Initialize Integration Manager
const integrationManager = new IntegrationManager();

// Export for use in other files
window.integrationManager = integrationManager;