// Confirmación para SuperAdmin antes de crear un registro nuevo, ya que puede
// tener seleccionado cualquier tenant en el navbar y es fácil olvidar cuál.
// No aplica a usuarios normales: ellos solo trabajan en su propio tenant, sin ambigüedad.
export function confirmCreateInTenant(isSuperAdmin: boolean, tenantName: string): boolean {
  if (!isSuperAdmin) return true;
  return window.confirm(
    `Vas a crear este registro en el tenant "${tenantName}".\n\n¿Es el tenant correcto? Revisa el selector de tenant en la parte superior si no estás seguro.`
  );
}
