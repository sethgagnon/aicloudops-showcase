import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users as UsersIcon, Mail, Calendar } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  role: string;
  avatar_url: string | null;
  created_at: string;
}

const AdminUsers = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?return=/admin/users");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      if (!user) return;
      try {
        const { data: hasRole, error: roleError } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "admin",
        });
        if (roleError) throw roleError;
        setIsAdmin(!!hasRole);
        if (!hasRole) {
          toast({
            title: "Access denied",
            description: "You must be an admin to view users.",
            variant: "destructive",
          });
          navigate("/admin");
          return;
        }
        const { data, error } = await supabase
          .from("profiles")
          .select("id, user_id, name, email, role, avatar_url, created_at")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setProfiles((data || []) as Profile[]);
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    if (user) checkAdminAndFetch();
  }, [user, toast, navigate]);

  if (authLoading || loading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="User Management | Admin"
        description="Admin-only page to view all registered users."
        canonical={`${window.location.origin}/admin/users`}
        noIndex={true}
      />
      <Navigation />
      <main className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <UsersIcon className="h-7 w-7 text-primary" /> Users
              </h1>
              <p className="text-muted-foreground mt-1">All registered accounts</p>
            </div>
            <button onClick={() => navigate("/admin")} className="btn-outline">
              Back to Dashboard
            </button>
          </div>

          <div className="card-elegant overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Users ({profiles.length})</h2>
            </div>
            <div className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{p.name || "—"}</span>
                          <span className="text-xs text-muted-foreground">{p.user_id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-foreground">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-[220px]">{p.email || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs font-medium border bg-primary/10 text-primary border-primary/20">
                          {p.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(p.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {profiles.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <div className="p-8 text-center text-muted-foreground">
                          No users found.
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminUsers;
