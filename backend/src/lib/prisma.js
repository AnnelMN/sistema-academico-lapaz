const { PrismaClient } = require('@prisma/client');

// Singleton: una sola instancia de PrismaClient para todo el servidor
// Evita crear multiples pools de conexion
const prisma = new PrismaClient();

module.exports = prisma;
