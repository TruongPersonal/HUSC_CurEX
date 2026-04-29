import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL and SUPABASE_KEY must be provided in .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const uploadToSupabase = async (file, folder = 'uploads') => {
  try {
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('husc_curex')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('husc_curex')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Lỗi khi upload lên Supabase:', error);
    throw error;
  }
};
