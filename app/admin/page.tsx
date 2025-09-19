import { ProtectedRoute } from "@/components/protected-route"
import { AdminDashboard } from "@/components/admin-dashboard"

export default function AdminPage() {
  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-background">
        <AdminDashboard />
      </div>
    </ProtectedRoute>
  )
}
