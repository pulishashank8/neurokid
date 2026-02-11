/**
 * OpenAPI Specification Generator
 *
 * Generates the OpenAPI 3.0 specification for the NeuroKind API.
 */

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
    contact?: {
      name: string;
      email: string;
    };
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: Record<string, unknown>;
  components?: {
    schemas?: Record<string, unknown>;
    securitySchemes?: Record<string, unknown>;
  };
}

/**
 * Generate the OpenAPI specification
 */
export function generateOpenAPISpec(): OpenAPISpec {
  return {
    openapi: '3.0.0',
    info: {
      title: 'NeuroKind API',
      description: 'API documentation for NeuroKind - A platform for families navigating autism',
      version: '1.0.0',
      contact: {
        name: 'NeuroKind Support',
        email: 'support@neurokind.com',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'API Server',
      },
    ],
    paths: {
      '/health': {
        get: {
          summary: 'Health check endpoint',
          description: 'Returns the health status of the API',
          responses: {
            '200': {
              description: 'API is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: {
                        type: 'string',
                        example: 'ok',
                      },
                      timestamp: {
                        type: 'string',
                        format: 'date-time',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            code: {
              type: 'string',
              description: 'Error code',
            },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  };
}
