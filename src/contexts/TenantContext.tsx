import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { tenantAPI } from '../services/api';
import type { Tenant } from '../types/types';

interface TenantContextType {
  selectedTenantId: string | null;
  setSelectedTenantId: (tenantId: string | null) => void;
  tenantName: string;
  isSuperAdmin: boolean;
  tenants: Tenant[];
  isLoadingTenants: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [selectedTenantId, setSelectedTenantIdState] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string>('FAUNEXA');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);
  const isSuperAdmin = user?.rol_id?.toString() === '1';

  const setSelectedTenantId = (tenantId: string | null) => {
    setSelectedTenantIdState(tenantId);
    // Guardar en localStorage para persistir entre sesiones
    if (tenantId) {
      localStorage.setItem('selectedTenantId', tenantId);
    } else {
      localStorage.removeItem('selectedTenantId');
    }
  };

  // Inicializar/actualizar el tenant activo cada vez que cambia el usuario autenticado.
  // Solo un SuperAdmin puede navegar tenants distintos al suyo (y por eso se respeta un
  // valor guardado en localStorage para él); cualquier otro usuario usa siempre su propio
  // tenantId, para no arrastrar el tenant seleccionado por una sesión anterior de otro usuario.
  useEffect(() => {
    if (!user) {
      setSelectedTenantIdState(null);
      return;
    }

    if (isSuperAdmin) {
      const storedTenantId = localStorage.getItem('selectedTenantId');
      setSelectedTenantIdState(storedTenantId || user.tenantId || null);
    } else if (user.tenantId) {
      setSelectedTenantIdState(user.tenantId);
      localStorage.setItem('selectedTenantId', user.tenantId);
    }
  }, [user, isSuperAdmin]);

  // Obtener el tenant activo: si es SuperAdmin puede seleccionar, si no usa el suyo
  const activeTenantId = selectedTenantId || user?.tenantId || null;

  // Cargar todos los tenants si es SuperAdmin (para el selector y para resolver nombres)
  useEffect(() => {
    if (!isSuperAdmin) {
      setTenants([]);
      return;
    }
    const loadTenants = async () => {
      try {
        setIsLoadingTenants(true);
        const response = await tenantAPI.getAll();
        if (Array.isArray(response.data)) {
          setTenants(response.data);
        }
      } catch (error) {
        console.error('Error loading tenants:', error);
      } finally {
        setIsLoadingTenants(false);
      }
    };
    loadTenants();
  }, [isSuperAdmin]);

  // Cargar el nombre del tenant activo cada vez que cambie
  useEffect(() => {
    if (!activeTenantId) {
      setTenantName('FAUNEXA');
      return;
    }
    // Si ya lo tenemos en la lista cargada (SuperAdmin), evitar una petición extra
    const cached = tenants.find(t => t.tenantId === activeTenantId);
    if (cached) {
      setTenantName(cached.razonSocial);
      return;
    }
    const loadTenantName = async () => {
      try {
        const response = await tenantAPI.getById(activeTenantId);
        if (response?.data?.razonSocial) {
          setTenantName(response.data.razonSocial);
        }
      } catch (error) {
        console.error('Error al cargar el nombre del tenant:', error);
        setTenantName('FAUNEXA');
      }
    };
    loadTenantName();
  }, [activeTenantId, tenants]);

  const value: TenantContextType = {
    selectedTenantId: activeTenantId,
    setSelectedTenantId,
    tenantName,
    isSuperAdmin,
    tenants,
    isLoadingTenants,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
