import { Pool, types } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

// Force numeric and bigint to be treated as numbers if needed
// types.setTypeParser(1700, (val) => parseFloat(val))

const connectionString = process.env.DATABASE_URL

const prismaClientSingleton = () => {
    if (!connectionString) {
        throw new Error('DATABASE_URL is not defined')
    }

    // Workaround for Vercel/Supabase TLS: some environments require explicit SSL config
    // while others might conflict with pool settings.
    const pool = new Pool({
        connectionString,
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        ssl: {
            rejectUnauthorized: false,
        },
    })

    const adapter = new PrismaPg(pool)

    return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
    })
}

declare const globalThis: {
    prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined
} & typeof global

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
