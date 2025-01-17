import React, { useState, useEffect } from "react";
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

  interface Transaction {
    date: string;
    balance: number;
  }

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  interface PriceHistoryEntry {
    date: string;
    price: number;
  }

  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (user){
        if (!user.wallets) {
          setError("Wallet address not available, please add one in the profile page");
          setIsLoading(false);
          return;
        }
        else {
          const walletAddress = user.wallets[0].address;

        try {
            const walletResponse = await getWalletByAddress(walletAddress);
            setTransactions(walletResponse.transactions);

            const priceHistoryResponse = await findSymbolPriceHistory("ETH");
            setPriceHistory(priceHistoryResponse.data);

            setError(null);
          } catch (err) {
            setError("Failed to fetch data. Please try again later.");
          } finally {
            setIsLoading(false);
          }
        }
        
      }
    
    
      
    };

    fetchData();
  }, [user]);

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
    <div className="p-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      {error && <p className="text-red-500">{error}</p>}
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="mt-8">
          <Line data={chartData} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;