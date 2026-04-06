import { useApp } from "@/context/AppContext";
import RoleSelector from "@/components/RoleSelector";
import TherapistDashboard from "@/components/therapist/TherapistDashboard";
import ParentDashboard from "@/components/parent/ParentDashboard";

export default function Index() {
  const { role } = useApp();

  if (role === "therapist") return <TherapistDashboard />;
  if (role === "parent") return <ParentDashboard />;
  return <RoleSelector />;
}
