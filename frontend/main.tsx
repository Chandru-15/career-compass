import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
  MutationCache,
  QueryCache,
} from "@tanstack/react-query";
import { AuthProvider, AuthGate } from "./components/AuthProvider";
import { toast } from "sonner";
import App from "./App";
import "./index.css";

// Initialize React Query
const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) => toast.error(error.message),
  }),
  queryCache: new QueryCache({
    onError: (error) => toast.error(error.message),
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGate>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthGate>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
