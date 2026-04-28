import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'protocolos_ic_db';
const DB_VERSION = 8;

let dbPromise: Promise<IDBPDatabase> | null = null;

export const initDB = async (): Promise<IDBPDatabase> => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains('perfiles')) {
          db.createObjectStore('perfiles', { keyPath: 'ID_PERFIL' });
        }
        if (!db.objectStoreNames.contains('fotos')) {
          db.createObjectStore('fotos', { keyPath: 'id' });
        }
        
        // Manejo robusto de la tabla instrumentos para asegurar que TAGNAME sea la llave
        if (!db.objectStoreNames.contains('instrumentos')) {
          db.createObjectStore('instrumentos', { keyPath: 'TAGNAME' });
        } else if (oldVersion < 7) {
          // Forzamos recreación si venimos de una versión vieja o incierta
          db.deleteObjectStore('instrumentos');
          db.createObjectStore('instrumentos', { keyPath: 'TAGNAME' });
        }
        
        if (!db.objectStoreNames.contains('config')) {
          db.createObjectStore('config', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('export_logs')) {
          db.createObjectStore('export_logs', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};
