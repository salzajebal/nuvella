import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WishlistProvider } from "@/contexts/WishlistContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ChatWidget } from "@/components/layout/ChatWidget";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import ProductList from "@/pages/ProductList";
import ProductDetail from "@/pages/ProductDetail";
import Admin from "@/pages/Admin";
import Signup from "@/pages/Signup";
import Login from "@/pages/Login";
import Support from "@/pages/Support";
import Reviews from "@/pages/Reviews";
import Notices from "@/pages/Notices";
import Cart from "@/pages/Cart";
import Profile from "@/pages/Profile";
import Deposit from "@/pages/Deposit";
import Withdrawal from "@/pages/Withdrawal";
import Order from "@/pages/Order";
import Terms from "@/pages/Terms";
import Search from "@/pages/Search";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/products/:category" component={ProductList} />
      <Route path="/products" component={ProductList} />
      <Route path="/admin" component={Admin} />
      <Route path="/terms" component={Terms} />
      <Route path="/signup" component={Signup} />
      <Route path="/login" component={Login} />
      <Route path="/support" component={Support} />
      <Route path="/reviews" component={Reviews} />
      <Route path="/notices" component={Notices} />
      <Route path="/cart" component={Cart} />
      <Route path="/profile" component={Profile} />
      <Route path="/deposit" component={Deposit} />
      <Route path="/withdrawal" component={Withdrawal} />
      <Route path="/order/:id" component={Order} />
      <Route path="/search" component={Search} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ChatWidgetWrapper() {
  const [location] = useLocation();
  if (location.startsWith("/admin")) {
    return null;
  }
  return <ChatWidget />;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <WishlistProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
            <ChatWidgetWrapper />
          </TooltipProvider>
        </WishlistProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
