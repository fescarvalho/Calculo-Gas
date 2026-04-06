import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const connectionString = process.env.DATABASE_URL

const prismaClientSingleton = () => {
    if (!connectionString) {
        throw new Error('DATABASE_URL is not defined in environment variables')
    }

    const pool = new Pool({
        connectionString,
        max: 1, // Recommended for local dev, Vercel manages its own scaling
        ssl: {
            rejectUnauthorized: false
        }
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
