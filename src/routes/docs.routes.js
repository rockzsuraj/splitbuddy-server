const express = require('express');
const router = express.Router();
const path = require('path');
const YAML = require('yamljs');
const swaggerUi = require('swagger-ui-express');

// 1. Load your local Swagger file
const swaggerPath = path.resolve(__dirname, '../docs/swagger.yaml');
const swaggerSpec = YAML.load(swaggerPath);

// 2. Disable Petstore and external references
// const swaggerOptions = {
//   explorer: false, // Hide the search box
//   swaggerOptions: {
//     url: '/docs/json', // Force local JSON
//     validatorUrl: null, // Disable validator
//     urls: [], // Remove all external references
//     spec: swaggerSpec, // Use your local spec
//     docExpansion: 'none' // Collapse all docs by default
//   },
//   customSiteTitle: 'Your API Documentation'
// };

// 2. Configure Swagger UI to ONLY use your spec
const swaggerOptions = {
  customSiteTitle: 'My API Documentation',
  swaggerOptions: {
    spec: swaggerSpec, // Force use of your local spec
    validatorUrl: null, // Disable validator
    urls: [], // Remove all external references
    docExpansion: 'none', // Collapse all operations
    defaultModelsExpandDepth: -1, // Hide schemas
    displayRequestDuration: true // Show request timing
  }
};

// 3. Serve JSON
router.get('/json', (req, res) => res.json(swaggerSpec));

// 4. Serve UI (with no external calls)
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(null, swaggerOptions));


module.exports = router;