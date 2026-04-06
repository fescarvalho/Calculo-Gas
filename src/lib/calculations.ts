export function calculateGas(previous: number, current: number): number {
    if (current < previous) return 0;
    const base = (current - previous) * 2.5 * 9 / 1000;
    return Math.round(base);
}

export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}
