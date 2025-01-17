import React, { useState, useEffect } from "react";
import { createWallet, getWalletByAddress, updateTransactions } from "../services/api";
import { useAuth } from "../hooks/useAuth";

const Profile = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionsUpdated, setTransactionsUpdated] = useState<boolean>(false);

  useEffect(() => {
    const fetchWallet = async () => {
      setLoading(true);
      try {
        if (user && user.wallets.length > 0) {
          const walletAddress = user.wallets[0].address;
          const walletData = await getWalletByAddress(walletAddress);
          setWallet(walletData.address);
          setError(null);
        } else {
          setError("No wallet found");
        }
      } catch (error) {
        console.error("Failed to fetch wallet", error);
        setError("Failed to fetch wallet");
      } finally {
        setLoading(false);
      }
    };

    fetchWallet();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (user) {
        await createWallet(wallet, user.id);
        setError(null);
        // Optionally, show a success message
      } else {
        setError("User not authenticated");
      }
    } catch (error) {
      console.error("Failed to update wallet", error);
      setError("Failed to update wallet");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTransactions = async () => {
    setLoading(true);
    try {
      await updateTransactions(wallet);
      setTransactionsUpdated(true);
      setError(null);
    } catch (error) {
      console.error("Failed to update transactions", error);
      setError("Failed to update transactions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Profile</h1>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Wallet"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white p-2 rounded disabled:bg-blue-300"
        >
          {loading ? "Updating..." : "Update Wallet"}
        </button>
      </form>
      {wallet && (
        <button
          onClick={handleUpdateTransactions}
          disabled={loading}
          className="w-full bg-green-500 text-white p-2 rounded disabled:bg-green-300 mt-4"
        >
          {loading ? "Updating Transactions..." : "Mettre à jour les transactions"}
        </button>
      )}
      {transactionsUpdated && <p className="text-green-500">Transactions updated successfully!</p>}
    </div>
  );
};

export default Profile;