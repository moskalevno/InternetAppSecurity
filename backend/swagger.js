const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'My API',
            version: '1.0.0',
            description: 'API documentation for my project',
        },
        servers: [
            {
                url: 'http://localhost:8800', // Измените на URL вашего сервера
            },
        ],
    },
    apis: ['./routes/*.js'], // Путь к файлам API
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
};
