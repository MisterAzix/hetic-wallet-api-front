import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { getWalletByAddress, findSymbolPriceHistory } from "../services/api";
import { format } from "date-fns";
import { useAuth } from "../hooks/useAuth";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Fetching wallet data...");
    if (user && user.wallets.length > 0) {
      setWallet(user.wallets[0].address);
      console.log("Wallet address set:", user.wallets[0].address);
    } else {
      setWallet(null);
      console.log("No wallet found for user.");
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      if (wallet) {
        setLoading(true);
        try {
          console.log("Fetching transactions for wallet:", wallet);
          const transactionsData = await getWalletByAddress(wallet);
          setTransactions(transactionsData.transactions);
          console.log("Transactions data:", transactionsData.transactions);

          console.log("Fetching price history for wallet:", wallet);
          const priceHistoryData = await findSymbolPriceHistory(wallet);
          setPriceHistory(priceHistoryData.history);
          console.log("Price history data:", priceHistoryData.history);

          setError(null);
        } catch (error) {
          console.error("Failed to fetch data", error);
          setError("Failed to fetch data");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [wallet]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!wallet) {
    return <p>Veuillez renseigner un wallet dans profile !</p>;
  }

  const chartData = {
    labels: transactions.map((entry) => format(new Date(entry.date), "yyyy-MM-dd")),
    datasets: [
      {
        label: "Wallet Balance",
        data: transactions.map((entry) => entry.balance),
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: false,
      },
      {
        label: "Price Evolution",
        data: priceHistory.map((entry) => entry.price),
        borderColor: "rgba(153, 102, 255, 1)",
        backgroundColor: "rgba(153, 102, 255, 0.2)",
        fill: false,
      },
    ],
  };

  return (
    <div>
      <h1>Dashboard</h1>
      {error && <p className="text-red-500">{error}</p>}
      <Line data={chartData} />
    </div>
  );
};

export default Dashboard;