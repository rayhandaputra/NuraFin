import { db, auth, OperationType, handleFirestoreError } from '../nexus/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  Timestamp,
  getDoc,
  setDoc,
  serverTimestamp,
  increment,
  arrayUnion,
  Unsubscribe,
  writeBatch,
  getDocs
} from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  appCode: string;
  linkedUserId?: string | null;
  role?: string;
  createdAt: any;
}

export const FinanceService = {
  // --- Profile & Shared Data ---
  
  async getProfile(uid: string): Promise<UserProfile | null> {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) return { id: snap.id, ...snap.data() } as any;
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
      return null;
    }
  },

  async ensureProfile(user: any): Promise<UserProfile | null> {
    try {
      const profile = await this.getProfile(user.uid);
      if (!profile) {
        const appCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          appCode: appCode,
          linkedUserId: null,
          createdAt: serverTimestamp()
        };
        await setDoc(doc(db, 'users', user.uid), newProfile);
        return newProfile;
      }
      return profile;
    } catch (error) {
      console.error("Profile error:", error);
      return null;
    }
  },

  async linkAccount(uid: string, appCode: string) {
    try {
      const q = query(collection(db, 'users'), where('appCode', '==', appCode));
      const snap = await getDoc(doc(db, 'users_by_code', appCode)); // Better to have a lookup table or just find
      // For simplicity in this demo, we'll search by code in users collection
      const querySnap = await getDocs(query(collection(db, 'users'), where('appCode', '==', appCode)));
      
      if (querySnap.empty) throw new Error("Kode App tidak ditemukan.");
      
      const targetUser = querySnap.docs[0].data() as UserProfile;
      if (targetUser.uid === uid) throw new Error("Tidak bisa menautkan ke akun sendiri.");

      await updateDoc(doc(db, 'users', uid), {
        linkedUserId: targetUser.uid
      });
      return targetUser;
    } catch (error) {
      throw error;
    }
  },

  async unlinkAccount(uid: string) {
    await updateDoc(doc(db, 'users', uid), {
      linkedUserId: null
    });
  },

  // --- Core Data Path ---
  
  getDataPath(uid: string, linkedUid?: string | null) {
    return linkedUid ? linkedUid : uid;
  },

  // --- Generic Generic CRUD ---
  
  subscribeCollection(uid: string, linkedUid: string | null, collectionName: string, setter: (data: any[]) => void, orderField?: string, filter?: any): Unsubscribe {
    const ownerId = this.getDataPath(uid, linkedUid);
    let q = query(collection(db, 'users', ownerId, collectionName));
    if (orderField) q = query(q, orderBy(orderField, 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        // Convert timestamps to dates
        Object.keys(d).forEach(key => {
          if (d[key] instanceof Timestamp) d[key] = d[key].toDate();
        });
        return { id: doc.id, ...d };
      });
      setter(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${ownerId}/${collectionName}`);
    });
  },

  async addData(uid: string, linkedUid: string | null, collectionName: string, data: any) {
    const ownerId = this.getDataPath(uid, linkedUid);
    const finalData = {
      ...data,
      ownerId: ownerId,
      createdBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    try {
      return await addDoc(collection(db, 'users', ownerId, collectionName), finalData);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${ownerId}/${collectionName}`);
    }
  },

  async updateData(uid: string, linkedUid: string | null, collectionName: string, id: string, data: any) {
    const ownerId = this.getDataPath(uid, linkedUid);
    try {
      await updateDoc(doc(db, 'users', ownerId, collectionName, id), {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${ownerId}/${collectionName}/${id}`);
    }
  },

  async deleteData(uid: string, linkedUid: string | null, collectionName: string, id: string) {
    const ownerId = this.getDataPath(uid, linkedUid);
    try {
      await deleteDoc(doc(db, 'users', ownerId, collectionName, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${ownerId}/${collectionName}/${id}`);
    }
  },

  // --- Specific Operations ---
  
  async toggleNotification(uid: string, linkedUid: string | null, id: string, read: boolean) {
    await this.updateData(uid, linkedUid, 'notifications', id, { read });
  },

  async executeRecurringPayment(uid: string, linkedUid: string | null, recurring: any, walletId: string) {
    const ownerId = this.getDataPath(uid, linkedUid);
    const batch = writeBatch(db);
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 1. Create Transaction
    const transRef = doc(collection(db, 'users', ownerId, 'transactions'));
    batch.set(transRef, {
      title: recurring.title,
      amount: recurring.amount,
      category: recurring.category || 'Cicilan',
      type: recurring.type || 'expense',
      date: serverTimestamp(),
      notes: `Pembayaran otomatis: ${recurring.title} (${monthYear})`,
      walletId: walletId,
      ownerId: ownerId,
      createdBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // 2. Update Recurring (Mark month as paid)
    const recRef = doc(db, 'users', ownerId, 'recurring_transactions', recurring.id);
    batch.update(recRef, {
      paidMonths: arrayUnion(monthYear),
      updatedAt: serverTimestamp()
    });

    // 3. Update related Debt if exists
    if (recurring.relatedId) {
      const debtRef = doc(db, 'users', ownerId, 'debts', recurring.relatedId);
      // We check the debt first (this is outside batch for logic but we can do it)
      const debtSnap = await getDoc(debtRef);
      if (debtSnap.exists()) {
        const debtData = debtSnap.data();
        const newPaidAmount = (debtData.paidAmount || 0) + recurring.amount;
        
        batch.update(debtRef, {
          paidAmount: increment(recurring.amount),
          status: newPaidAmount >= debtData.amount ? 'paid' : 'active',
          updatedAt: serverTimestamp()
        });
      }
    }

    try {
      await batch.commit();
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${ownerId}/recurring_payment_batch`);
      throw error;
    }
  }
};
