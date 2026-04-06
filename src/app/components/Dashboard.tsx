'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { getReadings, updateReading, closeMonth, updatePreviousReading, updateUnitNumber } from '../actions'
import { formatCurrency } from '@/lib/calculations'
import { Printer, Calendar, Building, CheckCircle2, AlertCircle, Info } from 'lucide-react'

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
        // Skip validation for units that don't do calculation in Barão Real
        const currentBuilding = buildings.find(b => b.id === selectedBuilding)
        const isBaraoReal = currentBuilding?.name === 'Barão Real'
        const disabledUnits = ['304', '504', '701']

        const incomplete = readings.filter(r => {
            if (isBaraoReal && disabledUnits.includes(r.unitNumber)) return false
            return r.leitura_atual === 0
        })

        if (incomplete.length > 0) {
            alert(`Existem ${incomplete.length} unidades sem leitura atual preenchida.`)
            return
        }

        if (!confirm('Deseja realmente fechar o mês? Esta ação criará registros para o próximo mês.')) return

        try {
            const result = await closeMonth(selectedBuilding, selectedMonth)
            setMessage(`Mês fechado com sucesso! Próximo mês: ${result.nextMonth}`)
            setSelectedMonth(result.nextMonth)
        } catch (error: any) {
            alert(error.message)
        }
    }

    const currentBuilding = buildings.find(b => b.id === selectedBuilding)
    const buildingName = currentBuilding?.name || ''
    const isResidencialDias = buildingName === 'Residencial Dias'
    const isBaraoReal = buildingName === 'Barão Real'
    const disabledUnits = ['304', '504', '701']

    return (
        <div className="container" style={{ paddingBottom: '2rem' }}>
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

            {isResidencialDias && (
                <div className="no-print" style={{
                    padding: '1rem',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    color: 'var(--primary)',
                    borderRadius: '0.5rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    fontWeight: 600,
                    border: '1px solid rgba(52, 152, 219, 0.2)'
                }}>
                    <Info size={20} />
                    CAMARA MUNICIPAL DE NATIVIDADE - R$ 380,00
                </div>
            )}

            <div className="print-header" style={{ display: 'none' }}>
                <h1 style={{ fontSize: '20pt', textAlign: 'center', margin: '0 0 10pt 0' }}>Relatório de Consumo de Gás</h1>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1.5px solid black', paddingBottom: '3pt', marginBottom: '10pt' }}>
                    <span><strong>Prédio:</strong> {buildingName}</span>
                    <span><strong>Mês:</strong> {selectedMonth}</span>
                </div>
                {isResidencialDias && (
                    <div style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '8pt' }}>
                        Lembrete: CAMARA MUNICIPAL DE NATIVIDADE - R$ 380,00
                    </div>
                )}
            </div>

            <div className={isResidencialDias ? "card card-res-dias" : "card"}>
                <div className="table-container">
                    <table className="print-table">
                        <thead>
                            <tr>
                                <th>Unidade</th>
                                <th>Anterior</th>
                                <th>Atual</th>
                                <th>Consumo</th>
                                <th>Valor</th>
                                <th className="no-print">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {readings.map((r) => {
                                const isDisabled = isBaraoReal && disabledUnits.includes(r.unitNumber)
                                const consumo = isDisabled ? 'N/A' : (r.leitura_atual - r.leitura_anterior).toFixed(3)
                                const valorExibicao = isDisabled ? 0 : r.valor_calculado
                                const isComplete = isDisabled || r.leitura_atual > 0

                                return (
                                    <tr key={r.unitId} style={isDisabled ? { backgroundColor: 'rgba(0,0,0,0.03)', opacity: 0.8 } : {}}>
                                        <td>
                                            <input
                                                type="text"
                                                className="reading-input no-print"
                                                style={{ width: '60px', textAlign: 'left' }}
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
                                                disabled={isDisabled}
                                                onBlur={(e) => handlePreviousReadingChange(r.unitId, e.target.value)}
                                                placeholder={isDisabled ? '-' : ''}
                                            />
                                            <span className="print-only" style={{ display: 'none' }}>
                                                {isDisabled ? '-' : r.leitura_anterior.toFixed(3)}
                                            </span>
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                step="0.001"
                                                className="reading-input no-print"
                                                defaultValue={r.leitura_atual || ''}
                                                disabled={isDisabled}
                                                onBlur={(e) => handleReadingChange(r.unitId, e.target.value)}
                                                placeholder={isDisabled ? 'SEM GÁS' : ''}
                                            />
                                            <span className="print-only" style={{ display: 'none' }}>
                                                {isDisabled ? 'SEM GÁS' : r.leitura_atual.toFixed(3)}
                                            </span>
                                        </td>
                                        <td>{consumo}</td>
                                        <td className="currency">{formatCurrency(valorExibicao)}</td>
                                        <td className="no-print">
                                            {isDisabled ? (
                                                <span className="status-badge" style={{ backgroundColor: '#e2e8f0', color: '#64748b' }}>Isento</span>
                                            ) : isComplete ? (
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

            {isResidencialDias && (
                <div className="obs-box" style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    borderRadius: '0.4rem',
                    border: '1px solid #fcd34d',
                    fontSize: '0.9rem'
                }}>
                    <strong>OBS:</strong> SEPARAR GAS DOS APTS: 101, 102, 104, 304, 404, 501
                </div>
            )}

            <style jsx>{`
                @media print {
                    @page {
                        margin: 0.5cm;
                        size: A4 portrait;
                    }
                    .container { padding: 0 !important; width: 100% !important; max-width: 100% !important; }
                    .card { 
                        box-shadow: none !important; 
                        border: none !important; 
                        padding: 0 !important;
                        background: transparent !important;
                    }
                    .print-only { display: inline !important; }
                    .reading-input { display: none !important; }
                    .print-header { display: block !important; }
                    th, td { 
                        padding: 4pt 6pt !important; 
                        font-size: 10pt !important;
                        border: 1px solid #ddd !important;
                    }
                    .currency { font-weight: bold; }
                    .obs-box { 
                        border-color: #000 !important; 
                        background-color: transparent !important;
                        margin-top: 15pt !important;
                        font-size: 10pt !important;
                    }
                }
            `}</style>
        </div>
    )
}
