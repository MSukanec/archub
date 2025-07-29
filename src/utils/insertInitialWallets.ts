import { supabase } from '@/lib/supabase';

const initialWallets = [
  { name: 'Efectivo' },
  { name: 'Cuenta Corriente' },
  { name: 'Cuenta de Ahorros' },
  { name: 'Tarjeta de Crédito' },
  { name: 'Tarjeta de Débito' },
  { name: 'Transferencia Bancaria' },
  { name: 'Cheque' },
  { name: 'PayPal' },
  { name: 'Mercado Pago' },
  { name: 'Caja Chica' }
];

export async function insertInitialWallets() {
  console.log('🔧 Insertando billeteras iniciales...');
  
  try {
    for (const wallet of initialWallets) {
      // Check if wallet already exists
      const { data: existing } = await supabase
        .from('wallets')
        .select('id')
        .eq('name', wallet.name)
        .single();
      
      if (!existing) {
        const { data, error } = await supabase
          .from('wallets')
          .insert([{
            name: wallet.name,
            is_active: true
          }])
          .select();
        
        if (error) {
          console.error(`❌ Error insertando ${wallet.name}:`, error);
        } else {
          console.log(`✅ Billetera insertada: ${wallet.name}`);
        }
      } else {
        console.log(`ℹ️ Billetera ya existe: ${wallet.name}`);
      }
    }
    
    console.log('✅ Inserción de billeteras completada');
    return true;
  } catch (error) {
    console.error('❌ Error general:', error);
    return false;
  }
}