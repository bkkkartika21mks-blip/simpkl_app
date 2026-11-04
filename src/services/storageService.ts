import { supabase, isSupabaseConfigured } from './supabaseClient';

const BUCKET_NAME = 'simpkl_documents';
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export interface UploadResult {
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  error?: string;
}

/**
 * Validates file size and MIME type according to security requirements
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Ukuran file melebihi batas maksimal 10MB (Ukuran file: ${(file.size / (1024 * 1024)).toFixed(2)}MB).`,
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Format file "${file.type || 'tidak dikenal'}" tidak didukung. Harap unggah format PDF, JPG, PNG, WEBP, atau DOCX.`,
    };
  }

  return { valid: true };
}

/**
 * Uploads file to private Supabase storage bucket or stores simulated base64/object in demo mode
 */
export async function uploadPlacementDocument(
  file: File,
  folder: string = 'monitoring'
): Promise<UploadResult> {
  const validation = validateFile(file);
  if (!validation.valid) {
    return {
      filePath: '',
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      error: validation.error,
    };
  }

  const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${folder}/${Date.now()}_${cleanFileName}`;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        return {
          filePath: '',
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          error: error.message,
        };
      }

      return {
        filePath: data.path,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      };
    } catch (err: any) {
      return {
        filePath: '',
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        error: err.message || 'Gagal mengunggah file ke Supabase Storage.',
      };
    }
  } else {
    // In demo / offline mode, create object URL or simulated local data
    const simulatedPath = `simulated://${path}`;
    return {
      filePath: simulatedPath,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    };
  }
}

/**
 * Generates a temporary signed URL for authorized access to private bucket file
 * Expiry: 60 minutes (3600 seconds)
 */
export async function getTemporarySignedUrl(filePath: string): Promise<string> {
  if (!filePath) return '';

  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  if (filePath.startsWith('simulated://')) {
    // Return sample placeholder image or document preview
    return 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80';
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(filePath, 3600); // 1 hour expiration

      if (error || !data) {
        console.error('Error generating signed URL:', error);
        return '';
      }

      return data.signedUrl;
    } catch (err) {
      console.error('Exception generating signed URL:', err);
      return '';
    }
  }

  return '';
}
