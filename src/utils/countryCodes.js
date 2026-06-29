export const ISO_LOOKUP = {
  // CONMEBOL (South America)
  "Argentina": "ar", "Brazil": "br", "Uruguay": "uy", "Colombia": "co", 
  "Ecuador": "ec", "Peru": "pe", "Paraguay": "py",
  
  // UEFA (Europe)
  "France": "fr", "England": "gb-eng", "Spain": "es", "Germany": "de", 
  "Portugal": "pt", "Netherlands": "nl", "Italy": "it", "Croatia": "hr", 
  "Belgium": "be", "Switzerland": "ch", "Denmark": "dk", "Serbia": "rs",
  "Poland": "pl", "Czech Republic": "cz", "Austria": "at", "Sweden": "se",
  
  // CONCACAF (North America)
  "USA": "us", "United States": "us", "Mexico": "mx", "Canada": "ca", 
  "Costa Rica": "cr", "Panama": "pa", "Haiti": "ht",
  
  // CAF (Africa)
  "Morocco": "ma", "Senegal": "sn", "Egypt": "eg", "Ivory Coast": "ci", 
  "Cameroon": "ci", "South Africa": "za", "Algeria": "dz", "Ghana": "gh",
  "Tunisia": "tn", "Cape Verde": "cv",
  
  // AFC (Asia)
  "Japan": "jp", "South Korea": "kr", "Iran": "ir", "Saudi Arabia": "sa", 
  "Australia": "au", "Uzbekistan": "uz", "Iraq": "iq", "Jordan": "jo",
  "Qatar": "qa",
  
  // OFC (Oceania)
  "New Zealand": "nz"
};

/**
 * Helper to safely fetch a FlagCDN URL from a team name.
 * Falls back to a default FIFA placeholder if the team isn't found.
 */
export const getFlagUrl = (teamName, size = 'w40') => {
  const code = ISO_LOOKUP[teamName];
  return code 
    ? `https://flagcdn.com/${size}/${code}.png` 
    : `https://upload.wikimedia.org/wikipedia/commons/e/e0/FIFA_World_Cup_2026_logo.svg`; // Fallback
};