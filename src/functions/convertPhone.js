function convertPhoneNumber(phone) {
  if (phone.startsWith("+251")) {
    return phone.replace("+251", "0");
  }
  return phone; // Return as-is if it doesn't start with +251
}

module.exports = convertPhoneNumber;
