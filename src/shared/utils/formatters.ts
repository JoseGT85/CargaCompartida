/**
 * Utilidades de formato comunes para toda la app.
 */

/**
 * Formatea una fecha ISO como "17 feb, 14:30" en español argentino.
 */
export function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}
