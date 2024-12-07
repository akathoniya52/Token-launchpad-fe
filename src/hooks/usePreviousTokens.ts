import { useEffect, useState } from "react";

export function usePreviousTokens(wallet) {
    const [previousTokens, setPreviousTokens] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
  
    useEffect(() => {
      const fetchPreviousTokens = async () => {
        if (wallet.connected) {
          setLoading(true);
          setError(null); // Reset error state before fetching
          try {
            const response = await fetch(`http://localhost:3000/tokenslaunch/${wallet?.publicKey}`); // Replace with your API endpoint
            if (!response.ok) {
              throw new Error("Network response was not ok");
            }
            const data = await response.json();
            setPreviousTokens(data?.tokens);
            console.log("Previous tokens fetched: ", data);
          } catch (error) {
            setError(error.message); // Set error message
            console.error("Error fetching previous tokens: ", error);
          } finally {
            setLoading(false); // Set loading to false after fetch
          }
        }
      };
  
      fetchPreviousTokens();
    }, [wallet.connected]); // Dependency on wallet connection
  
    return { previousTokens, loading, error }; // Return all states
  }