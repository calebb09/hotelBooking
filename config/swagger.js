const swaggerOptions = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "OPEN API DOCS - for Triplaye",
      version: "1.0.11",
      description: `Triplaye Booking API is a RESTful service designed to power booking and reservation
                    workflows for web and mobile platforms.

                    The API enables:
                    • User authentication and profile management  
                    • Resource listing and availability management  
                    • Booking creation, updates, and cancellations  
                    • Secure payment processing and transaction tracking  
                    • Notifications and real-time updates  
                    • Admin and partner-level operations  

                    All endpoints follow REST standards and return JSON responses.
                    Authentication is handled using Bearer tokens (JWT).

                    This documentation is intended for frontend developers, mobile developers,
                    and third-party integrators who want to build on top of the Triplaye platform.`,
    },
    servers: [
      {url: "https://138.199.225.171/backend/v1/api"},
      {url: "https://138.199.225.171/backend/v2/api"},
      {url: "https://138.199.225.171/backend/v3/api"},
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
        },
      },
    },
  },
  apis: ["./src/routes/**/*.js"], // pick up JSDoc comments from all route files
};

module.exports = swaggerOptions;
