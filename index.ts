import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './src/routes';
import { errorHandler, notFoundHandler } from './src/middlewares/error.middleware';

// Charger les variables d'environnement
dotenv.config();

// Créer l'application Express
const app: Application = express();

// Configuration du port
const PORT = process.env.PORT || 5000;
const API_VERSION = process.env.API_VERSION || 'v1';

// Middlewares de sécurité et configuration
app.use(helmet()); // Sécurité des headers HTTP
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
})); // CORS
app.use(express.json({ limit: '10mb' })); // Parser JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parser URL-encoded
app.use(morgan('dev')); // Logger HTTP

// Route de base
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Smart Business Card API',
    version: API_VERSION,
    documentation: `/api/${API_VERSION}/health`,
  });
});

// Routes de l'API
app.use(`/api/${API_VERSION}`, routes);

// Gestion des erreurs 404
app.use(notFoundHandler);

// Gestion globale des erreurs
app.use(errorHandler);

// Démarrage du serveur
const server = app.listen(PORT, () => {
  console.log('=================================');
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 API URL: http://localhost:${PORT}/api/${API_VERSION}`);
  console.log(`📚 Health Check: http://localhost:${PORT}/api/${API_VERSION}/health`);
  console.log('=================================');
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (error: Error) => {
  console.error('❌ Unhandled Rejection:', error);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error);
  server.close(() => {
    process.exit(1);
  });
});

// Gestion de l'arrêt gracieux
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
  });
});

export default app;