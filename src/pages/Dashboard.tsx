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
import {  findSymbolPriceHistory } from "../services/api";
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

interface Transaction {
  id: string;
  userId: string;
  walletId: string;
  blockNumber: number;
  transactionIndex: number;
  balance: number;
  date: string;
}

interface WalletInterface {
  id: string;
  userId: string;
  symbol: string;
  address: string;
  createdAt: string;
  updatedAt: string;
  transactions: Transaction[];
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [walletData, setWalletData] = useState<WalletInterface | null>(null);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.wallets.length > 0) {
      console.log(user.wallets[0]);
      const userWalletData : WalletInterface= user.wallets[0];
      setWalletData(userWalletData);
      console.log("Wallet data set:", walletData);
    } else {
      setWalletData(null);
      console.log("No walletData found for user.");
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    const fetchPriceHistory = async () => {
      if (walletData) {
        setLoading(true);
        try {
          console.log("Fetching price history for symbol:", walletData.symbol);
          const priceHistoryData = await findSymbolPriceHistory(walletData.symbol);
          setPriceHistory(priceHistoryData); // Utilisez directement les données de l'API
          console.log("Price history data:", priceHistoryData);
          setError(null);
        } catch (error) {
          console.error("Error fetching price history:", error);
          setError("Error fetching price history");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPriceHistory();
  }, [walletData]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!walletData) {
    return <p>Veuillez renseigner un wallet dans profile !</p>;
  }

  const chartData = {
    labels: walletData.transactions.map((entry) => format(new Date(entry.date), "yyyy-MM-dd")),
    datasets: [
      {
        label: "Wallet Balance",
        data: walletData.transactions.map((entry) => entry.balance),
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