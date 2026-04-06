'use server'

import prisma from '@/lib/prisma'
import { calculateGas } from '@/lib/calculations'
import { revalidatePath } from 'next/cache'

export async function getBuildings() {
    return await prisma.building.findMany({
        orderBy: { name: 'asc' }
    })
}

export async function getReadings(buildingId: string, referenceMonth: string) {
    // Get all units for the building
    const units = await prisma.unit.findMany({
        where: { buildingId },
        orderBy: { number: 'asc' },
        include: {
            readings: {
                where: { mes_referencia: referenceMonth }
            }
        }
    })

    // Return a structured list of readings or empty placeholders
    return units.map(unit => {
        const reading = unit.readings[0]
        return {
            unitId: unit.id,
            unitNumber: unit.number,
            readingId: reading?.id || null,
            leitura_anterior: reading?.leitura_anterior ?? 0,
            leitura_atual: reading?.leitura_atual ?? 0,
            valor_calculado: reading?.valor_calculado ?? 0,
            mes_referencia: referenceMonth,
        }
    })
}

export async function updateReading(
    unitId: string,
    referenceMonth: string,
    currentReading: number
) {
    const reading = await prisma.reading.findUnique({
        where: {
            unidade_id_mes_referencia: {
                unidade_id: unitId,
                mes_referencia: referenceMonth
            }
        }
    })

    const previousReading = reading?.leitura_anterior ?? 0
    const valorCalculado = calculateGas(previousReading, currentReading)

    if (reading) {
        await prisma.reading.update({
            where: { id: reading.id },
            data: {
                leitura_atual: currentReading,
                valor_calculado: valorCalculado
            }
        })
    } else {
        await prisma.reading.create({
            data: {
                unidade_id: unitId,
                mes_referencia: referenceMonth,
                leitura_anterior: previousReading,
                leitura_atual: currentReading,
                valor_calculado: valorCalculado
            }
        })
    }

    revalidatePath('/')
}

export async function updatePreviousReading(
    unitId: string,
    referenceMonth: string,
    previousReading: number
) {
    const reading = await prisma.reading.findUnique({
        where: {
            unidade_id_mes_referencia: {
                unidade_id: unitId,
                mes_referencia: referenceMonth
            }
        }
    })

    const currentReading = reading?.leitura_atual ?? 0
    const valorCalculado = calculateGas(previousReading, currentReading)

    if (reading) {
        await prisma.reading.update({
            where: { id: reading.id },
            data: {
                leitura_anterior: previousReading,
                valor_calculado: valorCalculado
            }
        })
    } else {
        await prisma.reading.create({
            data: {
                unidade_id: unitId,
                mes_referencia: referenceMonth,
                leitura_anterior: previousReading,
                leitura_atual: 0,
                valor_calculado: valorCalculado
            }
        })
    }

    revalidatePath('/')
}

export async function updateUnitNumber(unitId: string, newNumber: string) {
    await prisma.unit.update({
        where: { id: unitId },
        data: { number: newNumber }
    })
    revalidatePath('/')
}

export async function closeMonth(buildingId: string, currentMonth: string) {
    // 1. Validate all units have reading
    const units = await prisma.unit.findMany({
        where: { buildingId },
        include: {
            readings: {
                where: { mes_referencia: currentMonth }
            }
        }
    })

    const incomplete = units.filter(u => u.readings.length === 0 || u.readings[0].leitura_atual === 0)

    if (incomplete.length > 0) {
        throw new Error(`Existem ${incomplete.length} unidades sem leitura atual preenchida.`)
    }

    // 2. Calculate next month string
    const [year, month] = currentMonth.split('-').map(Number)
    let nextYear = year
    let nextMonth = month + 1
    if (nextMonth > 12) {
        nextMonth = 1
        nextYear++
    }
    const nextMonthStr = `${nextYear}-${nextMonth.toString().padStart(2, '0')}`

    // 3. Create records for next month
    for (const unit of units) {
        const currentReading = unit.readings[0].leitura_atual

        await prisma.reading.upsert({
            where: {
                unidade_id_mes_referencia: {
                    unidade_id: unit.id,
                    mes_referencia: nextMonthStr
                }
            },
            update: {
                leitura_anterior: currentReading,
                leitura_atual: 0,
                valor_calculado: 0
            },
            create: {
                unidade_id: unit.id,
                mes_referencia: nextMonthStr,
                leitura_anterior: currentReading,
                leitura_atual: 0,
                valor_calculado: 0
            }
        })
    }

    revalidatePath('/')
    return { success: true, nextMonth: nextMonthStr }
}
