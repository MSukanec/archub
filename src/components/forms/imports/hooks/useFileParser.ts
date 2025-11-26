import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
// @ts-ignore - papaparse types handled inline
import Papa from 'papaparse';
import type { ParsedData } from '../types';

interface UseFileParserReturn {
  parsedData: ParsedData | null;
  isLoading: boolean;
  error: string | null;
  parseFile: (file: File) => Promise<void>;
  reset: () => void;
}

export function useFileParser(): UseFileParserReturn {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseCSV = useCallback((file: File): Promise<ParsedData> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        complete: (results: { data: any[][]; errors: Array<{ message: string }> }) => {
          if (results.errors.length > 0) {
            reject(new Error(results.errors[0].message));
            return;
          }
          
          const data = results.data as any[][];
          if (data.length < 2) {
            reject(new Error('El archivo debe tener al menos una fila de encabezados y una fila de datos'));
            return;
          }
          
          const filteredData = data.filter(row => 
            row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
          );
          
          const headers = filteredData[0].map(h => String(h).trim());
          const rows = filteredData.slice(1);
          
          resolve({
            headers,
            rows,
            fileName: file.name,
            fileType: 'csv',
            totalRows: rows.length,
          });
        },
        error: (err: { message: string }) => reject(new Error(err.message)),
      });
    });
  }, []);

  const parseExcel = useCallback((file: File): Promise<ParsedData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
          
          if (jsonData.length < 2) {
            reject(new Error('El archivo debe tener al menos una fila de encabezados y una fila de datos'));
            return;
          }
          
          const filteredData = jsonData.filter(row => 
            row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
          );
          
          const headers = filteredData[0].map(h => String(h).trim());
          const rows = filteredData.slice(1);
          
          const fileType = file.name.endsWith('.xlsx') ? 'xlsx' : 'xls';
          
          resolve({
            headers,
            rows,
            fileName: file.name,
            fileType,
            totalRows: rows.length,
          });
        } catch (err) {
          reject(new Error('Error al procesar el archivo Excel'));
        }
      };
      
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsBinaryString(file);
    });
  }, []);

  const parseFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      let result: ParsedData;
      
      if (extension === 'csv') {
        result = await parseCSV(file);
      } else if (extension === 'xlsx' || extension === 'xls') {
        result = await parseExcel(file);
      } else {
        throw new Error('Formato de archivo no soportado. Use .csv, .xlsx o .xls');
      }
      
      setParsedData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo');
      setParsedData(null);
    } finally {
      setIsLoading(false);
    }
  }, [parseCSV, parseExcel]);

  const reset = useCallback(() => {
    setParsedData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    parsedData,
    isLoading,
    error,
    parseFile,
    reset,
  };
}
