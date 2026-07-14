const fs = require('fs');

const database = JSON.parse(fs.readFileSync('/Users/yoon/Desktop/PUCO/puco_capability_db.json', 'utf8'));

const getCapabilityDetail = (code) => {
  if (!database) return null;
  return database.SN.find(item => item.code === code) ||
         database.MP.find(item => item.code === code) ||
         database.PJ.find(item => item.code === code) ||
         database.SP.find(item => item.code === code) || null;
};

console.log("SN-B01:", getCapabilityDetail("SN-B01"));
console.log("SN-B-01:", getCapabilityDetail("SN-B-01"));
