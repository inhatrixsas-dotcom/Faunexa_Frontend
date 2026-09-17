import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Package,
  Users,
  Heart,
  DollarSign,
  AlertTriangle,
  FileText,
  Briefcase,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface DashboardSummary {
  citasHoy: number;
  totalProductos: number;
  ventasHoy: number;
  ventasMes: number;
  totalUsuarios: number;
  totalMascotas: number;
  totalServicios: number;
  productosStockBajo: number;
  facturasHoy: number;
}

interface TopItem {
  nombre: string;
  cantidad: number;
}

interface AppointmentStats {
  citasProgramadas: number;
  citasCompletadas: number;
  citasCanceladas: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value || 0);

const APPOINTMENT_COLORS = ['#16a34a', '#166534', '#dc2626'];

const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [topProducts, setTopProducts] = useState<TopItem[]>([]);
  const [topServices, setTopServices] = useState<TopItem[]>([]);
  const [appointmentStats, setAppointmentStats] = useState<AppointmentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      const summaryResponse = await dashboardAPI.getSummary();
      setSummary(summaryResponse.data);

      try {
        const salesResponse = await dashboardAPI.getSalesStats();
        setTopProducts((salesResponse.data?.productosTopVentas || []).slice(0, 5));
        setTopServices((salesResponse.data?.serviciosTopVentas || []).slice(0, 5));
      } catch (error) {
        console.error('Error loading sales stats:', error);
      }

      try {
        const appointmentStatsResponse = await dashboardAPI.getAppointmentStats();
        setAppointmentStats({
          citasProgramadas: appointmentStatsResponse.data?.citasProgramadas || 0,
          citasCompletadas: appointmentStatsResponse.data?.citasCompletadas || 0,
          citasCanceladas: appointmentStatsResponse.data?.citasCanceladas || 0,
        });
      } catch (error) {
        console.error('Error loading appointment stats:', error);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const kpis = summary
    ? [
        { label: 'Citas Hoy', value: summary.citasHoy, icon: Calendar },
        { label: 'Facturas Hoy', value: summary.facturasHoy, icon: FileText },
        { label: 'Ventas Hoy', value: formatCurrency(summary.ventasHoy), icon: DollarSign },
        { label: 'Ventas del Mes', value: formatCurrency(summary.ventasMes), icon: DollarSign },
        { label: 'Total Mascotas', value: summary.totalMascotas, icon: Heart },
        { label: 'Total Usuarios', value: summary.totalUsuarios, icon: Users },
        { label: 'Servicios Activos', value: summary.totalServicios, icon: Briefcase },
        { label: 'Productos Activos', value: summary.totalProductos, icon: Package },
        { label: 'Stock Bajo', value: summary.productosStockBajo, icon: AlertTriangle },
      ]
    : [];

  const appointmentPieData = appointmentStats
    ? [
        { name: 'Programadas', value: appointmentStats.citasProgramadas },
        { name: 'Completadas', value: appointmentStats.citasCompletadas },
        { name: 'Canceladas', value: appointmentStats.citasCanceladas },
      ].filter((item) => item.value > 0)
    : [];

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white border-2 border-green-600 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bienvenido, {user?.name || 'Usuario'}</h1>
            <p className="text-gray-500 mt-2 text-lg">Resumen general del negocio</p>
          </div>
          <Briefcase className="h-16 w-16 text-green-600" />
        </div>
      </div>

      {/* KPIs */}
      {summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className="bg-white border-2 border-green-200 hover:border-green-600 rounded-lg p-5 shadow-sm transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{kpi.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-full p-3">
                    <Icon className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border-2 border-yellow-300 rounded-lg p-6 text-center text-gray-700">
          No se pudieron cargar las estadísticas del dashboard.
        </div>
      )}

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productos más vendidos */}
        <div className="bg-white border-2 border-green-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="h-5 w-5 text-green-600 mr-2" />
            Productos más vendidos
          </h3>
          {topProducts.length > 0 ? (
            <div className="h-64" style={{ minHeight: '256px' }}>
              <ResponsiveContainer width="100%" height="100%" minHeight={256}>
                <BarChart data={topProducts} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="nombre" width={110} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="cantidad" fill="#16a34a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-12">Aún no hay ventas registradas.</p>
          )}
        </div>

        {/* Servicios más solicitados */}
        <div className="bg-white border-2 border-green-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Briefcase className="h-5 w-5 text-green-600 mr-2" />
            Servicios más solicitados
          </h3>
          {topServices.length > 0 ? (
            <div className="h-64" style={{ minHeight: '256px' }}>
              <ResponsiveContainer width="100%" height="100%" minHeight={256}>
                <BarChart data={topServices} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="nombre" width={110} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="cantidad" fill="#15803d" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-12">Aún no hay servicios registrados en facturas.</p>
          )}
        </div>

        {/* Estado de citas */}
        <div className="bg-white border-2 border-green-200 rounded-lg p-6 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 text-green-600 mr-2" />
            Estado de las citas
          </h3>
          {appointmentPieData.length > 0 ? (
            <div className="h-64" style={{ minHeight: '256px' }}>
              <ResponsiveContainer width="100%" height="100%" minHeight={256}>
                <PieChart>
                  <Pie
                    data={appointmentPieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {appointmentPieData.map((entry, index) => (
                      <Cell key={entry.name} fill={APPOINTMENT_COLORS[index % APPOINTMENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-12">Aún no hay citas registradas.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
