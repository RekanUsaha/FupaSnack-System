// integration.js - Sistem Integrasi Lengkap

class FirebaseIntegration {
    constructor() {
        this.firebaseConfig = {
            apiKey: "AIzaSyApYdiUlLMb9ihBkLnCjDpLJHqYFRFS3Fw",
            authDomain: "fupa-snack.firebaseapp.com",
            projectId: "fupa-snack",
            storageBucket: "fupa-snack.firebasestorage.app",
            messagingSenderId: "972524876738",
            appId: "1:972524876738:web:dd0d57dd8bf2d8a8dd9c5b"
        };
        
        this.cloudinaryConfig = {
            cloudName: 'da7idhh4f',
            uploadPreset: 'FupaSnack',
            apiKey: 'your_cloudinary_api_key_here'
        };
        
        this.spreadsheetUrl = 'https://script.google.com/macros/s/AKfycbyhQQ1q7XOq_z2wkXZqFvug5BZOu-ApPs3bXiZSrMlCucHsRQu7CEfMdn1T2K4bI9wQ/exec';
        
        this.init();
    }
    
    init() {
        // Inisialisasi Firebase
        firebase.initializeApp(this.firebaseConfig);
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.currentUser = null;
        this.userRole = null;
        
        // Setup auth state listener
        this.setupAuthListener();
    }
    
    setupAuthListener() {
        this.auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                await this.getUserRole();
                this.onLoginSuccess();
            } else {
                this.currentUser = null;
                this.userRole = null;
                this.showLoginPopup();
            }
        });
    }
    
    async getUserRole() {
        try {
            const idTokenResult = await this.currentUser.getIdTokenResult();
            this.userRole = idTokenResult.claims.admin ? 'admin' : 'karyawan';
            return this.userRole;
        } catch (error) {
            console.error('Error getting user role:', error);
            this.userRole = 'karyawan';
            return this.userRole;
        }
    }
    
    async login(email, password) {
        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }
    
    async logout() {
        try {
            await this.auth.signOut();
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    }
    
    // === FIRESTORE OPERATIONS ===
    
    async addSale(saleData) {
        try {
            const saleWithMetadata = {
                ...saleData,
                ownerId: this.currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            const docRef = await this.db.collection('sales').add(saleWithMetadata);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error adding sale:', error);
            return { success: false, error: error.message };
        }
    }
    
    async updateSale(saleId, saleData) {
        try {
            await this.db.collection('sales').doc(saleId).update({
                ...saleData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating sale:', error);
            return { success: false, error: error.message };
        }
    }
    
    async deleteSale(saleId) {
        try {
            await this.db.collection('sales').doc(saleId).delete();
            return { success: true };
        } catch (error) {
            console.error('Error deleting sale:', error);
            return { success: false, error: error.message };
        }
    }
    
    async getSales(filter = {}) {
        try {
            let query = this.db.collection('sales');
            
            // Filter berdasarkan ownerId untuk karyawan
            if (this.userRole === 'karyawan') {
                query = query.where('ownerId', '==', this.currentUser.uid);
            }
            
            // Filter tanggal jika ada
            if (filter.startDate && filter.endDate) {
                query = query.where('date', '>=', filter.startDate)
                            .where('date', '<=', filter.endDate);
            }
            
            // Filter karyawan jika ada (hanya admin)
            if (filter.employeeId && this.userRole === 'admin') {
                query = query.where('ownerId', '==', filter.employeeId);
            }
            
            const snapshot = await query.orderBy('date', 'desc').get();
            const sales = [];
            snapshot.forEach(doc => {
                sales.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, data: sales };
        } catch (error) {
            console.error('Error getting sales:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Realtime listener untuk sales
    setupSalesListener(callback) {
        let query = this.db.collection('sales');
        
        if (this.userRole === 'karyawan') {
            query = query.where('ownerId', '==', this.currentUser.uid);
        }
        
        return query.orderBy('date', 'desc').onSnapshot(snapshot => {
            const sales = [];
            snapshot.forEach(doc => {
                sales.push({ id: doc.id, ...doc.data() });
            });
            callback(sales);
        });
    }
    
    // === CLOUDINARY UPLOAD ===
    
    async uploadToCloudinary(file) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', this.cloudinaryConfig.uploadPreset);
            formData.append('cloud_name', this.cloudinaryConfig.cloudName);
            
            fetch(`https://api.cloudinary.com/v1_1/${this.cloudinaryConfig.cloudName}/image/upload`, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.secure_url) {
                    resolve({ success: true, url: data.secure_url });
                } else {
                    reject(new Error('Upload failed'));
                }
            })
            .catch(error => {
                reject(error);
            });
        });
    }
    
    // === GOOGLE SHEETS INTEGRATION ===
    
    async saveToSpreadsheet(data, sheetName) {
        try {
            const response = await fetch(this.spreadsheetUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'append',
                    sheetName: sheetName,
                    data: data
                })
            });
            
            const result = await response.json();
            return { success: true, result: result };
        } catch (error) {
            console.error('Error saving to spreadsheet:', error);
            return { success: false, error: error.message };
        }
    }
    
    // === AUTOMATIC COLLECTION CREATION ===
    
    async ensureCollectionsExist() {
        const collections = ['sales', 'financials', 'projections', 'expenses', 'salaries', 'users', 'settings'];
        
        for (const collectionName of collections) {
            try {
                // Coba baca dokumen pertama untuk memastikan collection ada
                const snapshot = await this.db.collection(collectionName).limit(1).get();
                if (snapshot.empty) {
                    // Buat dokumen dummy untuk membuat collection
                    await this.db.collection(collectionName).doc('init').set({
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        initialized: true
                    });
                }
            } catch (error) {
                console.warn(`Collection ${collectionName} might not exist yet:`, error);
            }
        }
    }
    
    // === EVENT HANDLERS ===
    
    onLoginSuccess() {
        this.ensureCollectionsExist();
        this.hideLoginPopup();
        this.updateUIBasedOnRole();
    }
    
    showLoginPopup() {
        document.getElementById('loginPopup').classList.add('active');
    }
    
    hideLoginPopup() {
        document.getElementById('loginPopup').classList.remove('active');
    }
    
    updateUIBasedOnRole() {
        const adminOnlyElements = document.querySelectorAll('[data-admin-only]');
        const employeeOnlyElements = document.querySelectorAll('[data-employee-only]');
        
        if (this.userRole === 'admin') {
            adminOnlyElements.forEach(el => el.style.display = 'block');
            employeeOnlyElements.forEach(el => el.style.display = 'block');
        } else {
            adminOnlyElements.forEach(el => el.style.display = 'none');
            employeeOnlyElements.forEach(el => el.style.display = 'block');
        }
    }
}

// Initialize integration system
const integrationSystem = new FirebaseIntegration();

// Export untuk penggunaan global
window.integrationSystem = integrationSystem;