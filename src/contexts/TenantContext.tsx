import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface TenantContextType {
  selectedTenantId: string | null;
  setSelectedTenantId: (tenantId: string | null) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [selectedTenantId, setSelectedTenantIdState] = useState<string | null>(null);
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

  const value: TenantContextType = {
    selectedTenantId: activeTenantId,
    setSelectedTenantId,
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

