import { PrismaClient } from "../generated/prisma/index.js";

// const globalForPrisma = globalThis;

// export const db = globalForPrisma.prisma || new PrismaClient();

// if (process.env.NODE_ENV !== "production") {
//   globalForPrisma.prisma = db;
// }

// or

// Store Prisma instance on the global object to reuse connection across hot reloads in development

const globalForPrisma = globalThis;

// Function to create a singleton Prisma client instance
const prismaClientSingleton = () => {
    // Create a new Prisma client
    const client = new PrismaClient();

    // Add logging for connection events
    client
        .$connect()
        .then(() => {
            console.log("Successfully connected to the database");
        })
        .catch((error) => {
            console.error("Failed to connect to the database:", error);
            process.exit(1); // Exit the process if connection fails
        });

    return client;
};

// Export the existing Prisma instance if available (during hot reload) or create a new one
export const db = globalForPrisma.prisma || prismaClientSingleton();

// In development, save the instance to the global object to prevent multiple instances during hot reload
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = db;
}
