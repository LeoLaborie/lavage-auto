const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const email = 'laborie.leo.1@gmail.com'

    try {
        const deletedCustomer = await prisma.customer.delete({
            where: { email },
        })
        console.log('Deleted customer:', deletedCustomer)
    } catch (e) {
        console.log('Customer not found or error:', e.message)
    }

    try {
        const deletedWasher = await prisma.washer.delete({
            where: { email },
        })
        console.log('Deleted washer:', deletedWasher)
    } catch (e) {
        console.log('Washer not found or error:', e.message)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
