import { useEffect, useState, Dispatch, SetStateAction } from "react";
import { auth, db } from "./firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

// A hook that behaves like useState, but syncs with localStorage AND Firestore.
export function useSyncedState<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
  // Read from local storage initially
  const [state, setState] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Effect to update localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  // Effect to sync with Firestore when logged in
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let isFirstLoad = true;

    const authUnsub = auth.onAuthStateChanged(user => {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = undefined;
      }

      if (user) {
        const docRef = doc(db, `users/${user.uid}/preferences`, key);
        
        // Listen to changes in Firestore
        unsubscribe = onSnapshot(docRef, (snapshot) => {
          if (snapshot.exists()) {
            const remoteData = snapshot.data().value as T;
            setState(remoteData);
            // Also update localStorage so it's fresh for next load
            localStorage.setItem(key, JSON.stringify(remoteData));
          } else if (isFirstLoad) {
            // Document doesn't exist yet, we should create it with current local state
            try {
              const localItem = localStorage.getItem(key);
              const currentValue = localItem ? JSON.parse(localItem) : initialValue;
              setDoc(docRef, { value: currentValue }, { merge: true }).catch(console.error);
            } catch (e) {
              setDoc(docRef, { value: initialValue }, { merge: true }).catch(console.error);
            }
          }
          isFirstLoad = false;
        });
      }
    });

    return () => {
      authUnsub();
      if (unsubscribe) unsubscribe();
    };
  }, [key]);

  // Wrap setState to also upload to Firestore if logged in
  const setSyncedState: Dispatch<SetStateAction<T>> = (valueOrUpdater) => {
    setState((prev: T) => {
      const newValue = 
        typeof valueOrUpdater === "function" 
          ? (valueOrUpdater as (prev: T) => T)(prev) 
          : valueOrUpdater;
      
      // Update Firestore if we have a user
      const user = auth.currentUser;
      if (user) {
        setDoc(doc(db, `users/${user.uid}/preferences`, key), { value: newValue }, { merge: true })
          .catch(console.error);
      }
      return newValue;
    });
  };

  return [state, setSyncedState];
}
