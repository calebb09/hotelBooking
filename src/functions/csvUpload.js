// Helper to map spreadsheet row → your schema
function mapRowToAccommodation(row) {
  return {
    name: row.name,
    address: {
      street_address: row.street_address,
      // split on comma (or semicolon) and trim whitespace:
      phoneAddress: row.phoneAddress
        ? row.phoneAddress
            .split(/[,;]+/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      emailAddress: row.emailAddress
        ? row.emailAddress
            .split(/[,;]+/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      city: row.city, // if this is an ObjectId string, you might convert it before saving
      country: row.country,
      location: {
        type: "Point",
        coordinates: [parseFloat(row.lng) || 0, parseFloat(row.lat) || 0],
      },
    },
    star: parseInt(row.star, 10) || 0,
    description: row.description || "",
    // we removed min_max_price, facilities, etc.
    stuff_language: row.stuff_language
      ? row.stuff_language
          .split(/[,;]+/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    carParking_available: row.carParking_available === "true" || false,
    checkIn_checkOut_times: {
      checkIn: row.checkIn
        ? row.checkIn
            .split(/[,;]+/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      checkOut: row.checkOut
        ? row.checkOut
            .split(/[,;]+/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    },
    petsAllowed: row.petsAllowed === "true" || false,
    // rate_average, total_review, created_at, updated_at, created_by are excluded
  };
}
module.exports = mapRowToAccommodation;
