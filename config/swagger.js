const swaggerOptions = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "gojobooking.com DOCS - An open API for ET-Booking",
      version: "1.0.11",
      description: "GOJO BOOKING API DOCUMENTATION",
    },
    servers: [
      {url: "https://localhost:4000/v1/api"},
      {url: "https://localhost:4000/v2/api"},
      {url: "https://localhost:4000/v3/api"},
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
  apis: ["./routes/**/*.js"], // pick up JSDoc comments from all route files
};

module.exports = swaggerOptions;
