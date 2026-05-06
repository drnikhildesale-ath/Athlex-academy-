import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase SDK
if (!firebaseConfig || !firebaseConfig.apiKey) {
  console.error("Firebase configuration is missing or invalid!");
}
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Validate Connection to Firestore
// async function testConnection() {
//   try {
//     await getDocFromServer(doc(db, 'test', 'connection'));
//   } catch (error) {
//     if (error instanceof Error && error.message.includes('the client is offline')) {
//       console.error("Please check your Firebase configuration. The client is offline.");
//     }
//     // Skip logging for other errors, as this is simply a connection test.
//   }
// }
// testConnection();

// Error Handling Spec for Firestore Operations
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

import { getDocs, Query, QuerySnapshot, DocumentData } from 'firebase/firestore';

// Cache expiration: 5 minutes for most data
const DEFAULT_CACHE_TIME = 5 * 60 * 1000;

export async function getDocsCached(query: Query<DocumentData>, cacheKey: string, forceRefresh = false): Promise<any[]> {
  const now = Date.now();
  const cached = localStorage.getItem(`cache_${cacheKey}`);
  
  if (cached && !forceRefresh) {
    const { data, timestamp } = JSON.parse(cached);
    if (now - timestamp < DEFAULT_CACHE_TIME) {
      console.log(`Using cached data for ${cacheKey}`);
      return data;
    }
  }

  try {
    const snapshot = await getDocs(query);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    localStorage.setItem(`cache_${cacheKey}`, JSON.stringify({ data, timestamp: now }));
    return data;
  } catch (err) {
    if (err instanceof Error && err.message.includes('Quota exceeded')) {
      console.warn(`Quota exceeded for ${cacheKey}, using stale cache if available`);
      if (cached) {
        return JSON.parse(cached).data;
      }
    }
    throw err;
  }
}

// Helper to safely convert cached or real timestamps to Date objects
export function formatFirebaseDate(timestamp: any): Date {
  if (!timestamp) return new Date();
  
  // If it's a Firestore Timestamp (has toDate method)
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  // If it's a cached timestamp (seconds/nanoseconds object or ISO string)
  if (timestamp.seconds !== undefined) {
    return new Date(timestamp.seconds * 1000);
  }
  
  // Last resort: try standard Date constructor
  const date = new Date(timestamp);
  return isNaN(date.getTime()) ? new Date() : date;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const isQuotaError = errorMessage.includes('Quota exceeded') || errorMessage.includes('resource-exhausted');
  
  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  
  if (isQuotaError) {
    console.error('CRITICAL: Firestore Quota Exceeded. The app will likely fail to load data until the quota resets tomorrow.', JSON.stringify(errInfo));
    // We still throw as required, but the UI should catch this and show a friendly message
    throw new Error(JSON.stringify(errInfo));
  } else {
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  }
}
