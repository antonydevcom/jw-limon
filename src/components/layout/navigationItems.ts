import {
  BookOpen,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  ClipboardList,
  Home,
  Mic2,
  Sparkles,
  Users,
} from "lucide-react";

export const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  {
    href: "/dashboard/reunion-semanal",
    label: "Reunión Semanal",
    icon: CalendarDays,
  },
  {
    href: "/dashboard/reunion-fin-semana",
    label: "Reunión Fin de Semana",
    icon: CalendarCheck,
  },
  { href: "/dashboard/lectores", label: "Lectores", icon: BookOpen },
  { href: "/dashboard/acomodadores", label: "Acomodadores", icon: Mic2 },
  { href: "/dashboard/limpieza", label: "Limpieza", icon: Sparkles },
  { href: "/dashboard/hospitalidad", label: "Hospitalidad", icon: Users },
  { href: "/dashboard/servicio", label: "Servicio", icon: ClipboardList },
  { href: "/dashboard/eventos", label: "Eventos", icon: CalendarPlus },
] as const;
