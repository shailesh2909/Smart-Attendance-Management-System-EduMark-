import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  onSnapshot, 
  Query, 
  DocumentData,
  QuerySnapshot 
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

interface UseFirestoreQueryResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

export function useFirestoreQuery<T = DocumentData>(
  queryFn: () => Query<DocumentData> | null
): UseFirestoreQueryResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = queryFn();
    if (!q) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as T[];
        
        setData(items);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore query error:", err);
        setError(err.message || "An error occurred while fetching data");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [queryFn]);

  return { data, loading, error };
}

// Specific hook for collections with common patterns
export function useFirestoreCollection<T = DocumentData>(
  collectionName: string,
  constraints?: any[]
): UseFirestoreQueryResult<T> {
  return useFirestoreQuery(() => {
    let q = query(collection(db, collectionName));
    
    if (constraints && constraints.length > 0) {
      q = query(collection(db, collectionName), ...constraints);
    }
    
    return q;
  });
}