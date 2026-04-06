'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { getReadings, updateReading, closeMonth, updatePreviousReading, updateUnitNumber } from '../actions'
import { formatCurrency } from '@/lib/calculations'
import { Printer, Calendar, Building, CheckCircle2, AlertCircle } from 'lucide-react'

interface Building {
    id: string
    name: string
}

interface Reading {
    unitId: string
    unitNumber: string
    readingId: string | null
    leitura_anterior: number
    leitura_atual: number
    valor_calculado: number
}

export default function Dashboard({ buildings, initialMonth }: { buildings: Building[], initialMonth: string }) {
    const [selectedBuilding, setSelectedBuilding] = useState(buildings[0]?.id || '')
    const [selectedMonth, setSelectedMonth] = useState(initialMonth)
    const [readings, setReadings] = useState<Reading[]>([])
    const [isPending, startTransition] = useTransition()
    const [message, setMessage] = useState('')

    useEffect(() => {
        if (selectedBuilding && selectedMonth) {
            loadReadings()
        }
    }, [selectedBuilding, selectedMonth])

    async function loadReadings() {
        const data = await getReadings(selectedBuilding, selectedMonth)
        setReadings(data)
    }

    async function handleReadingChange(unitId: string, value: string) {
        const numValue = parseFloat(value) || 0
        setReadings(prev => prev.map(r => r.unitId === unitId ? { ...r, leitura_atual: numValue } : r))
        await updateReading(unitId, selectedMonth, numValue)
        loadReadings()
    }

    async function handlePreviousReadingChange(unitId: string, value: string) {
        const numValue = parseFloat(value) || 0
        setReadings(prev => prev.map(r => r.unitId === unitId ? { ...r, leitura_anterior: numValue } : r))
        await updatePreviousReading(unitId, selectedMonth, numValue)
        loadReadings()
    }

    async function handleUnitNumberChange(unitId: string, value: string) {
        setReadings(prev => prev.map(r => r.unitId === unitId ? { ...r, unitNumber: value } : r))
        await updateUnitNumber(unitId, value)
        loadReadings()
    }

    async function handleCloseMonth() {
        if (!confirm('Deseja realmente fechar o mês? Esta ação criará registros para o próximo mês.')) return

        try {
            const result = await closeMonth(selectedBuilding, selectedMonth)
            setMessage(`Mês fechado com sucesso! Próximo mês: ${result.nextMonth}`)
            setSelectedMonth(result.nextMonth)
        } catch (error: any) {
            alert(error.message)
        }
    }

    const buildingName = buildings.find(b => b.id === selectedBuilding)?.name || ''

    return (
        <div className="container">
            <div className="header no-print">
                <div>
                    <h1 className="title">Gestão de Gás</h1>
                    <p style={{ color: 'var(--text-muted)' }}>{buildingName} - {selectedMonth}</p>
                </div>

                <div className="controls">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building size={18} color="var(--text-muted)" />
                        <select
                            value={selectedBuilding}
                            onChange={(e) => setSelectedBuilding(e.target.value)}
                        >
                            {buildings.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={18} color="var(--text-muted)" />
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        />
                    </div>

                    <button className="btn btn-outline" onClick={() => window.print()}>
                        <Printer size={18} style={{ marginRight: '0.5rem' }} />
                        Imprimir
                    </button>

                    <button className="btn btn-primary" onClick={handleCloseMonth}>
                        Fechar Mês
                    </button>
                </div>
            </div>

            {message && (
                <div className="no-print" style={{
                    padding: '1rem',
                    backgroundColor: '#dcfce7',
                    color: '#166534',
                    borderRadius: '0.5rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <CheckCircle2 size={18} />
                    {message}
                </div>
            )}

            <div className="print-header" style={{ display: 'none', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '24pt', textAlign: 'center' }}>Relatório de Consumo de Gás</h1>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', borderBottom: '2px solid black', paddingBottom: '0.5rem' }}>
                    <span><strong>Prédio:</strong> {buildingName}</span>
                    <span><strong>Mês de Referência:</strong> {selectedMonth}</span>
                </div>
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Unidade</th>
                                <th>Leitura Anterior</th>
                                <th>Leitura Atual</th>
                                <th>Consumo</th>
                                <th>Valor Calculado</th>
                                <th className="no-print">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {readings.map((r) => {
                                const consumo = (r.leitura_atual - r.leitura_anterior).toFixed(3)
                                const isComplete = r.leitura_atual > 0

                                return (
                                    <tr key={r.unitId}>
                                        <td>
                                            <input
                                                type="text"
                                                className="reading-input no-print"
                                                style={{ width: '80px', textAlign: 'left' }}
                                                defaultValue={r.unitNumber}
                                                onBlur={(e) => handleUnitNumberChange(r.unitId, e.target.value)}
                                            />
                                            <span className="print-only" style={{ display: 'none', fontWeight: 600 }}>
                                                {r.unitNumber}
                                            </span>
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                step="0.001"
                                                className="reading-input no-print"
                                                defaultValue={r.leitura_anterior || ''}
                                                onBlur={(e) => handlePreviousReadingChange(r.unitId, e.target.value)}
                                            />
                                            <span className="print-only" style={{ display: 'none' }}>
                                                {r.leitura_anterior.toFixed(3)}
                                            </span>
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                step="0.001"
                                                className="reading-input no-print"
                                                defaultValue={r.leitura_atual || ''}
                                                onBlur={(e) => handleReadingChange(r.unitId, e.target.value)}
                                            />
                                            <span className="print-only" style={{ display: 'none' }}>
                                                {r.leitura_atual.toFixed(3)}
                                            </span>
                                        </td>
                                        <td>{consumo}</td>
                                        <td className="currency">{formatCurrency(r.valor_calculado)}</td>
                                        <td className="no-print">
                                            {isComplete ? (
                                                <span className="status-badge status-done">Concluído</span>
                                            ) : (
                                                <span className="status-badge status-pending">Pendente</span>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                <div style={{ display: 'inline-block', backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total do Prédio</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                        {formatCurrency(readings.reduce((acc, curr) => acc + curr.valor_calculado, 0))}
                    </p>
                </div>
            </div>

            <style jsx>{`
        @media print {
          .print-only { display: inline !important; }
          .reading-input { display: none !important; }
          .print-header { display: block !important; }
        }
      `}</style>
        </div>
    )
}
