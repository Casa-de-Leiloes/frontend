import { Link, useNavigate } from "react-router-dom";
import { auth } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";

export function NavBar() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();

  async function handleSignOut() {
    await auth.signOut().catch(() => {});
    setUser(null);
    navigate("/login");
  }

  return (
    <nav className="border-b border-border bg-background px-6 py-3 flex items-center justify-between">
      <Link to="/" className="font-bold text-lg">
        🏛 Auction House
      </Link>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link to="/" className="text-sm hover:text-primary">Lots</Link>
            {user.role === "BIDDER" && (
              <Link to="/wallet" className="text-sm hover:text-primary">Wallet</Link>
            )}
            <span className="text-sm text-muted-foreground">{user.name}</span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>Sign Out</Button>
          </>
        ) : (
          <>
            <Link to="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link to="/register"><Button size="sm">Register</Button></Link>
          </>
        )}
      </div>
    </nav>
  );
}
