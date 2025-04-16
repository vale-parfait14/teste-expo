// src/utils/firestore-helpers.js
export const cleanForFirestore = (obj) => {
    // Si null ou undefined, retourner null (valeur acceptée par Firestore)
    if (obj == null) return null;
    
    // Si c'est un tableau, nettoyer chaque élément
    if (Array.isArray(obj)) {
      return obj.map(item => cleanForFirestore(item));
    }
    
    // Si ce n'est pas un objet, le retourner tel quel
    if (typeof obj !== 'object') return obj;
    
    const clean = {};
    
    Object.keys(obj).forEach(key => {
      if (obj[key] !== undefined) {
        // Si c'est un objet imbriqué, le nettoyer récursivement
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          clean[key] = cleanForFirestore(obj[key]);
        } else {
          clean[key] = obj[key];
        }
      }
    });
    
    return clean;
  };
  